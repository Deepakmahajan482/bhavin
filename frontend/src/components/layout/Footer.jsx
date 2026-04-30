import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, Mail } from "lucide-react";

export default function Footer() {
    return (
        <footer className="mt-32 border-t hairline" data-testid="site-footer">
            <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
                <div className="md:col-span-2">
                    <h3 className="serif text-3xl font-semibold">
                        Bhavin <span className="italic gold-text">Creations</span>
                    </h3>
                    <p className="text-sm text-foreground/70 mt-3 max-w-md leading-relaxed">
                        Handcrafted resin art that turns everyday moments into heirlooms.
                        Premium materials, slow craft, and timeless palettes.
                    </p>
                    <div className="flex items-center gap-3 mt-6">
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" className="h-9 w-9 inline-flex items-center justify-center rounded-md border hairline hover:gold-border" data-testid="social-instagram">
                            <Instagram className="h-4 w-4" />
                        </a>
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" className="h-9 w-9 inline-flex items-center justify-center rounded-md border hairline hover:gold-border" data-testid="social-facebook">
                            <Facebook className="h-4 w-4" />
                        </a>
                        <a href="https://youtube.com" target="_blank" rel="noreferrer" className="h-9 w-9 inline-flex items-center justify-center rounded-md border hairline hover:gold-border" data-testid="social-youtube">
                            <Youtube className="h-4 w-4" />
                        </a>
                        <a href="mailto:hello@bhavincreations.com" className="h-9 w-9 inline-flex items-center justify-center rounded-md border hairline hover:gold-border" data-testid="social-email">
                            <Mail className="h-4 w-4" />
                        </a>
                    </div>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-widest text-foreground/50 mb-4">Shop</p>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/shop" className="hover:gold-text">All Products</Link></li>
                        <li><Link to="/shop?category=Keychains" className="hover:gold-text">Keychains</Link></li>
                        <li><Link to="/shop?category=Jewelry" className="hover:gold-text">Jewelry</Link></li>
                        <li><Link to="/shop?category=Trays" className="hover:gold-text">Trays</Link></li>
                        <li><Link to="/custom-order" className="hover:gold-text">Custom Order</Link></li>
                    </ul>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-widest text-foreground/50 mb-4">Studio</p>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/about" className="hover:gold-text">About</Link></li>
                        <li><Link to="/faq" className="hover:gold-text">FAQ</Link></li>
                        <li><Link to="/contact" className="hover:gold-text">Contact</Link></li>
                        <li><Link to="/account" className="hover:gold-text">My Account</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t hairline">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-foreground/60">© {new Date().getFullYear()} Bhavin Creations. All rights reserved.</p>
                    <p className="text-xs text-foreground/70" data-testid="rk-credit">
                        Powered by <span className="gold-text font-medium">RK Technologies</span> &nbsp;·&nbsp;
                        <span className="italic">"Crafting Digital Experiences, Just Like Bhavin Creates Art."</span>
                    </p>
                </div>
            </div>
        </footer>
    );
}
