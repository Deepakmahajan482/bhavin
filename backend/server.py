from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")  # ← must run BEFORE any os.getenv calls

import os
import uuid
import logging
import bcrypt
import jwt
import secrets
import asyncio
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import cloudinary
import cloudinary.uploader

from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends, Query, UploadFile, File, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ── Cloudinary (configured after load_dotenv) ─────────────────────────────────
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)

# ── App & DB ──────────────────────────────────────────────────────────────────
JWT_ALGORITHM     = "HS256"
ACCESS_TOKEN_MIN  = 60 * 24   # 1 day
REFRESH_TOKEN_DAYS = 7
LOCKOUT_THRESHOLD = 5
LOCKOUT_MINUTES   = 15

mongo_url = os.environ["MONGO_URL"]
client    = AsyncIOMotorClient(mongo_url)
db        = client[os.environ["DB_NAME"]]

app = FastAPI(title="Bhavin Creations API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("bhavin")


# ── Helpers ───────────────────────────────────────────────────────────────────
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MIN),
        "type": "access",
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="none", max_age=ACCESS_TOKEN_MIN * 60, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="none", max_age=REFRESH_TOKEN_DAYS * 86400, path="/")

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(401, "User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")
    return user


# ── Models ────────────────────────────────────────────────────────────────────
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: str

class ProductIn(BaseModel):
    title: str
    description: str
    price: float
    category: str
    color: str
    stock: int = 10
    images: List[str]
    featured: bool = False

class Product(ProductIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rating: float = 0.0
    review_count: int = 0
    created_at: str = Field(default_factory=now_iso)

class ReviewIn(BaseModel):
    product_id: str
    rating: int = Field(ge=1, le=5)
    comment: str

class CartItemIn(BaseModel):
    product_id: str
    quantity: int = 1

class WishlistItemIn(BaseModel):
    product_id: str

class Address(BaseModel):
    full_name: str
    phone: str
    line1: str
    line2: str = ""
    city: str
    state: str
    pincode: str
    country: str = "India"

class CheckoutIn(BaseModel):
    address: Address
    coupon_code: Optional[str] = None
    payment_method: Literal["cod", "stripe"] = "stripe"
    origin_url: Optional[str] = None

class CustomOrderIn(BaseModel):
    name: str
    email: EmailStr
    phone: str
    description: str
    budget: Optional[float] = None
    reference_image: Optional[str] = None

class ContactIn(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class CouponIn(BaseModel):
    code: str
    discount_pct: float
    active: bool = True

class AIRecommendIn(BaseModel):
    seed_product_ids: List[str] = []
    interests: Optional[str] = None


# ── Brute Force Protection ────────────────────────────────────────────────────
async def check_brute_force(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if not rec:
        return
    if rec.get("locked_until"):
        locked_until = datetime.fromisoformat(rec["locked_until"])
        if locked_until > datetime.now(timezone.utc):
            mins = int((locked_until - datetime.now(timezone.utc)).total_seconds() // 60) + 1
            raise HTTPException(429, f"Too many attempts. Try again in {mins} min.")

async def record_failed_login(identifier: str):
    rec      = await db.login_attempts.find_one({"identifier": identifier})
    attempts = (rec or {}).get("attempts", 0) + 1
    update   = {"attempts": attempts, "last_attempt": now_iso()}
    if attempts >= LOCKOUT_THRESHOLD:
        update["locked_until"] = (
            datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
        ).isoformat()
        update["attempts"] = 0
    await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)

async def clear_login_attempts(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})


# ── Auth ──────────────────────────────────────────────────────────────────────
@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": payload.name,
        "email": email,
        "password_hash": hash_password(payload.password),
        "role": "customer",
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    access  = create_access_token(user_id, email, "customer")
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"id": user_id, "name": payload.name, "email": email,
            "role": "customer", "created_at": user_doc["created_at"]}

@api.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    email      = payload.email.lower()
    ip         = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await check_brute_force(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await record_failed_login(identifier)
        raise HTTPException(401, "Invalid email or password")
    await clear_login_attempts(identifier)
    access  = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "name": user["name"], "email": user["email"],
            "role": user["role"], "created_at": user["created_at"]}

@api.post("/auth/logout")
async def logout(response: Response, _user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(401, "No refresh token")
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(401, "User not found")
        access = create_access_token(user["id"], user["email"], user["role"])
        response.set_cookie("access_token", access, httponly=True, secure=True,
                            samesite="none", max_age=ACCESS_TOKEN_MIN * 60, path="/")
        return {"ok": True}
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid refresh token")


# ── Products ──────────────────────────────────────────────────────────────────
@api.get("/products")
async def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    color: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = "newest",
    featured: Optional[bool] = None,
    limit: int = 60,
):
    query: dict = {}
    if q:
        query["$or"] = [
            {"title":       {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"category":    {"$regex": q, "$options": "i"}},
        ]
    if category:
        query["category"] = category
    if color:
        query["color"] = color
    if min_price is not None or max_price is not None:
        pq: dict = {}
        if min_price is not None:
            pq["$gte"] = min_price
        if max_price is not None:
            pq["$lte"] = max_price
        query["price"] = pq
    if featured is not None:
        query["featured"] = featured

    cursor = db.products.find(query, {"_id": 0})
    if sort == "price_asc":
        cursor = cursor.sort("price", 1)
    elif sort == "price_desc":
        cursor = cursor.sort("price", -1)
    elif sort == "rating":
        cursor = cursor.sort("rating", -1)
    else:
        cursor = cursor.sort("created_at", -1)
    return await cursor.to_list(limit)

@api.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p:
        raise HTTPException(404, "Product not found")
    return p

@api.post("/products")
async def create_product(payload: ProductIn, _admin: dict = Depends(get_admin_user)):
    p = Product(**payload.model_dump())
    await db.products.insert_one(p.model_dump())
    return p.model_dump()

@api.put("/products/{pid}")
async def update_product(pid: str, payload: ProductIn, _admin: dict = Depends(get_admin_user)):
    res = await db.products.update_one({"id": pid}, {"$set": payload.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(404, "Product not found")
    return await db.products.find_one({"id": pid}, {"_id": 0})

@api.delete("/products/{pid}")
async def delete_product(pid: str, _admin: dict = Depends(get_admin_user)):
    res = await db.products.delete_one({"id": pid})
    if res.deleted_count == 0:
        raise HTTPException(404, "Product not found")
    return {"ok": True}

@api.get("/categories")
async def list_categories():
    cats = await db.products.distinct("category")
    out  = []
    for c in cats:
        count  = await db.products.count_documents({"category": c})
        sample = await db.products.find_one({"category": c}, {"_id": 0, "images": 1})
        out.append({"name": c, "count": count,
                    "image": (sample or {}).get("images", [None])[0]})
    return out


# ── Reviews ───────────────────────────────────────────────────────────────────
@api.get("/products/{pid}/reviews")
async def list_reviews(pid: str):
    return await db.reviews.find({"product_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(100)

@api.post("/reviews")
async def create_review(payload: ReviewIn, user: dict = Depends(get_current_user)):
    rid = str(uuid.uuid4())
    doc = {
        "id": rid,
        "product_id": payload.product_id,
        "user_id":    user["id"],
        "user_name":  user["name"],
        "rating":     payload.rating,
        "comment":    payload.comment,
        "created_at": now_iso(),
    }
    await db.reviews.insert_one(doc)
    # Recalculate product aggregate rating
    cursor  = db.reviews.find({"product_id": payload.product_id}, {"_id": 0, "rating": 1})
    ratings = [r["rating"] async for r in cursor]
    avg     = round(sum(ratings) / len(ratings), 2) if ratings else 0
    await db.products.update_one(
        {"id": payload.product_id},
        {"$set": {"rating": avg, "review_count": len(ratings)}},
    )
    doc.pop("_id", None)
    return doc


# ── Cart ──────────────────────────────────────────────────────────────────────
async def get_cart_with_products(user_id: str):
    cart      = await db.carts.find_one({"user_id": user_id}, {"_id": 0}) or {"user_id": user_id, "items": []}
    items_out = []
    subtotal  = 0.0
    for it in cart.get("items", []):
        p = await db.products.find_one({"id": it["product_id"]}, {"_id": 0})
        if not p:
            continue
        line_total = p["price"] * it["quantity"]
        subtotal  += line_total
        items_out.append({**it, "product": p, "line_total": line_total})
    return {
        "items":    items_out,
        "subtotal": round(subtotal, 2),
        "count":    sum(it["quantity"] for it in items_out),
    }

@api.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    return await get_cart_with_products(user["id"])

@api.post("/cart")
async def add_to_cart(payload: CartItemIn, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]})
    if not cart:
        await db.carts.insert_one({"user_id": user["id"], "items": [payload.model_dump()]})
    else:
        items = cart.get("items", [])
        for it in items:
            if it["product_id"] == payload.product_id:
                it["quantity"] += payload.quantity
                break
        else:
            items.append(payload.model_dump())
        await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": items}})
    return await get_cart_with_products(user["id"])

@api.put("/cart/{pid}")
async def update_cart_item(pid: str, payload: CartItemIn, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]})
    if not cart:
        raise HTTPException(404, "Cart not found")
    items = [
        {**it, "quantity": payload.quantity} if it["product_id"] == pid else it
        for it in cart.get("items", [])
    ]
    items = [it for it in items if it["quantity"] > 0]
    await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": items}})
    return await get_cart_with_products(user["id"])

@api.delete("/cart/{pid}")
async def remove_cart_item(pid: str, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]})
    if cart:
        items = [it for it in cart.get("items", []) if it["product_id"] != pid]
        await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": items}})
    return await get_cart_with_products(user["id"])


# ── Wishlist ──────────────────────────────────────────────────────────────────
@api.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    w     = await db.wishlists.find_one({"user_id": user["id"]}, {"_id": 0}) or {"items": []}
    items = []
    for pid in w.get("items", []):
        p = await db.products.find_one({"id": pid}, {"_id": 0})
        if p:
            items.append(p)
    return {"items": items}

@api.post("/wishlist")
async def add_to_wishlist(payload: WishlistItemIn, user: dict = Depends(get_current_user)):
    w = await db.wishlists.find_one({"user_id": user["id"]}) or {"user_id": user["id"], "items": []}
    if payload.product_id not in w["items"]:
        w["items"].append(payload.product_id)
    await db.wishlists.update_one(
        {"user_id": user["id"]}, {"$set": {"items": w["items"]}}, upsert=True
    )
    return await get_wishlist(user)

@api.delete("/wishlist/{pid}")
async def remove_wishlist(pid: str, user: dict = Depends(get_current_user)):
    w = await db.wishlists.find_one({"user_id": user["id"]})
    if w:
        items = [i for i in w.get("items", []) if i != pid]
        await db.wishlists.update_one({"user_id": user["id"]}, {"$set": {"items": items}})
    return await get_wishlist(user)


# ── Coupons ───────────────────────────────────────────────────────────────────
@api.post("/coupons/validate")
async def validate_coupon(body: dict):
    code = (body.get("code") or "").upper().strip()
    if not code:
        raise HTTPException(400, "Coupon code required")
    c = await db.coupons.find_one({"code": code, "active": True}, {"_id": 0})
    if not c:
        raise HTTPException(404, "Invalid or expired coupon")
    return c

@api.get("/coupons")
async def list_coupons(_admin: dict = Depends(get_admin_user)):
    return await db.coupons.find({}, {"_id": 0}).to_list(100)

@api.post("/coupons")
async def create_coupon(payload: CouponIn, _admin: dict = Depends(get_admin_user)):
    code = payload.code.upper().strip()
    doc  = {
        "id":           str(uuid.uuid4()),
        "code":         code,
        "discount_pct": payload.discount_pct,
        "active":       payload.active,
        "created_at":   now_iso(),
    }
    await db.coupons.update_one({"code": code}, {"$set": doc}, upsert=True)
    return doc


# ── Stripe Helpers ────────────────────────────────────────────────────────────

async def _validate_stock(items):
    for it in items:
        p = it["product"]
        if it["quantity"] > p.get("stock", 0):
            raise HTTPException(400, f"Only {p.get('stock', 0)} of '{p['title']}' available")

async def _finalize_order(order_id: str):
    """Mark order paid + confirmed, decrement stock, clear cart. Idempotent."""
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        return None
    if order.get("payment_status") == "paid" and order.get("stock_decremented"):
        return order
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"payment_status": "paid", "status": "confirmed", "stock_decremented": True}},
    )
    if not order.get("stock_decremented"):
        for it in order["items"]:
            await db.products.update_one({"id": it["product_id"]}, {"$inc": {"stock": -it["quantity"]}})
    await db.carts.update_one({"user_id": order["user_id"]}, {"$set": {"items": []}})
    return await db.orders.find_one({"id": order_id}, {"_id": 0})


# ── Checkout / Orders ─────────────────────────────────────────────────────────
@api.post("/checkout")
async def checkout(payload: CheckoutIn, request: Request, user: dict = Depends(get_current_user)):
    cart = await get_cart_with_products(user["id"])
    if not cart["items"]:
        raise HTTPException(400, "Cart is empty")
    await _validate_stock(cart["items"])

    subtotal    = cart["subtotal"]
    discount    = 0.0
    coupon_code = None
    if payload.coupon_code:
        c = await db.coupons.find_one({"code": payload.coupon_code.upper(), "active": True}, {"_id": 0})
        if c:
            discount    = round(subtotal * (c["discount_pct"] / 100), 2)
            coupon_code = c["code"]
    shipping = 0 if subtotal > 999 else 49
    total    = round(subtotal - discount + shipping, 2)
    order_id = str(uuid.uuid4())
    is_stripe = payload.payment_method == "stripe"

    order_doc = {
        "id":             order_id,
        "user_id":        user["id"],
        "user_email":     user["email"],
        "user_name":      user["name"],
        "items":          [
            {
                "product_id": it["product_id"],
                "title":      it["product"]["title"],
                "price":      it["product"]["price"],
                "image":      it["product"]["images"][0],
                "quantity":   it["quantity"],
            }
            for it in cart["items"]
        ],
        "address":         payload.address.model_dump(),
        "subtotal":        subtotal,
        "discount":        discount,
        "shipping":        shipping,
        "total":           total,
        "coupon_code":     coupon_code,
        "payment_method":  payload.payment_method,
        "payment_status":  "pending",
        "status":          "pending_payment" if is_stripe else "confirmed",
        "stock_decremented": False,
        "created_at":      now_iso(),
    }
    await db.orders.insert_one(order_doc)

    if not is_stripe:
        for it in cart["items"]:
            await db.products.update_one({"id": it["product_id"]}, {"$inc": {"stock": -it["quantity"]}})
        await db.orders.update_one({"id": order_id}, {"$set": {"stock_decremented": True}})
        await db.carts.update_one({"user_id": user["id"]}, {"$set": {"items": []}})
        order_doc["stock_decremented"] = True
        order_doc.pop("_id", None)
        return {"order": order_doc, "redirect": False}

    # Stripe flow

@api.get("/payments/stripe/status/{session_id}")
async def stripe_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not txn:
        raise HTTPException(404, "Payment not found")
    if txn["user_id"] != user["id"] and user.get("role") != "admin":
        raise HTTPException(403, "Forbidden")
    if txn.get("payment_status") == "paid":
        order = await db.orders.find_one({"id": txn["order_id"]}, {"_id": 0})
        return {"payment_status": "paid", "status": "complete", "order": order}
    try:
        stripe = get_stripe_checkout(request)
        s      = await stripe.get_checkout_status(session_id)
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": s.payment_status, "status": s.status}},
        )
        if s.payment_status == "paid":
            order = await _finalize_order(txn["order_id"])
            return {"payment_status": "paid", "status": s.status, "order": order}
        return {"payment_status": s.payment_status, "status": s.status, "order_id": txn["order_id"]}
    except Exception as e:
        logger.warning("Stripe status transient error for %s: %s", session_id, e)
        return {"payment_status": "pending", "status": "open", "order_id": txn["order_id"]}

@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        stripe = get_stripe_checkout(request)
        body   = await request.body()
        sig    = request.headers.get("Stripe-Signature", "")
        evt    = await stripe.handle_webhook(body, sig)
        if evt.payment_status == "paid" and evt.session_id:
            txn = await db.payment_transactions.find_one({"session_id": evt.session_id}, {"_id": 0})
            if txn:
                await db.payment_transactions.update_one(
                    {"session_id": evt.session_id},
                    {"$set": {"payment_status": "paid", "status": "complete"}},
                )
                await _finalize_order(txn["order_id"])
        return {"ok": True}
    except Exception as e:
        logger.error("Webhook error: %s", e)
        raise HTTPException(400, "Webhook failed")

@api.get("/orders")
async def list_user_orders(skip: int = 0, limit: int = 20, user: dict = Depends(get_current_user)):
    cursor = db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items  = await cursor.to_list(limit)
    total  = await db.orders.count_documents({"user_id": user["id"]})
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@api.get("/orders/{oid}")
async def get_order(oid: str, user: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o:
        raise HTTPException(404, "Order not found")
    if user["role"] != "admin" and o["user_id"] != user["id"]:
        raise HTTPException(403, "Access denied")
    return o

@api.get("/admin/orders")
async def admin_list_orders(skip: int = 0, limit: int = 20, _admin: dict = Depends(get_admin_user)):
    cursor = db.orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items  = await cursor.to_list(limit)
    total  = await db.orders.count_documents({})
    return {"items": items, "total": total, "skip": skip, "limit": limit}

@api.put("/admin/orders/{oid}")
async def admin_update_order(oid: str, body: dict, _admin: dict = Depends(get_admin_user)):
    new_status = body.get("status")
    if new_status not in ("confirmed", "shipped", "delivered", "cancelled", "returned"):
        raise HTTPException(400, "Invalid status")
    res = await db.orders.update_one({"id": oid}, {"$set": {"status": new_status}})
    if res.matched_count == 0:
        raise HTTPException(404, "Order not found")
    return await db.orders.find_one({"id": oid}, {"_id": 0})

@api.post("/orders/{oid}/return")
async def request_return(oid: str, body: dict, user: dict = Depends(get_current_user)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o or o["user_id"] != user["id"]:
        raise HTTPException(404, "Order not found")
    doc = {
        "id":       str(uuid.uuid4()),
        "order_id": oid,
        "user_id":  user["id"],
        "reason":   body.get("reason", ""),
        "status":   "pending",
        "created_at": now_iso(),
    }
    await db.return_requests.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ── File Uploads (Cloudinary) ─────────────────────────────────────────────────
@api.post("/uploads")
async def upload_file(
    file: UploadFile = File(...),
    admin: dict = Depends(get_admin_user),   # ← admin-only upload
):
    ext = (file.filename or "img").rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "bin"
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        raise HTTPException(400, "Only image files are allowed (jpg, jpeg, png, webp, gif)")

    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(400, "File too large (max 8 MB)")

    try:
        result = cloudinary.uploader.upload(data, folder="bhavin-creations/products")
    except Exception as e:
        logger.error("Cloudinary upload failed: %s", e)
        raise HTTPException(500, f"Upload failed: {e}")

    file_id = str(uuid.uuid4())
    await db.uploaded_files.insert_one({
        "id":                file_id,
        "cloudinary_url":    result["secure_url"],
        "public_id":         result["public_id"],
        "original_filename": file.filename,
        "uploaded_by":       admin["id"],
        "created_at":        now_iso(),
    })
    return {"id": file_id, "url": result["secure_url"]}


# ── Custom Orders ─────────────────────────────────────────────────────────────
@api.post("/custom-orders")
async def create_custom_order(payload: CustomOrderIn):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(),
           "status": "new", "created_at": now_iso()}
    await db.custom_orders.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/admin/custom-orders")
async def admin_list_custom_orders(skip: int = 0, limit: int = 20,
                                    _admin: dict = Depends(get_admin_user)):
    cursor = db.custom_orders.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    items  = await cursor.to_list(limit)
    total  = await db.custom_orders.count_documents({})
    return {"items": items, "total": total, "skip": skip, "limit": limit}


# ── Contact ───────────────────────────────────────────────────────────────────
@api.post("/contact")
async def contact(payload: ContactIn):
    doc = {"id": str(uuid.uuid4()), **payload.model_dump(), "created_at": now_iso()}
    await db.contact_messages.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ── Admin Analytics ───────────────────────────────────────────────────────────
@api.get("/admin/analytics")
async def admin_analytics(_admin: dict = Depends(get_admin_user)):
    products       = await db.products.count_documents({})
    users          = await db.users.count_documents({"role": "customer"})
    orders_total   = await db.orders.count_documents({})
    custom_orders  = await db.custom_orders.count_documents({})
    pending_returns = await db.return_requests.count_documents({"status": "pending"})

    rev_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    rev      = [doc async for doc in db.orders.aggregate(rev_pipeline)]
    revenue  = round(rev[0]["total"], 2) if rev else 0.0

    # Last 7 days daily revenue
    daily = []
    for d in range(6, -1, -1):
        day   = datetime.now(timezone.utc) - timedelta(days=d)
        start = day.replace(hour=0,  minute=0,  second=0,  microsecond=0).isoformat()
        end   = day.replace(hour=23, minute=59, second=59, microsecond=0).isoformat()
        total = 0.0
        async for doc in db.orders.find(
            {"created_at": {"$gte": start, "$lte": end}}, {"_id": 0, "total": 1}
        ):
            total += doc.get("total", 0)
        daily.append({"date": day.strftime("%b %d"), "revenue": round(total, 2)})

    return {
        "products":        products,
        "customers":       users,
        "orders":          orders_total,
        "revenue":         revenue,
        "custom_orders":   custom_orders,
        "pending_returns": pending_returns,
        "daily_revenue":   daily,
    }


# ── AI Recommendations ────────────────────────────────────────────────────────

# ── Health ────────────────────────────────────────────────────────────────────
@api.get("/")
async def root():
    return {"app": "Bhavin Creations", "by": "RK Technologies", "status": "ok"}


# ── Startup Seed Data ─────────────────────────────────────────────────────────
SAMPLE_IMAGES = {
    "Keychains":          ["https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=900",
                           "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=900"],
    "Name Plates":        ["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=900",
                           "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=900"],
    "Jewelry":            ["https://images.unsplash.com/photo-1758995115543-983c55f98a33?w=900",
                           "https://images.unsplash.com/photo-1761211115639-54394f139142?w=900",
                           "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900"],
    "Trays":              ["https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=900",
                           "https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=900"],
    "Coasters":           ["https://images.unsplash.com/photo-1556139943-4bdca53adf1e?w=900",
                           "https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=900"],
    "Photo Frames":       ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=900",
                           "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=900"],
    "Personalized Gifts": ["https://images.unsplash.com/photo-1761110518837-689557b142bf?w=900",
                           "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=900"],
    "Home Decor":         ["https://images.pexels.com/photos/7256576/pexels-photo-7256576.jpeg",
                           "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=900"],
}

SEED_PRODUCTS = [
    ("Aurora Keychain",          "Keychains",          "A swirling pastel resin keychain with gold flecks.",      299,  "Pastel Blue"),
    ("Custom Name Keychain",     "Keychains",          "Personalized name keychain in glossy finish.",             349,  "Rose"),
    ("Sunset Tray Round",        "Trays",              "Round serving tray inspired by sunset hues.",             1499, "Amber"),
    ("Golden Veins Tray",        "Trays",              "Marble effect resin tray with gold veins.",               1799, "Gold"),
    ("Cosmic Coaster Set (4)",   "Coasters",           "Set of four galaxy-style resin coasters.",                 999, "Indigo"),
    ("Rose Quartz Coasters (4)", "Coasters",           "Pastel rose coasters with crushed glass.",                 899, "Rose"),
    ("Floral Name Plate",        "Name Plates",        "Door name plate with embedded dried florals.",            1899, "Ivory"),
    ("Minimal Black Name Plate", "Name Plates",        "Sleek black & gold home name plate.",                     1599, "Black"),
    ("Pearl Drop Earrings",       "Jewelry",           "Resin pearl drop earrings with shimmer.",                  549, "Ivory"),
    ("Petal Necklace",            "Jewelry",           "Real flower petal pendant set in resin.",                  799, "Pastel Pink"),
    ("Heart Memory Frame",       "Photo Frames",       "A memory frame with heart inlay.",                        1299, "Rose"),
    ("Vintage Gold Frame",       "Photo Frames",       "Vintage gold-leaf trimmed frame.",                        1399, "Gold"),
    ("Couple's Resin Cube",      "Personalized Gifts", "3D photo cube for couples.",                              1199, "Crystal"),
    ("Bookmark Set of 3",        "Personalized Gifts", "Pressed flower resin bookmarks.",                          499, "Pastel Green"),
    ("Ocean Wave Wall Art",      "Home Decor",         "Statement ocean wave wall piece.",                        3499, "Teal"),
    ("Geode Slice Decor",        "Home Decor",         "Geode style slice with gold rim.",                        2599, "Amethyst"),
]

async def seed_products():
    if await db.products.count_documents({}) > 0:
        return
    docs = []
    for i, (title, cat, desc, price, color) in enumerate(SEED_PRODUCTS):
        imgs = SAMPLE_IMAGES.get(cat, [SAMPLE_IMAGES["Keychains"][0]])
        docs.append({
            "id":           str(uuid.uuid4()),
            "title":        title,
            "description":  desc,
            "price":        float(price),
            "category":     cat,
            "color":        color,
            "stock":        25,
            "images":       imgs,
            "featured":     i % 3 == 0,
            "rating":       round(4.2 + (i % 5) * 0.15, 1),
            "review_count": 5 + i,
            "created_at":   now_iso(),
        })
    await db.products.insert_many(docs)
    logger.info("Seeded %d products", len(docs))

async def seed_admin():
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_pw    = os.environ["ADMIN_PASSWORD"]
    existing    = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id":            str(uuid.uuid4()),
            "name":          "Bhavin Admin",
            "email":         admin_email,
            "password_hash": hash_password(admin_pw),
            "role":          "admin",
            "created_at":    now_iso(),
        })
        logger.info("Seeded admin user: %s", admin_email)
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_pw), "role": "admin"}},
        )

async def seed_test_user():
    test_email = "demo@bhavincreations.com"
    if not await db.users.find_one({"email": test_email}):
        await db.users.insert_one({
            "id":            str(uuid.uuid4()),
            "name":          "Demo Customer",
            "email":         test_email,
            "password_hash": hash_password("Demo@123"),
            "role":          "customer",
            "created_at":    now_iso(),
        })

async def seed_coupons():
    if await db.coupons.count_documents({}) == 0:
        await db.coupons.insert_many([
            {"id": str(uuid.uuid4()), "code": "WELCOME10", "discount_pct": 10, "active": True, "created_at": now_iso()},
            {"id": str(uuid.uuid4()), "code": "RESIN20",   "discount_pct": 20, "active": True, "created_at": now_iso()},
        ])

async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("category")
    await db.orders.create_index("user_id")
    await db.reviews.create_index("product_id")

@app.on_event("startup")
async def on_startup():
    await ensure_indexes()
    await seed_admin()
    await seed_test_user()
    await seed_products()
    await seed_coupons()
    logger.info("✅ Bhavin Creations API ready.")

@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ── App Wiring ────────────────────────────────────────────────────────────────
app.include_router(api)

frontend = os.environ.get("FRONTEND_URL")
if frontend:
    allow_origins      = [frontend]
    allow_credentials  = True
else:
    allow_origins      = ["*"]
    allow_credentials  = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)
print("CLOUD NAME =", os.getenv("CLOUDINARY_CLOUD_NAME"))
print("API KEY =", os.getenv("CLOUDINARY_API_KEY"))
print("API SECRET =", "loaded" if os.getenv("CLOUDINARY_API_SECRET") else "missing")