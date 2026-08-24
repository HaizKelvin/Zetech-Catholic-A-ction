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
  const [liveModelName, setLiveModelName] = useState<string>('gemini-2.5-flash');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Check backend Gemini health
  const checkHealth = () => {
    fetch('/api/chat/health')
      .then(res => res.json())
      .then(data => {
        setIsAiConfigured(!!data.connected || !!data.keyConfigured);
        if (data.liveModel && data.liveModel !== 'none') {
          setLiveModelName(data.liveModel);
        }
      })
      .catch(err => {
        console.warn("Could not fetch chat health:", err);
        setIsAiConfigured(false);
      });
  };

  useEffect(() => {
    checkHealth();
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
          if (data && data.text) {
            replyText = data.text;
            if (data.source === 'gemini-api') {
              setIsAiConfigured(true);
              if (data.model) setLiveModelName(data.model);
            }
          }
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
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="mb-4 w-[calc(100vw-1.5rem)] sm:w-[380px] h-[540px] max-h-[82vh] bg-white dark:bg-stone-950 rounded-[28px] shadow-[0_25px_70px_-15px_rgba(0,34,68,0.4)] border border-stone-200/80 dark:border-stone-800 overflow-hidden flex flex-col translate-x-0 will-change-transform z-50"
          >
            {/* Header */}
            <div className="p-4 sm:p-4.5 bg-gradient-to-br from-[#002244] via-[#003366] to-[#001a33] text-white relative overflow-hidden shrink-0 border-b border-white/10">
               <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 blur-[80px] -mr-20 -mt-20 rounded-full pointer-events-none" />
               <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 backdrop-blur-md shrink-0 shadow-inner">
                    <div className="relative">
                       <Bot className="w-5 h-5 text-amber-300" />
                       <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-[#002244] ${isAiConfigured === true ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white tracking-tight">Sanctuary Spirit</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/15 font-semibold text-amber-200 uppercase tracking-wide">AI</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isAiConfigured === true ? 'bg-emerald-400 animate-pulse' : isAiConfigured === false ? 'bg-amber-400' : 'bg-blue-300 animate-ping'}`} />
                      <span className="text-[10px] text-stone-200/90 font-medium">
                        {isAiConfigured === true ? `Connected • ${liveModelName}` : isAiConfigured === false ? 'Spiritual Companion' : 'Connecting to API...'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={checkHealth}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-stone-300 hover:text-white"
                    title="Check AI API status"
                  >
                    <Loader2 className={`w-3.5 h-3.5 ${isAiConfigured === null ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={async () => {
                       if (confirm('Clear our conversation to refresh the soul?')) {
                          if (!auth.currentUser) {
                            setMessages([]);
                          } else {
                            const path = `users/${auth.currentUser?.uid}/chatHistory`;
                            for (const msg of messages) {
                              await deleteDoc(doc(db, path, msg.id)).catch(() => {});
                            }
                            setMessages([]);
                          }
                       }
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-stone-300 hover:text-red-300"
                    title="Clear Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all active:scale-95 text-white"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 bg-stone-50/70 dark:bg-stone-950/60 custom-scrollbar relative">
              {messages.length === 0 && !isLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-900 flex items-center justify-center mb-3 shadow-md border border-stone-200/60 dark:border-stone-800">
                    <Bot className="w-7 h-7 text-[#003366] dark:text-sky-400" />
                  </div>
                  <h4 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">Peace be with you</h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 max-w-[260px] leading-relaxed mb-4">
                    I am the ZUCA Sanctuary companion, powered by Gemini AI to share Catholic prayers, scriptures, and community schedules.
                  </p>
                  
                  {/* Suggestions */}
                  <div className="grid grid-cols-1 gap-1.5 w-full max-w-[280px]">
                    {[
                      "When is Jumuiya fellowship & Mass?",
                      "Catholic prayer for exams & clarity",
                      "Novena prayer to St. Jude",
                      "Scripture for anxiety & inner peace"
                    ].map((hint) => (
                      <button
                        key={hint}
                        onClick={() => {
                          setInput(hint);
                        }}
                        className="px-3 py-2 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-[#002244] hover:text-white hover:border-[#002244] transition-all text-left shadow-xs flex items-center justify-between group cursor-pointer"
                      >
                        <span className="line-clamp-1">{hint}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  key={msg.id || idx} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}
                >
                  <div className={`flex gap-2 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-xs transition-all ${
                      msg.role === 'user' 
                        ? 'bg-[#002244] text-white dark:bg-blue-700 rounded-tr-xs font-medium' 
                        : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 rounded-tl-xs border-l-4 border-l-amber-500 font-sans'
                    }`}>
                      <div className="markdown-body prose prose-stone dark:prose-invert max-w-none text-xs sm:text-[13px] prose-p:my-1 prose-headings:my-1.5 prose-strong:text-[#002244] dark:prose-strong:text-sky-300 prose-strong:font-bold">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-stone-900 px-3.5 py-2 rounded-2xl rounded-tl-xs shadow-xs border border-stone-200 dark:border-stone-800 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Sanctuary Spirit reflecting...</span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask scripture, prayer, schedule..."}
                    className="w-full px-3.5 py-2.5 pr-9 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl outline-none text-xs sm:text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-2 p-1.5 rounded-lg transition-all cursor-pointer ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'text-stone-400 hover:text-blue-600 dark:hover:text-stone-200'
                    }`}
                    title="Voice input"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-[#002244] hover:bg-[#003366] active:bg-[#001a33] text-white p-2.5 rounded-xl disabled:opacity-40 transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
                  title="Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
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
