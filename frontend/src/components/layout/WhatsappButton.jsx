import { MessageCircle } from "lucide-react";

export default function WhatsappButton() {
    const number = "919999999999";
    const text = encodeURIComponent("Hi Bhavin Creations! I'd like to know more about your resin art.");
    return (
        <a
            href={`https://wa.me/${number}?text=${text}`}
            target="_blank"
            rel="noreferrer"
            className="fixed bottom-6 right-6 z-50 h-14 w-14 inline-flex items-center justify-center rounded-full text-white shadow-xl transition-transform hover:scale-110"
            style={{ background: "#25D366", boxShadow: "0 0 0 8px rgba(37,211,102,0.18)" }}
            data-testid="whatsapp-floating-button"
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle className="h-6 w-6" />
        </a>
    );
}
