import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google"; // <-- Changed from Geist
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/Providers";

const outfit = Outfit({
  variable: "--font-sans",
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
    // Add next-themes required hydration suppression
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Tells the browser to establish early connections to the domain hosting your assets */}
        <link rel="preconnect" href="https://vaaratav-web.vercel.app" />
        
        {/* Do the same for your LiveKit Server URL so it connects faster! */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_LIVEKIT_URL} />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", outfit.variable)}>
        <Providers> 
           {children}
        </Providers>    
        <Analytics/>
      </body>
    </html>
  );
}