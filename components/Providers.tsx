"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SocketProvider } from "@/components/providers/SocketProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <SocketProvider>
          {children}
        </SocketProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}