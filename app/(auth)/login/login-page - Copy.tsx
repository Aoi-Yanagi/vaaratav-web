"use client";

import { signIn } from "next-auth/react";
import { Github, Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-indigo-600/20 text-indigo-500 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/30">
          <Video className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
        <p className="text-gray-400">Sign in to access your VaartaV dashboard.</p>
      </div>

      <Card className="w-full p-8 bg-neutral-900/50 border-neutral-800 backdrop-blur-xl rounded-2xl">
        <Button 
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="w-full h-12 bg-white text-black hover:bg-gray-200 font-semibold text-base rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <Github className="w-5 h-5" />
          Continue with GitHub
        </Button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign up here
          </Link>
        </p>{/** No error just js being strict */}
      </Card>
    </div>
  );
}