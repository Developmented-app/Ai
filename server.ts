import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("ពិនិត្យឃើញថាខ្វះ GEMINI_API_KEY។ សូមបញ្ចូលវាក្នុង Settings > Secrets!");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// 1. Transcription API via Gemini
app.post("/api/gemini/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType, prompt } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: "ខ្វះទិន្នន័យសំឡេង (audio data block)" });
    }

    const ai = getGeminiClient();
    
    // Send audio to Gemini-3.5-flash which has amazing audio understanding capabilities
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/mp3",
            data: audioBase64,
          },
        },
        {
          text: prompt || "Listen to this audio and write a highly accurate subtitle transcript in SRT format with timing sequence. Please speak Khmer if the audio is in Khmer. Respond ONLY with valid SRT subtitles. Do not add any text wrappers or markdown block characters before or after.",
        },
      ],
    });

    res.json({ srt: response.text });
  } catch (err: any) {
    console.error("Transcribe Error:", err);
    res.status(500).json({ error: err.message || "មានបញ្ហានៅពេលបំលែងសំឡេងជាអក្សរ" });
  }
});

// 2. SRT and Text Translation API via Gemini
app.post("/api/gemini/translate", async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text) {
      return res.status(400).json({ error: "ខ្វះទិន្នន័យអត្ថបទសម្រាប់បកប្រែ" });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a professional film/video subtitling translator. Translate the following subtitles/text content into "${targetLang || "Khmer"}".
If it is SRT, keep all the line numbers and timestamp ranges (e.g., 00:00:01,000 --> 00:00:04,500) EXACTLY identical and in the same sequence. Only translate the dialogue text inside.
Ensure the translation sounds highly natural, cinematic, and perfectly captures the emotion of the movie dialogue.

Content to translate:
${text}`,
    });

    res.json({ translatedText: response.text });
  } catch (err: any) {
    console.error("Translation Error:", err);
    res.status(500).json({ error: err.message || "មានបញ្ហានៅពេលបកប្រែភាសា" });
  }
});

// 3. Text to Speech (TTS) generation via Gemini Speech API
app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { text, voiceName, promptStyle } = req.body;
    if (!text) {
      return res.status(400).json({ error: "ខ្វះអត្ថបទសម្រាប់អាន" });
    }

    const ai = getGeminiClient();
    // Using gemini-3.1-flash-tts-preview model to create high quality audio
    const prompt = promptStyle ? `Style: ${promptStyle}. Text to say: ${text}` : `Read the following dialogue clearly and naturally: ${text}`;
    
    // Choose prebuilt voice: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
    const chosenVoice = voiceName || "Kore"; 

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audio: base64Audio, format: "pcm", sampleRate: 24000 });
    } else {
      throw new Error("Fail to generate speech audio binary from Gemini TTS preview.");
    }
  } catch (err: any) {
    console.error("TTS Generator error:", err);
    // Return mock fallback speech marker if API fails to prevent blocking user testing
    res.status(500).json({ error: err.message || "មានបញ្ហានៅពេលបង្កើតសំឡេង (TTS)" });
  }
});

// Start integration with Vite in Dev environment
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is happily running at http://0.0.0.0:${PORT}`);
  });
}

initServer();
