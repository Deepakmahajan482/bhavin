import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import WhatsappButton from "./WhatsappButton";
import CartDrawer from "../CartDrawer";
import { Toaster } from "sonner";

export default function Layout() {
    return (
        <>
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
            <CartDrawer />
            <WhatsappButton />
            <Toaster position="top-right" richColors />
        </>
    );
}
