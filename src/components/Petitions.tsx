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
    <div className="max-w-5xl mx-auto space-y-24 pb-32">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        className="glass rounded-[56px] p-12 md:p-24 relative group overflow-hidden border border-brand-500/20 shadow-3xl shadow-brand-900/10"
      >
        <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="relative z-10 space-y-16">
          <div className="text-center md:text-left space-y-6">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-none italic serif-display">Sacred <span className="text-brand-600 dark:text-brand-500 not-italic uppercase font-black text-2xl md:text-3xl tracking-[0.3em] block mt-4">Altar</span></h2>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="h-[2px] w-12 bg-brand-500/40" />
              <p className="text-stone-600 dark:text-stone-400 font-serif italic text-xl opacity-80">"The prayer of the humble pierces the clouds."</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="relative group/input">
              <div className="absolute inset-x-0 -bottom-1 h-[2px] bg-brand-500/0 group-focus-within/input:bg-brand-500/40 transition-all duration-700" />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Entrust your deepest petitions to the sanctuary..."
                className="w-full bg-white/40 dark:bg-white/5 rounded-[40px] p-12 md:p-16 min-h-[300px] text-2xl md:text-3xl font-serif italic resize-none border border-white/20 outline-none focus:ring-4 focus:ring-brand-500/10 placeholder:text-stone-300 dark:placeholder:text-stone-700 transition-all shadow-inner"
                required
              />
              <Heart className="absolute bottom-12 right-12 w-20 h-20 text-brand-900/5 group-focus-within/input:text-brand-500/10 transition-all duration-700 animate-pulse-gentle" />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-3 p-3 glass rounded-[32px] shadow-2xl border border-white/20">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-4 px-8 py-5 rounded-[24px] transition-all font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] ${isPublic ? 'bg-brand-900 text-white shadow-3xl shadow-brand-900/40 scale-105' : 'text-stone-500 dark:text-stone-400 hover:text-brand-600'}`}
                >
                  <Globe className="w-4 h-4" />
                  Divine Publication
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-4 px-8 py-5 rounded-[24px] transition-all font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] ${!isPublic ? 'bg-brand-900 text-white shadow-3xl shadow-brand-900/40 scale-105' : 'text-stone-500 dark:text-stone-400 hover:text-brand-600'}`}
                >
                  <Lock className="w-4 h-4" />
                  Sacred Silence
                </button>
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={loading || !text.trim()}
                className="w-full md:w-auto bg-brand-900 text-white px-16 py-7 rounded-[32px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-5 hover:bg-brand-800 transition-all shadow-3xl shadow-brand-900/40 disabled:opacity-50 text-[11px] active:scale-95 group/btn"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />}
                Deposit Petition
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>

      <div className="space-y-16">
        <div className="flex items-center gap-10">
           <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
           <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-stone-500 dark:text-stone-600 shrink-0 italic serif-display">The Eternal Litany</h3>
           <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          <AnimatePresence mode="popLayout">
            {petitions.map((p, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true }}
                transition={{ delay: idx % 2 * 0.1, duration: 0.8 }}
                key={p.id}
                className="glass rounded-[48px] p-12 lg:p-16 group relative border-white/20 shadow-xl hover:shadow-3xl hover:shadow-brand-900/10 transition-all duration-700 bg-white/20 dark:bg-black/10 backdrop-blur-2xl"
              >
                <div className="absolute inset-0 divine-pattern opacity-[0.02] pointer-events-none" />
                <div className="flex justify-between items-start mb-10">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-brand-900/10 rounded-[20px] flex items-center justify-center shadow-inner group-hover:bg-brand-900 group-hover:scale-110 transition-all duration-700">
                      <Heart className="w-7 h-7 text-brand-900 group-hover:text-white group-hover:animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-stone-900 dark:text-white italic serif-display text-2xl tracking-tighter truncate max-w-[200px] md:max-w-full">
                        {p.isPublic ? p.userName : 'Silent Guardian'}
                      </h4>
                      <p className="text-[10px] text-brand-600/60 dark:text-brand-500/60 font-black uppercase tracking-[0.2em]">
                        Offering of Grace: {p.timestamp?.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {(auth.currentUser?.uid === p.userId || auth.currentUser?.email === 'wachirakevin65@gmail.com') && (
                    <motion.button 
                      whileHover={{ scale: 1.2, rotate: 12 }}
                      onClick={() => handleDelete(p.id)} 
                      className="p-4 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all rounded-[20px] border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>
                <div className="relative pt-6">
                  <div className="absolute top-0 left-0 w-12 h-0.5 bg-brand-500/30 group-hover:w-full transition-all duration-1000" />
                  <p className="text-stone-900 dark:text-stone-100 text-2xl lg:text-3xl leading-relaxed font-serif italic group-hover:tracking-tight transition-all duration-700">
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
