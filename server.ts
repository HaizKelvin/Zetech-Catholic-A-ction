import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { BrevoClient } from "@getbrevo/brevo";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
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
    const systemInstruction = `You are the "Sanctuary Spirit", a spiritual guide for the ZUCA community. 
Provide authentic, direct, and concise Catholic guidance.

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
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL,
        },
      }
    });

    const aiText = response.text || "My reflection is currently interrupted, fellow pilgrim. Let us pause for a moment in prayer.";
    res.json({ text: aiText });
  } catch (error: any) {
    console.error("Gemini Chat Error Details:", {
      message: error.message,
      stack: error.stack,
      response: error.response
    });
    res.status(500).json({ 
      error: "The Spirit is reflecting. Please try again soon.",
      details: error.message
    });
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
