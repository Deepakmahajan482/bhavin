import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminCustomOrders() {
    const [items, setItems] = useState([]);
    useEffect(() => { api.get("/admin/custom-orders").then((r) => setItems(r.data)); }, []);
    return (
        <div data-testid="admin-custom-orders">
            <h2 className="serif text-2xl mb-6">Custom Requests</h2>
            {items.length === 0 ? (
                <p className="text-foreground/60">No custom requests yet.</p>
            ) : (
                <ul className="space-y-3">
                    {items.map((c) => (
                        <li key={c.id} className="border hairline rounded-md p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="serif">{c.name}</p>
                                    <p className="text-xs text-foreground/60">{c.email} · {c.phone}</p>
                                </div>
                                {c.budget && <span className="text-sm gold-text">₹{c.budget}</span>}
                            </div>
                            <p className="text-sm mt-3">{c.description}</p>
                            {c.reference_image && <a href={c.reference_image} target="_blank" rel="noreferrer" className="text-xs gold-text mt-2 inline-block">View reference</a>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
