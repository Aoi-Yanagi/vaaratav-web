"use client";

import { signIn } from "next-auth/react";
import { Github, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="w-full max-w-md flex flex-col items-center">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-cyan-600/20 text-cyan-500 rounded-xl flex items-center justify-center mb-4 border border-cyan-500/30">
          <Plus className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Create an Account</h2>
        <p className="text-gray-400">Start hosting secure meetings in seconds.</p>
      </div>

      <Card className="w-full p-8 bg-neutral-900/50 border-neutral-800 backdrop-blur-xl rounded-2xl">
        <Button 
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="w-full h-12 bg-white text-black hover:bg-gray-200 font-semibold text-base rounded-xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02]"
        >
          <Github className="w-5 h-5" />
          Sign Up with GitHub
        </Button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
            Log in here
          </Link>
        </p>
      </Card>
    </div>
  );
}