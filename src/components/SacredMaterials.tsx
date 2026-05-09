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
    <div className="max-w-4xl mx-auto pb-12 px-4 md:px-0">
      {/* Compact Manuscript Header */}
      <div className="relative mb-6 pt-2">
        <div className="absolute inset-0 bg-stone-900 dark:bg-black rounded-3xl overflow-hidden shadow-2xl border border-stone-800 ring-1 ring-white/10">
           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[80px] rounded-full -mr-16 -mt-16" />
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-500/10 blur-[80px] rounded-full -ml-16 -mb-16" />
        </div>
        
        <div className="relative z-10 p-6 md:p-10 flex flex-col items-center text-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-5xl font-black tracking-tight text-white uppercase serif-display flex items-center justify-center gap-3">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 rotate-3">
                <BookOpen className="w-5 h-5 md:w-7 md:h-7 text-black" />
              </div>
              Sacred <span className="text-amber-500 italic lowercase font-light">Archive</span>
            </h1>
            <p className="text-stone-500 text-[9px] md:text-sm font-bold uppercase tracking-[0.3em]">
              The Sanctum of Divine Knowledge
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-amber-500 text-black px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all border-b-4 border-amber-600"
          >
            <Plus className="w-3.5 h-3.5" /> Deposit Resource
          </motion.button>
        </div>
      </div>

      {/* Library Navigation - Tighter & Real Library Style */}
      <div className="sticky top-1 z-40 mb-8 flex items-center justify-center">
        <div className="flex items-center gap-3 p-2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-3xl shadow-black/10 ring-1 ring-white/10 overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shrink-0 flex items-center gap-2 ${
              activeCategory === 'All' 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' 
                : 'bg-stone-900/50 text-stone-400 hover:text-white'
            }`}
          >
            <Library className="w-3 h-3" />
            All Books
          </button>

          <div className="w-[1px] h-4 bg-white/10 shrink-0" />

          {/* Archive Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all bg-stone-900/50 border border-white/5 ${
                activeCategory !== 'All'
                  ? 'text-amber-500 ring-1 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              <span>{activeCategory === 'All' ? 'Select Shelf' : activeCategory}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-0 bg-black/0" onClick={() => setIsDropdownOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 mt-3 w-52 bg-stone-900 border border-white/10 rounded-2xl shadow-3xl p-2 z-10 backdrop-blur-3xl ring-1 ring-white/10"
                  >
                    <p className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-stone-500 border-b border-white/5 mb-2">Divine Sections</p>
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left mb-1 ${
                            activeCategory === cat.id ? 'bg-amber-500/10 text-amber-500' : 'hover:bg-white/5 text-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={activeCategory === cat.id ? 'text-amber-500' : 'text-stone-600'}>{cat.icon}</div>
                          <span className="text-[10px] font-bold uppercase tracking-wider">{cat.id}</span>
                        </div>
                        {activeCategory === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,1)]" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="w-[1px] h-4 bg-white/10 shrink-0" />

          {/* Search Box - Real Library Search */}
          <div className="relative w-40 md:w-52 shrink-0 group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 transition-colors group-focus-within:text-amber-500" />
             <input 
                type="text"
                placeholder="Find a scroll..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-stone-900/50 border border-white/5 rounded-xl text-[10px] font-bold text-white outline-none placeholder:text-stone-600 focus:ring-2 focus:ring-amber-500/40 transition-all uppercase tracking-wider"
             />
          </div>
        </div>
      </div>

      {/* Library Grid - Centered & Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
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
              
              <div className="p-5 flex flex-col h-full min-h-[200px]">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                       <div className="p-1 bg-stone-100 dark:bg-white/5 rounded-md text-amber-500 scale-75">
                          {item.category === 'Choir' ? <Music className="w-4 h-4" /> : 
                           item.category === 'Rosary' ? <Cross className="w-4 h-4" /> : 
                           item.category === 'Liturgy' ? <FileText className="w-4 h-4" /> : 
                           <BookOpen className="w-4 h-4" />}
                       </div>
                       <span className="text-[7px] font-black uppercase tracking-[0.1em] text-stone-400">{item.category} Shelf</span>
                    </div>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-stone-200 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <h3 className="text-sm md:text-base font-black text-stone-900 dark:text-white serif-display tracking-tight leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="w-8 h-0.5 bg-amber-500/30" />
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug italic opacity-80 serif-display line-clamp-3">
                    {item.description}
                  </p>
                </div>

              {/* Library Librarian Interaction */}
              <div className="px-5 pb-5 mt-auto flex items-center justify-between pt-4 border-t border-stone-100 dark:border-white/5 bg-stone-50/50 dark:bg-stone-900/10">
                <button 
                  onClick={() => onStudy(item.title, item.contentSnippet || item.description)}
                  className="flex flex-1 items-center justify-center gap-2 text-stone-500 hover:text-amber-500 transition-colors group/btn py-2"
                >
                  <Bot className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest">AI Librarian</span>
                </button>

                <div className="w-[1px] h-4 bg-stone-200 dark:bg-white/5 mx-2" />

                <button 
                  onClick={() => item.link && window.open(item.link, '_blank')}
                  disabled={!item.link}
                  className="flex flex-1 items-center justify-center gap-2 bg-stone-900 dark:bg-amber-500 text-white dark:text-black px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Read
                </button>
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
