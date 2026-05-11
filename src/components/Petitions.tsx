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
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 text-stone-900 dark:text-stone-100">
      {/* Immersive Header - Standardized across all pages */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-8 md:py-24 px-6 md:px-12 rounded-[24px] md:rounded-[48px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-6 md:mb-12 mx-2 md:mx-0"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1544256718-3bcf237f3974?q=80&w=2671&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20 transform group-hover:scale-110 transition-transform duration-[3s]" 
            alt="Sacred Altar"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 md:gap-8 max-w-full">
          <div className="space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark border border-white/10 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-300 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)]" />
              Sacred Altar
            </motion.div>
            
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight text-white serif-display">
              Prayer <br />
              <span className="serif-display italic font-light text-rose-400 lowercase">Petitions</span>
            </h1>
            
            <p className="text-stone-400 text-sm md:text-xl font-light max-w-xl leading-relaxed italic serif-display opacity-80">
              "The prayer of the humble pierces the clouds." Entrust your intentions to the sanctuary.
            </p>
          </div>
        </div>
      </motion.header>

      <div className="px-4 md:px-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="glass rounded-[32px] md:rounded-[48px] p-6 md:p-16 lg:p-24 relative group overflow-hidden border border-brand-500/20 shadow-3xl shadow-brand-900/10"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />

        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 blur-[150px] rounded-full animate-pulse" />
          <div className="relative z-10 space-y-8 md:space-y-16">
            <div className="text-center md:text-left space-y-4 md:space-y-6">
              <h2 className="text-2xl md:text-5xl font-black tracking-tight text-stone-900 dark:text-white uppercase">Submit <span className="text-brand-600 dark:text-brand-400">Intentions</span></h2>
              <p className="text-stone-500 text-sm md:text-lg font-serif italic max-w-2xl">Your whispers in the sanctuary are heard in high places.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
            <div className="relative group/input">
              <div className="absolute inset-x-0 -bottom-1 h-[2px] bg-brand-500/0 group-focus-within/input:bg-brand-500/40 transition-all duration-700" />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Entrust your deepest petitions to the sanctuary..."
                className="w-full bg-white/40 dark:bg-white/5 rounded-3xl md:rounded-[40px] p-6 md:p-12 min-h-[180px] md:min-h-[250px] text-base md:text-2xl font-serif italic resize-none border border-white/20 outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-stone-300 dark:placeholder:text-stone-700 transition-all shadow-inner"
                required
              />
              <Heart className="absolute bottom-6 right-6 md:bottom-10 md:right-10 w-10 h-10 md:w-16 md:h-16 text-brand-900/5 group-focus-within/input:text-brand-500/10 transition-all duration-700 animate-pulse-gentle" />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-10">
              <div className="flex flex-col sm:flex-row items-center gap-3 p-2 md:p-3 glass rounded-[28px] md:rounded-[32px] shadow-2xl border border-white/20 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`w-full sm:w-auto flex items-center justify-center gap-4 px-6 md:px-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] transition-all font-black text-[9px] md:text-[11px] uppercase tracking-[0.3em] ${isPublic ? 'bg-brand-900 text-white shadow-3xl shadow-brand-900/40 scale-105' : 'text-stone-500 dark:text-stone-400 hover:text-brand-600'}`}
                >
                  <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Divine Publication
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`w-full sm:w-auto flex items-center justify-center gap-4 px-6 md:px-8 py-4 md:py-5 rounded-[20px] md:rounded-[24px] transition-all font-black text-[9px] md:text-[11px] uppercase tracking-[0.3em] ${!isPublic ? 'bg-brand-900 text-white shadow-3xl shadow-brand-900/40 scale-105' : 'text-stone-500 dark:text-stone-400 hover:text-brand-600'}`}
                >
                  <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Sacred Silence
                </button>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading || !text.trim()}
                className="w-full md:w-auto bg-brand-900 text-white px-10 md:px-16 py-5 md:py-7 rounded-[28px] md:rounded-[32px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 md:gap-5 hover:bg-brand-800 transition-all shadow-3xl shadow-brand-900/40 disabled:opacity-50 text-[10px] md:text-[11px] active:scale-95 group/btn"
              >
                {loading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Send className="w-5 h-5 md:w-6 md:h-6 group-hover/btn:translate-x-2 transition-transform" />}
                Deposit Petition
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>

      <div className="space-y-12 md:space-y-16 px-2 md:px-0">
        <div className="flex items-center gap-6 md:gap-10">
           <div className="h-[1px] md:h-[2px] flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
           <h3 className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] text-stone-500 dark:text-stone-600 shrink-0 italic serif-display">The Eternal Litany</h3>
           <div className="h-[1px] md:h-[2px] flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          <AnimatePresence mode="popLayout">
            {petitions.map((p, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true }}
                transition={{ delay: idx % 2 * 0.1, duration: 0.8 }}
                key={p.id}
                className="glass rounded-[32px] md:rounded-[48px] p-8 md:p-12 lg:p-16 group relative border-white/20 shadow-xl hover:shadow-3xl hover:shadow-brand-900/10 transition-all duration-700 bg-white/20 dark:bg-black/10 backdrop-blur-2xl"
              >
                <div className="absolute inset-0 divine-pattern opacity-[0.02] pointer-events-none" />
                <div className="flex justify-between items-start mb-8 md:mb-10">
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-10 h-10 md:w-14 md:h-14 bg-brand-900/10 rounded-[12px] md:rounded-[20px] flex items-center justify-center shadow-inner group-hover:bg-brand-900 group-hover:scale-110 transition-all duration-700">
                      <Heart className="w-5 h-5 md:w-7 md:h-7 text-brand-900 group-hover:text-white group-hover:animate-pulse" />
                    </div>
                    <div className="space-y-0.5 md:space-y-1">
                      <h4 className="font-bold text-stone-900 dark:text-white italic serif-display text-xl md:text-2xl tracking-tighter truncate max-w-[150px] md:max-w-full">
                        {p.isPublic ? p.userName : 'Silent Guardian'}
                      </h4>
                      <p className="text-[8px] md:text-[10px] text-brand-600/60 dark:text-brand-500/60 font-black uppercase tracking-[0.2em]">
                        {p.timestamp?.toDate()?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) || 'Recent'}
                      </p>
                    </div>
                  </div>
                  {(auth.currentUser?.uid === p.userId || auth.currentUser?.email === 'wachirakevin65@gmail.com') && (
                    <motion.button 
                      whileHover={{ scale: 1.2, rotate: 12 }}
                      onClick={() => handleDelete(p.id)} 
                      className="p-3 md:p-4 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all rounded-[16px] md:rounded-[20px] border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                    </motion.button>
                  )}
                </div>
                <div className="relative pt-4 md:pt-6">
                  <div className="absolute top-0 left-0 w-8 md:w-12 h-0.5 bg-brand-500/30 group-hover:w-full transition-all duration-1000" />
                  <p className="text-stone-900 dark:text-stone-100 text-xl md:text-3xl leading-relaxed font-serif italic group-hover:tracking-tight transition-all duration-700">
                    "{p.text}"
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
