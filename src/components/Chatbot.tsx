import React, { useState, useEffect, useRef } from 'react';
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
import { Send, Bot, User, Loader2, MessageCircle, X, Minus, Trash2, Mic, MicOff, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Chatbot({ userName, aiContext, onClearContext }: { userName?: string, aiContext?: string | null, onClearContext?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiConfigured, setIsAiConfigured] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check backend Gemini health
  useEffect(() => {
    fetch('/api/chat/health')
      .then(res => res.json())
      .then(data => {
        setIsAiConfigured(!!data.keyConfigured);
      })
      .catch(err => {
        console.warn("Could not fetch chat health:", err);
        setIsAiConfigured(false);
      });
  }, []);

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
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    setIsLoading(true);

    const isGuest = !auth.currentUser;
    const path = isGuest ? '' : `users/${auth.currentUser.uid}/chatHistory`;

    try {
      const newUserMessage: ChatMessage = {
        id: isGuest ? Math.random().toString() : '',
        userId: isGuest ? 'guest' : auth.currentUser!.uid,
        role: 'user',
        text: userText,
        timestamp: isGuest ? Timestamp.now() : serverTimestamp() as any
      };

      if (isGuest) {
        setMessages(prev => [...prev, newUserMessage]);
      } else {
        try {
          await addDoc(collection(db, path), {
            userId: auth.currentUser!.uid,
            role: 'user',
            text: userText,
            timestamp: serverTimestamp()
          });
        } catch (dbErr) {
          console.warn("Could not save user message to chat history in Firestore:", dbErr);
          setMessages(prev => [...prev, newUserMessage]);
        }
      }

      // Constructing history for context
      const history = [...messages, newUserMessage].slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      let replyText = "";
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: userText, 
            history,
            userName: isGuest ? 'Pilgrim Friend' : (userName || 'Friend')
          })
        });

        if (response.ok) {
          const data = await response.json();
          replyText = data.text;
        } else {
          console.warn("Server API returned status", response.status);
        }
      } catch (networkErr) {
        console.warn("Network request error to /api/chat:", networkErr);
      }

      if (!replyText) {
        // Spiritual fallback in case of direct fetch failure
        const low = userText.toLowerCase();
        if (low.includes('mass') || low.includes('service')) {
          replyText = `Peace be with you, ${userName || 'Friend'}. Our Sunday Mass is celebrated at 9:00 AM. Let us gather with devotion. (Matthew 26:26)`;
        } else if (low.includes('jumuiya') || low.includes('meeting') || low.includes('wednesday')) {
          replyText = `Dearest ${userName || 'Friend'}, Jumuiya fellowship takes place in Room PG 6 every Wednesday at 4:20 PM. Join us in praise! (Matthew 18:20)`;
        } else if (low.includes('choir') || low.includes('sing')) {
          replyText = `Blessings, ${userName || 'Friend'}! Choir rehearsals are Thursdays at 4:30 PM, Saturdays & Sundays at 3:00 PM. (Psalm 100:2)`;
        } else {
          replyText = `May the peace of Christ accompany you, ${userName || 'Friend'}. Rest in prayer and academic perseverance. (Philippians 4:6)`;
        }
      }

      const newModelMessage: ChatMessage = {
        id: isGuest ? Math.random().toString() : '',
        userId: isGuest ? 'guest' : auth.currentUser!.uid,
        role: 'model',
        text: replyText,
        timestamp: isGuest ? Timestamp.now() : serverTimestamp() as any
      };

      if (isGuest) {
        setMessages(prev => [...prev, newModelMessage]);
      } else {
        try {
          await addDoc(collection(db, path), {
            userId: auth.currentUser!.uid,
            role: 'model',
            text: replyText,
            timestamp: serverTimestamp()
          });
        } catch (dbErr) {
          console.warn("Could not save model response to chat history in Firestore:", dbErr);
          setMessages(prev => [...prev, newModelMessage]);
        }
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      const fallbackMsg = `May the Lord guide you with peace and wisdom, ${userName || 'Friend'}. (Proverbs 3:5-6)`;
      const newErrorMessage: ChatMessage = {
        id: isGuest ? Math.random().toString() : '',
        userId: isGuest ? 'guest' : auth.currentUser!.uid,
        role: 'model',
        text: fallbackMsg,
        timestamp: isGuest ? Timestamp.now() : serverTimestamp() as any
      };

      if (isGuest) {
        setMessages(prev => [...prev, newErrorMessage]);
      } else {
        try {
          await addDoc(collection(db, path), {
            userId: auth.currentUser!.uid,
            role: 'model',
            text: fallbackMsg,
            timestamp: serverTimestamp()
          });
        } catch (dbErr) {
          setMessages(prev => [...prev, newErrorMessage]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[110] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
            <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="mb-4 w-[calc(100vw-2rem)] md:w-[290px] h-[50vh] md:h-[360px] bg-white dark:bg-stone-950 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,51,102,0.3)] border border-stone-200/60 dark:border-white/10 overflow-hidden flex flex-col translate-x-0 will-change-transform"
          >
            {/* Header - Enhanced legit look */}
            <div className="p-4 md:p-5 bg-gradient-to-br from-[#003366] to-[#001a33] text-white relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 w-64 h-64 bg-zetech-gold/10 blur-[100px] -mr-32 -mt-32 rounded-full pointer-events-none animate-pulse-gentle" />
               <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-zetech-gold/5 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[20px] bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-3xl shrink-0 group shadow-inner">
                    <div className="relative">
                       <Bot className="w-6 h-6 text-zetech-gold group-hover:scale-110 transition-transform duration-300" />
                       <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#003366]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-base tracking-tight leading-tight uppercase">Sanctuary <span className="text-zetech-gold serif-display italic font-light lowercase">Spirit</span></h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isAiConfigured === true ? 'bg-emerald-400 animate-pulse' : isAiConfigured === false ? 'bg-amber-400' : 'bg-stone-400 animate-bounce'}`} />
                      <span className="text-[7.5px] text-zetech-gold/90 uppercase tracking-[0.2em] font-black">
                        {isAiConfigured === true ? 'AI Connected' : isAiConfigured === false ? 'Local Spirit' : 'Syncing...'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={async () => {
                       if (confirm('Clear our conversation to refresh the soul?')) {
                          if (!auth.currentUser) {
                            setMessages([]);
                          } else {
                            const path = `users/${auth.currentUser?.uid}/chatHistory`;
                            for (const msg of messages) {
                              await deleteDoc(doc(db, path, msg.id));
                            }
                          }
                       }
                    }}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-red-300"
                    title="Clear Soul"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-95 border border-white/10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages - More refined typography */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-stone-50/30 dark:bg-stone-950/40 custom-scrollbar relative">
              <div className="absolute inset-0 divine-pattern opacity-[0.02] pointer-events-none" />
              
              {messages.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 relative z-10">
                  <div className="w-20 h-20 rounded-[32px] bg-white dark:bg-stone-900 flex items-center justify-center mb-6 shadow-xl border border-stone-100 dark:border-white/5 relative group">
                    <div className="absolute inset-0 bg-zetech-gold/5 rounded-[32px] scale-110 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Bot className="w-10 h-10 text-zetech-blue drop-shadow-lg relative z-10" />
                  </div>
                  <h4 className="text-xl serif-display font-light text-stone-900 dark:text-stone-100 mb-2 italic">Peace be with you</h4>
                  <p className="text-[12px] font-medium text-stone-50 dark:text-stone-400 leading-relaxed max-w-[200px] mx-auto opacity-0 h-0 overflow-hidden md:h-auto md:opacity-100">
                    I am your spiritual guide. Ask for wisdom or a prayer.
                  </p>
                  
                  {/* Enhanced Legit Suggestions */}
                  <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-[260px]">
                    {[
                      "Legit prayer for exams",
                      "Scripture for hope",
                    ].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => setInput(hint)}
                        className="px-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-white/5 rounded-[16px] text-[9px] font-black uppercase tracking-widest text-zetech-blue dark:text-stone-400 hover:bg-[#003366] hover:text-white hover:border-[#003366] hover:-translate-y-0.5 transition-all text-left shadow-sm flex items-center justify-between group"
                      >
                        {hint}
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  key={msg.id || idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}
                >
                  <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`px-4.5 py-3.5 rounded-[22px] text-[13.5px] leading-[1.5] shadow-md transition-all ${
                      msg.role === 'user' 
                        ? 'bg-[#003366] text-white dark:bg-brand-600 rounded-tr-none font-medium' 
                        : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-100 dark:border-white/10 rounded-tl-none font-serif italic selection:bg-zetech-gold/20 selection:text-zetech-blue border-l-4 border-l-zetech-gold text-sm'
                    }`}>
                      <div className="markdown-body prose prose-stone dark:prose-invert max-w-none prose-p:my-0.5 prose-headings:my-1 prose-strong:text-zetech-blue prose-strong:font-black">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-stone-900 px-4 py-3 rounded-[18px] rounded-tl-none shadow-md border border-stone-100 dark:border-stone-800 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-zetech-gold animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Spirit Reflecting...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Area - More legit feel */}
            <div className="p-3 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-white/10 shrink-0">
              <form onSubmit={handleSend} className="flex gap-3">
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Whisper..."}
                    className="w-full px-4 py-2.5 pr-10 bg-stone-50 dark:bg-white/5 border border-stone-200/60 dark:border-white/10 rounded-[18px] outline-none text-[13px] transition-all focus:ring-4 focus:ring-zetech-blue/5 focus:border-[#003366]/40 shadow-inner placeholder:text-stone-400 font-medium"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-2.5 p-2 rounded-[14px] transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
                        : 'text-stone-400 hover:text-zetech-blue hover:bg-stone-100'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4.5 h-4.5 animate-pulse" /> : <Mic className="w-4.5 h-4.5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-[#003366] text-white p-2.5 rounded-[18px] hover:translate-y-[-2px] active:translate-y-[0px] disabled:opacity-50 transition-all shadow-[0_8px_16px_-8px_rgba(0,51,102,0.4)] flex items-center justify-center shrink-0 disabled:grayscale group"
                >
                  <Send className="w-5.5 h-5.5 group-hover:rotate-12 transition-transform" />
                </button>
              </form>
              <div className="flex items-center justify-center gap-4 mt-4">
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-stone-100 dark:to-white/5" />
                 <p className="text-[7px] text-stone-400 font-black uppercase tracking-[0.4em]">ZUCA Action</p>
                 <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-stone-100 dark:to-white/5" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 md:w-14 md:h-14 rounded-[20px] md:rounded-[24px] flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(0,51,102,0.3)] transition-all duration-300 relative group overflow-hidden ${
          isOpen 
            ? 'bg-[#001a33] text-white rotate-90' 
            : 'bg-[#003366] text-white'
        }`}
      >
        {/* Glow Effects */}
        <div className="absolute inset-0 bg-gradient-to-tr from-zetech-gold/30 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <X className="w-6 h-6 md:w-7 md:h-7" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} className="relative z-10 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 md:w-9 md:h-9 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
              <div className="absolute -top-1 -right-1 flex">
                <div className="absolute inset-0 bg-zetech-gold rounded-full animate-ping opacity-75" />
                <div className="relative w-3 h-3 md:w-4 md:h-4 bg-zetech-gold rounded-full border-2 border-[#003366] shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
