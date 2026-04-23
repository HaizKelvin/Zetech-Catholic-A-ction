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

export default function Chatbot({ userName }: { userName?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      console.error('Chat error:', error);
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
            className="mb-4 w-[calc(100vw-3rem)] md:w-[300px] h-[55vh] md:h-[420px] bg-white/90 dark:bg-stone-950/90 backdrop-blur-3xl rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-brand-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-xs">Spiritual Guide</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[8px] text-brand-200 uppercase tracking-tighter font-black">Active Now</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gradient-to-b from-stone-50/50 to-white/50 dark:from-stone-900/20 dark:to-stone-950/20">
              {messages.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
                  <Bot className="w-8 h-8 mb-3" />
                  <p className="text-[10px] font-medium italic">"Seek and you shall find..."</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-stone-950 text-white dark:bg-white dark:text-stone-950 rounded-tr-none' 
                        : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border border-stone-100 dark:border-stone-800 rounded-tl-none'
                    }`}>
                      <div className="markdown-body prose prose-xs max-w-none prose-stone dark:prose-invert">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-stone-900 px-3 py-2 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 rounded-tl-none">
                    <div className="flex gap-1">
                       <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce" />
                       <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                       <div className="w-1 h-1 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white/50 dark:bg-stone-950/50 backdrop-blur-md border-t border-stone-100 dark:border-white/5 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your guide..."
                className="flex-1 px-4 py-2 bg-stone-100/50 dark:bg-white/5 border-none rounded-xl outline-none text-xs placeholder:text-stone-400"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-brand-900 text-white p-2 rounded-xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen ? 'bg-brand-900 rotate-90' : 'bg-brand-700'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-7 h-7 text-white" />
        )}
      </motion.button>
    </div>
  );
}
