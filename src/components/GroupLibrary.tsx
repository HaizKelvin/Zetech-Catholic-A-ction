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
  Heart 
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
  category: 'Prayers' | 'Training' | 'Choir' | 'Liturgy' | 'Other';
  link?: string;
  addedBy: string;
  timestamp: any;
  contentSnippet?: string;
}

interface GroupLibraryProps {
  user: any;
  onStudy: (title: string, content: string) => void;
}

const CATEGORIES = [
  { id: 'Prayers', icon: <Heart className="w-3 h-3" /> },
  { id: 'Training', icon: <GraduationCap className="w-3 h-3" /> },
  { id: 'Choir', icon: <Music className="w-3 h-3" /> },
  { id: 'Liturgy', icon: <FileText className="w-3 h-3" /> },
  { id: 'Other', icon: <Plus className="w-3 h-3" /> },
];

export default function GroupLibrary({ user, onStudy }: GroupLibraryProps) {
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
    <div className="max-w-7xl mx-auto space-y-3 md:space-y-6 pb-24 text-stone-900 dark:text-stone-100">
      {/* Immersive Header - Ultra Compacted */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-4 md:py-12 px-4 md:px-10 rounded-[20px] md:rounded-[40px] overflow-hidden bg-brand-950 text-white shadow-xl group mx-2 md:mx-0"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2670&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-10 transform group-hover:scale-105 transition-transform duration-[5s]" 
            alt="Library"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/70 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-full">
          <div className="space-y-1 md:space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-dark border border-white/10 text-[8px] font-black uppercase tracking-[0.3em] text-blue-300"
            >
              Archive
            </motion.div>
            
            <h1 className="text-xl md:text-5xl font-black tracking-tighter leading-tight text-white serif-display">
              Divine <span className="serif-display italic font-light text-blue-400 lowercase">Library</span>
            </h1>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 md:px-6 md:py-4 rounded-xl md:rounded-2xl hover:bg-blue-500 transition-all font-black uppercase tracking-[0.15em] shadow-lg shadow-blue-600/20 text-[8px] md:text-[10px]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Resource
          </motion.button>
        </div>
      </motion.header>

      {/* Navigation - Better Mobile Fit */}
      <div className="px-2 md:px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-2 md:p-4 bg-white dark:bg-stone-900/40 border border-stone-200/60 dark:border-white/5 rounded-[20px] md:rounded-[32px] shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-1.5 md:gap-3 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveCategory('All')}
              className={`px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[9px] transition-all shrink-0 ${
                activeCategory === 'All' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black uppercase tracking-widest text-[8px] md:text-[9px] transition-all shrink-0 border ${
                  activeCategory === cat.id 
                    ? 'bg-stone-900 border-stone-900 dark:bg-white dark:border-white text-white dark:text-black shadow-md' 
                    : 'text-stone-400 border-transparent hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5'
                }`}
              >
                {cat.icon}
                <span>{cat.id}</span>
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64 group border-t md:border-t-0 md:border-l border-stone-100 dark:border-white/10 pt-2 md:pt-0 md:pl-4">
             <Search className="absolute left-3 md:left-7 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-500" />
             <input 
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 md:pl-10 pr-4 py-2 md:py-2.5 bg-stone-100 dark:bg-black/10 border border-transparent focus:border-blue-500/30 rounded-lg md:rounded-xl text-[10px] font-bold text-stone-900 dark:text-white outline-none transition-all uppercase tracking-widest placeholder:text-stone-600"
             />
          </div>
        </div>
      </div>

      {/* Grid - More compact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 px-4">

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
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/20 group-hover:bg-blue-500 transition-all" />
              
              <div className="p-4 md:p-6 flex flex-col h-full min-h-[160px]">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                     <div className="p-1 px-2 bg-blue-500/10 rounded-md text-blue-500 text-[8px] font-black uppercase tracking-tighter">
                        {item.category}
                     </div>
                  </div>
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-stone-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-black text-stone-900 dark:text-white serif-display tracking-tight leading-tight line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-[10px] md:text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed italic opacity-80 serif-display line-clamp-2">
                    {item.description}
                  </p>
                </div>

              {/* Enhanced Action Bar */}
              <div className="mt-4 pt-3 border-t border-stone-100 dark:border-white/5 flex items-center gap-2">
                <button 
                  onClick={() => onStudy(item.title, item.contentSnippet || item.description)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-brand-500/5 text-brand-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-brand-500/10 transition-all border border-brand-500/10"
                >
                  <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Guide
                </button>

                <button 
                  onClick={() => item.link && window.open(item.link, '_blank')}
                  disabled={!item.link}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-stone-900 dark:bg-white text-white dark:text-black py-1.5 rounded-lg font-black uppercase tracking-widest text-[8px] hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-30"
                >
                  <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Access
                </button>
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
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 md:p-4 bg-blue-500/10 rounded-2xl md:rounded-[24px] text-blue-500">
                    <Plus className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-3xl font-black text-white serif-display tracking-tight leading-tight">Add Resource</h2>
                    <p className="text-[9px] md:text-[10px] text-stone-400 uppercase tracking-widest font-black">Divine Depository</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 md:p-3 hover:bg-white/5 rounded-xl transition-all text-white/40 hover:text-white"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="space-y-4 md:space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Material Title</label>
                  <input
                    required
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500 transition-all font-medium"
                    placeholder="e.g. Choir Training Manual"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Category</label>
                    <select
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value as any })}
                      className="w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500 transition-all font-medium appearance-none"
                    >
                      <option value="Prayers">Prayers</option>
                      <option value="Training">Training</option>
                      <option value="Choir">Choir</option>
                      <option value="Liturgy">Liturgy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Resource Link</label>
                    <input
                      type="url"
                      value={newMaterial.link}
                      onChange={(e) => setNewMaterial({ ...newMaterial, link: e.target.value })}
                      className="w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500 transition-all font-medium"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Short Description</label>
                  <textarea
                    rows={2}
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500 transition-all font-medium resize-none shadow-inner"
                    placeholder="Brief summary..."
                  />
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">Knowledge Base Content</label>
                   <textarea
                    rows={3}
                    value={newMaterial.contentSnippet}
                    onChange={(e) => setNewMaterial({ ...newMaterial, contentSnippet: e.target.value })}
                    className="w-full px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-500 transition-all font-medium resize-none shadow-inner"
                    placeholder="Paste full text here for AI assistance..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 md:py-5 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-500 transition-all shadow-xl active:scale-95"
                >
                  Confirm Material
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
