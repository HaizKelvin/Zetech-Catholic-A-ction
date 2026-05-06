import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Plus, 
  Trash2, 
  X, 
  Maximize2,
  Heart,
  MessageCircle,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: any;
  likes?: number;
}

export default function Gallery({ profile }: { profile: UserProfile | null }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    url: '', 
    title: '', 
    description: '', 
    type: 'image' as 'image' | 'video' 
  });

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(24));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryItem[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery');
    });
    return () => unsubscribe();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.url) return;
    setLoading(true);
    const path = 'gallery';
    try {
      await addDoc(collection(db, path), {
        ...form,
        userId: profile.uid,
        userName: profile.displayName,
        timestamp: serverTimestamp(),
        likes: 0
      });
      setShowAdd(false);
      setForm({ url: '', title: '', description: '', type: 'image' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this post?')) return;
    const path = `gallery/${id}`;
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 lg:space-y-32 pb-32">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-12 md:py-48 px-6 md:px-32 rounded-[40px] md:rounded-[120px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-8 md:mb-20"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-30 transition-transform duration-[15s] group-hover:scale-100"
            alt="Gallery"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-12 md:gap-20">
          <div className="space-y-6 md:space-y-10 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 md:px-8 md:py-3 rounded-full glass-dark border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-brand-300 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-400 animate-pulse shadow-[0_0_12px_rgba(92,133,255,1)]" />
              Living Testimony
            </motion.div>
            
            <h1 className="text-4xl md:text-[9rem] font-black tracking-[-0.05em] leading-tight md:leading-[0.8] text-white serif-display italic">
              Activity <br />
              <span className="text-brand-400 not-italic uppercase font-black text-xl md:text-5xl tracking-[0.4em] block mt-2 md:mt-4">Gallery</span>
            </h1>
            
            <p className="text-stone-400 text-base md:text-3xl font-light max-w-2xl leading-relaxed italic serif-display opacity-80">
              Reliving our moments of worship, fellowship, and divine connection.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAdd(true)}
            className="w-full md:w-auto flex items-center justify-center gap-4 bg-brand-600 text-white px-8 py-5 md:px-10 md:py-6 rounded-[24px] md:rounded-[32px] hover:bg-brand-500 transition-all font-black uppercase tracking-[0.3em] shadow-3xl shadow-brand-600/40 text-[9px] md:text-[10px]"
          >
            <Plus className="w-5 h-5" />
            Share Moment
          </motion.button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-16 px-4">
        {items.map((item) => (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white dark:bg-stone-900/10 rounded-[50px] overflow-hidden shadow-2xl border border-stone-100 dark:border-white/5 p-4 transition-all duration-700 hover:border-brand-500/20"
          >
            <div 
              className="aspect-[4/3] relative overflow-hidden cursor-pointer rounded-[40px] shadow-sm"
              onClick={() => setSelectedItem(item)}
            >
              {item.type === 'image' ? (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[1.5s]" />
              ) : (
                <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                  <Play className="w-16 h-16 text-brand-500 relative z-10" />
                  <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-8 left-8 right-8 text-white translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="font-black text-2xl tracking-tighter serif-display italic leading-none mb-2">{item.title}</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity">View Moment →</p>
              </div>
              <div className="absolute top-6 right-6 flex gap-2">
                {item.type === 'video' && <div className="bg-brand-600/20 backdrop-blur-md p-3 rounded-2xl text-white border border-white/10"><VideoIcon className="w-5 h-5" /></div>}
                {(profile?.role === 'admin' || profile?.uid === item.userId) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="bg-red-500/10 backdrop-blur-md p-3 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6 md:p-8 flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center border border-brand-500/20">
                  <span className="text-[10px] md:text-xs font-black text-brand-600 dark:text-brand-400 uppercase">{item.userName[0]}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] md:text-[10px] font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest">{item.userName}</span>
                  <span className="text-[7px] md:text-[8px] font-bold text-stone-400 uppercase tracking-widest">Sanctuary Citizen</span>
                </div>
              </div>
              <div className="flex items-center gap-4 md:gap-6">
                <button className="flex flex-col items-center group/like">
                  <Heart className="w-5 h-5 md:w-6 md:h-6 text-stone-300 dark:text-stone-700 group-hover/like:text-rose-500 group-hover/like:scale-110 transition-all transition-colors" />
                  <span className="text-[7px] md:text-[8px] font-black mt-1 text-stone-400">{item.likes || 0}</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal for detail view */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-stone-950/95 backdrop-blur-2xl">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-8 right-8 p-3 bg-white/10 text-white rounded-full hover:bg-red-500 transition-all z-[110]"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-6xl w-full h-full flex flex-col md:flex-row relative z-10"
            >
              <div className="flex-1 bg-black flex items-center justify-center rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden h-[50vh] md:h-auto">
                {selectedItem.type === 'image' ? (
                  <img src={selectedItem.url} alt="" className="max-w-full max-h-full object-contain" />
                ) : (
                  <video src={selectedItem.url} controls className="w-full h-full" autoPlay />
                )}
              </div>
              <div className="w-full md:w-96 bg-white dark:bg-stone-900 border-l border-stone-100 dark:border-stone-800 flex flex-col h-full">
                {/* Header Information */}
                <div className="p-8 border-b border-stone-100 dark:border-stone-800">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-brand-900 text-white flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-brand-500/10">
                       {selectedItem.userName[0]}
                     </div>
                     <div>
                       <p className="font-black text-stone-900 dark:text-stone-100 uppercase tracking-widest text-xs">{selectedItem.userName}</p>
                       <p className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em]">{selectedItem.timestamp?.toDate()?.toLocaleDateString()}</p>
                     </div>
                   </div>
                   <h2 className="text-3xl font-bold tracking-tighter text-stone-900 dark:text-stone-100 leading-tight">
                     {selectedItem.title}
                   </h2>
                </div>

                {/* Description - Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-stone-50/30 dark:bg-black/20">
                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-600">Activity Reflection</h4>
                     <p className="text-stone-600 dark:text-stone-400 text-base leading-relaxed font-medium italic serif-display">
                       {selectedItem.description || "The community shared this beautiful moment of fellowship and worship."}
                     </p>
                   </div>
                   
                   <div className="pt-8 border-t border-stone-200/50 dark:border-white/5 space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Sanctuary Impact</p>
                     <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-white dark:bg-stone-800 rounded-full text-[9px] font-black tracking-widest text-stone-500 border border-stone-100 dark:border-stone-700">#COMMUNITY</span>
                        <span className="px-3 py-1 bg-white dark:bg-stone-800 rounded-full text-[9px] font-black tracking-widest text-stone-500 border border-stone-100 dark:border-stone-700">#WORSHIP</span>
                        <span className="px-3 py-1 bg-white dark:bg-stone-800 rounded-full text-[9px] font-black tracking-widest text-stone-500 border border-stone-100 dark:border-stone-700">#ZUCA</span>
                     </div>
                   </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800">
                  <button className="w-full bg-brand-900 text-white py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 hover:bg-brand-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-brand-900/40 group">
                    <Heart className="w-6 h-6 group-hover:scale-125 transition-transform" />
                    <span>Witness Love</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for adding content */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-stone-950/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-10 w-full max-w-xl shadow-3xl text-stone-900 dark:text-stone-100 relative overflow-hidden"
            >
              <div className="absolute inset-0 sparkle-bg opacity-10 pointer-events-none" />
              <h3 className="text-4xl font-black mb-10 tracking-tight text-center">Share Experience</h3>
              <form onSubmit={handlePost} className="space-y-8 relative z-10">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3 block">Content Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, type: 'image'})}
                      className={`flex items-center justify-center gap-3 py-4 rounded-[22px] font-bold border transition-all duration-500 shadow-sm ${form.type === 'image' ? 'bg-brand-600 text-white border-brand-600 shadow-brand-500/20' : 'bg-transparent border-stone-200 dark:border-stone-800'}`}
                    >
                      <ImageIcon className="w-5 h-5" />
                      Image
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, type: 'video'})}
                      className={`flex items-center justify-center gap-3 py-4 rounded-[22px] font-bold border transition-all duration-500 shadow-sm ${form.type === 'video' ? 'bg-brand-600 text-white border-brand-600 shadow-brand-500/20' : 'bg-transparent border-stone-200 dark:border-stone-800'}`}
                    >
                      <VideoIcon className="w-5 h-5" />
                      Video
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3 block">Title</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-6 py-5 rounded-[22px] bg-white/50 backdrop-blur-xl border-brand-500/10 focus:border-brand-500/30 transition-all shadow-inner text-sm" placeholder="e.g. Choir Rehearsal" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3 block">Media URL</label>
                  <input required value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="w-full px-6 py-5 rounded-[22px] bg-white/50 backdrop-blur-xl border-brand-500/10 focus:border-brand-500/30 transition-all shadow-inner text-xs font-mono" placeholder="Paste image/video link here..." />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 mb-3 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-6 py-5 rounded-[22px] bg-white/50 backdrop-blur-xl border-brand-500/10 focus:border-brand-500/30 transition-all shadow-inner h-32 resize-none text-sm" placeholder="Add a caption..." />
                </div>
                <div className="flex gap-6 pt-4">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-5 font-black uppercase tracking-[0.2em] text-[10px] border border-stone-200 dark:border-white/5 rounded-[22px] hover:bg-stone-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 btn-adorable py-5 shadow-2xl">
                    {loading ? 'Posting...' : 'Share Now'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
