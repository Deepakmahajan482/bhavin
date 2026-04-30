import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";

const FAQS = [
    ["How long does each piece take to make?", "Each piece is hand poured and cured. Most items take 4–7 days from pour to finish; custom pieces take 10–14 days."],
    ["Are products food safe?", "Our trays and coasters use food-safe epoxy. We recommend wiping clean with a damp cloth — never a dishwasher."],
    ["Do you ship internationally?", "Yes — we ship across India and to most countries. Shipping rates are calculated at checkout."],
    ["Can I customize a piece?", "Absolutely. Use the Custom Order form to share your idea, colors and reference photos. We'll quote within 48 hours."],
    ["What is your return policy?", "We accept returns within 7 days for non-personalized items. Custom pieces are final sale."],
    ["How do I care for resin pieces?", "Avoid prolonged direct sunlight and harsh chemicals. Wipe with a soft microfiber cloth — your piece will stay glossy for years."],
];

export default function FAQ() {
    return (
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-16" data-testid="faq-page">
            <p className="text-xs uppercase tracking-[0.3em] gold-text">Help</p>
            <h1 className="serif text-5xl font-semibold mt-3">Frequently asked.</h1>
            <Accordion type="single" collapsible className="mt-10" data-testid="faq-accordion">
                {FAQS.map(([q, a], i) => (
                    <AccordionItem value={`item-${i}`} key={i}>
                        <AccordionTrigger className="serif text-left text-base hover:gold-text" data-testid={`faq-q-${i}`}>{q}</AccordionTrigger>
                        <AccordionContent className="text-foreground/75 leading-relaxed">{a}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
