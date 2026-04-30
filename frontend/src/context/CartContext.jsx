import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { user } = useAuth();
    const [cart, setCart] = useState({ items: [], subtotal: 0, count: 0 });
    const [open, setOpen] = useState(false);

    const refresh = useCallback(async () => {
        if (!user || user === false) {
            setCart({ items: [], subtotal: 0, count: 0 });
            return;
        }
        try {
            const { data } = await api.get("/cart");
            setCart(data);
        } catch {
            setCart({ items: [], subtotal: 0, count: 0 });
        }
    }, [user]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addItem = async (product_id, quantity = 1) => {
        const { data } = await api.post("/cart", { product_id, quantity });
        setCart(data);
        setOpen(true);
    };
    const updateItem = async (product_id, quantity) => {
        const { data } = await api.put(`/cart/${product_id}`, { product_id, quantity });
        setCart(data);
    };
    const removeItem = async (product_id) => {
        const { data } = await api.delete(`/cart/${product_id}`);
        setCart(data);
    };

    return (
        <CartContext.Provider value={{ cart, open, setOpen, addItem, updateItem, removeItem, refresh }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
