const ABOUT_IMG = "https://images.pexels.com/photos/7256576/pexels-photo-7256576.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function About() {
    return (
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-16" data-testid="about-page">
            <p className="text-xs uppercase tracking-[0.3em] gold-text">About</p>
            <h1 className="serif text-5xl font-semibold mt-3 leading-tight">A studio of <span className="italic gold-text">slow craft.</span></h1>
            <p className="text-foreground/75 mt-6 max-w-2xl leading-relaxed text-base">
                Bhavin Creations was born in a small home studio, fueled by a belief that the most cherished objects
                are the ones made by hand. Each piece begins as raw resin, pigment, and an idea — and ends as a
                singular keepsake meant to last lifetimes.
            </p>
            <div className="mt-10 aspect-[16/8] rounded-md overflow-hidden">
                <img src={ABOUT_IMG} alt="Crafting resin" className="w-full h-full object-cover" />
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    ["Slow Craft", "We pour, we wait, we polish. Patience is our most expensive ingredient."],
                    ["Tiny Batches", "Every collection is limited. We'd rather make 12 great pieces than 100 fine ones."],
                    ["A Touch of Gold", "Each finished piece is signed and gilded — a quiet golden reminder of its maker."],
                ].map(([t, d]) => (
                    <div key={t}>
                        <p className="serif text-xl mb-2 gold-text">{t}</p>
                        <p className="text-sm text-foreground/70 leading-relaxed">{d}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
