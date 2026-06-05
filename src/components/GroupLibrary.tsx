import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Music, 
  Cross, 
  Upload, 
  Search, 
  FileText, 
  Download, 
  Trash2, 
  Bot, 
  X,
  Plus,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Info,
  Minimize2,
  Maximize2,
  ChevronDown,
  Filter,
  Library,
  GraduationCap,
  Youtube,
  Heart,
  Church,
  ScrollText,
  Flame,
  Globe,
  Feather,
  MapPin,
  Clock,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot, 
  getDocs,
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError } from '../utils';
import { OperationType } from '../types';

interface Material {
  id: string;
  title: string;
  description: string;
  category: 'Prayers' | 'Scriptures' | 'Liturgy' | 'Choir' | 'Formation' | 'Videos' | 'Other';
  link?: string;
  addedBy: string;
  timestamp: any;
  contentSnippet?: string;
  type?: 'text' | 'video' | 'audio';
}

interface GroupLibraryProps {
  user: any;
  isAdmin: boolean;
  onStudy: (title: string, content: string) => void;
}

const CATEGORIES = [
  { id: 'Prayers', icon: <Flame className="w-3.5 h-3.5" />, color: 'amber' },
  { id: 'Scriptures', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'blue' },
  { id: 'Liturgy', icon: <Church className="w-3.5 h-3.5" />, color: 'rose' },
  { id: 'Choir', icon: <Music className="w-3.5 h-3.5" />, color: 'indigo' },
  { id: 'Formation', icon: <ScrollText className="w-3.5 h-3.5" />, color: 'emerald' },
  { id: 'Videos', icon: <Youtube className="w-3.5 h-3.5" />, color: 'red' },
];

export default function GroupLibrary({ user, isAdmin, onStudy }: GroupLibraryProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    category: 'Prayers' as const,
    link: '',
    contentSnippet: '',
    type: 'text' as 'text' | 'video' | 'audio'
  });

  useEffect(() => {
    // Keep using same collection but update terminology in UI
    const q = query(collection(db, 'sacred_materials'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Material));
      setMaterials(docs);
    });
    return unsubscribe;
  }, []);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterial.title) return;

    try {
      const matRef = await addDoc(collection(db, 'sacred_materials'), {
        ...newMaterial,
        addedBy: user.displayName || 'Member',
        timestamp: serverTimestamp()
      });

      // Add notification for all users
      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title: 'New Sacred Resource',
        message: `${user.displayName || 'A member'} added "${newMaterial.title}" to the divine library.`,
        type: 'announcement',
        sourceId: matRef.id,
        isRead: false,
        timestamp: serverTimestamp()
      });

      setIsAddModalOpen(false);
      setNewMaterial({ title: '', description: '', category: 'Prayers', link: '', contentSnippet: '', type: 'text' });
    } catch (error) {
      console.error("Error adding material:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this resource? Associated notifications will also be cleared.')) {
      try {
        await deleteDoc(doc(db, 'sacred_materials', id));
        
        // Remove associated notifications
        const q = query(collection(db, 'notifications'), where('sourceId', '==', id));
        const snapshots = await getDocs(q);
        const promises = snapshots.docs.map(d => deleteDoc(d.ref));
        await Promise.all(promises);
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `sacred_materials/${id}`);
      }
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const shareResource = (item: Material) => {
    const message = `*${item.type === 'video' ? 'DIVINE VISION' : 'KNOWLEDGE'}: ${item.title.toUpperCase()}*
    
*Category:* ${item.category}
    
*Description:*
${item.description}
    
*Access Details:*
${item.link || 'Available via ZUCA Portal'}
    
━━━━━━━━━━━━━━━━━━
*ZUCA PORTAL:* ${window.location.origin}
✧────────────────✧`;
    const encodedText = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const featuredMaterial = filteredMaterials[0];

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getCategoryIcon = (catId: string) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat ? cat.icon : <Library className="w-4 h-4" />;
  };

  const [playingResource, setPlayingResource] = useState<Material | null>(null);

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-24 text-stone-900 dark:text-stone-100">
      {/* Cinematic Video Modal Overlay */}
      <AnimatePresence>
        {playingResource && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-2 md:p-6"
          >
            {/* Animated Ambient Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                  rotate: [0, 90, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[20%] -left-[20%] w-[140%] h-[140%] bg-gradient-to-br from-emerald-500/20 via-brand-500/10 to-amber-500/20 blur-[120px] rounded-full"
              />
            </div>

            {/* Blurred Visual Backdrop */}
            <div className="absolute inset-0 z-0 opacity-40">
              <img 
                src={`https://img.youtube.com/vi/${getYoutubeId(playingResource.link || '')}/maxresdefault.jpg`}
                className="w-full h-full object-cover blur-[80px]"
                alt=""
              />
              <div className="absolute inset-0 bg-black/60" />
            </div>

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-6xl aspect-video rounded-3xl md:rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-black border border-white/10 z-10 group"
            >
              {/* Top Control Bar */}
              <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 ${playingResource.type === 'audio' ? 'bg-indigo-600' : 'bg-red-600'}`}>
                    {playingResource.type === 'audio' ? (
                      <Music className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    ) : (
                      <Youtube className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-white font-black text-sm md:text-xl serif-display tracking-tight leading-tight">{playingResource.title}</h3>
                    <p className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-black">{playingResource.category} • {playingResource.type === 'audio' ? 'Divine Resonance' : 'Divine Vision'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPlayingResource(null)}
                  className="w-10 h-10 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-xl transition-all border border-white/10"
                >
                  <X className="w-5 h-5 md:w-7 md:h-7" />
                </button>
              </div>

              {getYoutubeId(playingResource.link || '') ? (
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${getYoutubeId(playingResource.link || '')}?autoplay=1&rel=0&modestbranding=1`}
                  title={playingResource.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900 p-8 space-y-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-32 h-32 md:w-48 md:h-48 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20"
                  >
                    <Music className="w-12 h-12 md:w-20 md:h-20 text-emerald-500" />
                  </motion.div>
                  <audio 
                    controls 
                    autoPlay 
                    className="w-full max-w-xl custom-audio-player"
                    src={playingResource.link}
                  />
                  <p className="text-stone-400 text-sm font-serif italic text-center max-w-md">
                    "{playingResource.description}"
                  </p>
                </div>
              )}

              {/* Bottom Subtle Vignette */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sacred Header - Enhanced with subtle texture */}
      <motion.header 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative py-12 md:py-32 px-6 md:px-16 rounded-[32px] md:rounded-[64px] overflow-hidden bg-brand-950 text-white shadow-3xl group mx-2 md:mx-0 border border-emerald-500/20"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548625361-92e105e4539a?q=80&w=2670&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-30 transform group-hover:scale-105 transition-transform duration-[20s]" 
            alt="Cathedral"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/90 to-transparent" />
                   <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[180px] rounded-full -mr-64 -mt-64" />
          <div className="absolute inset-0 divine-pattern opacity-5" />
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-10 md:gap-16">
          <div className="space-y-6 md:space-y-10">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full glass-dark border border-white/10 text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400 shadow-2xl backdrop-blur-3xl"
            >
               <Flame className="w-3.5 h-3.5 animate-pulse text-amber-500" />
               Eternal Repository
            </motion.div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-9xl font-black tracking-tighter leading-[0.85] text-white serif-display">
                Sacred <br />
                <span className="serif-display italic font-light text-emerald-400 lowercase drop-shadow-3xl">Archive</span>
              </h1>
              <p className="max-w-xl text-stone-400 text-base md:text-2xl font-light italic serif-display leading-relaxed opacity-90">
                "Where wisdom is stored, grace flourishes. Seek and you shall find the path to enlightenment."
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStudy("Divine Archive Guidance", "I am exploring the Sacred Archive. What spiritual treasures are available for me today?")}
              className="flex-1 md:flex-none flex items-center justify-center gap-4 bg-stone-900 border border-white/10 text-white px-10 py-6 rounded-[28px] md:rounded-[40px] hover:bg-black transition-all font-black uppercase tracking-[0.3em] shadow-3xl text-[11px]"
            >
              <Bot className="w-5 h-5 text-brand-400" />
              Seek Counsel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-4 bg-emerald-600 text-white px-10 py-6 rounded-[28px] md:rounded-[40px] hover:bg-emerald-500 transition-all font-black uppercase tracking-[0.3em] shadow-3xl shadow-emerald-500/30 text-[11px] border border-white/10"
            >
              <Plus className="w-5 h-5" />
              Endow Resource
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Library Navigation & Feature Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 px-2 md:px-0">
        {/* Navigation Sidebar (Desktop Only) */}
        <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
          <div className="glass rounded-[32px] md:rounded-[48px] p-8 border border-stone-100 dark:border-white/5 shadow-2xl space-y-10 bg-white/50 dark:bg-stone-900/40 backdrop-blur-3xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-white/5 pb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Categories</h3>
                <Filter className="w-3 h-3 text-emerald-500" />
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setActiveCategory('All')}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all group ${
                    activeCategory === 'All' 
                      ? 'bg-emerald-500 text-black shadow-xl' 
                      : 'text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Globe className="w-4 h-4" /> Universal
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${activeCategory === 'All' ? 'translate-x-1' : 'opacity-0'}`} />
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all group border ${
                      activeCategory === cat.id 
                        ? 'bg-stone-900 text-white dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-lg' 
                        : 'text-stone-400 border-transparent hover:border-emerald-500/30 hover:bg-stone-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {cat.icon} {cat.id}
                    </span>
                    <span className="text-[9px] opacity-40">{materials.filter(m => m.category === cat.id).length}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <div className="p-6 rounded-[24px] bg-emerald-500/5 border border-emerald-500/10 text-center space-y-3">
                <Sparkles className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Archive Seekers</p>
                <p className="text-[11px] text-stone-500 leading-relaxed font-serif italic">Use the Divine AI for complex questions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-8 md:space-y-12 order-1 lg:order-2">
          {/* Search Bar Refined */}
          <div className="relative group">
             <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
             <input 
                type="text"
                placeholder="Search the Sacred Archive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-8 py-6 md:py-8 bg-stone-100/50 dark:bg-stone-900/40 border border-transparent focus:border-emerald-500/30 rounded-[32px] md:rounded-[48px] text-lg font-medium text-stone-900 dark:text-white outline-none transition-all placeholder:text-stone-400 shadow-xl"
             />
          </div>

          {/* Library Grid - Manuscripts Style (Denser) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredMaterials.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => {
                    if ((item.type === 'video' || item.type === 'audio') && (getYoutubeId(item.link || '') || item.link)) {
                      setPlayingResource(item);
                    } else if (item.link) {
                      window.open(item.link, '_blank');
                    }
                  }}
                  className="group relative bg-white dark:bg-stone-900/40 border border-stone-100 dark:border-white/5 rounded-[32px] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col h-full border-b-4 border-b-transparent hover:border-b-emerald-500/30 cursor-pointer"
                >
                  {/* Thumbnail for Video/Audio (YouTube) */}
                  {getYoutubeId(item.link || '') && (
                    <div className="h-32 md:h-40 relative overflow-hidden shrink-0">
                      <img 
                        src={`https://img.youtube.com/vi/${getYoutubeId(item.link || '')}/mqdefault.jpg`} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        alt={item.title}
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 scale-90 group-hover:scale-100 transition-all shadow-2xl">
                           <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[10px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                         </div>
                      </div>
                    </div>
                  )}

                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    {/* Small Type Icon */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-stone-50 dark:bg-white/5 flex items-center justify-center transition-colors group-hover:bg-emerald-500 group-hover:text-black">
                        {item.type === 'video' ? (
                          <Youtube className="w-5 h-5 text-red-500 group-hover:text-black transition-colors" />
                        ) : item.type === 'audio' ? (
                          <Music className="w-5 h-5 text-indigo-500 group-hover:text-black transition-colors" />
                        ) : (
                          getCategoryIcon(item.category)
                        )}
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* High Density Content */}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-black text-sm md:text-base text-stone-900 dark:text-white serif-display tracking-tight leading-tight line-clamp-2 transition-colors group-hover:text-emerald-500">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-stone-400 bg-stone-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Description Preview */}
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed font-serif italic mt-3 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Actions (Appears on Hover) */}
                    <div className="mt-4 pt-4 border-t border-stone-100 dark:border-white/5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all" onClick={(e) => e.stopPropagation()}>
                      <motion.button 
                         whileHover={{ scale: 1.1 }}
                         whileTap={{ scale: 0.9 }}
                         onClick={() => onStudy(item.title, item.contentSnippet || item.description)}
                         title="Divine Advisor"
                         className="p-2.5 bg-brand-600 text-white rounded-xl shadow-lg border border-white/10"
                      >
                         <Bot className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => shareResource(item)}
                        className="p-2.5 bg-stone-50 dark:bg-white/5 text-stone-400 rounded-xl"
                      >
                        <Share2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>


      {/* Empty State */}
      {filteredMaterials.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="py-20 flex flex-col items-center text-center opacity-30"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-dashed border-stone-500 flex items-center justify-center mb-6">
            <Library className="w-10 h-10 md:w-12 md:h-12" />
          </div>
          <p className="font-serif italic text-lg md:text-xl">The library is currently empty...</p>
          <p className="text-[9px] uppercase tracking-[0.4em] mt-2 font-black">Deposit a resource to begin</p>
        </motion.div>
      )}

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-stone-900 border border-white/5 p-4 md:p-6 rounded-[24px] md:rounded-[40px] w-full max-w-2xl shadow-3xl max-h-[95vh] overflow-y-auto custom-scrollbar relative"
            >
              <div className="flex items-center justify-between mb-8 md:mb-12">
                <div className="flex items-center gap-5">
                  <div className="p-4 md:p-6 bg-emerald-500/10 rounded-[28px] md:rounded-[40px] text-emerald-500 shadow-inner border border-emerald-500/20">
                    <Library className="w-6 h-6 md:w-10 md:h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-5xl font-black text-white serif-display tracking-tight leading-tight italic">Resource Endowment</h2>
                    <p className="text-[10px] md:text-[11px] text-emerald-500 uppercase tracking-[0.4em] font-black mt-2">Contribution to the Sacred Archive</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-3 md:p-4 hover:bg-white/5 rounded-2xl transition-all text-white/20 hover:text-white"
                >
                  <X className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="space-y-6 md:space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1 text-left">Sacred Title</label>
                    <input
                      required
                      type="text"
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                      className="w-full px-6 py-4 md:py-5 rounded-2xl md:rounded-[32px] bg-white/5 border-2 border-white/5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-medium placeholder:text-stone-700"
                      placeholder="e.g. Oratio Dominica"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1 text-left">Wisdom Category</label>
                    <select
                      value={newMaterial.category}
                      onChange={(e) => {
                        const cat = e.target.value as any;
                        setNewMaterial({ 
                          ...newMaterial, 
                          category: cat,
                          type: cat === 'Videos' ? 'video' : 'text'
                        });
                      }}
                      className="w-full px-6 py-4 md:py-5 rounded-2xl md:rounded-[32px] bg-stone-950 border-2 border-white/5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option value="Prayers">Prayers & Devotions</option>
                      <option value="Scriptures">Sacred Scriptures</option>
                      <option value="Liturgy">Order of Liturgy</option>
                      <option value="Choir">Sacred Music & Choir</option>
                      <option value="Formation">Spiritual Formation</option>
                      <option value="Videos">Divine Visuals (Videos)</option>
                      <option value="Other">Miscellaneous Grace</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1 text-left">Resource Type</label>
                    <div className="flex gap-2 p-1 bg-stone-950 rounded-2xl border border-white/5">
                      <button
                        type="button"
                        onClick={() => setNewMaterial({ ...newMaterial, type: 'text' })}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newMaterial.type === 'text' ? 'bg-emerald-500 text-black' : 'text-stone-500 hover:text-white'}`}
                      >
                        Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewMaterial({ ...newMaterial, type: 'video' })}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newMaterial.type === 'video' ? 'bg-emerald-500 text-black' : 'text-stone-500 hover:text-white'}`}
                      >
                        Video
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewMaterial({ ...newMaterial, type: 'audio' })}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newMaterial.type === 'audio' ? 'bg-emerald-500 text-black' : 'text-stone-500 hover:text-white'}`}
                      >
                        Audio
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1 text-left">Path of Access (URL)</label>
                    <input
                      type="url"
                      value={newMaterial.link}
                      onChange={(e) => setNewMaterial({ ...newMaterial, link: e.target.value })}
                      className="w-full px-6 py-4 md:py-5 rounded-2xl md:rounded-[32px] bg-white/5 border-2 border-white/5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-medium placeholder:text-stone-700"
                      placeholder={newMaterial.type === 'video' ? 'https://youtube.com/watch?v=...' : newMaterial.type === 'audio' ? 'https://youtube.com/watch?v=... or audio URL' : 'https://divine-resource.org/scripture'}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Succinct Proclamation</label>
                  <textarea
                    rows={2}
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-6 py-4 md:py-5 rounded-2xl md:rounded-[32px] bg-white/5 border-2 border-white/5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-medium resize-none placeholder:text-stone-700"
                    placeholder="A brief summary of this sacred resource..."
                  />
                </div>

                <div className="space-y-3">
                   <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Full Divine Wisdom (Text Content)</label>
                   <textarea
                    rows={4}
                    value={newMaterial.contentSnippet}
                    onChange={(e) => setNewMaterial({ ...newMaterial, contentSnippet: e.target.value })}
                    className="w-full px-6 py-4 md:py-5 rounded-2xl md:rounded-[32px] bg-white/5 border-2 border-white/5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-medium resize-none placeholder:text-stone-700 custom-scrollbar"
                    placeholder="Deposit the full text here for the Archive's Knowledge Base..."
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-5 md:py-7 bg-emerald-600 text-white rounded-[24px] md:rounded-[40px] font-black uppercase tracking-[0.4em] text-[11px] md:text-[12px] hover:bg-emerald-500 transition-all shadow-3xl shadow-emerald-500/20 border border-white/10"
                >
                  Endow Archive
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
