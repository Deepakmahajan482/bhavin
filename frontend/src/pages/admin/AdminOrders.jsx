import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const load = () => api.get("/admin/orders").then((r) => setOrders(r.data));
    useEffect(() => { load(); }, []);

    const updateStatus = async (id, status) => {
        await api.put(`/admin/orders/${id}`, { status });
        await load();
    };

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
                                <td className="p-3">
                                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                                        <SelectTrigger className="w-[140px] h-9" data-testid={`status-select-${o.id}`}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {["confirmed", "shipped", "delivered", "cancelled", "returned"].map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan="5" className="p-8 text-center text-foreground/60">No orders yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
