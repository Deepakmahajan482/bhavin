import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Package, ShoppingCart, Users, Wallet, Sparkles, RotateCcw } from "lucide-react";

export default function AdminDashboard() {
    const [s, setS] = useState(null);
    useEffect(() => { api.get("/admin/analytics").then((r) => setS(r.data)); }, []);
    if (!s) return <p className="text-foreground/60">Loading…</p>;

    const cards = [
        { label: "Revenue", value: `₹${s.revenue.toLocaleString("en-IN")}`, icon: Wallet, accent: true },
        { label: "Orders", value: s.orders, icon: ShoppingCart },
        { label: "Products", value: s.products, icon: Package },
        { label: "Customers", value: s.customers, icon: Users },
        { label: "Custom Requests", value: s.custom_orders, icon: Sparkles },
        { label: "Pending Returns", value: s.pending_returns, icon: RotateCcw },
    ];
    const max = Math.max(...s.daily_revenue.map((d) => d.revenue), 1);

    return (
        <div data-testid="admin-dashboard">
            <h2 className="serif text-2xl mb-6">Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cards.map((c) => (
                    <div key={c.label} className={`p-5 rounded-md border ${c.accent ? "gold-border" : "hairline"}`}>
                        <c.icon className={`h-4 w-4 ${c.accent ? "gold-text" : "text-foreground/60"}`} />
                        <p className="text-xs text-foreground/60 mt-3">{c.label}</p>
                        <p className="serif text-2xl font-semibold mt-1">{c.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-10 border hairline rounded-md p-6">
                <p className="serif text-lg mb-4">Last 7 Days Revenue</p>
                <div className="flex items-end gap-2 h-40">
                    {s.daily_revenue.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full bg-[hsl(var(--accent))]/80 rounded-t" style={{ height: `${(d.revenue / max) * 100}%`, minHeight: 4 }} />
                            <span className="text-[10px] text-foreground/60">{d.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
