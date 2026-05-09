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
  Info
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
  { id: 'All', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'Choir', icon: <Music className="w-4 h-4" /> },
  { id: 'Rosary', icon: <Cross className="w-4 h-4" /> },
  { id: 'Liturgy', icon: <FileText className="w-4 h-4" /> },
  { id: 'Other', icon: <Plus className="w-4 h-4" /> },
];

export default function SacredMaterials({ user, onStudy }: SacredMaterialsProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    <div className="max-w-6xl mx-auto pb-20 px-4 md:px-0">
      {/* Header Section */}
      <div className="mb-6 p-5 md:p-10 rounded-3xl md:rounded-[40px] bg-indigo-950 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row gap-5 md:items-center justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest text-indigo-200">
              <Sparkles className="w-2.5 h-2.5" /> Shared Wisdom
            </div>
            <h1 className="text-2xl md:text-5xl font-black tracking-tight leading-none uppercase italic serif-display">
              Sacred <span className="text-indigo-400 not-italic lowercase">Materials</span>
            </h1>
            <p className="text-indigo-200/60 text-[11px] md:text-sm max-w-md font-medium">
              Collaborative resources for training and meditation.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-indigo-950 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-900/20"
          >
            <Plus className="w-3.5 h-3.5 ml-[-2px]" /> Deposit
          </motion.button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-40 mb-6 p-2 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl border border-stone-200 dark:border-white/5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-3 transition-all">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mask-fade-edges w-full md:flex-1 py-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-bold text-[9px] uppercase tracking-wider border ${
                activeCategory === cat.id 
                  ? 'bg-indigo-600 text-white border-indigo-600' 
                  : 'bg-white dark:bg-white/5 text-stone-500 dark:text-stone-400 border-stone-100 dark:border-white/10 hover:border-indigo-500/20'
              }`}
            >
              <span className="scale-75">{cat.icon}</span>
              {cat.id}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-[11px] outline-none focus:border-indigo-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMaterials.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="group bg-white dark:bg-stone-900/40 p-5 rounded-3xl border border-stone-100 dark:border-white/5 hover:border-indigo-500/20 shadow-sm hover:shadow-lg transition-all duration-500 flex flex-col h-full active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                  item.category === 'Choir' ? 'bg-blue-50 text-blue-600' :
                  item.category === 'Rosary' ? 'bg-emerald-50 text-emerald-600' :
                  item.category === 'Liturgy' ? 'bg-amber-50 text-amber-600' :
                  'bg-stone-50 text-stone-600'
                } group-hover:rotate-6 transition-transform duration-500 shadow-inner`}>
                  <div className="scale-75">
                    {item.category === 'Choir' ? <Music className="w-5 h-5" /> : 
                     item.category === 'Rosary' ? <Cross className="w-5 h-5" /> : 
                     item.category === 'Liturgy' ? <FileText className="w-5 h-5" /> : 
                     <BookOpen className="w-5 h-5" />}
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-stone-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-stone-400">{item.category}</span>
                </div>
                <h3 className="text-base font-black text-stone-900 dark:text-white leading-tight serif-display tracking-tight line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 font-medium leading-relaxed opacity-80 line-clamp-3 italic serif-display">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 dark:border-white/5 flex items-center justify-between gap-2">
                {item.link ? (
                  <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-stone-900 dark:bg-white/10 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-md active:scale-95"
                  >
                    <Download className="w-3 h-3" /> View
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-stone-100 dark:bg-white/5 text-stone-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-dashed border-stone-200">
                    <Info className="w-3 h-3" /> Private
                  </div>
                )}
                <button 
                  onClick={() => onStudy(item.title, item.contentSnippet || item.description)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100 dark:border-indigo-500/10 active:scale-95"
                >
                  <Bot className="w-3 h-3" /> AI Help
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredMaterials.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-400">
             <BookOpen className="w-12 h-12 mb-4 opacity-20" />
             <p className="text-sm font-semibold">No materials discovered yet in this realm.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-[24px] overflow-hidden shadow-2xl border border-white/10 p-5 md:p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight">Deposit wisdom</h2>
                  <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-0.5">Sacred Material Entry</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-stone-400 hover:text-red-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMaterial} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1.5">Title</label>
                  <input
                    required
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-[13px] outline-none focus:border-indigo-500 transition-all font-medium"
                    placeholder="e.g. Easter Vigil Sheet"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1.5">Category</label>
                    <select
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-[13px] outline-none focus:border-indigo-500 transition-all font-medium appearance-none"
                    >
                      <option value="Choir">Choir</option>
                      <option value="Rosary">Rosary</option>
                      <option value="Liturgy">Liturgy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1.5">Link (Optional)</label>
                    <input
                      type="url"
                      value={newMaterial.link}
                      onChange={(e) => setNewMaterial({ ...newMaterial, link: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-[13px] outline-none focus:border-indigo-500 transition-all font-medium"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-[13px] outline-none focus:border-indigo-500 transition-all font-medium resize-none shadow-inner"
                    placeholder="Brief description..."
                  />
                </div>

                <div>
                   <label className="block text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1.5">Content (For AI)</label>
                   <textarea
                    rows={3}
                    value={newMaterial.contentSnippet}
                    onChange={(e) => setNewMaterial({ ...newMaterial, contentSnippet: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/10 text-[13px] outline-none focus:border-indigo-500 transition-all font-medium resize-none shadow-inner"
                    placeholder="Paste text here for AI help..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
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
