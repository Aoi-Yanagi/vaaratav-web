import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// --- CHANGED: We now only need to import the ONE unified Providers file ---
import { Providers } from "@/components/Providers";

const inter = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vaarta.V",
  description: "Next Gen. No-app Video Site!",
  icons: "icon.svg",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        {/* The unified provider wraps everything securely on the client side */}
        <Providers> 
           {children}
        </Providers>    
      </body>
    </html>
  );
}