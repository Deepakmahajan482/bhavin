import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function ProductCard({ product, index = 0 }) {
    const { has, toggle } = useWishlist();
    const { addItem } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const onWishlist = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || user === false) {
            toast.message("Please log in to save to wishlist");
            navigate("/login");
            return;
        }
        await toggle(product.id);
    };

    const onAdd = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || user === false) {
            toast.message("Please log in to add to cart");
            navigate("/login");
            return;
        }
        try {
            await addItem(product.id, 1);
            toast.success("Added to cart");
        } catch {
            toast.error("Could not add to cart");
        }
    };

    return (
        <Link
            to={`/products/${product.id}`}
            className="group block reveal"
            style={{ animationDelay: `${(index % 8) * 60}ms` }}
            data-testid={`product-card-${product.id}`}
        >
            <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-muted">
                <img
                    src={product.images?.[0]}
                    alt={product.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <button
                    onClick={onWishlist}
                    className="absolute top-3 right-3 h-9 w-9 inline-flex items-center justify-center rounded-full bg-background/85 backdrop-blur hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] transition"
                    data-testid={`wishlist-toggle-${product.id}`}
                    aria-label="Toggle wishlist"
                >
                    <Heart className={`h-4 w-4 ${has(product.id) ? "fill-current gold-text" : ""}`} />
                </button>
                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button
                        onClick={onAdd}
                        className="w-full h-10 rounded-md btn-gold text-sm font-medium"
                        data-testid={`add-to-cart-${product.id}`}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="serif text-base font-medium truncate">{product.title}</p>
                    <p className="text-xs text-foreground/60 mt-0.5">{product.category} · {product.color}</p>
                </div>
                <p className="text-sm font-medium shrink-0">₹{product.price.toLocaleString("en-IN")}</p>
            </div>
        </Link>
    );
}
