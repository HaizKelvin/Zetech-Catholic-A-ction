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
    <div className="max-w-5xl mx-auto space-y-20 pb-24">
      <div className="glass-card p-10 md:p-20 relative group overflow-hidden border border-brand-500/10">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/[0.03] to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-12">
          <div className="text-center md:text-left space-y-4">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none italic serif-display">Prayer <span className="text-brand-900 dark:text-brand-400 not-italic uppercase font-black text-xl md:text-2xl tracking-[0.2em] block mt-2">Altar</span></h2>
            <p className="text-stone-500 dark:text-stone-400 font-serif italic text-lg opacity-80">"For where two or three are gathered in my name, there am I among them."</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Entrust your petition to the community..."
                className="w-full glass-card bg-stone-50/50 dark:bg-black/20 p-10 md:p-14 min-h-[250px] text-xl md:text-2xl font-serif italic resize-none border-none outline-none focus:ring-2 focus:ring-brand-500/20"
                required
              />
              <Heart className="absolute bottom-8 right-8 w-16 h-16 text-brand-900/5 group-focus-within:text-brand-500/10 transition-colors" />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-2 p-2 bg-stone-100 dark:bg-white/5 rounded-[22px] shadow-inner">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest ${isPublic ? 'bg-white dark:bg-stone-800 shadow-md text-brand-900' : 'text-stone-400'}`}
                >
                  <Globe className="w-4 h-4" />
                  Eternal Sanctuary
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest ${!isPublic ? 'bg-white dark:bg-stone-800 shadow-md text-brand-900' : 'text-stone-400'}`}
                >
                  <Lock className="w-4 h-4" />
                  Private Communion
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="w-full md:w-auto bg-brand-900 text-white px-12 py-5 rounded-[28px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-brand-800 transition-all shadow-[0_20px_50px_rgba(30,58,138,0.3)] disabled:opacity-50 text-[10px]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Deposit Petition
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-12">
        <div className="flex items-center gap-8">
           <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-stone-400 shrink-0">The Infinite Litany</h3>
           <div className="h-px flex-1 bg-stone-200 dark:bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <AnimatePresence mode="popLayout">
            {petitions.map((p, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx % 2 * 0.1 }}
                key={p.id}
                className="glass-card p-10 md:p-14 group relative border-white/5"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-900/10 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-brand-900 transition-all duration-500">
                      <Heart className="w-6 h-6 text-brand-900 group-hover:text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 italic serif-display text-lg">{p.isPublic ? p.userName : 'Private Soul'}</h4>
                      <p className="text-[9px] text-stone-400 font-black uppercase tracking-[0.2em] mt-1">
                        Moment of Grace: {p.timestamp?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {(auth.currentUser?.uid === p.userId || auth.currentUser?.email === 'wachirakevin65@gmail.com') && (
                    <button 
                      onClick={() => handleDelete(p.id)} 
                      className="p-3 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute -left-6 top-0 bottom-0 w-px bg-brand-500/20" />
                  <p className="text-stone-600 dark:text-stone-300 text-lg md:text-xl leading-relaxed font-serif italic">
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
