import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  doc,
  where,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { PrayerPetition, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { Heart, Send, Trash2, Globe, Lock, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Petitions() {
  const [petitions, setPetitions] = useState<PrayerPetition[]>([]);
  const [text, setText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'petitions'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PrayerPetition[];
      setPetitions(p);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'petitions');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'petitions'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        text: text.trim(),
        isPublic,
        timestamp: serverTimestamp()
      });

      if (isPublic) {
        // Broad notification for community
        await addDoc(collection(db, 'notifications'), {
          userId: 'all',
          title: 'A Heart’s Whisper',
          message: `${auth.currentUser.displayName || 'A member'} shared a prayer petition. Join in intercession.`,
          type: 'announcement',
          isRead: false,
          timestamp: serverTimestamp()
        });
      }

      setText('');
      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'petitions');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this petition?')) return;
    try {
      await deleteDoc(doc(db, 'petitions', id));
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `petitions/${id}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 text-stone-900 dark:text-stone-100 px-2 sm:px-6">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-8 md:py-20 px-6 md:px-14 rounded-[32px] md:rounded-[48px] overflow-hidden bg-stone-950 text-white shadow-2xl border border-white/10 group mb-6 md:mb-10"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1600&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-25 scale-105 group-hover:scale-100 transition-transform duration-[10s]" 
            alt="Candlelight and Holy Cross"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-stone-950/85 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col gap-4 max-w-2xl text-left">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-950/80 border border-rose-400/30 text-[10px] md:text-xs font-bold uppercase tracking-wider text-rose-300 shadow-md backdrop-blur-md"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            Prayer & Intercession
          </motion.div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-sans leading-tight">
            Prayer Requests & <br />
            <span className="text-rose-400 font-serif italic text-2xl sm:text-4xl md:text-5xl font-normal">Petitions</span>
          </h1>
          
          <p className="text-stone-300 text-sm md:text-base leading-relaxed">
            "Ask, and it will be given to you; seek, and you will find; knock, and it will be opened to you." Share your intentions so our community can pray for you during Mass and Rosary.
          </p>
        </div>
      </motion.header>

      <div className="px-2 md:px-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-stone-900/60 rounded-[32px] md:rounded-[40px] p-6 md:p-12 relative group overflow-hidden border border-stone-200/80 dark:border-white/5 shadow-xl"
        >
          <div className="relative z-10 space-y-6 md:space-y-8">
            <div className="text-left space-y-2">
              <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">Submit Your Prayer Request</h2>
              <p className="text-stone-600 dark:text-stone-300 text-sm">You can submit your petition publicly for community prayers or keep it private for the chaplaincy team.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your prayer request here (e.g., healing for a loved one, peace during upcoming exams, thanksgiving for blessings)..."
                  rows={4}
                  className="w-full bg-stone-50 dark:bg-stone-800/60 border border-stone-300 dark:border-stone-700 focus:border-blue-500 dark:focus:border-sky-400 rounded-2xl p-4 md:p-5 text-stone-900 dark:text-white text-sm md:text-base placeholder-stone-400 focus:outline-none transition-all shadow-inner resize-none"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isPublic 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Public Community Prayer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !isPublic 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    <span>Private to Chaplain</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !text.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Prayer Request</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <div className="space-y-8 md:space-y-10 px-2 md:px-0 text-left">
        <div className="flex items-center gap-4">
           <div className="h-[1px] flex-1 bg-stone-200 dark:bg-stone-800" />
           <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Community Prayer Intentions</h3>
           <div className="h-[1px] flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {petitions.map((p, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 4) * 0.05 }}
                key={p.id}
                className="bg-white dark:bg-stone-900/60 rounded-3xl p-6 md:p-8 border border-stone-200/80 dark:border-white/5 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900 dark:text-white text-base">
                          {p.isPublic ? p.userName : 'Anonymous Student'}
                        </h4>
                        <p className="text-[11px] text-stone-400 font-medium">
                          {p.timestamp?.toDate()?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) || 'Recent'}
                        </p>
                      </div>
                    </div>
                    {(auth.currentUser?.uid === p.userId || auth.currentUser?.email === 'wachirakevin65@gmail.com') && (
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all rounded-xl cursor-pointer"
                        title="Delete petition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-stone-700 dark:text-stone-200 text-sm md:text-base leading-relaxed italic">
                    "{p.text}"
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
