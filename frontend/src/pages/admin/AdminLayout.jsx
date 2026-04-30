import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Sparkles } from "lucide-react";

export default function AdminLayout() {
    const items = [
        { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
        { to: "/admin/products", label: "Products", icon: Package },
        { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
        { to: "/admin/custom-orders", label: "Custom Requests", icon: Sparkles },
    ];
    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10" data-testid="admin-layout">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <aside className="lg:col-span-3">
                    <p className="text-xs uppercase tracking-[0.3em] gold-text">Admin</p>
                    <h1 className="serif text-3xl font-semibold mt-2 mb-6">Control Room</h1>
                    <nav className="flex flex-row lg:flex-col gap-1">
                        {items.map((it) => (
                            <NavLink
                                key={it.to}
                                to={it.to}
                                end={it.end}
                                className={({ isActive }) =>
                                    `inline-flex items-center gap-2 px-4 h-10 rounded-md text-sm transition ${isActive ? "bg-foreground text-background" : "hover:bg-muted"}`
                                }
                                data-testid={`admin-nav-${it.label.toLowerCase().replace(/ /g, "-")}`}
                            >
                                <it.icon className="h-4 w-4" /> {it.label}
                            </NavLink>
                        ))}
                    </nav>
                </aside>
                <div className="lg:col-span-9">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
