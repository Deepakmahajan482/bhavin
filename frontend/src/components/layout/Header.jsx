import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useTheme } from "../../context/ThemeContext";
import { Search, Heart, ShoppingBag, Sun, Moon, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const navLinks = [
    { to: "/", label: "Home" },
    { to: "/shop", label: "Shop" },
    { to: "/custom-order", label: "Custom" },
    { to: "/about", label: "About" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" },
];

export default function Header() {
    const { user, logout } = useAuth();
    const { cart, setOpen } = useCart();
    const { wishlist } = useWishlist();
    const { theme, toggle } = useTheme();
    const navigate = useNavigate();
    const [searchQ, setSearchQ] = useState("");

    const onSearch = (e) => {
        e.preventDefault();
        if (searchQ.trim()) navigate(`/shop?q=${encodeURIComponent(searchQ.trim())}`);
    };

    return (
        <header className="sticky top-0 z-40 glass-header" data-testid="site-header">
            <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center gap-6">
                <Link to="/" className="flex items-center gap-2 shrink-0" data-testid="brand-logo">
                    <span className="serif text-2xl font-semibold tracking-tight">Bhavin</span>
                    <span className="serif text-2xl font-semibold gold-text italic">Creations</span>
                </Link>

                <nav className="hidden lg:flex items-center gap-6 ml-4">
                    {navLinks.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            data-testid={`nav-${l.label.toLowerCase()}`}
                            className={({ isActive }) =>
                                `text-sm hover:text-[hsl(var(--accent))] transition-colors ${
                                    isActive ? "gold-text" : "text-foreground/80"
                                }`
                            }
                        >
                            {l.label}
                        </NavLink>
                    ))}
                </nav>

                <form onSubmit={onSearch} className="hidden md:flex items-center flex-1 max-w-sm ml-auto" data-testid="search-form">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
                        <input
                            type="text"
                            value={searchQ}
                            onChange={(e) => setSearchQ(e.target.value)}
                            placeholder="Search resin art…"
                            className="w-full bg-transparent border border-border rounded-md pl-10 pr-4 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--accent))]"
                            data-testid="search-input"
                        />
                    </div>
                </form>

                <div className="flex items-center gap-1 ml-auto md:ml-0">
                    <button
                        onClick={toggle}
                        className="h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-muted transition"
                        aria-label="Toggle theme"
                        data-testid="theme-toggle"
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    <Link
                        to="/wishlist"
                        className="relative h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-muted transition"
                        data-testid="wishlist-link"
                    >
                        <Heart className="h-4 w-4" />
                        {wishlist.items.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-full h-4 min-w-4 px-1 inline-flex items-center justify-center">
                                {wishlist.items.length}
                            </span>
                        )}
                    </Link>

                    <button
                        onClick={() => setOpen(true)}
                        className="relative h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-muted transition"
                        data-testid="cart-button"
                    >
                        <ShoppingBag className="h-4 w-4" />
                        {cart.count > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 text-[10px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-full h-4 min-w-4 px-1 inline-flex items-center justify-center" data-testid="cart-count">
                                {cart.count}
                            </span>
                        )}
                    </button>

                    {user && user !== false ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-muted transition" data-testid="user-menu-trigger">
                                    <User className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="serif">{user.name}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate("/account")} data-testid="menu-account">
                                    <User className="h-4 w-4 mr-2" /> My Account
                                </DropdownMenuItem>
                                {user.role === "admin" && (
                                    <DropdownMenuItem onClick={() => navigate("/admin")} data-testid="menu-admin">
                                        <LayoutDashboard className="h-4 w-4 mr-2" /> Admin Panel
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} data-testid="menu-logout">
                                    <LogOut className="h-4 w-4 mr-2" /> Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link to="/login" className="ml-2 hidden sm:inline-flex items-center px-4 h-10 rounded-md btn-gold text-sm" data-testid="login-link">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
