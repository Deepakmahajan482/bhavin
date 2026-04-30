import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";
import { ArrowRight, Sparkles } from "lucide-react";

const HERO_BG = "https://images.unsplash.com/photo-1628965582495-e84e68eaf90d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwyfHxwYXN0ZWwlMjBtYXJibGUlMjB0ZXh0dXJlfGVufDB8fHx8MTc3NzU3ODY3MXww&ixlib=rb-4.1.0&q=85";
const ABOUT_IMG = "https://images.pexels.com/photos/7256576/pexels-photo-7256576.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [latest, setLatest] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const [f, l, c] = await Promise.all([
                    api.get("/products?featured=true&limit=8"),
                    api.get("/products?limit=8"),
                    api.get("/categories"),
                ]);
                setFeatured(f.data);
                setLatest(l.data);
                setCategories(c.data);
            } catch {}
        })();
    }, []);

    return (
        <div data-testid="home-page">
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-90 dark:opacity-30" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--background))] via-[hsl(var(--background))]/70 to-transparent" />
                </div>
                <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-36 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 reveal">
                        <p className="text-xs uppercase tracking-[0.3em] gold-text mb-5">Handmade · Made in India</p>
                        <h1 className="serif text-5xl sm:text-6xl lg:text-7xl font-semibold leading-[1.05] tracking-tight">
                            Resin Art that <br />
                            tells a story <span className="italic gold-text">slowly.</span>
                        </h1>
                        <p className="mt-6 text-base text-foreground/75 max-w-xl leading-relaxed">
                            Curated keepsakes, name plates, jewelry & home decor — each piece poured by hand,
                            cured with patience, and finished with a quiet golden touch.
                        </p>
                        <div className="mt-9 flex flex-wrap items-center gap-3">
                            <Link to="/shop" className="inline-flex items-center gap-2 px-7 h-12 rounded-md btn-gold text-sm font-medium" data-testid="hero-shop-button">
                                Explore the Collection <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link to="/custom-order" className="inline-flex items-center gap-2 px-7 h-12 rounded-md border hairline hover:gold-border text-sm" data-testid="hero-custom-button">
                                <Sparkles className="h-4 w-4" /> Request a Custom Piece
                            </Link>
                        </div>
                        <div className="mt-12 flex items-center gap-8 text-xs text-foreground/60">
                            <div><span className="serif text-2xl text-foreground gold-text">2k+</span><br />Happy Patrons</div>
                            <div><span className="serif text-2xl text-foreground gold-text">800+</span><br />Pieces Crafted</div>
                            <div><span className="serif text-2xl text-foreground gold-text">100%</span><br />Hand Poured</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories — bento grid */}
            <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-12">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] gold-text">Browse</p>
                        <h2 className="serif text-3xl sm:text-4xl font-semibold mt-2">Curated Categories</h2>
                    </div>
                    <Link to="/shop" className="text-sm hover:gold-text inline-flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.slice(0, 8).map((c, i) => (
                        <Link
                            to={`/shop?category=${encodeURIComponent(c.name)}`}
                            key={c.name}
                            className={`relative group overflow-hidden rounded-md aspect-square ${i === 0 || i === 5 ? "md:col-span-2 md:row-span-2 md:aspect-auto" : ""}`}
                            data-testid={`category-card-${c.name}`}
                        >
                            <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-5 text-white">
                                <p className="serif text-xl sm:text-2xl">{c.name}</p>
                                <p className="text-xs opacity-80">{c.count} pieces</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured */}
            <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-24">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] gold-text">The Atelier</p>
                        <h2 className="serif text-3xl sm:text-4xl font-semibold mt-2">Featured Pieces</h2>
                    </div>
                    <Link to="/shop?featured=true" className="text-sm hover:gold-text inline-flex items-center gap-1">See all <ArrowRight className="h-3 w-3" /></Link>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
                    {featured.map((p, i) => <ProductCard product={p} index={i} key={p.id} />)}
                </div>
            </section>

            {/* About teaser */}
            <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-5 relative aspect-square rounded-md overflow-hidden">
                    <img src={ABOUT_IMG} alt="Crafting" className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="lg:col-span-7 lg:pl-8">
                    <p className="text-xs uppercase tracking-[0.3em] gold-text">Our Story</p>
                    <h2 className="serif text-4xl lg:text-5xl font-semibold mt-3 leading-tight">A studio where<br /> craft becomes <span className="italic gold-text">heirloom.</span></h2>
                    <p className="mt-6 text-foreground/75 leading-relaxed max-w-xl">
                        Founded by Bhavin, our small studio pours every piece by hand. We work in tiny batches,
                        choose pigments like a painter chooses oils, and finish each piece with a touch of gold.
                    </p>
                    <Link to="/about" className="mt-7 inline-flex items-center gap-2 px-6 h-11 rounded-md border hairline hover:gold-border text-sm" data-testid="home-about-link">
                        Read the journey <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            {/* Latest */}
            <section className="max-w-7xl mx-auto px-6 lg:px-10 mt-24">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-xs uppercase tracking-[0.3em] gold-text">Just In</p>
                        <h2 className="serif text-3xl sm:text-4xl font-semibold mt-2">Newly Poured</h2>
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
                    {latest.map((p, i) => <ProductCard product={p} index={i} key={p.id} />)}
                </div>
            </section>
        </div>
    );
}
