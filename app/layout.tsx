import type { Metadata, Viewport } from "next";
import { Geist} from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";
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
  maximumScale: 1, // STOPS AGGRESSIVE AUTO-ZOOM
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
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <SocketProvider>
               <Providers> 
                  {children}
               </Providers>    
            </SocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}