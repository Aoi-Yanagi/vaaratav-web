"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Star, Edit3, Trash2, Loader2, StarOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// FIX: Define exactly what properties the meeting object has
interface MeetingData {
  meetingCode: string;
  title: string;
  isFavorite: boolean;
  [key: string]: unknown; // Allows for any other properties from the database
}

// FIX: Define the expected payload structure
interface ActionPayload {
  title?: string;
}

export function MeetingActionMenu({ meeting }: { meeting: MeetingData }) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(meeting.title);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: string, payload?: ActionPayload) => {
    setLoading(true);
    try {
      await fetch('/api/meetings/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingCode: meeting.meetingCode, action, payload })
      });
      router.refresh(); // Automatically updates the dashboard!
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsRenaming(false);
    }
  };

  if (isRenaming) {
    return (
      <div className="flex items-center gap-2">
        <input 
          autoFocus
          className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-sm text-black dark:text-white outline-none focus:border-indigo-500" 
          value={newTitle} onChange={(e) => setNewTitle(e.target.value)} 
        />
        <Button size="sm" onClick={() => handleAction('RENAME', { title: newTitle })} className="bg-indigo-600 h-7 text-xs">Save</Button>
        <Button size="sm" variant="ghost" onClick={() => setIsRenaming(false)} className="h-7 text-xs">Cancel</Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DropdownMenuItem onClick={() => handleAction('TOGGLE_FAVORITE')} className="cursor-pointer">
          {meeting.isFavorite ? <StarOff className="w-4 h-4 mr-2" /> : <Star className="w-4 h-4 mr-2 text-amber-500" />}
          {meeting.isFavorite ? "Remove from Favorites" : "Mark as Favorite"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsRenaming(true)} className="cursor-pointer">
          <Edit3 className="w-4 h-4 mr-2" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('DELETE')} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600">
          <Trash2 className="w-4 h-4 mr-2" /> Delete Meeting
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}