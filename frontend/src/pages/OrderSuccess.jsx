import { useEffect, useRef, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function OrderSuccess() {
    const { id } = useParams();
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const cancelled = params.get("cancelled");
    const { refresh } = useCart();
    const [order, setOrder] = useState(null);
    const [paymentState, setPaymentState] = useState(sessionId ? "checking" : "ready");
    const attempts = useRef(0);

    useEffect(() => {
        if (cancelled) {
            setPaymentState("cancelled");
            return;
        }
        let stop = false;
        const loadOrder = () => api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch(() => {});

        if (!sessionId) {
            loadOrder();
            return;
        }
        const poll = async () => {
            if (stop) return;
            try {
                const { data } = await api.get(`/payments/stripe/status/${sessionId}`);
                if (data.payment_status === "paid") {
                    setOrder(data.order);
                    setPaymentState("paid");
                    refresh();
                    return;
                }
                if (data.status === "expired") {
                    setPaymentState("expired");
                    return;
                }
            } catch {}
            attempts.current += 1;
            if (attempts.current > 20) {
                setPaymentState("timeout");
                return;
            }
            setTimeout(poll, 2000);
        };
        poll();
        return () => { stop = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, sessionId, cancelled]);

    const isError = paymentState === "expired" || paymentState === "timeout" || paymentState === "cancelled";

    return (
        <div className="max-w-2xl mx-auto px-6 lg:px-10 py-20 text-center" data-testid="order-success-page">
            {paymentState === "checking" && (
                <>
                    <Clock className="h-16 w-16 mx-auto text-foreground/40 animate-pulse" />
                    <h1 className="serif text-4xl font-semibold mt-6">Confirming your payment…</h1>
                    <p className="text-foreground/70 mt-3">Please don't close this window.</p>
                </>
            )}
            {isError && (
                <>
                    <XCircle className="h-16 w-16 mx-auto text-destructive" />
                    <h1 className="serif text-4xl font-semibold mt-6">
                        {paymentState === "cancelled" ? "Payment cancelled" : "Payment didn't go through"}
                    </h1>
                    <p className="text-foreground/70 mt-3">
                        {paymentState === "cancelled" ? "Your order was not placed. You can try again any time." : "Please try again or pick a different payment method."}
                    </p>
                    <Link to="/checkout" className="mt-8 inline-flex items-center px-6 h-11 rounded-md btn-gold text-sm">Try Again</Link>
                </>
            )}
            {(paymentState === "ready" || paymentState === "paid") && (
                <>
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
                                <div className="flex justify-between"><span>Payment</span><span className="capitalize gold-text">{order.payment_status}</span></div>
                                <div className="flex justify-between"><span>Status</span><span className="capitalize gold-text">{order.status}</span></div>
                            </div>
                        </div>
                    )}
                    <div className="mt-8 flex justify-center gap-3">
                        <Link to="/account" className="px-6 h-11 inline-flex items-center rounded-md border hairline text-sm">My Orders</Link>
                        <Link to="/shop" className="px-6 h-11 inline-flex items-center rounded-md btn-gold text-sm">Continue Shopping</Link>
                    </div>
                </>
            )}
        </div>
    );
}
