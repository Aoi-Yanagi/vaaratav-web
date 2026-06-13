import asyncio
import logging
import os
import sys
import uuid  # <-- NEW: Import Python's built-in unique ID generator
from dotenv import load_dotenv
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

# 1. FORCE LOAD ENV VARS BEFORE ANYTHING ELSE
load_dotenv()

# 2. BULLETPROOF CHECKS
missing_keys = []
if not os.getenv("LIVEKIT_URL"): missing_keys.append("LIVEKIT_URL")
if not os.getenv("LIVEKIT_API_KEY"): missing_keys.append("LIVEKIT_API_KEY")
if not os.getenv("LIVEKIT_API_SECRET"): missing_keys.append("LIVEKIT_API_SECRET")
if not os.getenv("DEEPGRAM_API_KEY"): missing_keys.append("DEEPGRAM_API_KEY")
# Added this check so your new OpenAI integration doesn't crash!
if not os.getenv("OPENAI_API_KEY"): missing_keys.append("OPENAI_API_KEY") 

if missing_keys:
    print(f"\n❌ CRITICAL ERROR: Missing the following keys in your .env file: {', '.join(missing_keys)}")
    print("Please add them and try again.\n")
    sys.exit(1)

# Safe to import LiveKit
from livekit import rtc
from livekit.agents import AutoSubscribe, JobContext, WorkerOptions, cli, WorkerType
from livekit.agents import stt as lk_stt
# Added openai to the imports!
from livekit.plugins import deepgram, openai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcriber")

# Global list to store the conversation
meeting_transcripts = []

async def entrypoint(ctx: JobContext):
    logger.info("Connecting to LiveKit room...")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)
    logger.info(f"✅ Successfully connected to room: {ctx.room.name}")

    try:
        # Upgraded to nova-2 and smart_format
        stt_engine = deepgram.STT(
            model="nova-2",
            language="en-US",
            smart_format=True
        )
    except Exception as e:
        logger.error(f"❌ Failed to initialize Deepgram: {e}")
        return

    # RPC endpoint for frontend to request a summary
    @ctx.room.local_participant.register_rpc_method("generate_summary")
    async def generate_summary(req: rtc.RpcInvocation):
        logger.info("Summary requested by frontend!")
        
        if not meeting_transcripts:
            return "Not enough conversation has happened yet to generate a summary."

        full_conversation = " ".join(meeting_transcripts)
        
        llm = openai.LLM(model="gpt-4o-mini")
        prompt = f"Summarize the following meeting transcript in 3-4 bullet points:\n\n{full_conversation}"
        
        try:
            response = await llm.chat(messages=[{"role": "user", "content": prompt}])
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return "Failed to generate summary due to an internal error."

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(track: rtc.Track, publication: rtc.RemoteTrackPublication, participant: rtc.RemoteParticipant):
        if track.kind == rtc.TrackKind.KIND_AUDIO:
            logger.info(f"🎙️ Found audio track for {participant.identity}. Starting transcription...")
            asyncio.create_task(transcribe_track(ctx.room, track, participant, stt_engine))

    await asyncio.Event().wait()

# --- THE AUDIO PIPELINE ---
async def transcribe_track(room: rtc.Room, track: rtc.Track, participant: rtc.RemoteParticipant, stt_engine: lk_stt.STT):
    audio_stream = rtc.AudioStream(track)
    stt_stream = stt_engine.stream()

    async def push_audio():
        async for event in audio_stream:
            stt_stream.push_frame(event.frame)

    async def receive_text():
        async for event in stt_stream:
            if event.type == lk_stt.SpeechEventType.FINAL_TRANSCRIPT:
                text = event.alternatives[0].text
                
                if text:
                    logger.info(f"[{participant.identity}] {text}")
                    
                    segment = rtc.TranscriptionSegment(
                        id=str(uuid.uuid4()), 
                        text=text,
                        start_time=0,
                        end_time=0,
                        language="en",
                        final=True
                    )
                    transcription = rtc.Transcription(
                        participant_identity=participant.identity,
                        track_sid=track.sid,  
                        segments=[segment]
                    )
                    
                    # Save the text to memory for the summary function
                    if segment.text.strip():
                        meeting_transcripts.append(f"{participant.identity}: {segment.text}")
                    
                    # Push text to your Next.js frontend
                    asyncio.create_task(room.local_participant.publish_transcription(transcription))

    await asyncio.gather(push_audio(), receive_text())

# --- THE FAKE WEB SERVER HACK ---
class DummyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"AI Agent is awake and listening!")

def run_dummy_server():
    # Render assigns a dynamic port, default to 8080 locally
    port = int(os.environ.get("PORT", 8080))
    server = HTTPServer(("0.0.0.0", port), DummyHandler)
    server.serve_forever()

if __name__ == "__main__":
    # Start the fake web server in a background thread to satisfy Render's free tier
    threading.Thread(target=run_dummy_server, daemon=True).start()
    
    # Start the actual LiveKit worker
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            worker_type=WorkerType.ROOM,
        )
    )