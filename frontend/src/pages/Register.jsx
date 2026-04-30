import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const { ok, error: err } = await register(form.name, form.email, form.password);
        setLoading(false);
        if (ok) {
            toast.success("Account created");
            navigate("/account");
        } else {
            setError(err);
        }
    };

    return (
        <div className="max-w-md mx-auto px-6 py-20" data-testid="register-page">
            <h1 className="serif text-4xl font-semibold">Create your account</h1>
            <p className="text-foreground/70 mt-2 text-sm">Save favourites, track orders, and shop faster.</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
                <input type="text" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-transparent border hairline rounded-md h-11 px-3 text-sm" required data-testid="register-name" />
                <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-transparent border hairline rounded-md h-11 px-3 text-sm" required data-testid="register-email" />
                <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-transparent border hairline rounded-md h-11 px-3 text-sm" required minLength={6} data-testid="register-password" />
                {error && <p className="text-sm text-destructive" data-testid="register-error">{error}</p>}
                <button disabled={loading} className="w-full h-11 rounded-md btn-gold text-sm font-medium disabled:opacity-50" data-testid="register-submit">
                    {loading ? "Creating account…" : "Create Account"}
                </button>
            </form>
            <p className="text-sm text-foreground/70 mt-6">
                Already have one? <Link to="/login" className="gold-text hover:underline">Sign in</Link>
            </p>
        </div>
    );
}
