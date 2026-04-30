import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import CustomOrder from "./pages/CustomOrder";
import OrderSuccess from "./pages/OrderSuccess";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCustomOrders from "./pages/admin/AdminCustomOrders";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    useEffect(() => {
        document.title = "Bhavin Creations · Handmade Resin Art";
    }, []);

    return (
        <div className="App">
            <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <WishlistProvider>
                            <BrowserRouter>
                                <Routes>
                                    <Route element={<Layout />}>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/shop" element={<Shop />} />
                                        <Route path="/products/:id" element={<ProductDetail />} />
                                        <Route path="/about" element={<About />} />
                                        <Route path="/contact" element={<Contact />} />
                                        <Route path="/faq" element={<FAQ />} />
                                        <Route path="/custom-order" element={<CustomOrder />} />
                                        <Route path="/login" element={<Login />} />
                                        <Route path="/register" element={<Register />} />
                                        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                                        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                                        <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                                        <Route path="/orders/success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                                        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
                                            <Route index element={<AdminDashboard />} />
                                            <Route path="products" element={<AdminProducts />} />
                                            <Route path="orders" element={<AdminOrders />} />
                                            <Route path="custom-orders" element={<AdminCustomOrders />} />
                                        </Route>
                                    </Route>
                                </Routes>
                            </BrowserRouter>
                        </WishlistProvider>
                    </CartProvider>
                </AuthProvider>
            </ThemeProvider>
        </div>
    );
}

export default App;
