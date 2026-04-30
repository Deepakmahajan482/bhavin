import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import ProductCard from "../components/ProductCard";
import { Slider } from "../components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Filter, X } from "lucide-react";

const COLORS = ["Pastel Blue", "Rose", "Amber", "Gold", "Indigo", "Ivory", "Black", "Pastel Pink", "Crystal", "Pastel Green", "Teal", "Amethyst"];

export default function Shop() {
    const [params, setParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    const q = params.get("q") || "";
    const category = params.get("category") || "";
    const color = params.get("color") || "";
    const sort = params.get("sort") || "newest";
    const minPrice = Number(params.get("min") || 0);
    const maxPrice = Number(params.get("max") || 5000);
    const featured = params.get("featured");

    const queryString = useMemo(() => {
        const sp = new URLSearchParams();
        if (q) sp.set("q", q);
        if (category) sp.set("category", category);
        if (color) sp.set("color", color);
        sp.set("sort", sort);
        sp.set("min_price", minPrice);
        sp.set("max_price", maxPrice);
        if (featured) sp.set("featured", "true");
        return sp.toString();
    }, [q, category, color, sort, minPrice, maxPrice, featured]);

    useEffect(() => {
        api.get("/categories").then((r) => setCategories(r.data)).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        api.get(`/products?${queryString}`).then((r) => {
            setProducts(r.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [queryString]);

    const update = (key, val) => {
        const sp = new URLSearchParams(params);
        if (val === "" || val == null) sp.delete(key);
        else sp.set(key, val);
        setParams(sp);
    };
    const clear = () => setParams(new URLSearchParams());

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12" data-testid="shop-page">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] gold-text">Shop</p>
                    <h1 className="serif text-4xl sm:text-5xl font-semibold mt-2">{q ? `Results for "${q}"` : category || "All Pieces"}</h1>
                    <p className="text-sm text-foreground/60 mt-2">{products.length} piece{products.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowFilters((s) => !s)} className="lg:hidden inline-flex items-center gap-2 px-4 h-10 rounded-md border hairline text-sm" data-testid="filters-toggle">
                        <Filter className="h-4 w-4" /> Filters
                    </button>
                    <Select value={sort} onValueChange={(v) => update("sort", v)}>
                        <SelectTrigger className="w-[160px]" data-testid="sort-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="price_asc">Price: Low to High</SelectItem>
                            <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            <SelectItem value="rating">Top Rated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Filters */}
                <aside className={`${showFilters ? "block" : "hidden"} lg:block lg:col-span-3 space-y-8`} data-testid="filters-sidebar">
                    <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-widest text-foreground/60">Filters</p>
                        <button onClick={clear} className="text-xs gold-text hover:underline" data-testid="clear-filters">Clear all</button>
                    </div>

                    <div>
                        <p className="serif text-base mb-3">Category</p>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <button onClick={() => update("category", "")} className={`text-left w-full hover:gold-text ${!category ? "gold-text font-medium" : "text-foreground/80"}`}>
                                    All categories
                                </button>
                            </li>
                            {categories.map((c) => (
                                <li key={c.name}>
                                    <button
                                        onClick={() => update("category", c.name)}
                                        className={`text-left w-full hover:gold-text ${category === c.name ? "gold-text font-medium" : "text-foreground/80"}`}
                                        data-testid={`filter-cat-${c.name}`}
                                    >
                                        {c.name} <span className="text-foreground/40">({c.count})</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <p className="serif text-base mb-3">Color</p>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    onClick={() => update("color", color === c ? "" : c)}
                                    className={`px-3 h-8 rounded-md border text-xs transition ${color === c ? "gold-border gold-text" : "hairline text-foreground/70 hover:gold-border"}`}
                                    data-testid={`filter-color-${c}`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="serif text-base mb-3">Price Range</p>
                        <div className="px-1">
                            <Slider
                                min={0}
                                max={5000}
                                step={100}
                                value={[minPrice, maxPrice]}
                                onValueChange={(vals) => {
                                    const sp = new URLSearchParams(params);
                                    sp.set("min", String(vals[0]));
                                    sp.set("max", String(vals[1]));
                                    setParams(sp);
                                }}
                                data-testid="price-slider"
                            />
                            <div className="flex items-center justify-between text-xs text-foreground/70 mt-3">
                                <span>₹{minPrice.toLocaleString("en-IN")}</span>
                                <span>₹{maxPrice.toLocaleString("en-IN")}</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Grid */}
                <div className="lg:col-span-9">
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="aspect-[4/5] bg-muted animate-pulse rounded-md" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="py-24 text-center">
                            <p className="serif text-2xl">No pieces match your filters.</p>
                            <button onClick={clear} className="mt-4 inline-flex items-center gap-2 px-5 h-10 rounded-md border hairline text-sm">
                                <X className="h-4 w-4" /> Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
                            {products.map((p, i) => <ProductCard product={p} index={i} key={p.id} />)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
