"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings, Mic, Video, Volume2 } from "lucide-react";

// Mock device lists.
const CAMERAS = ["FaceTime HD Camera", "Logitech C920", "OBS Virtual Camera"];
const MICS = ["MacBook Pro Microphone", "Yeti Stereo Microphone", "AirPods Pro"];
const SPEAKERS = ["MacBook Pro Speakers", "External Headphones"];

export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-200 dark:hover:bg-neutral-800 text-zinc-600 dark:text-zinc-300 transition-colors">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-900 border-zinc-200 dark:border-neutral-800 text-zinc-900 dark:text-white transition-colors">
        <DialogHeader>
          <DialogTitle>Audio & Video Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          
          {/* Camera Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Camera
            </Label>
            <select className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
              {CAMERAS.map((cam) => <option key={cam}>{cam}</option>)}
            </select>
          </div>

          {/* Mic Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Microphone
            </Label>
            <select className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
              {MICS.map((mic) => <option key={mic}>{mic}</option>)}
            </select>
            {/* Mic Test Visualizer */}
            <div className="h-1 w-full bg-zinc-200 dark:bg-neutral-800 rounded-full overflow-hidden transition-colors">
                <div className="h-full bg-green-500 w-[60%] animate-pulse" />
            </div>
          </div>

          {/* Speaker Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Speakers
            </Label>
            <select className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors">
              {SPEAKERS.map((spk) => <option key={spk}>{spk}</option>)}
            </select>
            <Button variant="outline" size="sm" className="w-full border-zinc-200 dark:border-neutral-700 text-xs transition-colors hover:bg-zinc-100 dark:hover:bg-neutral-800">
              Test Audio
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}