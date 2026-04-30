"""Backend integration tests for Bhavin Creations API.

Covers: health, auth (register/login/me/logout/lockout), products + filters, categories,
reviews, cart, wishlist, coupons, checkout/orders, admin product CRUD + RBAC, custom orders,
contact, admin analytics, AI recommendations.
"""
import os
import uuid
import time
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://resin-gallery-15.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"

ADMIN = {"email": "admin@bhavincreations.com", "password": "Admin@123"}
CUSTOMER = {"email": "demo@bhavincreations.com", "password": "Demo@123"}


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=ADMIN, timeout=15)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    assert r.json()["role"] == "admin"
    return s


@pytest.fixture(scope="module")
def customer_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json=CUSTOMER, timeout=15)
    assert r.status_code == 200, f"customer login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def sample_product():
    r = requests.get(f"{API}/products?limit=5", timeout=15)
    assert r.status_code == 200
    items = r.json()
    assert len(items) > 0, "no products seeded"
    return items[0]


# ---------- Health ----------
def test_root_health():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    j = r.json()
    assert j.get("app") == "Bhavin Creations"
    assert j.get("by") == "RK Technologies"
    assert j.get("status") == "ok"


# ---------- Auth ----------
class TestAuth:
    def test_register_and_me_logout(self):
        s = requests.Session()
        unique = f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
        r = s.post(f"{API}/auth/register", json={"name": "Test User", "email": unique, "password": "Pass@123"}, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        # Backend normalizes email to lowercase — that's expected behavior
        assert body["email"] == unique.lower()
        assert body["role"] == "customer"
        # cookies should be set
        assert "access_token" in s.cookies.get_dict()

        me = s.get(f"{API}/auth/me", timeout=15)
        assert me.status_code == 200
        assert me.json()["email"] == unique.lower()

        out = s.post(f"{API}/auth/logout", timeout=15)
        assert out.status_code == 200
        # me should now fail
        me2 = s.get(f"{API}/auth/me", timeout=15)
        assert me2.status_code == 401

    def test_register_duplicate_email(self):
        r = requests.post(f"{API}/auth/register", json={"name": "Dup", **CUSTOMER}, timeout=15)
        assert r.status_code == 400

    def test_login_invalid_password_returns_401(self):
        # Use a never-locked random email so we don't burn lockouts
        bogus = f"TEST_nope_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/login", json={"email": bogus, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_brute_force_lockout(self):
        # Use a unique email so we don't lock a real account
        target = f"TEST_lock_{uuid.uuid4().hex[:8]}@example.com"
        s = requests.Session()
        s.post(f"{API}/auth/register", json={"name": "Lock", "email": target, "password": "Right@123"}, timeout=15)
        s.post(f"{API}/auth/logout", timeout=15)
        # Hammer up to 20 times; behind ingress, request.client.host may rotate
        # across hops, so use a single requests.Session and many attempts.
        last_status = None
        for _ in range(20):
            r = s.post(f"{API}/auth/login", json={"email": target, "password": "WrongPass!"}, timeout=15)
            last_status = r.status_code
            if last_status == 429:
                break
        assert last_status == 429, f"expected 429 lockout eventually, last status={last_status}"


# ---------- Products ----------
class TestProducts:
    def test_list_products(self):
        r = requests.get(f"{API}/products", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 10
        assert {"id", "title", "price", "category"}.issubset(items[0].keys())

    def test_filters_and_sort(self):
        r = requests.get(f"{API}/products?category=Keychains&sort=price_asc", timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert all(p["category"] == "Keychains" for p in items)
        prices = [p["price"] for p in items]
        assert prices == sorted(prices)

    def test_min_max_and_q(self):
        r = requests.get(f"{API}/products?min_price=500&max_price=1500&q=tray", timeout=15)
        assert r.status_code == 200
        for p in r.json():
            assert 500 <= p["price"] <= 1500

    def test_featured_filter(self):
        r = requests.get(f"{API}/products?featured=true", timeout=15)
        assert r.status_code == 200
        for p in r.json():
            assert p["featured"] is True

    def test_get_product(self, sample_product):
        r = requests.get(f"{API}/products/{sample_product['id']}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == sample_product["id"]

    def test_get_product_404(self):
        r = requests.get(f"{API}/products/nonexistent-id", timeout=15)
        assert r.status_code == 404

    def test_categories(self):
        r = requests.get(f"{API}/categories", timeout=15)
        assert r.status_code == 200
        cats = r.json()
        assert isinstance(cats, list) and len(cats) > 0
        c = cats[0]
        assert {"name", "count", "image"}.issubset(c.keys())
        assert c["count"] > 0


# ---------- Reviews ----------
class TestReviews:
    def test_list_and_create_review(self, customer_session, sample_product):
        pid = sample_product["id"]
        r = requests.get(f"{API}/products/{pid}/reviews", timeout=15)
        assert r.status_code == 200

        post = customer_session.post(f"{API}/reviews", json={
            "product_id": pid, "rating": 5, "comment": "TEST_great"
        }, timeout=15)
        assert post.status_code == 200, post.text
        # verify product aggregate updated
        p = requests.get(f"{API}/products/{pid}", timeout=15).json()
        assert p["review_count"] >= 1
        assert 1 <= p["rating"] <= 5

    def test_create_review_unauth(self, sample_product):
        r = requests.post(f"{API}/reviews", json={
            "product_id": sample_product["id"], "rating": 5, "comment": "x"
        }, timeout=15)
        assert r.status_code == 401


# ---------- Cart ----------
class TestCart:
    def test_cart_crud_flow(self, customer_session, sample_product):
        pid = sample_product["id"]
        # clear first
        customer_session.delete(f"{API}/cart/{pid}", timeout=15)

        r = customer_session.post(f"{API}/cart", json={"product_id": pid, "quantity": 2}, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert any(it["product_id"] == pid for it in body["items"])
        assert body["count"] >= 2

        r2 = customer_session.put(f"{API}/cart/{pid}", json={"product_id": pid, "quantity": 3}, timeout=15)
        assert r2.status_code == 200
        item = next(it for it in r2.json()["items"] if it["product_id"] == pid)
        assert item["quantity"] == 3

        r3 = customer_session.get(f"{API}/cart", timeout=15)
        assert r3.status_code == 200

        r4 = customer_session.delete(f"{API}/cart/{pid}", timeout=15)
        assert r4.status_code == 200
        assert all(it["product_id"] != pid for it in r4.json()["items"])

    def test_cart_unauth(self):
        assert requests.get(f"{API}/cart", timeout=15).status_code == 401


# ---------- Wishlist ----------
class TestWishlist:
    def test_wishlist_flow(self, customer_session, sample_product):
        pid = sample_product["id"]
        customer_session.delete(f"{API}/wishlist/{pid}", timeout=15)
        r = customer_session.post(f"{API}/wishlist", json={"product_id": pid}, timeout=15)
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()["items"]]
        assert pid in ids

        g = customer_session.get(f"{API}/wishlist", timeout=15)
        assert g.status_code == 200

        d = customer_session.delete(f"{API}/wishlist/{pid}", timeout=15)
        assert d.status_code == 200
        assert pid not in [p["id"] for p in d.json()["items"]]


# ---------- Coupons ----------
class TestCoupons:
    def test_validate_welcome10(self):
        r = requests.post(f"{API}/coupons/validate", json={"code": "WELCOME10"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["discount_pct"] == 10

    def test_validate_invalid(self):
        r = requests.post(f"{API}/coupons/validate", json={"code": "FAKE_XYZ"}, timeout=15)
        assert r.status_code == 404

    def test_admin_coupons_list_and_create(self, admin_session):
        lst = admin_session.get(f"{API}/coupons", timeout=15)
        assert lst.status_code == 200
        new_code = f"TEST{uuid.uuid4().hex[:5].upper()}"
        cr = admin_session.post(f"{API}/coupons", json={"code": new_code, "discount_pct": 5, "active": True}, timeout=15)
        assert cr.status_code == 200
        v = requests.post(f"{API}/coupons/validate", json={"code": new_code}, timeout=15)
        assert v.status_code == 200

    def test_admin_coupons_requires_admin(self, customer_session):
        r = customer_session.get(f"{API}/coupons", timeout=15)
        assert r.status_code == 403


# ---------- Checkout / Orders ----------
class TestCheckoutOrders:
    def test_full_checkout_flow_and_math(self, customer_session, sample_product):
        # build cart with qty enough to trigger free shipping if possible
        pid = sample_product["id"]
        customer_session.delete(f"{API}/cart/{pid}", timeout=15)
        customer_session.post(f"{API}/cart", json={"product_id": pid, "quantity": 4}, timeout=15)

        cart = customer_session.get(f"{API}/cart", timeout=15).json()
        subtotal = cart["subtotal"]
        expected_shipping = 0 if subtotal > 999 else 49
        expected_discount = round(subtotal * 0.10, 2)
        expected_total = round(subtotal - expected_discount + expected_shipping, 2)

        addr = {
            "full_name": "TEST Demo", "phone": "9999999999", "line1": "1 Lane",
            "city": "Mumbai", "state": "MH", "pincode": "400001", "country": "India",
        }
        r = customer_session.post(f"{API}/checkout", json={
            "address": addr, "coupon_code": "WELCOME10", "payment_method": "mock_card"
        }, timeout=20)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["payment_status"] == "paid"
        assert order["status"] == "confirmed"
        assert order["coupon_code"] == "WELCOME10"
        assert order["subtotal"] == subtotal
        assert order["discount"] == expected_discount
        assert order["shipping"] == expected_shipping
        assert order["total"] == expected_total
        # cart should be cleared
        cart_after = customer_session.get(f"{API}/cart", timeout=15).json()
        assert cart_after["count"] == 0
        # store order id for next tests
        TestCheckoutOrders.order_id = order["id"]

    def test_list_orders(self, customer_session):
        r = customer_session.get(f"{API}/orders", timeout=15)
        assert r.status_code == 200
        orders = r.json()
        assert any(o["id"] == TestCheckoutOrders.order_id for o in orders)

    def test_get_own_order(self, customer_session):
        r = customer_session.get(f"{API}/orders/{TestCheckoutOrders.order_id}", timeout=15)
        assert r.status_code == 200

    def test_get_other_order_forbidden(self, sample_product):
        # register fresh user, try to access first user's order
        s = requests.Session()
        u = f"TEST_otr_{uuid.uuid4().hex[:6]}@example.com"
        s.post(f"{API}/auth/register", json={"name": "X", "email": u, "password": "Pass@123"}, timeout=15)
        r = s.get(f"{API}/orders/{TestCheckoutOrders.order_id}", timeout=15)
        assert r.status_code == 403

    def test_request_return(self, customer_session):
        r = customer_session.post(f"{API}/orders/{TestCheckoutOrders.order_id}/return",
                                  json={"reason": "TEST_damaged"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "pending"

    def test_admin_orders_list_and_status_update(self, admin_session):
        lst = admin_session.get(f"{API}/admin/orders", timeout=15)
        assert lst.status_code == 200
        upd = admin_session.put(f"{API}/admin/orders/{TestCheckoutOrders.order_id}",
                                json={"status": "shipped"}, timeout=15)
        assert upd.status_code == 200
        assert upd.json()["status"] == "shipped"

    def test_admin_orders_invalid_status(self, admin_session):
        r = admin_session.put(f"{API}/admin/orders/{TestCheckoutOrders.order_id}",
                              json={"status": "garbage"}, timeout=15)
        assert r.status_code == 400

    def test_admin_orders_requires_admin(self, customer_session):
        r = customer_session.get(f"{API}/admin/orders", timeout=15)
        assert r.status_code == 403


# ---------- Admin Product CRUD ----------
class TestAdminProductCRUD:
    def test_create_update_delete_as_admin(self, admin_session):
        payload = {
            "title": "TEST_AdminProduct", "description": "tmp", "price": 199.0,
            "category": "Keychains", "color": "Blue", "stock": 5,
            "images": ["https://example.com/x.jpg"], "featured": False,
        }
        r = admin_session.post(f"{API}/products", json=payload, timeout=15)
        assert r.status_code == 200
        pid = r.json()["id"]
        # GET
        g = requests.get(f"{API}/products/{pid}", timeout=15)
        assert g.status_code == 200 and g.json()["title"] == "TEST_AdminProduct"
        # UPDATE
        payload["price"] = 249.0
        u = admin_session.put(f"{API}/products/{pid}", json=payload, timeout=15)
        assert u.status_code == 200 and u.json()["price"] == 249.0
        # DELETE
        d = admin_session.delete(f"{API}/products/{pid}", timeout=15)
        assert d.status_code == 200
        assert requests.get(f"{API}/products/{pid}", timeout=15).status_code == 404

    def test_non_admin_cannot_create(self, customer_session):
        r = customer_session.post(f"{API}/products", json={
            "title": "x", "description": "x", "price": 1, "category": "x", "color": "x",
            "stock": 1, "images": ["http://x"], "featured": False
        }, timeout=15)
        assert r.status_code == 403


# ---------- Custom Orders ----------
class TestCustomOrders:
    def test_create_public(self):
        r = requests.post(f"{API}/custom-orders", json={
            "name": "TEST C", "email": "test@example.com", "phone": "1234567890",
            "description": "A custom resin tray", "budget": 1500
        }, timeout=15)
        assert r.status_code == 200
        assert r.json()["status"] == "new"

    def test_admin_list(self, admin_session):
        r = admin_session.get(f"{API}/admin/custom-orders", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_only(self, customer_session):
        r = customer_session.get(f"{API}/admin/custom-orders", timeout=15)
        assert r.status_code == 403


# ---------- Contact ----------
def test_contact_public():
    r = requests.post(f"{API}/contact", json={
        "name": "TEST", "email": "t@e.com", "subject": "hi", "message": "hello"
    }, timeout=15)
    assert r.status_code == 200
    assert "id" in r.json()


# ---------- Admin Analytics ----------
def test_admin_analytics(admin_session):
    r = admin_session.get(f"{API}/admin/analytics", timeout=15)
    assert r.status_code == 200
    j = r.json()
    for k in ["products", "customers", "orders", "revenue", "daily_revenue"]:
        assert k in j
    assert isinstance(j["daily_revenue"], list) and len(j["daily_revenue"]) == 7


def test_admin_analytics_requires_admin(customer_session):
    r = customer_session.get(f"{API}/admin/analytics", timeout=15)
    assert r.status_code == 403


# ---------- AI Recommendations ----------
def test_ai_recommendations():
    r = requests.post(f"{API}/ai/recommendations", json={
        "seed_product_ids": [], "interests": "pastel coastal vibes"
    }, timeout=60)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "items" in j and "reasoning" in j
    assert isinstance(j["items"], list)
