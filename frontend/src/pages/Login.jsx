import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        const { ok, error: err, user } = await login(form.email, form.password);
        setLoading(false);
        if (ok) {
            toast.success("Welcome back!");
            const dest = location.state?.from?.pathname || (user.role === "admin" ? "/admin" : "/account");
            navigate(dest);
        } else {
            setError(err);
        }
    };

    return (
        <div className="max-w-md mx-auto px-6 py-20" data-testid="login-page">
            <h1 className="serif text-4xl font-semibold">Welcome back</h1>
            <p className="text-foreground/70 mt-2 text-sm">Sign in to continue your collection.</p>
            <form onSubmit={submit} className="mt-8 space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-transparent border hairline rounded-md h-11 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent))]"
                    required
                    data-testid="login-email"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-transparent border hairline rounded-md h-11 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent))]"
                    required
                    data-testid="login-password"
                />
                {error && <p className="text-sm text-destructive" data-testid="login-error">{error}</p>}
                <button disabled={loading} className="w-full h-11 rounded-md btn-gold text-sm font-medium disabled:opacity-50" data-testid="login-submit">
                    {loading ? "Signing in…" : "Sign In"}
                </button>
            </form>
            <p className="text-sm text-foreground/70 mt-6">
                New here? <Link to="/register" className="gold-text hover:underline" data-testid="register-link">Create an account</Link>
            </p>
           
        </div>
    );
}
