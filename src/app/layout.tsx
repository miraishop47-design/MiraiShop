import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { FavoriteProvider } from "./context/FavoriteContext";
import CartSidebar from "./components/CartSidebar";
import FloatingCartButton from "./components/FloatingCartButton";
import WhatsAppContactButton from "./components/WhatsAppContactButton";

const inter = Inter({ subsets: ["latin"] });

const APP_NAME = 'MiraiShop';
const APP_DEFAULT_TITLE = 'MiraiShop | Diseño y Tecnología';
const APP_TITLE_TEMPLATE = '%s | MiraiShop';
const APP_DESCRIPTION = 'Explora diseños únicos de la más alta calidad y listos para formar parte de tu Setup o tu Hogar. Descubre productos modernos y funcionales.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://miraishop.vercel.app'),
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
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
            <FavoriteProvider>
              <Navbar />
              <CartSidebar />
              <FloatingCartButton />
              <WhatsAppContactButton />
              <main className="min-h-screen pt-16">
                {children}
              </main>
            </FavoriteProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
