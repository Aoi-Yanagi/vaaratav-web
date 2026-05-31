"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Settings, Mic, Video, Volume2 } from "lucide-react";
import { useMediaDeviceSelect } from "@livekit/components-react";

export function SettingsDialog() {
  const { devices: cameras, activeDeviceId: activeCam, setActiveMediaDevice: setCam } = useMediaDeviceSelect({ kind: 'videoinput' });
  const { devices: mics, activeDeviceId: activeMic, setActiveMediaDevice: setMic } = useMediaDeviceSelect({ kind: 'audioinput' });
  const { devices: speakers, activeDeviceId: activeSpk, setActiveMediaDevice: setSpk } = useMediaDeviceSelect({ kind: 'audiooutput' });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          <Settings className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-zinc-800 text-white transition-colors">
        <DialogHeader>
          <DialogTitle>Audio & Video Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Video className="w-4 h-4 text-indigo-400" /> Camera</Label>
            <select 
              value={activeCam} onChange={(e) => setCam(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-md p-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              {cameras.map((cam) => <option key={cam.deviceId} value={cam.deviceId}>{cam.label || "Default Camera"}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Mic className="w-4 h-4 text-indigo-400" /> Microphone</Label>
            <select 
              value={activeMic} onChange={(e) => setMic(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-md p-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              {mics.map((mic) => <option key={mic.deviceId} value={mic.deviceId}>{mic.label || "Default Mic"}</option>)}
            </select>
          </div>

          {speakers.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Volume2 className="w-4 h-4 text-indigo-400" /> Speakers</Label>
              <select 
                value={activeSpk} onChange={(e) => setSpk(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-md p-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {speakers.map((spk) => <option key={spk.deviceId} value={spk.deviceId}>{spk.label || "Default Speaker"}</option>)}
              </select>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}