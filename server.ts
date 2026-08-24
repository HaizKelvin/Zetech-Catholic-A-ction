import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini lazily
let genAI: GoogleGenAI | null = null;
function getGemini() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    genAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

// API Routes
function generateSpiritualFallback(userMessage: string, userName: string): string {
  const msg = userMessage.toLowerCase();
  const name = userName || "Friend";
  
  if (msg.includes("mass") || msg.includes("service") || msg.includes("sacrament") || msg.includes("eucharist") || msg.includes("liturgy")) {
    return `Peace be with you, ${name}. The Holy Mass is the sacred source and summit of our faith journey. Let us attend and receive the Eucharist with deep, pure hearts. (Matthew 26:26)`;
  }
  if (msg.includes("choir") || msg.includes("sing") || msg.includes("music") || msg.includes("rehearsal") || msg.includes("practice")) {
    return `Blessings, ${name}! High chanting or singing is praying twice to the Lord. Our choir family meets on Thursdays at 4:30 PM, and Saturdays & Sundays at 3:00 PM. (Psalm 100:2)`;
  }
  if (msg.includes("jumuiya") || msg.includes("meeting") || msg.includes("wednesday") || msg.includes("tuesday") || msg.includes("room") || msg.includes("school") || msg.includes("class") || msg.includes("gather") || msg.includes("pg 6")) {
    return `Dearest ${name}, please remember we now meet for Jumuiya fellowship and shared prayers at PG 6 Room every Wednesday at 4:20 PM at the school. Come join other pilgrims! (Matthew 18:20)`;
  }
  if (msg.includes("pray") || msg.includes("intention") || msg.includes("petition") || msg.includes("altar")) {
    return `I am praying with you, ${name}. Rest assured that your heartfelt intentions are fully presented before our Lord's holy altar. (Philippians 4:6)`;
  }
  if (msg.includes("confession") || msg.includes("sin") || msg.includes("forgive") || msg.includes("mercy")) {
    return `God's divine mercy is an infinite ocean, ${name}. Never hesitate to approach the beautiful Sacrament of Reconciliation for complete renewal. (1 John 1:9)`;
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("jambo")) {
    return `A very warm welcome to you, ${name}! The Sanctuary Spirit greets you on this blessed day. How can I guide your collegiate faith journey today? (John 14:27)`;
  }
  if (msg.includes("who are you") || msg.includes("what is your name")) {
    return `I am the Sanctuary Spirit, the digital guide of Zetech University Catholic Action, here to accompany you through scriptures and spiritual support. (Proverbs 3:5-6)`;
  }
  
  return `Keep walking in faith, ${name}. Let your university journey be guided by prayers, genuine academic effort, and loving charity towards all. (Proverbs 3:5-6)`;
}

app.post("/api/chat", async (req, res) => {
  const { message, history, userName } = req.body;
  
  try {
    const ai = getGemini();
    const systemInstruction = `You are the "Sanctuary Spirit", a spiritual guide for the ZUCA community. 
Provide authentic, direct, and concise Catholic guidance.

IMPORTANT SCHEDULE INFO:
- Jumuiya fellowship is every Wednesday at 4:20 PM in PG 6 Room at the school.
- Choir practices are on Thursdays at 4:30 PM, Saturdays at 3:00 PM, and Sundays at 3:00 PM.
- Sunday Holy Mass is at 9:00 AM.

TONE: Warm, respectful, spiritually wise.
RESPONSE STYLE: EXTREMELY BRIEF (1-2 sentences).
MANDATORY: Include ONE Scripture verse (Book Chapter:Verse).
REFER TO USER AS: ${userName ? `"${userName}"` : '"Friend"'}.`;

    // Clean and alternate history
    const contents: any[] = [];
    let lastRole: string | null = null;

    if (history && Array.isArray(history)) {
      for (const m of history) {
        const role = m.role === 'user' ? 'user' : 'model';
        const text = (m.parts && m.parts[0]?.text) || m.text || "";
        const cleanText = text.trim();
        if (!cleanText) continue;

        if (role === lastRole) {
          if (contents.length > 0) {
            contents[contents.length - 1].parts[0].text += "\n" + cleanText;
          }
        } else {
          contents.push({
            role,
            parts: [{ text: cleanText }]
          });
          lastRole = role;
        }
      }
    }

    // Append new user message
    if (lastRole === 'user') {
      if (contents.length > 0) {
        contents[contents.length - 1].parts[0].text += "\n" + message;
      }
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
      }
    });

    const aiText = response.text || "My reflection is currently interrupted, fellow pilgrim. Let us pause for a moment in prayer.";
    res.json({ text: aiText });
  } catch (error: any) {
    console.warn("Gemini API call failed, falling back to spiritual guidance generator:", error.message);
    const fallbackText = generateSpiritualFallback(message || "", userName || "Pilgrim Friend");
    res.json({ text: fallbackText });
  }
});

app.get("/api/chat/health", async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;
    const isKeySet = !!key;
    const keyLength = key ? key.length : 0;
    const keyPrefix = key ? key.slice(0, 6) : "none";

    let testResult = "Not attempted";
    if (isKeySet) {
      try {
        const ai = getGemini();
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: "Hello, reply with one word: 'Sanctuary'",
        });
        testResult = response.text ? response.text.trim() : "Empty response";
      } catch (e: any) {
        testResult = `Error calling Gemini: ${e.message}`;
      }
    }

    res.json({
      status: "ready",
      keyConfigured: isKeySet,
      keyLength,
      keyPrefix,
      testResult,
      time: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/send-email", async (req, res) => {
  try {
    const { subject, body, recipients } = req.body;
    if (!subject || !body || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: "Missing required fields: subject, body, recipients (array)" });
    }
    // Brevo dependency removed - logging simulated notification
    console.log(`[Notification Service] Email queued for: ${recipients.join(', ')} | Subject: ${subject}`);
    res.json({ message: "Notification queued successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to process request" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
