import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import { Heart, Star, Truck, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addItem } = useCart();
    const { has, toggle } = useWishlist();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [related, setRelated] = useState([]);
    const [activeImg, setActiveImg] = useState(0);
    const [qty, setQty] = useState(1);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

    useEffect(() => {
        (async () => {
            const { data: p } = await api.get(`/products/${id}`);
            setProduct(p);
            setActiveImg(0);
            const [{ data: rev }, { data: rel }] = await Promise.all([
                api.get(`/products/${id}/reviews`),
                api.get(`/products?category=${encodeURIComponent(p.category)}&limit=4`),
            ]);
            setReviews(rev);
            setRelated(rel.filter((x) => x.id !== id).slice(0, 4));
        })().catch(() => navigate("/shop"));
    }, [id, navigate]);

    if (!product) return <div className="py-32 text-center text-foreground/60">Loading…</div>;

    const onAdd = async () => {
        if (!user || user === false) {
            toast.message("Please log in to add to cart");
            navigate("/login");
            return;
        }
        await addItem(product.id, qty);
        toast.success(`Added ${qty} to cart`);
    };
    const onWishlist = async () => {
        if (!user || user === false) {
            navigate("/login");
            return;
        }
        await toggle(product.id);
    };
    const submitReview = async (e) => {
        e.preventDefault();
        if (!user || user === false) {
            navigate("/login");
            return;
        }
        try {
            await api.post("/reviews", { product_id: id, rating: Number(reviewForm.rating), comment: reviewForm.comment });
            const [{ data: rev }, { data: p }] = await Promise.all([
                api.get(`/products/${id}/reviews`),
                api.get(`/products/${id}`),
            ]);
            setReviews(rev);
            setProduct(p);
            setReviewForm({ rating: 5, comment: "" });
            toast.success("Thanks for your review!");
        } catch {
            toast.error("Could not submit review");
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10" data-testid="product-detail-page">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7 grid grid-cols-5 gap-3">
                    <div className="hidden md:flex flex-col gap-3 col-span-1">
                        {product.images.map((src, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveImg(i)}
                                className={`aspect-square overflow-hidden rounded-md border ${activeImg === i ? "gold-border" : "hairline"}`}
                                data-testid={`thumb-${i}`}
                            >
                                <img src={src} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                    <div className="col-span-5 md:col-span-4 aspect-[4/5] rounded-md overflow-hidden bg-muted">
                        <img src={product.images[activeImg]} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <p className="text-xs uppercase tracking-[0.3em] gold-text">{product.category}</p>
                    <h1 className="serif text-4xl font-semibold mt-3 leading-tight">{product.title}</h1>
                    <div className="mt-3 flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1 gold-text">
                            {[1,2,3,4,5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= Math.round(product.rating) ? "fill-current" : ""}`} />)}
                        </div>
                        <span className="text-foreground/60">{product.rating} ({product.review_count} reviews)</span>
                    </div>
                    <p className="serif text-3xl font-medium mt-6">₹{product.price.toLocaleString("en-IN")}</p>
                    <p className="text-foreground/75 mt-5 leading-relaxed">{product.description}</p>

                    <div className="mt-7 flex items-center gap-3">
                        <div className="inline-flex items-center border hairline rounded-md">
                            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-11 w-11" data-testid="qty-decrease">−</button>
                            <span className="w-10 text-center text-sm" data-testid="qty-value">{qty}</span>
                            <button onClick={() => setQty((q) => q + 1)} className="h-11 w-11" data-testid="qty-increase">+</button>
                        </div>
                        <button onClick={onAdd} className="flex-1 h-11 rounded-md btn-gold text-sm font-medium" data-testid="add-to-cart-detail">
                            Add to Cart
                        </button>
                        <button onClick={onWishlist} className="h-11 w-11 rounded-md border hairline hover:gold-border inline-flex items-center justify-center" data-testid="wishlist-detail">
                            <Heart className={`h-4 w-4 ${has(product.id) ? "fill-current gold-text" : ""}`} />
                        </button>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
                        <div className="p-3 border hairline rounded-md flex flex-col gap-1.5"><Truck className="h-4 w-4 gold-text" />Free shipping above ₹999</div>
                        <div className="p-3 border hairline rounded-md flex flex-col gap-1.5"><Shield className="h-4 w-4 gold-text" />7-day easy returns</div>
                        <div className="p-3 border hairline rounded-md flex flex-col gap-1.5"><Sparkles className="h-4 w-4 gold-text" />Hand poured · 1 of 1</div>
                    </div>
                </div>
            </div>

            {/* Reviews */}
            <section className="mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10" data-testid="reviews-section">
                <div className="lg:col-span-5">
                    <p className="text-xs uppercase tracking-[0.3em] gold-text">Reviews</p>
                    <h2 className="serif text-3xl font-semibold mt-2">Words from our patrons</h2>
                    {user && user !== false && (
                        <form onSubmit={submitReview} className="mt-6 space-y-3" data-testid="review-form">
                            <div className="flex items-center gap-2">
                                {[1,2,3,4,5].map((n) => (
                                    <button type="button" key={n} onClick={() => setReviewForm((f) => ({...f, rating: n}))} aria-label={`${n} stars`} data-testid={`review-star-${n}`}>
                                        <Star className={`h-5 w-5 ${n <= reviewForm.rating ? "fill-current gold-text" : "text-foreground/30"}`} />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm((f) => ({...f, comment: e.target.value}))}
                                rows={4}
                                placeholder="Share your thoughts…"
                                className="w-full rounded-md border hairline bg-transparent p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent))]"
                                required
                                data-testid="review-comment"
                            />
                            <button className="px-5 h-10 rounded-md btn-gold text-sm" data-testid="review-submit">Post Review</button>
                        </form>
                    )}
                </div>
                <div className="lg:col-span-7 space-y-5">
                    {reviews.length === 0 ? (
                        <p className="text-foreground/60 text-sm">No reviews yet. Be the first to share your story.</p>
                    ) : reviews.map((r) => (
                        <div key={r.id} className="border-b hairline pb-5" data-testid={`review-${r.id}`}>
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-muted inline-flex items-center justify-center serif">{r.user_name?.[0]}</div>
                                <div>
                                    <p className="text-sm font-medium">{r.user_name}</p>
                                    <div className="flex gold-text">{[1,2,3,4,5].map((n) => <Star key={n} className={`h-3 w-3 ${n <= r.rating ? "fill-current" : "text-foreground/30"}`} />)}</div>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-foreground/80">{r.comment}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Related */}
            {related.length > 0 && (
                <section className="mt-24">
                    <h2 className="serif text-3xl font-semibold mb-8">You may also love</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
                        {related.map((p, i) => <ProductCard product={p} index={i} key={p.id} />)}
                    </div>
                </section>
            )}
        </div>
    );
}
