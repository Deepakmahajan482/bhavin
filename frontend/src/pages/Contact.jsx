import { useState } from "react";
import { api } from "../lib/api";
import { toast } from "sonner";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Contact() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post("/contact", form);
            toast.success("Message sent. We'll be in touch.");
            setForm({ name: "", email: "", subject: "", message: "" });
        } catch {
            toast.error("Could not send message");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16" data-testid="contact-page">
            <p className="text-xs uppercase tracking-[0.3em] gold-text">Contact</p>
            <h1 className="serif text-5xl font-semibold mt-3">Say hello.</h1>
            <p className="text-foreground/70 mt-3 max-w-xl text-sm">
                Custom orders, press, collaborations or simply curious — we'd love to hear from you.
            </p>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5 space-y-5">
                    <div className="flex items-start gap-3"><MapPin className="h-4 w-4 mt-1 gold-text" /><div><p className="serif">Studio</p><p className="text-sm text-foreground/70">Ahmedabad, Gujarat, India</p></div></div>
                    <div className="flex items-start gap-3"><Phone className="h-4 w-4 mt-1 gold-text" /><div><p className="serif">Phone / WhatsApp</p><p className="text-sm text-foreground/70">+91 99999 99999</p></div></div>
                    <div className="flex items-start gap-3"><Mail className="h-4 w-4 mt-1 gold-text" /><div><p className="serif">Email</p><p className="text-sm text-foreground/70">hello@bhavincreations.com</p></div></div>
                </div>

                <form onSubmit={submit} className="lg:col-span-7 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="bg-transparent border hairline rounded-md h-11 px-3 text-sm" data-testid="contact-name" />
                        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="bg-transparent border hairline rounded-md h-11 px-3 text-sm" data-testid="contact-email" />
                    </div>
                    <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="w-full bg-transparent border hairline rounded-md h-11 px-3 text-sm" data-testid="contact-subject" />
                    <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Your message" className="w-full bg-transparent border hairline rounded-md p-3 text-sm" data-testid="contact-message" />
                    <button disabled={loading} className="px-6 h-11 rounded-md btn-gold text-sm font-medium disabled:opacity-50" data-testid="contact-submit">
                        {loading ? "Sending…" : "Send Message"}
                    </button>
                </form>
            </div>
        </div>
    );
}
