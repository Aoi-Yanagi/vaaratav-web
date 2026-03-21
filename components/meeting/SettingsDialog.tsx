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
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-neutral-800">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle>Audio & Video Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          
          {/* Camera Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" /> Camera
            </Label>
            <select className="w-full bg-black border border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-indigo-500">
              {CAMERAS.map((cam) => <option key={cam}>{cam}</option>)}
            </select>
          </div>

          {/* Mic Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-400" /> Microphone
            </Label>
            <select className="w-full bg-black border border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-indigo-500">
              {MICS.map((mic) => <option key={mic}>{mic}</option>)}
            </select>
            {/* Mic Test Visualizer (FAKE! 🤫) */}
            <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[60%] animate-pulse" />
            </div>
          </div>

          {/* Speaker Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-400" /> Speakers
            </Label>
            <select className="w-full bg-black border border-neutral-700 rounded-md p-2 text-sm focus:outline-none focus:border-indigo-500">
              {SPEAKERS.map((spk) => <option key={spk}>{spk}</option>)}
            </select>
            <Button variant="outline" size="sm" className="w-full border-neutral-700 text-xs">
              Test Audio
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}