import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";

export default function Account() {
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        api.get("/orders").then((r) => setOrders(r.data)).catch(() => {});
    }, []);

    const requestReturn = async (oid) => {
        const reason = prompt("Reason for return?");
        if (!reason) return;
        try {
            await api.post(`/orders/${oid}/return`, { reason });
            toast.success("Return request submitted");
        } catch {
            toast.error("Could not submit return");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-12" data-testid="account-page">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] gold-text">Account</p>
                    <h1 className="serif text-4xl font-semibold mt-2">Hello, {user?.name}</h1>
                    <p className="text-sm text-foreground/60">{user?.email}</p>
                </div>
                <button onClick={logout} className="px-5 h-10 rounded-md border hairline text-sm" data-testid="account-logout">Logout</button>
            </div>

            <Tabs defaultValue="orders" className="w-full">
                <TabsList>
                    <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
                    <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="mt-6">
                    {orders.length === 0 ? (
                        <p className="text-foreground/60 py-12">No orders yet.</p>
                    ) : (
                        <ul className="space-y-4">
                            {orders.map((o) => (
                                <li key={o.id} className="border hairline rounded-md p-5" data-testid={`order-${o.id}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-foreground/60">Order</p>
                                            <p className="serif text-base">#{o.id.slice(0, 8)}</p>
                                        </div>
                                        <span className="px-3 h-7 inline-flex items-center rounded-md text-xs gold-text border gold-border">{o.status}</span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {o.items.slice(0, 4).map((it, i) => (
                                            <img key={i} src={it.image} alt={it.title} className="h-14 w-14 object-cover rounded-md" />
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center justify-between text-sm">
                                        <span>{o.items.length} item{o.items.length !== 1 ? "s" : ""}</span>
                                        <span className="font-medium">₹{o.total.toLocaleString("en-IN")}</span>
                                    </div>
                                    {o.status !== "returned" && o.status !== "cancelled" && (
                                        <button onClick={() => requestReturn(o.id)} className="mt-3 text-xs gold-text hover:underline" data-testid={`return-${o.id}`}>Request Return</button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                    <div className="border hairline rounded-md p-6 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-foreground/60">Name</span><span>{user?.name}</span></div>
                        <div className="flex justify-between"><span className="text-foreground/60">Email</span><span>{user?.email}</span></div>
                        <div className="flex justify-between"><span className="text-foreground/60">Role</span><span className="capitalize">{user?.role}</span></div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
