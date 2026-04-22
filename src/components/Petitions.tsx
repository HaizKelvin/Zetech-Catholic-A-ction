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
  where
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
    const q = query(collection(db, 'petitions'), orderBy('timestamp', 'desc'));
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
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="glass rounded-[40px] p-8 md:p-12 shadow-xl italic">
        <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-4 ">Submit a Prayer Request</h2>
        <p className="text-stone-500 dark:text-stone-400 mb-8">"For where two or three are gathered in my name, there am I among them." — Matthew 18:20</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What should we pray for?"
            className="w-full p-6 h-40 text-lg resize-none"
            required
          />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-6 p-2 bg-white/30 dark:bg-stone-900/30 rounded-2xl">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isPublic ? 'bg-white dark:bg-stone-800 shadow-sm text-brand-600' : 'text-stone-400'}`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-bold">Public</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${!isPublic ? 'bg-white dark:bg-stone-800 shadow-sm text-brand-600' : 'text-stone-400'}`}
              >
                <Lock className="w-4 h-4" />
                <span className="text-sm font-bold">Private (Admin only)</span>
              </button>
            </div>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="bg-brand-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Submit Request
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2 text-stone-900 dark:text-stone-100">
           <MessageSquare className="w-5 h-5 text-brand-600" />
           Prayer Wall
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {petitions.map((p) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={p.id}
                className="glass p-8 rounded-[32px] relative group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm">{p.isPublic ? p.userName : 'Private Request'}</h4>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                        {p.timestamp?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {(auth.currentUser?.uid === p.userId || auth.currentUser?.email === 'wachirakevin65@gmail.com') && (
                    <button onClick={() => handleDelete(p.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed font-serif italic">
                  "{p.text}"
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
