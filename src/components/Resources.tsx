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
import { Resource, OperationType, UserRole } from '../types';
import { handleFirestoreError } from '../utils';
import { Music, FileText, Play, Plus, Trash2, ExternalLink, Search, X, Book, Heart, ScrollText, Bot, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResourcesProps {
  role: UserRole;
  onStudy: (title: string, content: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: <Search className="w-4 h-4" /> },
  { id: 'Document', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
  { id: 'Rosary Guide', label: 'Rosary', icon: <Heart className="w-4 h-4" /> },
  { id: 'Hymn', label: 'Hymns', icon: <Music className="w-4 h-4" /> },
  { id: 'Sheet Music', label: 'Scores', icon: <ScrollText className="w-4 h-4" /> },
  { id: 'Liturgical Guide', label: 'Liturgical', icon: <Book className="w-4 h-4" /> },
  { id: 'Audio', label: 'Audio', icon: <Play className="w-4 h-4" /> },
];

export default function Resources({ role, onStudy }: ResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    category: 'Document' as Resource['category'],
    description: '',
    content: '',
    fileUrl: ''
  });

  useEffect(() => {
    const path = 'resources';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const res = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
      setResources(res);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || role !== 'admin') return;

    try {
      await addDoc(collection(db, 'resources'), {
        ...newResource,
        uploadedBy: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setShowAddModal(false);
      setNewResource({ title: '', category: 'Document', description: '', content: '', fileUrl: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'resources');
    }
  };

  const handleDelete = async (id: string) => {
    if (role !== 'admin' || !window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `resources/${id}`);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (r.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getIcon = (category: Resource['category']) => {
    switch (category) {
      case 'Hymn': return <Music className="w-6 h-6" />;
      case 'Sheet Music': return <ScrollText className="w-6 h-6" />;
      case 'Audio': return <Play className="w-6 h-6" />;
      case 'Rosary Guide': return <Heart className="w-6 h-6" />;
      case 'Document': return <FileText className="w-6 h-6" />;
      case 'Liturgical Guide': return <Book className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
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
            src="https://images.unsplash.com/photo-1548625361-9878235272a0?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-20 transition-transform duration-[15s] group-hover:scale-100"
            alt="Library"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-12 md:gap-20">
          <div className="space-y-6 md:space-y-12 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 px-6 py-2 md:px-8 md:py-3 rounded-full glass-dark border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-brand-300 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-400 animate-pulse shadow-[0_0_12px_rgba(92,133,255,1)]" />
              Sacred Repository
            </motion.div>
            
            <h1 className="text-4xl md:text-[9rem] font-black tracking-[-0.05em] leading-tight md:leading-[0.8] text-white serif-display italic">
              Divine <br />
              <span className="text-brand-400 not-italic uppercase font-black text-xl md:text-5xl tracking-[0.4em] block mt-2 md:mt-4">Library</span>
            </h1>
            
            <p className="text-stone-400 text-base md:text-3xl font-light max-w-2xl leading-relaxed italic serif-display opacity-80">
              A curated archive of hymnals, liturgical guides, and spiritual manuscripts.
            </p>
          </div>
          
          {role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-4 bg-brand-600 text-white px-8 py-5 md:px-10 md:py-6 rounded-[24px] md:rounded-[32px] hover:bg-brand-500 transition-all font-black uppercase tracking-[0.3em] shadow-3xl shadow-brand-600/40 text-[9px] md:text-[10px]"
            >
              <Plus className="w-5 h-5" />
              Deposit Wisdom
            </motion.button>
          )}
        </div>
      </motion.header>

        <div className="flex flex-col gap-6 lg:gap-20">
          {/* Search & Filter Bar - More Refined */}
          <div className="flex flex-col gap-6 md:gap-10">
            <div className="relative group px-2 md:px-0">
              <div className="absolute inset-0 bg-brand-500/5 blur-[40px] rounded-[40px] md:rounded-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative glass rounded-[32px] md:rounded-[60px] p-1.5 md:p-3 border border-stone-200 dark:border-white/10 shadow-2xl">
                <div className="relative flex items-center">
                  <Search className="absolute left-6 md:left-12 w-5 h-5 md:w-8 md:h-8 text-brand-600/30" />
                  <input
                    type="text"
                    placeholder="Query the sacred archives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 md:pl-28 pr-6 md:pr-8 py-6 md:py-12 rounded-[24px] md:rounded-[48px] bg-white/40 dark:bg-black/20 text-lg md:text-4xl outline-none placeholder:text-stone-300 dark:placeholder:text-stone-700 font-black tracking-tight"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex overflow-x-auto gap-3 md:gap-6 px-4 pb-4 md:pb-6 custom-scrollbar no-scrollbar scroll-smooth">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 md:gap-5 px-6 md:px-12 py-3 md:py-6 rounded-2xl md:rounded-[40px] whitespace-nowrap transition-all font-black text-[9px] md:text-xs uppercase tracking-[0.4em] backdrop-blur-3xl border ${
                    activeCategory === cat.id 
                      ? 'bg-brand-900 text-white border-brand-900 shadow-3xl shadow-brand-900/30 scale-105' 
                      : 'bg-white dark:bg-white/5 text-stone-500 dark:text-stone-500 hover:text-brand-900 dark:hover:text-white border-stone-100 dark:border-white/5 hover:bg-stone-50 dark:hover:bg-white/10'
                  }`}
                >
                  <span className={`transition-opacity transition-transform ${activeCategory === cat.id ? 'animate-float opacity-100 scale-110' : 'opacity-40 group-hover:opacity-70'} w-3 h-3 md:w-4 md:h-4 flex items-center justify-center`}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-16 px-4 md:px-0">
          <AnimatePresence mode="popLayout">
            {/* Spiritual Guide CTA Card */}
            <motion.div
              layout
              key="divine-study-ai-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-1 glass-dark rounded-[40px] md:rounded-[70px] p-10 md:p-16 border-2 border-brand-500/20 bg-brand-950 text-white flex flex-col justify-between group relative h-full overflow-hidden shadow-3xl shadow-brand-900/40"
            >
              <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-500/20 blur-[120px] rounded-full animate-pulse" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-[28px] md:rounded-[32px] bg-white/10 backdrop-blur-3xl text-white flex items-center justify-center shadow-inner mb-8 md:mb-12 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 border border-white/10">
                  <Bot className="w-8 h-8 md:w-10 md:h-10" />
                </div>
                <h3 className="text-3xl md:text-5xl font-bold mb-6 md:mb-8 tracking-tighter leading-[1.1] italic serif-display">
                  Divine <br />
                  <span className="text-brand-300 not-italic font-black uppercase tracking-[0.3em] text-[10px] md:text-xs">AI Assistant</span>
                </h3>
                <p className="text-base md:text-lg text-stone-400 font-light leading-relaxed mb-8 md:mb-12 serif-display italic">
                  "Perplexed by a sacred text? Our spiritual assistant can analyze any archive for your edification."
                </p>
                <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 w-fit shadow-2xl">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400 animate-ping absolute" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400 relative" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">System Ready</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ x: 10 }}
                onClick={() => onStudy("General Assistance", "I need help understanding these archives.")}
                className="mt-12 md:mt-20 text-[10px] md:text-[11px] font-black uppercase tracking-[0.6em] text-brand-400 flex items-center gap-4 group/btn"
              >
                Summon Assistant 
                <span className="group-hover/btn:translate-x-3 transition-transform text-lg md:text-xl">→</span>
              </motion.button>
            </motion.div>

            {filteredResources.length === 0 ? (
               <motion.div 
                 key="no-resources-found"
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="col-span-full py-48 text-center glass rounded-[60px] border-dashed border-stone-200 dark:border-stone-800"
               >
                  <Search className="w-24 h-24 text-stone-200 dark:text-stone-900 mx-auto mb-8" />
                  <p className="text-stone-400 font-black tracking-[0.5em] uppercase text-xs">Silence in the archives</p>
               </motion.div>
            ) : (
              filteredResources.map((resource) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={resource.id} 
                  className="glass p-8 md:p-14 group relative flex flex-col h-full bg-white dark:bg-stone-900/10 border border-stone-100 dark:border-white/5 hover:border-brand-500/30 shadow-2xl rounded-[40px] md:rounded-[70px] transition-all duration-700"
                >
                  <div className="flex items-start justify-between mb-8 md:mb-12">
                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-[22px] md:rounded-[32px] bg-stone-50 dark:bg-white/5 text-brand-900 dark:text-white flex items-center justify-center shadow-inner group-hover:bg-brand-900 group-hover:text-white transition-all duration-700 group-hover:rotate-6 border border-stone-100 dark:border-white/10">
                      {getIcon(resource.category)}
                    </div>
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all p-3 md:p-4 rounded-[20px]"
                      >
                        <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-6 md:space-y-8">
                    <div className="space-y-2 md:space-y-3">
                       <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] text-brand-600 dark:text-brand-400 inline-block bg-brand-50 dark:bg-brand-500/10 px-3 md:px-4 py-1 md:py-1.5 rounded-full">
                         {resource.category}
                       </span>
                    </div>
                    <h4 className="text-2xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 leading-[1.1] tracking-tighter serif-display group-hover:translate-x-2 transition-transform duration-700">
                      {resource.title}
                    </h4>
                    {resource.description && (
                      <p className="text-base md:text-lg text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3 font-light serif-display italic opacity-80">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-10 md:mt-14 space-y-4 md:space-y-6">
                    {resource.content && (
                      <div className="p-6 md:p-8 bg-stone-50 dark:bg-black/20 rounded-[30px] md:rounded-[40px] border border-stone-100 dark:border-white/5 relative overflow-hidden group/content">
                        <div className="absolute top-0 right-0 p-4 md:p-6 opacity-[0.03] group-hover/content:opacity-10 transition-opacity">
                           <Book className="w-12 h-12 md:w-16 md:h-16 text-brand-500" />
                        </div>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-3 md:mb-4 ml-1">Insight Preview</p>
                        <p className="text-sm md:text-base italic font-serif text-stone-950 dark:text-stone-100 line-clamp-3 leading-relaxed whitespace-pre-wrap">"{resource.content}"</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-6 pt-4">
                      {resource.fileUrl ? (
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-4 py-6 bg-brand-900 text-white rounded-[32px] group/link hover:shadow-2xl hover:shadow-brand-900/40 transition-all duration-500 text-[11px] font-black uppercase tracking-[0.3em]"
                        >
                          <Download className="w-5 h-5" />
                          Archives
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-4 py-6 bg-stone-100 dark:bg-stone-800 text-stone-400 rounded-[32px] text-[11px] font-black uppercase tracking-[0.3em] opacity-40">
                          <FileText className="w-5 h-5" />
                          Vault
                        </div>
                      )}
                      
                      <button
                        onClick={() => onStudy(resource.title, resource.content || resource.description || "")}
                        className="flex items-center justify-center gap-4 py-6 bg-white dark:bg-white/5 text-brand-900 dark:text-stone-100 border border-stone-200 dark:border-white/10 rounded-[32px] hover:bg-stone-50 dark:hover:bg-brand-500/10 transition-all font-black uppercase tracking-[0.3em] text-[11px]"
                      >
                        <Bot className="w-5 h-5 text-brand-600" />
                        Analyze
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-950/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass rounded-[48px] p-12 w-full max-w-2xl shadow-2xl relative z-10 text-stone-900 dark:text-stone-100"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-4xl font-bold tracking-tighter italic serif-display">Sacred <span className="text-brand-600">Provision</span></h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-4">Resource Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Total Consecration Guide"
                      value={newResource.title}
                      onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                      className="w-full px-6 py-4 rounded-[24px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-4">Archive Section</label>
                    <select
                      value={newResource.category}
                      onChange={(e) => setNewResource({...newResource, category: e.target.value as Resource['category']})}
                      className="w-full px-6 py-4 rounded-[24px] font-bold"
                    >
                      <option value="Document">Canonical Document</option>
                      <option value="Rosary Guide">Rosary Guide</option>
                      <option value="Hymn">Sanctuary Hymn</option>
                      <option value="Sheet Music">Liturgical Score</option>
                      <option value="Liturgical Guide">The Order of Mass</option>
                      <option value="Scripture">Holy Scripture</option>
                      <option value="Audio">Audio Presentation</option>
                      <option value="Other">Miscellaneous</option>
                    </select>
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-4">Brief Summary</label>
                   <input
                     type="text"
                     placeholder="What is this resource about?"
                     value={newResource.description}
                     onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                     className="w-full px-6 py-4 rounded-[24px]"
                   />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-4">Key Content (Lyrics/Quotes)</label>
                  <textarea
                    value={newResource.content}
                    onChange={(e) => setNewResource({...newResource, content: e.target.value})}
                    placeholder="Provide a small preview of the content..."
                    className="w-full px-6 py-4 rounded-[32px] h-32 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-4">Archive Document Location (Drive/Cloud Storage)</label>
                  <input
                    type="url"
                    value={newResource.fileUrl}
                    onChange={(e) => setNewResource({...newResource, fileUrl: e.target.value})}
                    className="w-full px-6 py-4 rounded-[24px] font-mono text-xs"
                    placeholder="https://..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-6 bg-brand-900 text-white rounded-[32px] font-black uppercase tracking-[0.2em] hover:bg-brand-800 transition-all shadow-3xl shadow-brand-900/30 active:scale-[0.98]"
                >
                  Deposit to Sanctuary Archives
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
