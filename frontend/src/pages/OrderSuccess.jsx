import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccess() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => {});
    }, [id]);

    return (
        <div className="max-w-2xl mx-auto px-6 lg:px-10 py-20 text-center" data-testid="order-success-page">
            <CheckCircle2 className="h-16 w-16 mx-auto gold-text" />
            <h1 className="serif text-4xl font-semibold mt-6">Thank you for your order!</h1>
            <p className="text-foreground/70 mt-3">Your order has been confirmed.</p>
            {order && (
                <div className="mt-8 border hairline rounded-md p-6 text-left">
                    <p className="text-xs uppercase tracking-widest text-foreground/60">Order ID</p>
                    <p className="serif text-lg" data-testid="order-id">{order.id}</p>
                    <div className="border-t hairline mt-4 pt-4 space-y-1 text-sm">
                        <div className="flex justify-between"><span>Items</span><span>{order.items.length}</span></div>
                        <div className="flex justify-between"><span>Total</span><span className="font-medium">₹{order.total.toLocaleString("en-IN")}</span></div>
                        <div className="flex justify-between"><span>Status</span><span className="gold-text">{order.status}</span></div>
                    </div>
                </div>
            )}
            <div className="mt-8 flex justify-center gap-3">
                <Link to="/account" className="px-6 h-11 inline-flex items-center rounded-md border hairline text-sm">My Orders</Link>
                <Link to="/shop" className="px-6 h-11 inline-flex items-center rounded-md btn-gold text-sm">Continue Shopping</Link>
            </div>
        </div>
    );
}
