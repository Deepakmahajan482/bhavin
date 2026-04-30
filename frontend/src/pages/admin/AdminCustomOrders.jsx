import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE = 20;

export default function AdminCustomOrders() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);

    const load = (p) => api.get(`/admin/custom-orders?skip=${p * PAGE}&limit=${PAGE}`).then((r) => {
        setItems(r.data.items || []);
        setTotal(r.data.total || 0);
    });
    useEffect(() => { load(0); }, []);

    const lastPage = Math.max(0, Math.ceil(total / PAGE) - 1);

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
            {total > PAGE && (
                <div className="flex items-center justify-between mt-4 text-sm text-foreground/70">
                    <span>Showing {page * PAGE + 1}–{Math.min(total, (page + 1) * PAGE)} of {total}</span>
                    <div className="flex gap-1">
                        <button onClick={() => { const p = Math.max(0, page - 1); setPage(p); load(p); }} disabled={page === 0} className="h-9 w-9 inline-flex items-center justify-center rounded-md border hairline disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
                        <button onClick={() => { const p = Math.min(lastPage, page + 1); setPage(p); load(p); }} disabled={page >= lastPage} className="h-9 w-9 inline-flex items-center justify-center rounded-md border hairline disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
                    </div>
                </div>
            )}
        </div>
    );
}
