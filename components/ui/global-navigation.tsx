"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function GlobalNavigation() {
  const { data: session } = useSession();

  return (
    <nav className="absolute top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">V</span>
        </div>
        VaartaV
      </Link>
      
      <div className="flex items-center gap-4">
        {session ? (
          <div className="flex items-center gap-4">
            {/* The Clickable Avatar that signs you out */}
            <img
              src={session.user?.image || "https://github.com/ghost.png"}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-indigo-500/50 cursor-pointer hover:border-indigo-400 hover:opacity-80 transition-all shadow-lg"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Click to Sign Out"
            />
          </div>
        ) : (
          <div className="flex gap-3">
            <Button variant="ghost" className="text-gray-300 hover:text-white" onClick={() => signIn("github")}>
                Log In
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-full px-6" onClick={() => signIn("github")}>
                Get Started
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}