import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { toast } from "sonner";

const empty = { title: "", description: "", price: 0, category: "", color: "", stock: 10, images: [], featured: false };

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(empty);
    const [editing, setEditing] = useState(null);
    const [open, setOpen] = useState(false);

    const load = () => api.get("/products?limit=200").then((r) => setProducts(r.data));
    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        const payload = { ...form, price: Number(form.price), stock: Number(form.stock), images: form.images.filter(Boolean) };
        try {
            if (editing) await api.put(`/products/${editing}`, payload);
            else await api.post("/products", payload);
            await load();
            setOpen(false);
            setEditing(null);
            setForm(empty);
            toast.success("Saved");
        } catch (err) {
            toast.error(err.response?.data?.detail || "Failed to save");
        }
    };

    const onEdit = (p) => {
        setEditing(p.id);
        setForm({ ...p });
        setOpen(true);
    };
    const onNew = () => { setEditing(null); setForm(empty); setOpen(true); };
    const onDelete = async (id) => {
        if (!window.confirm("Delete this product?")) return;
        await api.delete(`/products/${id}`);
        await load();
    };

    return (
        <div data-testid="admin-products">
            <div className="flex items-center justify-between mb-6">
                <h2 className="serif text-2xl">Products</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <button onClick={onNew} className="inline-flex items-center gap-2 px-4 h-10 rounded-md btn-gold text-sm" data-testid="new-product-button">
                            <Plus className="h-4 w-4" /> New Product
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="serif">{editing ? "Edit Product" : "New Product"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={save} className="space-y-3">
                            <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-transparent border hairline rounded-md h-10 px-3 text-sm" data-testid="prod-title" />
                            <textarea required rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-transparent border hairline rounded-md p-3 text-sm" data-testid="prod-desc" />
                            <div className="grid grid-cols-2 gap-3">
                                <input required type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-transparent border hairline rounded-md h-10 px-3 text-sm" data-testid="prod-price" />
                                <input required type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="bg-transparent border hairline rounded-md h-10 px-3 text-sm" data-testid="prod-stock" />
                                <input required placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-transparent border hairline rounded-md h-10 px-3 text-sm" data-testid="prod-cat" />
                                <input required placeholder="Color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="bg-transparent border hairline rounded-md h-10 px-3 text-sm" data-testid="prod-color" />
                            </div>
                            <textarea rows={2} placeholder="Image URLs (one per line)" value={form.images.join("\n")} onChange={(e) => setForm({ ...form, images: e.target.value.split("\n") })} className="w-full bg-transparent border hairline rounded-md p-3 text-sm" data-testid="prod-images" />
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="prod-featured" />
                                Featured
                            </label>
                            <button className="w-full h-11 rounded-md btn-gold text-sm" data-testid="prod-save">Save</button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border hairline rounded-md overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted">
                        <tr>
                            <th className="text-left p-3 font-medium">Image</th>
                            <th className="text-left p-3 font-medium">Title</th>
                            <th className="text-left p-3 font-medium">Category</th>
                            <th className="text-left p-3 font-medium">Price</th>
                            <th className="text-left p-3 font-medium">Stock</th>
                            <th className="text-right p-3 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id} className="border-t hairline" data-testid={`admin-product-row-${p.id}`}>
                                <td className="p-3"><img src={p.images[0]} alt={p.title} className="h-10 w-10 rounded object-cover" /></td>
                                <td className="p-3 serif">{p.title}</td>
                                <td className="p-3 text-foreground/70">{p.category}</td>
                                <td className="p-3">₹{p.price}</td>
                                <td className="p-3">{p.stock}</td>
                                <td className="p-3 text-right">
                                    <button onClick={() => onEdit(p)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted" data-testid={`edit-${p.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => onDelete(p.id)} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted" data-testid={`delete-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
