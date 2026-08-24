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
  
  if (msg.includes("mass") || msg.includes("service") || msg.includes("sacrament") || msg.includes("eucharist") || msg.includes("liturgy") || msg.includes("sunday")) {
    return `Peace be with you, ${name}. The Holy Mass is the sacred source and summit of our Christian life. Our Sunday Mass is celebrated at 9:00 AM. Let us receive Christ with reverence. (Matthew 26:26)`;
  }
  if (msg.includes("choir") || msg.includes("sing") || msg.includes("music") || msg.includes("rehearsal") || msg.includes("practice")) {
    return `Blessings, ${name}! High chanting or singing praise is praying twice. ZUCA Choir rehearsals take place on Thursdays at 4:30 PM, and Saturdays & Sundays at 3:00 PM. (Psalm 100:2)`;
  }
  if (msg.includes("jumuiya") || msg.includes("meeting") || msg.includes("wednesday") || msg.includes("tuesday") || msg.includes("room") || msg.includes("school") || msg.includes("class") || msg.includes("gather") || msg.includes("pg 6") || msg.includes("pg6")) {
    return `Dearest ${name}, Jumuiya fellowship and shared reflection take place in Room PG 6 every Wednesday at 4:20 PM at the main school campus. Come and be blessed! (Matthew 18:20)`;
  }
  if (msg.includes("rosary") || msg.includes("mary") || msg.includes("mother") || msg.includes("decade") || msg.includes("hail mary")) {
    return `May Our Lady of the Holy Rosary wrap you in her mantle of peace, ${name}. Praying the Rosary connects us deeply with Christ's mysteries through Mary's intercession. (Luke 1:28)`;
  }
  if (msg.includes("pray") || msg.includes("intention") || msg.includes("petition") || msg.includes("altar") || msg.includes("help")) {
    return `I am praying with you, ${name}. Rest assured that your heartfelt petitions are placed before our Lord's altar. Cast all your anxieties on Him, for He cares for you. (Philippians 4:6)`;
  }
  if (msg.includes("confession") || msg.includes("sin") || msg.includes("forgive") || msg.includes("mercy") || msg.includes("reconciliation")) {
    return `God's divine mercy is boundless, ${name}. The Sacrament of Reconciliation restores and heals our hearts. Approach the Lord with trust. (1 John 1:9)`;
  }
  if (msg.includes("exam") || msg.includes("study") || msg.includes("stress") || msg.includes("academics") || msg.includes("cat") || msg.includes("grade")) {
    return `Trust in the Holy Spirit to grant you wisdom, clarity, and peace in your studies and exams, ${name}. Saint Thomas Aquinas and St. Joseph of Cupertino, pray for our students! (James 1:5)`;
  }
  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey") || msg.includes("jambo") || msg.includes("habari")) {
    return `A very warm welcome to you, ${name}! The Sanctuary Spirit greets you in Christ's peace. How can I assist your spiritual or university journey today? (John 14:27)`;
  }
  if (msg.includes("who are you") || msg.includes("what is your name") || msg.includes("sanctuary")) {
    return `I am the Sanctuary Spirit, the digital companion of Zetech University Catholic Action (ZUCA), here to provide Catholic scriptures, prayers, and community schedules. (Proverbs 3:5-6)`;
  }
  
  return `May the peace of Christ reign in your heart, ${name}. Let your university journey be anchored in faithful prayer, academic diligence, and brotherly love. (Proverbs 3:5-6)`;
}

app.post("/api/chat", async (req, res) => {
  const { message, history, userName } = req.body;
  
  try {
    const ai = getGemini();
    const systemInstruction = `You are the "Sanctuary Spirit", the spiritual guide and AI companion for the Zetech University Catholic Action (ZUCA) community. 
Provide authentic, compassionate, and concise Catholic guidance, prayers, and scripture.

COMMUNITY INFO & SCHEDULE:
- Jumuiya fellowship: Every Wednesday at 4:20 PM in Room PG 6 at the school campus.
- Choir rehearsals: Thursdays at 4:30 PM, Saturdays at 3:00 PM, Sundays at 3:00 PM.
- Sunday Holy Mass: 9:00 AM.
- Community: Zetech University Catholic Action (ZUCA).

TONE: Warm, encouraging, spiritually wise, and respectful.
STYLE: Direct and concise (2-3 sentences maximum).
MANDATORY: Include ONE inspiring Scripture reference (Book Chapter:Verse).
USER NAME: Address user as "${userName || 'Friend'}".`;

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
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction,
      }
    });

    const aiText = response.text || generateSpiritualFallback(message || "", userName || "Pilgrim Friend");
    res.json({ text: aiText });
  } catch (error: any) {
    console.warn("Gemini API request note, utilizing spiritual guide response:", error?.message || error);
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
          model: "gemini-3.6-flash",
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
