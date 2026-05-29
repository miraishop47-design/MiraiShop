import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import CartSidebar from "./components/CartSidebar";
import FloatingCartButton from "./components/FloatingCartButton";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MiraiShop",
  description: "Tecnología, diseño 3D y el futuro en tus manos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased`}>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <CartSidebar />
            <FloatingCartButton />
            <main className="min-h-screen pt-16">
              {children}
            </main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
