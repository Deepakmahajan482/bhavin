import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE = 20;

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);

    const load = (p = page) => {
        api.get(`/admin/orders?skip=${p * PAGE}&limit=${PAGE}`).then((r) => {
            setOrders(r.data.items || []);
            setTotal(r.data.total || 0);
        });
    };
    useEffect(() => { load(0); }, []);

    const updateStatus = async (id, status) => {
        await api.put(`/admin/orders/${id}`, { status });
        load(page);
    };

    const lastPage = Math.max(0, Math.ceil(total / PAGE) - 1);

    return (
        <div data-testid="admin-orders">
            <h2 className="serif text-2xl mb-6">Orders</h2>
            <div className="border hairline rounded-md overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="text-left p-3 font-medium">Order</th>
                            <th className="text-left p-3 font-medium">Customer</th>
                            <th className="text-left p-3 font-medium">Items</th>
                            <th className="text-left p-3 font-medium">Total</th>
                            <th className="text-left p-3 font-medium">Payment</th>
                            <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id} className="border-t hairline" data-testid={`admin-order-${o.id}`}>
                                <td className="p-3 serif">#{o.id.slice(0, 8)}</td>
                                <td className="p-3"><div>{o.user_name}</div><div className="text-xs text-foreground/60">{o.user_email}</div></td>
                                <td className="p-3">{o.items.length}</td>
                                <td className="p-3">₹{o.total.toLocaleString("en-IN")}</td>
                                <td className="p-3"><span className={`text-xs ${o.payment_status === "paid" ? "gold-text" : "text-foreground/60"}`}>{o.payment_status}</span><div className="text-[10px] text-foreground/50">{o.payment_method}</div></td>
                                <td className="p-3">
                                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                                        <SelectTrigger className="w-[150px] h-9" data-testid={`status-select-${o.id}`}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["pending_payment", "confirmed", "shipped", "delivered", "cancelled", "returned"].map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan="6" className="p-8 text-center text-foreground/60">No orders yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between mt-4 text-sm text-foreground/70">
                <span>Showing {page * PAGE + 1}–{Math.min(total, (page + 1) * PAGE)} of {total}</span>
                <div className="flex gap-1">
                    <button onClick={() => { const p = Math.max(0, page - 1); setPage(p); load(p); }} disabled={page === 0} className="h-9 w-9 inline-flex items-center justify-center rounded-md border hairline disabled:opacity-30" data-testid="orders-prev"><ChevronLeft className="h-4 w-4" /></button>
                    <button onClick={() => { const p = Math.min(lastPage, page + 1); setPage(p); load(p); }} disabled={page >= lastPage} className="h-9 w-9 inline-flex items-center justify-center rounded-md border hairline disabled:opacity-30" data-testid="orders-next"><ChevronRight className="h-4 w-4" /></button>
                </div>
            </div>
        </div>
    );
}
