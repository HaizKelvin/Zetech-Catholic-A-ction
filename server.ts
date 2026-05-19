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
      throw new Error("BREVO_API_KEY environment variable is required");
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
        ...history.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.parts[0].text }]
        })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are the "Sanctuary Spirit", the official AI spiritual companion for the ZUCA (Zetech University Catholic Action) community. 
        Your purpose is to provide "legit", authentic, and biblically-grounded Catholic guidance.
        
        TONE & PERSONALITY:
        - Deeply respectful, warm, and spiritually wise.
        - Use "legit" terminology when appropriate for university students, but keep it sacred.
        - Refer to the user as "Fellow Seeker", "Friend in Christ", or ${userName ? `"${userName}"` : '"Pilgrim"'}.
        
        CORE PRINCIPLES:
        - Always include a relevant (and accurate) Scripture verse for every guidance session.
        - If asked for prayer, provide a "legit" profound prayer that touches the heart.
        - Focus on the Zetech University context: Inventing your future through faith.
        - Keep responses summarized but high-impact. No fluff.
        
        CONSTRAINTS:
        - Do not give medical or legal advice.
        - Stay within Catholic tradition and university values.`
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "The Spirit is reflecting. Please try again in a moment." });
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
