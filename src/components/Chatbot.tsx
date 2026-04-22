import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChatMessage, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import Markdown from 'react-markdown';
import { Send, Bot, User, Loader2, MessageCircle, X, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
           ...history,
           { role: 'user', parts: [{ text: userText }] }
        ],
        config: {
          systemInstruction: "You are a spiritual guide for the ZUCA (Zetech University Catholic Action) community. Provide encouraging, biblically-sound, and Catholic-oriented guidance. Be compassionate and wise. Use a warm, editorial tone. Refer to the user as a fellow seeker and member of ZUCA."
        }
      });
      
      const aiResponse = result.text || "I am reflecting on your words. Pray for a moment and ask again.";

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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[calc(100vw-2rem)] md:w-[380px] h-[calc(100vh-10rem)] md:h-[550px] bg-white dark:bg-stone-950 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-5 bg-brand-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <Bot className="w-6 h-6 text-brand-100" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Spiritual Companion</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                    <span className="text-[10px] text-brand-300 uppercase tracking-wider font-bold">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#FBFBFA] dark:bg-stone-950/50">
              {messages.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 grayscale opacity-50">
                  <Bot className="w-12 h-12 text-stone-400 mb-4" />
                  <p className="text-stone-500 text-sm italic">"Ask, and it will be given to you; seek, and you will find..."</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-brand-900 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 shadow-sm border border-stone-100 dark:border-stone-800 rounded-tl-none'
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
                  <div className="bg-white dark:bg-stone-900 p-3.5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-stone-950 border-t border-stone-100 dark:border-stone-800 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border-none rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none text-sm"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-brand-900 text-white p-2.5 rounded-2xl hover:bg-brand-800 transition-all active:scale-95"
              >
                <Send className="w-5 h-5" />
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
