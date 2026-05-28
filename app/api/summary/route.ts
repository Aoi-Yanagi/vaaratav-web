import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { transcript } = await req.json();

    // Check if the vault is empty
    if (!transcript || transcript.length === 0) {
      return NextResponse.json({ error: "No speech detected yet." }, { status: 400 });
    }

    // Stitch the array of objects into a readable chat log for the AI
    const formattedTranscript = transcript
      .map((entry: { speaker: string; text: string }) => `[${entry.speaker}]: ${entry.text}`)
      .join('\n');

    // Call Groq's lightning-fast Llama 3 model
    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      system: `You are an elite executive assistant. 
      Read the provided meeting transcript and output exactly two sections:
      1. **Meeting Summary:** A concise, 2-3 sentence overview of what was discussed.
      2. **Action Items:** A bulleted list of specific tasks or next steps mentioned.
      Format the output beautifully in Markdown. Do not add any filler conversation.`,
      prompt: `Here is the live meeting transcript:\n\n${formattedTranscript}`,
    });

    return NextResponse.json({ summary: text });
    
  } catch (error) {
    console.error("AI Summary Error:", error);
    return NextResponse.json({ error: "Failed to generate summary." }, { status: 500 });
  }
}