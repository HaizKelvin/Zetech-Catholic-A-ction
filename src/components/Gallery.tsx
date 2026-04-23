import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile } from '../types';
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
    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryItem[]);
    }, (error) => {
      console.error("Gallery snapshot error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.url) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'gallery'), {
        ...form,
        userId: profile.uid,
        userName: profile.displayName,
        timestamp: serverTimestamp(),
        likes: 0
      });
      setShowAdd(false);
      setForm({ url: '', title: '', description: '', type: 'image' });
    } catch (error) {
      console.error("Error posting to gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter">Activity <span className="serif-display text-brand-600 dark:text-brand-400">Gallery</span>.</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-2">Relive our moments of worship and fellowship.</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-brand-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/20"
        >
          <Plus className="w-5 h-5" />
          Share Moment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {items.map((item) => (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-white dark:bg-stone-900 rounded-[32px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-stone-100 dark:border-stone-800"
          >
            <div 
              className="aspect-[4/3] relative overflow-hidden cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              {item.type === 'image' ? (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                  <Play className="w-12 h-12 text-brand-600" />
                  {/* For videos we'd usually use a preview image or video tag, using placeholder text for now or simple video tag if it's a direct url */}
                  <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-6 left-6 right-6 text-white translate-y-4 group-hover:translate-y-0 transition-transform">
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-xs opacity-80 line-clamp-1">{item.description}</p>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                {item.type === 'video' && <div className="bg-brand-600 p-2 rounded-xl text-white shadow-lg"><VideoIcon className="w-4 h-4" /></div>}
                {(profile?.role === 'admin' || profile?.uid === item.userId) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-white hover:bg-red-500 transition-colors shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center border border-stone-100 dark:border-stone-800">
                  <span className="text-[10px] font-black">{item.userName[0]}</span>
                </div>
                <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">{item.userName}</span>
              </div>
              <div className="flex items-center gap-4 text-stone-400">
                <button className="flex items-center gap-1 hover:text-brand-600 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="text-[10px] font-bold">{item.likes || 0}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-brand-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
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
              className="glass p-10 w-full max-w-xl shadow-2xl rounded-[40px] text-stone-900 dark:text-stone-100"
            >
              <h3 className="text-3xl font-bold mb-8 tracking-tight">Share Experience</h3>
              <form onSubmit={handlePost} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Content Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, type: 'image'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold border transition-all ${form.type === 'image' ? 'bg-brand-900 text-white border-brand-900' : 'bg-transparent border-stone-200 dark:border-stone-800'}`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setForm({...form, type: 'video'})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-2xl font-bold border transition-all ${form.type === 'video' ? 'bg-brand-900 text-white border-brand-900' : 'bg-transparent border-stone-200 dark:border-stone-800'}`}
                    >
                      <VideoIcon className="w-4 h-4" />
                      Video
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Title</label>
                  <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl" placeholder="e.g. Choir Rehearsal" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Media URL</label>
                  <input required value={form.url} onChange={e => setForm({...form, url: e.target.value})} className="w-full px-6 py-4 rounded-2xl font-mono text-xs" placeholder="Paste image/video link here..." />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-6 py-4 rounded-2xl h-24 resize-none" placeholder="Add a caption..." />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 font-bold border border-stone-100 dark:border-stone-800 rounded-2xl opacity-60 hover:opacity-100 transition-opacity">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-4 bg-brand-900 text-white rounded-2xl font-bold shadow-xl shadow-brand-900/20 disabled:opacity-50">
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
