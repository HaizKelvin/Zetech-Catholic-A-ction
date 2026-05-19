import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { BrevoClient } from "@getbrevo/brevo";
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

// Initialize Brevo lazily
let brevoClient: BrevoClient | null = null;
function getBrevo() {
  if (!brevoClient) {
    const key = process.env.BREVO_API_KEY;
    if (!key) {
      throw new Error("BREVO_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    brevoClient = new BrevoClient({ apiKey: key });
  }
  return brevoClient;
}

// API Routes
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, userName } = req.body;
    
    const ai = getGemini();
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...(history || []).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: (m.parts && m.parts[0]?.text) || m.text || "" }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are the "Sanctuary Spirit", a spiritual guide for the ZUCA community. 
        Provide authentic, direct, and concise Catholic guidance.
        
        TONE: Warm, respectful, spiritually wise.
        RESPONSE STYLE: EXTREMELY BRIEF (1-2 sentences).
        MANDATORY: Include ONE Scripture verse (Book Chapter:Verse).
        REFER TO USER AS: ${userName ? `"${userName}"` : '"Friend"'}.`
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini error:", error);
    const errorMessage = error.message?.includes("API_KEY_INVALID") 
      ? "Invalid API Key. Please check your GEMINI_API_KEY in the app settings."
      : "The spirit is reflecting. Please try again soon.";
    res.status(500).json({ error: errorMessage });
  }
});

// Cache for Daily bread
let cachedBread: any = null;
let lastBreadFetchDate: string | null = null;

// Automation for Daily bread (Bible Verse & Saint)
app.get("/api/daily-bread", async (req, res) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  // Return cached version if still today
  if (cachedBread && lastBreadFetchDate === dateStr) {
    return res.json(cachedBread);
  }

  try {
    let verse = { text: "For I know the plans I have for you, declares the Lord.", reference: "Jeremiah 29:11" };
    let saintName = "General Memorial";
    let saintInfo = "A day dedicated to silent prayer and reflection on the journey of faith.";

    // 1. Fetch Bible Verse of the Day (using a more stable API)
    try {
      const votdRes = await fetch("https://labs.bible.org/api/?passage=votd&type=json");
      if (votdRes.ok) {
        const contentType = votdRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const bibleData = await votdRes.json();
           if (Array.isArray(bibleData) && bibleData[0]) {
             verse = {
               text: bibleData[0].text,
               reference: `${bibleData[0].bookname} ${bibleData[0].chapter}:${bibleData[0].verse}`
             };
           }
        }
      }
    } catch (e) {
      console.warn("Bible API failed, using fallback");
    }

    // 2. Fetch Liturgical Calendar for Saint
    try {
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      
      const romcalRes = await fetch(`http://calapi.romcal.net/api/v1/dates/${yyyy}-${mm}-${dd}`);
      if (romcalRes.ok) {
        const contentType = romcalRes.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const romcalData = await romcalRes.json();
          const celebration = romcalData.celebrations?.find((c: any) => c.rank === 'MEMORIAL' || c.rank === 'FEAST' || c.rank === 'SOLEMNITY') || romcalData.celebrations?.[0];
          if (celebration?.title) {
            saintName = celebration.title;
          }
        }
      }
    } catch (e) {
      console.warn("Romcal API failed, using fallback");
    }

    // 3. Use Gemini to find a saint if API failed or provide bio
    try {
      const ai = getGemini();
      
      const prompt = (saintName === "General Memorial" || !saintName)
        ? `Today is ${today.toDateString()}. Identify a famous Catholic Saint or feast day for today. Provide their name and a 1-sentence spiritually-inspiring biography. Format: Name | Bio`
        : `Provide a beautiful, spiritually-inspiring 1-sentence biography for ${saintName}. TONE: Sacred and encouraging. FOCUS: Their core virtue.`;
      
      const bioResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      const text = bioResponse.text?.trim() || "";
      
      if (text.includes("|")) {
        const parts = text.split("|");
        saintName = parts[0].trim();
        saintInfo = parts[1].trim();
      } else if (text) {
        saintInfo = text;
      }
    } catch (e) {
      console.error("Gemini Saint fallback failed:", e);
    }

    const breadData = {
      verse: verse.text,
      reference: verse.reference,
      saintName: saintName,
      saintInfo: saintInfo,
      date: dateStr
    };

    cachedBread = breadData;
    lastBreadFetchDate = dateStr;

    res.json(breadData);
  } catch (error: any) {
    console.error("Daily Bread Root Error:", error);
    res.status(500).json({ error: "Failed to gather the Bread of Life." });
  }
});

app.post("/api/send-email", async (req, res) => {
  try {
    const { subject, body, recipients, type } = req.body;

    if (!subject || !body || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: "Missing required fields: subject, body, recipients (array)" });
    }

    const client = getBrevo();
    
    let htmlContent = body;

    // Optional: Wrap in a standard sanctuary template if not already wrapped
    if (type === 'welcome') {
      htmlContent = `
        <div style="font-family: serif; max-width: 600px; margin: auto; padding: 40px; background: #fff; border: 1px solid #eee; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 60px; height: 60px; background: #5c85ff; border-radius: 18px; line-height: 60px; color: white; font-size: 30px;">⛪</div>
            <h2 style="color: #5c85ff; text-transform: uppercase; letter-spacing: 0.3em; font-size: 12px; margin-top: 15px;">ZUCA Sanctuary</h2>
          </div>
          <h1 style="font-size: 28px; color: #111; text-align: center; margin-bottom: 20px;">Welcome to the Faith, ${req.body.name || 'Seeker'}</h1>
          <p style="font-size: 16px; color: #444; line-height: 1.8; text-align: center;">"For where two or three are gathered in my name, there am I among them." — Matthew 18:20</p>
          <div style="margin: 40px 0; padding: 30px; background: #f9f9f9; border-radius: 15px; text-align: center;">
            <p style="font-size: 16px; color: #666; margin: 0;">We are overjoyed to have you join our digital assembly. Here you will find daily strength, community support, and shared wisdom.</p>
          </div>
          <div style="text-align: center;">
            <a href="${process.env.APP_URL || 'https://zucasanctuary.com'}" style="display: inline-block; background: #111; color: white; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; letter-spacing: 0.1em; transition: all 0.3s ease;">ENTER THE SANCTUARY</a>
          </div>
          <p style="margin-top: 40px; font-size: 12px; color: #aaa; text-align: center; border-top: 1px solid #eee; pt-20">Peace and Grace be with you always.</p>
        </div>
      `;
    }

    await client.transactionalEmails.sendTransacEmail({
      subject,
      htmlContent,
      sender: { name: "ZUCA Sanctuary", email: "admin@zucasanctuary.com" },
      to: recipients.map((email: string) => ({ email })),
    });

    res.json({ message: "Email(s) sent successfully via Brevo" });
  } catch (error: any) {
    console.error("Brevo error:", error);
    res.status(500).json({ error: error.message || "Failed to send emails" });
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
