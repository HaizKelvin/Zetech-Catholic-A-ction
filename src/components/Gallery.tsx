import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc,
  limit,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, OperationType } from '../types';
import { handleFirestoreError, compressImage } from '../utils';
import { 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Plus, 
  Trash2, 
  X, 
  Heart, 
  Play,
  Upload,
  Camera,
  Loader2,
  Sparkles,
  AlertCircle
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
  const [loadingItems, setLoadingItems] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<{ [id: string]: boolean }>({});
  
  const [form, setForm] = useState({ 
    url: '', 
    title: '', 
    description: '', 
    type: 'image' as 'image' | 'video' 
  });

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GalleryItem[];
      setItems(fetched);
      setLoadingItems(false);
    }, (error) => {
      console.warn("Firestore gallery query error:", error);
      handleFirestoreError(error, OperationType.LIST, 'gallery');
      setLoadingItems(false);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setUploadError(null);
    setUploadingFile(true);
    try {
      // Compress image for fast Firestore persistence and crisp display
      const compressedDataUrl = await compressImage(file, 1000, 1000, 0.75);
      setForm(prev => ({ ...prev, url: compressedDataUrl, type: 'image' }));
    } catch (err: any) {
      console.error("Compression error:", err);
      setUploadError('Failed to process image file. Please try another image.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.url.trim() || !form.title.trim()) {
      setUploadError('Please provide a photo or media URL and title.');
      return;
    }
    
    setSubmitting(true);
    setUploadError(null);
    const path = 'gallery';
    try {
      const authorName = profile?.displayName || 'ZUCA Member';
      const authorId = profile?.uid || 'anonymous';

      await addDoc(collection(db, path), {
        type: form.type,
        url: form.url.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        userId: authorId,
        userName: authorName,
        timestamp: serverTimestamp(),
        likes: 0
      });
      setShowAdd(false);
      setForm({ url: '', title: '', description: '', type: 'image' });
    } catch (error) {
      console.error("Error creating gallery item:", error);
      handleFirestoreError(error, OperationType.CREATE, path);
      setUploadError('Failed to publish photo. Please ensure you are logged in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this activity photo?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
    }
  };

  const handleLike = async (item: GalleryItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (likedMap[item.id]) return; // Already liked locally

    setLikedMap(prev => ({ ...prev, [item.id]: true }));
    try {
      const docRef = doc(db, 'gallery', item.id);
      await updateDoc(docRef, {
        likes: increment(1)
      });
    } catch (err) {
      console.warn("Could not record like in database:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 px-3 sm:px-6">
      {/* Header Banner */}
      <motion.header 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-10 md:py-16 px-6 md:px-14 rounded-[32px] md:rounded-[40px] overflow-hidden bg-gradient-to-br from-stone-900 via-blue-950 to-stone-900 text-white shadow-2xl border border-white/10 group mb-6 md:mb-10"
      >
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-600/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-12">
          <div className="space-y-3 md:space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/60 border border-blue-400/30 text-[10px] md:text-xs font-bold uppercase tracking-wider text-sky-300 shadow-md backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              ZUCA Community Gallery
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Activity & Event <br />
              <span className="text-sky-400 font-serif italic text-2xl sm:text-3xl md:text-4xl font-normal">Photo Gallery</span>
            </h1>
            
            <p className="text-stone-300 text-sm md:text-base leading-relaxed">
              Memories and highlights from Sunday Holy Mass, St. Jude Choir rehearsals, Wednesday Jumuiya meetings, and charity outreach.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setUploadError(null);
              setShowAdd(true);
            }}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3.5 rounded-2xl transition-all font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Photo</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Loading state */}
      {loadingItems && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
          <p className="text-sm font-medium">Loading community moments...</p>
        </div>
      )}

      {/* Empty State when no photos exist */}
      {!loadingItems && items.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-stone-900/40 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-12 text-center max-w-2xl mx-auto space-y-5 shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-inner">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">No Activity Photos Yet</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed max-w-md mx-auto">
              Be the first to share photos from Sunday Mass, choir practices, Wednesday Jumuiya in PG 6 Room, or campus community outreach!
            </p>
          </div>
          <button
            onClick={() => {
              setUploadError(null);
              setShowAdd(true);
            }}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload First Photo</span>
          </button>
        </motion.div>
      )}

      {/* Grid of Real Uploaded Photos */}
      {!loadingItems && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {items.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative bg-white dark:bg-stone-900/60 rounded-3xl overflow-hidden shadow-md border border-stone-200/80 dark:border-stone-800 p-3 transition-all duration-300 hover:shadow-xl hover:border-sky-500/30 flex flex-col"
            >
              <div 
                className="aspect-[4/3] relative overflow-hidden cursor-pointer rounded-2xl shadow-xs bg-stone-100 dark:bg-stone-950"
                onClick={() => setSelectedItem(item)}
              >
                {item.type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.title} 
                    className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-500" 
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-950 flex items-center justify-center">
                    <Play className="w-12 h-12 text-sky-400 relative z-10" />
                    <video src={item.url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-bold text-lg text-white leading-tight mb-1 line-clamp-1 drop-shadow-sm">{item.title}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity">View Details →</p>
                </div>

                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  {item.type === 'video' && (
                    <div className="bg-stone-900/70 backdrop-blur-md p-2 rounded-xl text-white border border-white/10">
                      <VideoIcon className="w-4 h-4" />
                    </div>
                  )}
                  {(profile?.role === 'admin' || profile?.uid === item.userId) && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-md p-2 rounded-xl transition-all shadow-sm"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="pt-3 px-2 pb-1 flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-xs uppercase border border-sky-200 dark:border-sky-800 shrink-0">
                    {item.userName ? item.userName[0] : 'Z'}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{item.userName || 'ZUCA Member'}</span>
                    <span className="text-[10px] text-stone-400">{item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Community'}</span>
                  </div>
                </div>

                <button 
                  onClick={(e) => handleLike(item, e)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  title="Like photo"
                >
                  <Heart className={`w-4 h-4 ${likedMap[item.id] ? 'text-rose-500 fill-rose-500' : 'text-stone-400 hover:text-rose-500'} transition-colors`} />
                  <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">{(item.likes || 0) + (likedMap[item.id] && !item.likes ? 1 : 0)}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal for full detail view */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-stone-950/90 backdrop-blur-md">
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-5 right-5 p-2.5 bg-white/10 hover:bg-red-600 text-white rounded-full transition-all z-[110]"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-5xl w-full max-h-[90vh] bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-stone-200 dark:border-stone-800"
            >
              <div className="flex-1 bg-stone-950 flex items-center justify-center min-h-[300px] md:min-h-[450px] overflow-hidden">
                {selectedItem.type === 'image' ? (
                  <img src={selectedItem.url} alt={selectedItem.title} className="max-w-full max-h-[75vh] object-contain" />
                ) : (
                  <video src={selectedItem.url} controls className="w-full h-full max-h-[75vh]" autoPlay />
                )}
              </div>

              <div className="w-full md:w-80 lg:w-96 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-stone-200 dark:border-stone-800 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold text-sm uppercase">
                      {selectedItem.userName ? selectedItem.userName[0] : 'Z'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-stone-900 dark:text-stone-100">{selectedItem.userName}</p>
                      <p className="text-xs text-stone-400">
                        {selectedItem.timestamp?.toDate ? selectedItem.timestamp.toDate().toLocaleDateString() : 'Recent Moment'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
                      {selectedItem.title}
                    </h2>
                    {selectedItem.description && (
                      <p className="text-sm text-stone-600 dark:text-stone-300 mt-2 leading-relaxed whitespace-pre-wrap">
                        {selectedItem.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <button 
                    onClick={() => handleLike(selectedItem)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider hover:bg-rose-100 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${likedMap[selectedItem.id] ? 'fill-rose-600' : ''}`} />
                    <span>Witness / Like ({selectedItem.likes || 0})</span>
                  </button>

                  {(profile?.role === 'admin' || profile?.uid === selectedItem.userId) && (
                    <button 
                      onClick={() => handleDelete(selectedItem.id)}
                      className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal for adding/uploading photo */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-stone-900 p-6 md:p-8 rounded-3xl w-full max-w-lg shadow-2xl text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-800 relative my-8"
            >
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg md:text-xl font-bold">Add Community Photo</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePost} className="space-y-4">
                {/* Upload or Link selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Photo / Media Source</label>
                  
                  <div className="flex flex-col gap-3">
                    {/* Direct File Upload button */}
                    <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-4 cursor-pointer transition-colors ${
                      form.url 
                        ? 'border-sky-500/40 bg-sky-50/50 dark:bg-sky-950/20' 
                        : 'border-stone-300 dark:border-stone-700 hover:border-sky-500 bg-stone-50/50 dark:bg-stone-800/50'
                    }`}>
                      {uploadingFile ? (
                        <div className="flex flex-col items-center gap-2 py-4 text-sky-600">
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span className="text-xs font-semibold">Processing photo...</span>
                        </div>
                      ) : form.url && form.type === 'image' ? (
                        <div className="flex items-center gap-3 w-full">
                          <img src={form.url} alt="Preview" className="w-14 h-14 object-cover rounded-xl shadow-xs border border-sky-400" />
                          <div className="flex-1 overflow-hidden">
                            <span className="text-xs font-bold text-sky-700 dark:text-sky-300 block truncate">Image ready</span>
                            <span className="text-[10px] text-stone-400">Click to choose another photo</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-stone-500 dark:text-stone-400 py-2">
                          <Upload className="w-6 h-6 text-sky-600" />
                          <span className="text-xs font-bold text-stone-700 dark:text-stone-200">Click to select photo from device</span>
                          <span className="text-[10px] text-stone-400">Supports JPG, PNG, WEBP</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/jpg,image/webp" 
                        className="hidden" 
                        disabled={uploadingFile}
                        onChange={handleFileUpload} 
                      />
                    </label>

                    {/* Or URL input */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-stone-400">Or paste media link:</span>
                    </div>
                    <input 
                      value={form.url.startsWith('data:') ? '' : form.url} 
                      onChange={e => setForm({...form, url: e.target.value})} 
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" 
                      placeholder="https://..." 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">Title</label>
                  <input 
                    required 
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none" 
                    placeholder="e.g. Sunday Holy Mass, Choir Rehearsal, Jumuiya PG 6" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-1">Description (Optional)</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none h-20 resize-none" 
                    placeholder="Add details about the gathering or activity..." 
                  />
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAdd(false)} 
                    className="flex-1 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting || uploadingFile || !form.url.trim()} 
                    className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>{submitting ? 'Publishing...' : 'Publish Photo'}</span>
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

