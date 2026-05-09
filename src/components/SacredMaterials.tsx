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
  Library
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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

interface Material {
  id: string;
  title: string;
  description: string;
  category: 'Choir' | 'Rosary' | 'Liturgy' | 'Other';
  link?: string;
  addedBy: string;
  timestamp: any;
  contentSnippet?: string;
}

interface SacredMaterialsProps {
  user: any;
  onStudy: (title: string, content: string) => void;
}

const CATEGORIES = [
  { id: 'Choir', icon: <Music className="w-3 h-3" /> },
  { id: 'Rosary', icon: <Cross className="w-3 h-3" /> },
  { id: 'Liturgy', icon: <FileText className="w-3 h-3" /> },
  { id: 'Other', icon: <Plus className="w-3 h-3" /> },
];

export default function SacredMaterials({ user, onStudy }: SacredMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    category: 'Choir' as const,
    link: '',
    contentSnippet: ''
  });

  useEffect(() => {
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
      setNewMaterial({ title: '', description: '', category: 'Choir', link: '', contentSnippet: '' });
    } catch (error) {
      console.error("Error adding material:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Remove this resource?')) {
      await deleteDoc(doc(db, 'sacred_materials', id));
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesCategory = activeCategory === 'All' || m.category === activeCategory;
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24">
      {/* Immersive Header - Matching Dashboard & Gallery */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-8 md:py-24 px-6 md:px-12 rounded-[24px] md:rounded-[48px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-6 md:mb-12 mx-2 md:mx-0"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548625361-04286f9f30be?q=80&w=2670&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20 transform group-hover:scale-110 transition-transform duration-[3s]" 
            alt="Sacred Library"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 max-w-full">
          <div className="space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark border border-white/10 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-300 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]" />
              Sacred Archive
            </motion.div>
            
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight text-white serif-display">
              Divine <br />
              <span className="serif-display italic font-light text-amber-500 lowercase">Library</span>
            </h1>
            
            <p className="text-stone-400 text-sm md:text-xl font-light max-w-xl leading-relaxed italic serif-display opacity-80">
              The sanctum of knowledge, liturgy, and spiritual manuscripts.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-amber-500 text-black px-6 py-4 md:px-8 md:py-5 rounded-2xl md:rounded-3xl hover:bg-amber-400 transition-all font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 text-[9px] md:text-[10px]"
          >
            <Plus className="w-4 h-4" />
            Deposit Wise Word
          </motion.button>
        </div>
      </motion.header>

      {/* Optimized Navigation / Search */}
      <div className="px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 md:p-6 bg-white dark:bg-stone-900/40 border border-stone-200/60 dark:border-white/5 rounded-[32px] shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shrink-0 ${
                activeCategory === 'All' 
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' 
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              All Scrolls
            </button>
            <div className="w-[1px] h-6 bg-white/10 shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shrink-0 ${
                  activeCategory === cat.id 
                    ? 'bg-stone-900 dark:bg-white text-white dark:text-black shadow-lg' 
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {cat.icon}
                {cat.id}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 transition-colors group-focus-within:text-amber-500" />
             <input 
                type="text"
                placeholder="Find in the archive..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 bg-stone-100 dark:bg-black/20 border border-transparent focus:border-amber-500/30 rounded-2xl text-[11px] font-bold text-white outline-none transition-all uppercase tracking-widest placeholder:text-stone-600"
             />
          </div>
        </div>
      </div>

      {/* Library Grid - Polished & Spacious */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 px-4">

        <AnimatePresence mode="popLayout">
          {filteredMaterials.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-stone-950/40 border border-stone-200/60 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 group flex flex-col h-full relative"
            >
              {/* Card Spine Decor */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/20 group-hover:bg-amber-500 transition-all" />
              
              <div className="p-6 md:p-8 flex flex-col h-full min-h-[220px]">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                          {item.category === 'Choir' ? <Music className="w-5 h-5" /> : 
                           item.category === 'Rosary' ? <Cross className="w-5 h-5" /> : 
                           item.category === 'Liturgy' ? <FileText className="w-5 h-5" /> : 
                           <BookOpen className="w-5 h-5" />}
                       </div>
                       <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-500">{item.category} Manuscript</span>
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-stone-300 hover:text-red-500 transition-colors bg-stone-100 dark:bg-white/5 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="text-xl md:text-2xl font-black text-stone-900 dark:text-white serif-display tracking-tight leading-tight">
                    {item.title}
                  </h3>
                  <div className="h-[2px] w-12 bg-amber-500/20 rounded-full group-hover:w-20 transition-all duration-700" />
                  <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed italic opacity-80 serif-display line-clamp-4">
                    {item.description}
                  </p>
                </div>

              {/* Enhanced Action Bar */}
              <div className="mt-8 pt-6 border-t border-stone-100 dark:border-white/5 flex items-center gap-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onStudy(item.title, item.contentSnippet || item.description)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-brand-500/10 text-brand-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-500/20 transition-all"
                >
                  <Bot className="w-4 h-4" />
                  Guide Me
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => item.link && window.open(item.link, '_blank')}
                  disabled={!item.link}
                  className="flex-1 flex items-center justify-center gap-2 bg-stone-900 dark:bg-white text-white dark:text-black py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Access
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>

      {/* Real Library Aesthetic: Empty State */}
      {filteredMaterials.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="py-32 flex flex-col items-center text-center opacity-30"
        >
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-stone-500 flex items-center justify-center mb-8">
            <Library className="w-12 h-12" />
          </div>
          <p className="font-serif italic text-xl">The shelves are currently whispers in the wind...</p>
          <p className="text-[10px] uppercase tracking-[0.4em] mt-2 font-black">Search deeper or deposit a resource</p>
        </motion.div>
      )}

      {/* Modal - Aligned and compact */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-stone-900 border border-white/10 w-full max-w-lg rounded-[40px] shadow-3xl overflow-hidden relative"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Deposit Wisdom</h2>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Sacred Material Entry</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-stone-400 hover:text-red-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Manuscript Title</label>
                  <input
                    required
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-sm outline-none focus:border-amber-500 transition-all font-medium"
                    placeholder="e.g. Easter Vigil Choir Sheet"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">archives</label>
                    <select
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value as any })}
                      className="w-full px-5 py-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-sm outline-none focus:border-amber-500 transition-all font-medium appearance-none"
                    >
                      <option value="Choir">Choir</option>
                      <option value="Rosary">Rosary</option>
                      <option value="Liturgy">Liturgy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Safe Link</label>
                    <input
                      type="url"
                      value={newMaterial.link}
                      onChange={(e) => setNewMaterial({ ...newMaterial, link: e.target.value })}
                      className="w-full px-5 py-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-sm outline-none focus:border-amber-500 transition-all font-medium"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Description</label>
                  <textarea
                    rows={2}
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-sm outline-none focus:border-amber-500 transition-all font-medium resize-none shadow-inner"
                    placeholder="Briefly describe the significance..."
                  />
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Full Content (For AI Assistant)</label>
                   <textarea
                    rows={4}
                    value={newMaterial.contentSnippet}
                    onChange={(e) => setNewMaterial({ ...newMaterial, contentSnippet: e.target.value })}
                    className="w-full px-5 py-3 rounded-2xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-sm outline-none focus:border-amber-500 transition-all font-medium resize-none shadow-inner"
                    placeholder="Paste hymns or guide text here so AI Librarian can assist..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-black dark:bg-amber-500 text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-stone-800 dark:hover:bg-amber-400 transition-all shadow-xl active:scale-95"
                >
                  Confirm Deposit
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
