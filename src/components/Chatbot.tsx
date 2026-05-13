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
import { Send, Bot, User, Loader2, MessageCircle, X, Minus, Trash2, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Chatbot({ userName, aiContext, onClearContext }: { userName?: string, aiContext?: string | null, onClearContext?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev.trim() ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          alert("Microphone access is blocked. Please enable permissions in your browser settings. If you are using the AI Studio preview, try opening the app in a new browser tab.");
        } else if (event.error === 'network') {
          alert("Check your internet connection.");
        } else if (event.error === 'no-speech') {
          // Silent or subtle feedback for no speech detected
          console.log("No speech detected.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Try opening in a new tab.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

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
          systemInstruction: `You are a spiritual guide for the ZUCA (Zetech University Catholic Action) community. ${userName ? `You are speaking with ${userName}. ` : ""}Provide encouraging, biblically-sound, and Catholic-oriented guidance. ALWAYS provide concise, direct, and summarized results. Avoid long introductory phrases or preambles. If the user asks for a prayer, provide a short, profound one. If they ask for scripture, give the verse and a one-sentence reflection. Refer to the user as a fellow seeker or friend in Christ.`
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
            className="mb-4 w-[calc(100vw-3rem)] md:w-[400px] h-[75vh] md:h-[600px] bg-white dark:bg-stone-950 rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-stone-200 dark:border-white/10 overflow-hidden flex flex-col translate-x-0"
          >
            {/* Header */}
            <div className="p-6 md:p-8 bg-stone-900 dark:bg-stone-900/80 text-white relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/20 blur-[80px] -mr-24 -mt-24 rounded-full pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-3xl shrink-0 group transition-all">
                    <Bot className="w-7 h-7 text-brand-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg tracking-tight serif-display leading-tight">Divine Advisor</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] text-stone-400 uppercase tracking-[0.2em] font-black">Spirit Enkindled</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={async () => {
                       if (confirm('Clear our conversation to refresh the soul?')) {
                         const path = `users/${auth.currentUser?.uid}/chatHistory`;
                         for (const msg of messages) {
                           await deleteDoc(doc(db, path, msg.id));
                         }
                       }
                    }}
                    className="p-3 hover:bg-white/5 rounded-2xl transition-all text-stone-500 hover:text-red-400"
                    title="Refresh Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-95 border border-white/10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 bg-stone-50/50 dark:bg-stone-950/40 custom-scrollbar relative">
              <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
              {messages.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 relative z-10">
                  <div className="w-24 h-24 rounded-[36px] bg-white dark:bg-stone-900 flex items-center justify-center mb-8 shadow-2xl border border-stone-100 dark:border-white/5">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Bot className="w-12 h-12 text-brand-600 dark:text-brand-400" />
                    </motion.div>
                  </div>
                  <h4 className="text-xl serif-display font-black text-stone-800 dark:text-stone-200 mb-2 italic">Peace be with you</h4>
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 leading-relaxed max-w-[200px] mx-auto">
                    Ask me for a prayer, a scripture reflection, or guidance for your journey.
                  </p>
                  
                  {/* Quick Suggestions */}
                  <div className="mt-8 grid grid-cols-1 gap-2 w-full max-w-[240px]">
                    {[
                      "Short prayer for strength",
                      "Bible verse for hope",
                      "Today's reflection",
                    ].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => setInput(hint)}
                        className="px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/5 rounded-xl text-[11px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 transition-all text-left shadow-sm"
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}>
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`px-5 py-4 rounded-[24px] text-[14px] leading-relaxed shadow-sm transition-all ${
                      msg.role === 'user' 
                        ? 'bg-stone-900 text-white dark:bg-brand-600 rounded-tr-none font-medium' 
                        : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-100 dark:border-white/10 rounded-tl-none font-serif italic selection:bg-brand-200 selection:text-brand-900'
                    }`}>
                      <div className="markdown-body prose prose-stone dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-strong:text-brand-600">
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

            {/* Input Overlay */}
            <div className="p-6 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-white/10 shrink-0">
              <form onSubmit={handleSend} className="flex gap-3">
                <div className="flex-1 relative flex items-center group">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "I'm listening..." : "Ask the Spirit..."}
                    className="w-full px-6 py-4 pr-14 bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/5 rounded-[22px] outline-none text-[15px] transition-all focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500/50 shadow-inner placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-3 p-2.5 rounded-xl transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                        : 'text-stone-400 hover:text-brand-500 hover:bg-brand-500/10'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-brand-900 dark:bg-brand-600 text-white p-4 rounded-[22px] hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-50 transition-all shadow-xl shadow-brand-900/20 flex items-center justify-center shrink-0 disabled:grayscale"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
              <div className="flex items-center justify-center gap-4 mt-4">
                 <div className="h-[1px] flex-1 bg-stone-100 dark:bg-white/5" />
                 <p className="text-[9px] text-stone-400 font-black uppercase tracking-[0.3em]">Grace Manifested</p>
                 <div className="h-[1px] flex-1 bg-stone-100 dark:bg-white/5" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-[22px] md:rounded-[28px] flex items-center justify-center shadow-2xl transition-all duration-700 relative group overflow-hidden ${
          isOpen 
            ? 'bg-stone-950 text-white rotate-90 shadow-brand-500/30' 
            : 'bg-brand-900 text-white shadow-brand-900/40'
        }`}
      >
        {/* Divine Aura Effects */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-400/40 via-transparent to-brand-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="absolute -inset-4 bg-gradient-radial from-brand-500/30 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-150 animate-pulse-gentle" />
        
        {/* Sacred Geometry Pulse */}
        {!isOpen && (
          <div className="absolute inset-0 border border-brand-400/20 rounded-full scale-0 group-hover:scale-150 transition-transform duration-1000 opacity-0 group-hover:opacity-100" />
        )}

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
              className="relative z-10"
            >
              <X className="w-6 h-6 md:w-7 md:h-7" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="relative z-10 flex items-center justify-center"
            >
              <MessageCircle className="w-7 h-7 md:w-9 md:h-9 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
              <div className="absolute -top-1 -right-1 flex">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-75" />
                <div className="relative w-3 h-3 md:w-4 md:h-4 bg-emerald-500 rounded-full border-2 border-brand-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
