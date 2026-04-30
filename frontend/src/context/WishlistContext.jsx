import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState({ items: [] });

    const refresh = useCallback(async () => {
        if (!user || user === false) {
            setWishlist({ items: [] });
            return;
        }
        try {
            const { data } = await api.get("/wishlist");
            setWishlist(data);
        } catch {
            setWishlist({ items: [] });
        }
    }, [user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const has = (id) => wishlist.items.some((p) => p.id === id);

    const toggle = async (product_id) => {
        if (has(product_id)) {
            const { data } = await api.delete(`/wishlist/${product_id}`);
            setWishlist(data);
        } else {
            const { data } = await api.post("/wishlist", { product_id });
            setWishlist(data);
        }
    };

    return (
        <WishlistContext.Provider value={{ wishlist, toggle, has, refresh }}>
            {children}
        </WishlistContext.Provider>
    );
}

export const useWishlist = () => useContext(WishlistContext);
