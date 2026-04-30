import { useEffect, useState } from "react";
import { api, API_BASE } from "../../lib/api";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../components/ui/dialog";
import { toast } from "sonner";

const empty = { title: "", description: "", price: 0, category: "", color: "", stock: 10, images: [], featured: false };

export default function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(empty);
    const [editing, setEditing] = useState(null);
    const [open, setOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const load = () => api.get("/products?limit=200").then((r) => setProducts(r.data));
    useEffect(() => { load(); }, []);

    const save = async (e) => {
        e.preventDefault();
        if (form.images.length === 0) {
            toast.error("Add at least one image");
            return;
        }
        const payload = { ...form, price: Number(form.price), stock: Number(form.stock), images: form.images };
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

    const onUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setUploading(true);
        const newUrls = [];
        for (const f of files) {
            const fd = new FormData();
            fd.append("file", f);
            try {
                const { data } = await api.post("/uploads", fd, { headers: { "Content-Type": "multipart/form-data" } });
                newUrls.push(`${API_BASE}${data.url}`);
            } catch (err) {
                toast.error(err.response?.data?.detail || "Upload failed");
            }
        }
        setForm((f) => ({ ...f, images: [...f.images, ...newUrls] }));
        setUploading(false);
        e.target.value = "";
    };

    const removeImage = (idx) => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

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
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-widest text-foreground/60">Images</label>
                                {form.images.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {form.images.map((url, i) => (
                                            <div key={i} className="relative aspect-square rounded-md overflow-hidden border hairline">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 h-6 w-6 inline-flex items-center justify-center rounded-full bg-background/85 hover:bg-destructive hover:text-white" data-testid={`remove-img-${i}`}>
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <label className="flex items-center justify-center gap-2 h-20 border hairline border-dashed rounded-md cursor-pointer hover:gold-border text-sm" data-testid="prod-upload-label">
                                    <Upload className="h-4 w-4" />
                                    {uploading ? "Uploading…" : "Upload images (jpg/png/webp ≤ 8MB)"}
                                    <input type="file" multiple accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} data-testid="prod-upload-input" />
                                </label>
                            </div>

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
                                <td className="p-3"><span className={p.stock < 5 ? "text-destructive" : ""}>{p.stock}</span></td>
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
