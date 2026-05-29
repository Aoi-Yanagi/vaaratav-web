"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export function CreateMeetingButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreateMeeting = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/meetings/create", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.meetingCode) {
        // Redirect the user straight into their new room!
        // (Adjust this route if your room page is located elsewhere, e.g., /room/[id])
        router.push("/meeting/${data.meetingCode}")
      } else {
        console.error("Failed to generate meeting code:", data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Network error:", error);
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleCreateMeeting}
      disabled={isLoading}
      className="h-14 bg-indigo-600 hover:bg-indigo-700 justify-start text-lg px-6 w-full transition-all disabled:opacity-70"
    >
      {isLoading ? (
        <Loader2 className="mr-3 w-6 h-6 animate-spin" />
      ) : (
        <Plus className="mr-3 w-6 h-6" />
      )}
      {isLoading ? "Starting..." : "New Meeting"}
    </Button>
  );
}