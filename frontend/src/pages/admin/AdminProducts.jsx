import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Pencil, Trash2, Plus, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { toast } from "sonner";

const empty = {
  title: "",
  description: "",
  price: 0,
  category: "",
  color: "",
  stock: 10,
  images: [],
  featured: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () =>
    api.get("/products?limit=200").then((r) => setProducts(r.data));

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();

    if (form.images.length === 0) {
      toast.error("Add at least one image");
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      stock: Number(form.stock),
      images: form.images,
    };

    try {
      if (editing) {
        await api.put(`/products/${editing}`, payload);
      } else {
        await api.post("/products", payload);
      }

      await load();
      setOpen(false);
      setEditing(null);
      setForm(empty);
      toast.success("Saved successfully");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to save");
    }
  };

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const newUrls = [];

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);

      try {
        const { data } = await api.post("/uploads", fd, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // FIX: Cloudinary URL is already full URL
        newUrls.push(data.url);

        toast.success("Image uploaded");
      } catch (err) {
        toast.error(err.response?.data?.detail || "Upload failed");
      }
    }

    setForm((prev) => ({
      ...prev,
      images: [...prev.images, ...newUrls],
    }));

    setUploading(false);
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const onEdit = (product) => {
    setEditing(product.id);
    setForm({ ...product });
    setOpen(true);
  };

  const onNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await api.delete(`/products/${id}`);
      await load();
      toast.success("Deleted successfully");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-6" data-testid="admin-products">
      <div className="flex items-center justify-between mb-6">
        <h2 className="serif text-2xl">Products</h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              onClick={onNew}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-md btn-gold text-sm"
            >
              <Plus className="h-4 w-4" />
              New Product
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="serif">
                {editing ? "Edit Product" : "New Product"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={save} className="space-y-3">
              <input
                required
                placeholder="Title"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="w-full border rounded-md h-10 px-3"
              />

              <textarea
                required
                rows={3}
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border rounded-md p-3"
              />

              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="number"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  className="border rounded-md h-10 px-3"
                />

                <input
                  required
                  type="number"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: e.target.value })
                  }
                  className="border rounded-md h-10 px-3"
                />

                <input
                  required
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="border rounded-md h-10 px-3"
                />

                <input
                  required
                  placeholder="Color"
                  value={form.color}
                  onChange={(e) =>
                    setForm({ ...form, color: e.target.value })
                  }
                  className="border rounded-md h-10 px-3"
                />
              </div>

              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.images.map((url, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-md overflow-hidden border"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-white shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center justify-center gap-2 h-20 border border-dashed rounded-md cursor-pointer">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload images"}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onUpload}
                  className="hidden"
                />
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      featured: e.target.checked,
                    })
                  }
                />
                Featured
              </label>

              <button className="w-full h-11 rounded-md btn-gold">
                Save Product
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Image</th>
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">
                  <img
                    src={p.images?.[0]}
                    alt={p.title}
                    className="h-10 w-10 rounded object-cover"
                  />
                </td>

                <td className="p-3">{p.title}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">₹{p.price}</td>
                <td className="p-3">{p.stock}</td>

                <td className="p-3 text-right">
                  <button
                    onClick={() => onEdit(p)}
                    className="mr-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>

                  <button onClick={() => onDelete(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}