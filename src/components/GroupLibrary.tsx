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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

interface Material {
  id: string;
  title: string;
  description: string;
  category: 'Prayers' | 'Scriptures' | 'Liturgy' | 'Choir' | 'Formation' | 'Other';
  link?: string;
  addedBy: string;
  timestamp: any;
  contentSnippet?: string;
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
    contentSnippet: ''
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
      await addDoc(collection(db, 'sacred_materials'), {
        ...newMaterial,
        addedBy: user.displayName || 'Member',
        timestamp: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewMaterial({ title: '', description: '', category: 'Prayers', link: '', contentSnippet: '' });
    } catch (error) {
      console.error("Error adding material:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this resource?')) {
      try {
        await deleteDoc(doc(db, 'sacred_materials', id));
      } catch (error) {
        console.error("Error removing resource:", error);
        alert("Failed to remove resource. Please check your permissions or connection.");
      }
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-24 text-stone-900 dark:text-stone-100">
      {/* Sacred Header - Elegant & Liturgical */}
      <motion.header 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative py-8 md:py-24 px-6 md:px-16 rounded-[32px] md:rounded-[64px] overflow-hidden bg-brand-950 text-white shadow-3xl group mx-2 md:mx-0 border border-emerald-500/10"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548625361-92e105e4539a?q=80&w=2670&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20 transform group-hover:scale-110 transition-transform duration-[10s]" 
            alt="Cathedral"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/80 to-transparent" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[150px] rounded-full -mr-48 -mt-48" />
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 max-w-full">
          <div className="space-y-4 md:space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass-dark border border-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 shadow-2xl backdrop-blur-3xl"
            >
               <Flame className="w-3 h-3 animate-pulse text-amber-500" />
               Archive of Grace
            </motion.div>
            
            <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-none text-white serif-display">
              Divine <br />
              <span className="serif-display italic font-light text-emerald-400 lowercase italic">Library</span>
            </h1>

            <p className="max-w-xl text-stone-400 text-sm md:text-xl font-light italic serif-display leading-relaxed">
              "The fruit of the spirit is love, joy, peace, patience, kindness, goodness, faithfulness..."
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-emerald-600 text-white px-8 py-5 rounded-[24px] md:rounded-[32px] hover:bg-emerald-500 transition-all font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/30 text-[9px] md:text-[10px]"
          >
            <Plus className="w-5 h-5" />
            Endow Resource
          </motion.button>
        </div>
      </motion.header>

      {/* Navigation - Ornate & Minimal */}
      <div className="px-2 md:px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 md:p-6 bg-white dark:bg-stone-900 border border-stone-200/50 dark:border-white/5 rounded-[32px] md:rounded-[48px] shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto overflow-x-auto no-scrollbar py-2">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-4 md:px-7 py-2.5 md:py-3 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all shrink-0 ${
                activeCategory === 'All' 
                  ? 'bg-stone-900 text-white dark:bg-emerald-500 dark:text-black shadow-xl ring-2 ring-emerald-500/20' 
                  : 'text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-50 dark:hover:bg-white/5'
              }`}
            >
              Universal
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-[9px] md:text-[10px] transition-all shrink-0 border-2 ${
                  activeCategory === cat.id 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-lg' 
                    : 'text-stone-400 border-stone-100 dark:border-white/5 hover:border-emerald-500/30 hover:bg-stone-50 dark:hover:bg-white/5'
                }`}
              >
                {cat.icon}
                <span>{cat.id}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80 group">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
             <input 
                type="text"
                placeholder="Seek wisdom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-3 md:py-4 bg-stone-50 dark:bg-black/20 border-2 border-transparent focus:border-emerald-500/20 rounded-2xl md:rounded-3xl text-sm font-medium text-stone-900 dark:text-white outline-none transition-all placeholder:text-stone-400"
             />
          </div>
        </div>
      </div>

      {/* Library Grid - Manuscript / Sacred Book Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 px-4 md:px-4">
        <AnimatePresence mode="popLayout">
          {filteredMaterials.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -8 }}
              className="group bg-white dark:bg-stone-900/60 border-2 border-stone-100 dark:border-white/5 rounded-[32px] md:rounded-[48px] overflow-hidden shadow-xl hover:shadow-3xl transition-all duration-700 flex flex-col h-full relative"
            >
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/5 to-transparent pointer-events-none" />
              
              <div className="p-8 md:p-12 flex flex-col h-full min-h-[300px]">
                <div className="flex items-start justify-between mb-8">
                  <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-stone-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-stone-200 dark:border-emerald-500/20 shadow-sm">
                    {CATEGORIES.find(c => c.id === item.category)?.icon || <Feather className="w-3 h-3" />}
                    {item.category}
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="p-3 text-stone-300 hover:text-red-500 hover:bg-stone-50 dark:hover:bg-red-500/10 rounded-2xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-white serif-display tracking-tight leading-tight group-hover:text-emerald-500 transition-colors">
                    {item.title}
                  </h3>
                  <div className="h-0.5 w-12 bg-emerald-500/20 group-hover:w-20 transition-all duration-500" />
                  <p className="text-sm md:text-base text-stone-500 dark:text-stone-400 leading-relaxed italic opacity-80 serif-display line-clamp-4">
                    {item.description}
                  </p>
                </div>

                <div className="mt-10 pt-8 border-t border-stone-100 dark:border-white/5 flex items-center justify-between gap-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">Archivist</span>
                      <span className="text-xs font-bold text-stone-600 dark:text-stone-300">{item.addedBy}</span>
                   </div>
                   
                   <div className="flex gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onStudy(item.title, item.contentSnippet || item.description)}
                      className="p-3.5 bg-stone-900 dark:bg-emerald-500 text-white dark:text-black rounded-2xl shadow-xl hover:shadow-emerald-500/20 transition-all"
                      title="Seek Enlightenment"
                    >
                      <Bot className="w-5 h-5" />
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => item.link && window.open(item.link, '_blank')}
                      disabled={!item.link}
                      className="p-3.5 bg-stone-50 dark:bg-white/5 text-stone-400 dark:text-stone-300 rounded-2xl border border-stone-200 dark:border-white/10 hover:border-emerald-500/30 hover:text-emerald-500 transition-all disabled:opacity-20"
                      title="Open Resource"
                    >
                      <Globe className="w-5 h-5" />
                    </motion.button>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
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
                    <h2 className="text-2xl md:text-5xl font-black text-white serif-display tracking-tight leading-tight italic">Devotional Repository</h2>
                    <p className="text-[10px] md:text-[11px] text-emerald-500 uppercase tracking-[0.4em] font-black mt-2">Sacred archive of grace</p>
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
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Sacred Title</label>
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
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Wisdom Category</label>
                    <select
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value as any })}
                      className="w-full px-6 py-4 md:py-5 rounded-2xl md:rounded-[32px] bg-stone-950 border-2 border-white/5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-medium appearance-none cursor-pointer"
                    >
                      <option value="Prayers">Prayers & Devotions</option>
                      <option value="Scriptures">Sacred Scriptures</option>
                      <option value="Liturgy">Order of Liturgy</option>
                      <option value="Choir">Sacred Music & Choir</option>
                      <option value="Formation">Spiritual Formation</option>
                      <option value="Other">Miscellaneous Grace</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 ml-1">Path of Access (URL)</label>
                  <input
                    type="url"
                    value={newMaterial.link}
                    onChange={(e) => setNewMaterial({ ...newMaterial, link: e.target.value })}
                    className="w-full px-6 py-4 md:py-5 rounded-2xl md:rounded-[32px] bg-white/5 border-2 border-white/5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all font-medium placeholder:text-stone-700"
                    placeholder="https://divine-resource.org/scripture"
                  />
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
