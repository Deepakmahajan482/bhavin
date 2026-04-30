import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";

export default function CartDrawer() {
    const { cart, open, setOpen, updateItem, removeItem } = useCart();
    const navigate = useNavigate();

    const goCheckout = () => {
        setOpen(false);
        navigate("/checkout");
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent className="w-full sm:max-w-md flex flex-col" data-testid="cart-drawer">
                <SheetHeader>
                    <SheetTitle className="serif text-2xl">Your Cart</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {cart.items.length === 0 ? (
                        <p className="text-center text-foreground/60 py-12 text-sm">Your cart is empty.</p>
                    ) : (
                        <ul className="space-y-4">
                            {cart.items.map((it) => (
                                <li key={it.product_id} className="flex gap-3" data-testid={`cart-item-${it.product_id}`}>
                                    <img src={it.product.images?.[0]} alt={it.product.title} className="h-20 w-20 object-cover rounded-md" />
                                    <div className="flex-1 min-w-0">
                                        <p className="serif text-sm font-medium truncate">{it.product.title}</p>
                                        <p className="text-xs text-foreground/60">₹{it.product.price.toLocaleString("en-IN")}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <button onClick={() => updateItem(it.product_id, Math.max(0, it.quantity - 1))} className="h-7 w-7 rounded-md border hairline inline-flex items-center justify-center" data-testid={`cart-decrease-${it.product_id}`}>
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm w-6 text-center">{it.quantity}</span>
                                            <button onClick={() => updateItem(it.product_id, it.quantity + 1)} className="h-7 w-7 rounded-md border hairline inline-flex items-center justify-center" data-testid={`cart-increase-${it.product_id}`}>
                                                <Plus className="h-3 w-3" />
                                            </button>
                                            <button onClick={() => removeItem(it.product_id)} className="ml-auto text-foreground/60 hover:text-destructive" data-testid={`cart-remove-${it.product_id}`}>
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium shrink-0">₹{it.line_total.toLocaleString("en-IN")}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {cart.items.length > 0 && (
                    <div className="border-t hairline pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Subtotal</span>
                            <span className="text-base font-medium" data-testid="cart-subtotal">₹{cart.subtotal.toLocaleString("en-IN")}</span>
                        </div>
                        <button onClick={goCheckout} className="w-full h-11 rounded-md btn-gold text-sm font-medium" data-testid="cart-checkout-button">
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
