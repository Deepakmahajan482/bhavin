import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";

export default function Checkout() {
    const navigate = useNavigate();
    const { cart, refresh } = useCart();
    const [coupon, setCoupon] = useState("");
    const [couponData, setCouponData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        full_name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
    });
    const [paymentMethod, setPaymentMethod] = useState("mock_card");

    const apply = async () => {
        try {
            const { data } = await api.post("/coupons/validate", { code: coupon });
            setCouponData(data);
            toast.success(`Coupon applied: ${data.discount_pct}% off`);
        } catch (e) {
            setCouponData(null);
            toast.error(e.response?.data?.detail || "Invalid coupon");
        }
    };

    const subtotal = cart.subtotal;
    const discount = couponData ? Math.round(subtotal * (couponData.discount_pct / 100) * 100) / 100 : 0;
    const shipping = subtotal > 999 ? 0 : 49;
    const total = Math.max(0, subtotal - discount + shipping);

    const submit = async (e) => {
        e.preventDefault();
        if (cart.items.length === 0) {
            toast.error("Cart is empty");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.post("/checkout", {
                address: form,
                coupon_code: couponData?.code,
                payment_method: paymentMethod,
            });
            await refresh();
            navigate(`/orders/success/${data.id}`);
        } catch (err) {
            toast.error(err.response?.data?.detail || "Checkout failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12" data-testid="checkout-page">
            <h1 className="serif text-4xl font-semibold mb-10">Checkout</h1>
            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-8">
                    <div>
                        <p className="serif text-xl mb-4">Shipping Address</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ["full_name", "Full name", "col-span-2"],
                                ["phone", "Phone", "col-span-2 sm:col-span-1"],
                                ["pincode", "Pincode", "col-span-2 sm:col-span-1"],
                                ["line1", "Address line 1", "col-span-2"],
                                ["line2", "Address line 2 (optional)", "col-span-2"],
                                ["city", "City", "col-span-2 sm:col-span-1"],
                                ["state", "State", "col-span-2 sm:col-span-1"],
                            ].map(([k, label, cls]) => (
                                <input
                                    key={k}
                                    required={k !== "line2"}
                                    placeholder={label}
                                    value={form[k]}
                                    onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                                    className={`bg-transparent border hairline rounded-md h-11 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent))] ${cls}`}
                                    data-testid={`addr-${k}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="serif text-xl mb-4">Payment Method</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ["mock_card", "Card (Mock)"],
                                ["cod", "Cash on Delivery"],
                            ].map(([v, l]) => (
                                <button
                                    type="button"
                                    key={v}
                                    onClick={() => setPaymentMethod(v)}
                                    className={`h-12 rounded-md border text-sm transition ${paymentMethod === v ? "gold-border gold-text" : "hairline"}`}
                                    data-testid={`pay-${v}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-foreground/60 mt-3">Real payment gateway can be plugged in later. For now, "Card (Mock)" simulates a successful charge.</p>
                    </div>
                </div>

                <aside className="lg:col-span-5">
                    <div className="border hairline rounded-md p-6 space-y-4">
                        <p className="serif text-xl">Order Summary</p>
                        <ul className="space-y-2 text-sm max-h-60 overflow-y-auto">
                            {cart.items.map((it) => (
                                <li key={it.product_id} className="flex justify-between gap-3">
                                    <span className="truncate">{it.product.title} × {it.quantity}</span>
                                    <span>₹{it.line_total.toLocaleString("en-IN")}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 pt-2">
                            <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 bg-transparent border hairline rounded-md h-10 px-3 text-sm" data-testid="coupon-input" />
                            <button type="button" onClick={apply} className="px-4 h-10 rounded-md border hairline hover:gold-border text-sm" data-testid="coupon-apply">Apply</button>
                        </div>
                        <div className="border-t hairline pt-3 space-y-1.5 text-sm">
                            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
                            {discount > 0 && <div className="flex justify-between gold-text"><span>Discount ({couponData.code})</span><span>−₹{discount.toLocaleString("en-IN")}</span></div>}
                            <div className="flex justify-between"><span>Shipping</span><span>{shipping ? `₹${shipping}` : "Free"}</span></div>
                            <div className="flex justify-between border-t hairline pt-2 mt-2 text-base font-medium"><span>Total</span><span data-testid="checkout-total">₹{total.toLocaleString("en-IN")}</span></div>
                        </div>
                        <button disabled={loading} className="w-full h-12 rounded-md btn-gold font-medium disabled:opacity-50" data-testid="place-order-button">
                            {loading ? "Placing order…" : "Place Order"}
                        </button>
                    </div>
                </aside>
            </form>
        </div>
    );
}
