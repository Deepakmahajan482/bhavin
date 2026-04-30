import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
    const { user, ready } = useAuth();
    const location = useLocation();

    if (!ready) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]" data-testid="loading-spinner">
                <div className="h-8 w-8 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
            </div>
        );
    }
    if (user === false) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    if (adminOnly && user?.role !== "admin") {
        return <Navigate to="/" replace />;
    }
    return children;
}
