import { useWishlist } from "../context/WishlistContext";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
    const { wishlist } = useWishlist();
    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12" data-testid="wishlist-page">
            <h1 className="serif text-4xl font-semibold mb-8">Your Wishlist</h1>
            {wishlist.items.length === 0 ? (
                <p className="text-foreground/60 py-12">Nothing saved yet. Browse our pieces and save your favourites.</p>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
                    {wishlist.items.map((p, i) => <ProductCard product={p} index={i} key={p.id} />)}
                </div>
            )}
        </div>
    );
}
