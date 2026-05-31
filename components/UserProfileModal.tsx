"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserProfileModalProps {
  currentName: string;
  children: React.ReactNode;
}

export function UserProfileModal({ currentName, children }: UserProfileModalProps) {
  const router = useRouter();
  const [name, setName] = useState(currentName !== "Guest User" ? currentName : "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setIsOpen(false);
      router.refresh(); // Refreshes the page to show the new name
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = confirm("Are you absolutely sure? This will delete your account and all your meetings permanently.");
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await fetch('/api/user', { method: 'DELETE' });
      await signOut({ callbackUrl: '/' }); // Log them out and send to home page
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-white dark:bg-neutral-900 border-zinc-200 dark:border-neutral-800 text-zinc-900 dark:text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserCircle className="w-6 h-6 text-indigo-500" /> Profile Settings
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-600 dark:text-zinc-400">Display Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter your full name"
              required
              className="bg-zinc-50 dark:bg-black border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-xl h-12"
            />
          </div>

          <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </Button>
        </form>

        <div className="pt-6 border-t border-zinc-200 dark:border-neutral-800 mt-2">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="w-full h-12 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-500/10 dark:text-red-500 transition-colors"
          >
            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Trash2 className="w-5 h-5 mr-2" />}
            Delete Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}