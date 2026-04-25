import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChatMessage, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import Markdown from 'react-markdown';
import { Send, Bot, User, Loader2, MessageCircle, X, Minus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Chatbot({ userName, aiContext, onClearContext }: { userName?: string, aiContext?: string | null, onClearContext?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle external AI Context from Divine Library
  useEffect(() => {
    if (aiContext && isOpen) {
      setInput(aiContext);
      if (onClearContext) onClearContext();
    } else if (aiContext && !isOpen) {
      setIsOpen(true);
    }
  }, [aiContext, isOpen]);

  // Message expiration cleanup (10 minutes)
  useEffect(() => {
    if (!auth.currentUser || messages.length === 0) return;
    
    const now = Timestamp.now().toMillis();
    const tenMinutes = 10 * 60 * 1000;
    const path = `users/${auth.currentUser.uid}/chatHistory`;

    const cleanup = async () => {
      const expiredMessages = messages.filter(msg => {
        const msgTime = msg.timestamp instanceof Timestamp ? msg.timestamp.toMillis() : 0;
        return msgTime && (now - msgTime > tenMinutes);
      });

      for (const msg of expiredMessages) {
        try {
          await deleteDoc(doc(db, path, msg.id));
        } catch (err) {
          console.error("Auto-deletion failed:", err);
        }
      }
    };

    cleanup();
  }, [messages]);

  useEffect(() => {
    if (!auth.currentUser || !isOpen) return;

    const path = `users/${auth.currentUser.uid}/chatHistory`;
    const q = query(collection(db, path), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !auth.currentUser || isLoading) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    const path = `users/${auth.currentUser.uid}/chatHistory`;

    try {
      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        role: 'user',
        text: userText,
        timestamp: serverTimestamp()
      });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Constructing history for context
      const history = messages.slice(-5).map(m => ({
        role: m.role as any,
        parts: [{ text: m.text }]
      }));

      // Use streaming for faster response
      const result = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [
           ...history,
           { role: 'user', parts: [{ text: userText }] }
        ],
        config: {
          systemInstruction: `You are a spiritual guide for the ZUCA (Zetech University Catholic Action) community. ${userName ? `You are speaking with ${userName}. ` : ""}Provide encouraging, biblically-sound, and Catholic-oriented guidance. Be compassionate and wise. ALWAYS provide summarized and concise replies unless explicitly asked for a detailed explanation. Use a warm, editorial tone. Refer to the user as a fellow seeker.`
        }
      });
      
      let aiResponse = "";
      for await (const chunk of result) {
        aiResponse += chunk.text || "";
      }

      if (!aiResponse) aiResponse = "I am reflecting on your words. Pray for a moment and ask again.";

      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        role: 'model',
        text: aiResponse,
        timestamp: serverTimestamp()
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[110] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[calc(100vw-3rem)] md:w-[360px] h-[65vh] md:h-[500px] bg-[#F4F5F7] dark:bg-stone-950 rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.4)] border border-stone-200 dark:border-white/5 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 bg-brand-900 text-white relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 rounded-full" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-xl shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight">Spiritual Guide</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                      <span className="text-[10px] text-brand-200 uppercase tracking-widest font-black">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all active:scale-90"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-stone-50/30 dark:bg-stone-900/10 custom-scrollbar">
              {messages.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <div className="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-white/5 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-brand-900 dark:text-brand-400" />
                  </div>
                  <p className="text-xs font-serif italic text-stone-700 dark:text-stone-400">"Peace be with you. How can I guide your spirit today?"</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-1 ${
                      msg.role === 'user' ? 'bg-stone-200 dark:bg-stone-800' : 'bg-brand-900/10 text-brand-900'
                    }`}>
                      {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </div>
                    <div className={`p-4 rounded-[22px] text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 rounded-tr-none' 
                        : 'bg-[#FCFDFF] dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-tl-none ring-1 ring-stone-100 dark:ring-white/5'
                    }`}>
                      <div className="markdown-body prose prose-sm max-w-none prose-stone dark:prose-invert">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-stone-900 px-4 py-3 rounded-[20px] rounded-tl-none shadow-sm border border-stone-100 dark:border-stone-800">
                    <div className="flex gap-1.5 items-center">
                       <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-duration:0.6s]" />
                       <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]" />
                       <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-[#F4F5F7] dark:bg-stone-950 border-t border-stone-200 dark:border-white/5 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a spiritual question..."
                  className="flex-1 px-5 py-3 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/5 rounded-2xl outline-none text-sm transition-all focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/50"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-brand-900 text-white p-3 rounded-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-brand-900/20 flex items-center justify-center shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <p className="mt-2 text-[8px] text-center text-stone-600 dark:text-stone-400 font-bold uppercase tracking-widest">Powered by Sanctuary Spirit</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95, y: 0 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-[0_15px_45px_rgba(0,0,0,0.2)] transition-all duration-500 ${
          isOpen ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-950 rotate-90' : 'bg-brand-900 text-white'
        }`}
      >
        {isOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-brand-900 animate-pulse" />
          </div>
        )}
      </motion.button>
    </div>
  );
}
