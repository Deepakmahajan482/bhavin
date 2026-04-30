import { useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function CustomOrder() {
    const [form, setForm] = useState({ name: "", email: "", phone: "", description: "", budget: "", reference_image: "" });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/custom-orders", { ...form, budget: form.budget ? Number(form.budget) : null });
            setSubmitted(true);
            toast.success("Custom request sent!");
        } catch {
            toast.error("Could not submit request");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto px-6 py-24 text-center" data-testid="custom-success">
                <p className="text-xs uppercase tracking-[0.3em] gold-text">Received</p>
                <h1 className="serif text-4xl font-semibold mt-3">Thank you.</h1>
                <p className="text-foreground/70 mt-3">We'll review your idea and reply within 48 hours with a sketch and quote.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16" data-testid="custom-order-page">
            <p className="text-xs uppercase tracking-[0.3em] gold-text">Custom</p>
            <h1 className="serif text-5xl font-semibold mt-3 leading-tight">Tell us your <span className="italic gold-text">idea.</span></h1>
            <p className="text-foreground/70 mt-4 max-w-2xl">
                Share your concept, colors, dimensions and any reference photos. We'll respond within 48 hours with a sketch and quote.
            </p>
            <form onSubmit={submit} className="mt-10 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <input required placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-transparent border hairline rounded-md h-11 px-3 text-sm col-span-2 sm:col-span-1" data-testid="custom-name" />
                    <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-transparent border hairline rounded-md h-11 px-3 text-sm col-span-2 sm:col-span-1" data-testid="custom-email" />
                    <input required placeholder="Phone / WhatsApp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-transparent border hairline rounded-md h-11 px-3 text-sm col-span-2 sm:col-span-1" data-testid="custom-phone" />
                    <input type="number" placeholder="Budget (optional)" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className="bg-transparent border hairline rounded-md h-11 px-3 text-sm col-span-2 sm:col-span-1" data-testid="custom-budget" />
                </div>
                <textarea required rows={6} placeholder="Describe your dream piece — size, colors, occasion, any special details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full bg-transparent border hairline rounded-md p-3 text-sm" data-testid="custom-description" />
                <input placeholder="Reference image URL (optional)" value={form.reference_image} onChange={(e) => setForm({ ...form, reference_image: e.target.value })} className="w-full bg-transparent border hairline rounded-md h-11 px-3 text-sm" data-testid="custom-image" />
                <button disabled={loading} className="px-7 h-11 rounded-md btn-gold text-sm font-medium disabled:opacity-50" data-testid="custom-submit">
                    {loading ? "Sending…" : "Send Request"}
                </button>
            </form>
        </div>
    );
}
