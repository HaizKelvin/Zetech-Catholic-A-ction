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
import { Music, FileText, Play, Plus, Trash2, ExternalLink, Search, X, Book, Heart, ScrollText, Bot, Download, ArrowUp } from 'lucide-react';
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

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    const handleScroll = () => {
      const scrollPos = mainContent.scrollTop;
      const totalHeight = mainContent.scrollHeight - mainContent.clientHeight;
      setScrollProgress((scrollPos / totalHeight) * 100);
      setShowScrollTop(scrollPos > 400);
    };

    mainContent.addEventListener('scroll', handleScroll);
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="max-w-7xl mx-auto pb-32">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[110] pointer-events-none">
        <motion.div 
          className="h-full bg-brand-500 shadow-[0_0_10px_rgba(92,133,255,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Back to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={() => {
              const main = document.querySelector('main');
              if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="fixed bottom-10 right-10 z-[120] w-14 h-14 bg-brand-900 text-white rounded-2xl flex items-center justify-center shadow-3xl shadow-brand-900/40 hover:scale-110 active:scale-95 transition-all group"
          >
            <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-8 md:py-24 px-6 md:px-20 rounded-[24px] md:rounded-[80px] overflow-hidden bg-brand-950 text-white shadow-2xl shadow-brand-900/20 mb-6 md:mb-16 mx-2 md:mx-0"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548625361-9878235272a0?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover mix-blend-overlay opacity-30"
            alt="Library"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/60 to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-12">
          <div className="space-y-4 md:space-y-8 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full glass-dark border border-white/10 text-[9px] md:text-sm font-bold uppercase tracking-[0.2em] text-brand-300 shadow-xl backdrop-blur-xl"
            >
              Sanctuary Repository
            </motion.div>
            
            <h1 className="text-3xl md:text-8xl font-black tracking-tight leading-[0.9] text-white serif-display italic">
              Divine <br />
              <span className="text-brand-400 not-italic uppercase font-black text-lg md:text-5xl tracking-[0.2em] md:tracking-[0.4em] block mt-1 md:mt-4">Library</span>
            </h1>
            
            <p className="hidden md:block text-stone-300 text-xl font-light max-w-2xl leading-relaxed serif-display opacity-80 italic">
              Explore the curated archives of hymnals, liturgical guides, and spiritual manuscripts.
            </p>
          </div>
          
          {role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-3 bg-brand-600 text-white px-6 py-3.5 md:px-12 md:py-6 rounded-xl md:rounded-full hover:bg-brand-500 transition-all font-bold uppercase tracking-[0.1em] shadow-xl shadow-brand-600/30 text-[10px] md:text-xs"
            >
              <Plus className="w-4 h-4 md:w-6 md:h-6" />
              Deposit Wisdom
            </motion.button>
          )}
        </div>
      </motion.header>

      <div className="flex flex-col gap-8 px-4 md:px-0">
        {/* Search & Filter Bar */}
        <div className="sticky top-0 z-50 flex flex-col gap-3 py-2 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md">
          <div className="max-w-xl mx-auto w-full px-2">
            <div className="relative group">
              <div className="relative glass rounded-xl p-0.5 border border-stone-200 dark:border-white/10 shadow-lg">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-brand-600/50" />
                  <input
                    type="text"
                    placeholder="Search archives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 text-xs md:text-sm outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative flex justify-center">
            <div className="flex overflow-x-auto gap-2 pb-1 no-scrollbar scroll-smooth px-4 md:px-0 mask-fade-edges max-w-full">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all font-bold text-[10px] md:text-sm tracking-tight border shadow-sm ${
                    activeCategory === cat.id 
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/30' 
                      : 'bg-white dark:bg-white/5 text-brand-600 dark:text-brand-400 hover:text-brand-800 border-brand-100 dark:border-white/10 hover:border-brand-300'
                  }`}
                >
                  <span className={`${activeCategory === cat.id ? 'opacity-100' : 'opacity-60'} w-3 h-3 flex items-center justify-center`}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          <AnimatePresence mode="popLayout">
            {/* Spiritual Guide CTA Card */}
            <motion.div
              layout
              key="divine-study-ai-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-1 glass-dark rounded-3xl md:rounded-[40px] p-8 md:p-12 border border-brand-500/20 bg-brand-950 text-white flex flex-col justify-between group relative overflow-hidden shadow-2xl min-h-[320px]"
            >
              <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/10 backdrop-blur-3xl text-white flex items-center justify-center shadow-inner mb-6 md:mb-10 group-hover:scale-105 transition-transform duration-500">
                  <Bot className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6 tracking-tight leading-tight italic serif-display">
                  Divine <br />
                  <span className="text-brand-300 not-italic font-black uppercase tracking-widest text-[10px] md:text-xs">AI Assistant</span>
                </h3>
                <p className="text-sm md:text-base text-stone-400 font-light leading-relaxed mb-6 md:mb-8 serif-display italic opacity-80">
                  Deep-dive into sacred archives for spiritual edification.
                </p>
                <div className="flex items-center gap-2 md:gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 w-fit">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-emerald-200">System Ready</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ x: 5 }}
                onClick={() => onStudy("General Assistance", "I need help understanding these archives.")}
                className="mt-10 text-[11px] md:text-xs font-black uppercase tracking-widest text-brand-400 flex items-center gap-3 transition-colors hover:text-brand-300"
              >
                Summon Assistant →
              </motion.button>
            </motion.div>

            {filteredResources.length === 0 ? (
               <motion.div 
                 key="no-resources-found"
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="col-span-full py-32 text-center glass rounded-[40px] border-dashed border-stone-200 dark:border-stone-800"
               >
                  <Search className="w-16 h-16 text-stone-200 dark:text-stone-900 mx-auto mb-6" />
                  <p className="text-stone-400 font-bold tracking-[0.2em] uppercase text-sm">Silence in the archives</p>
               </motion.div>
            ) : (
              filteredResources.map((resource) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={resource.id}
                  className="glass p-6 md:p-10 group relative flex flex-col h-full bg-white dark:bg-stone-900/10 border border-stone-100 dark:border-white/5 hover:border-brand-500/50 shadow-xl rounded-3xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-stone-50 dark:bg-white/5 text-brand-900 dark:text-white flex items-center justify-center shadow-inner group-hover:bg-brand-900 group-hover:text-white transition-all duration-300 border border-stone-100 dark:border-white/10">
                      {getIcon(resource.category)}
                    </div>
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-stone-300 hover:text-red-500 transition-all p-2 bg-stone-50 dark:bg-white/5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 inline-block bg-brand-50 dark:bg-brand-500/10 px-3 py-1 rounded-full">
                         {resource.category}
                       </span>
                    </div>
                    <h4 className="text-2xl font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tight serif-display">
                      {resource.title}
                    </h4>
                    {resource.description && (
                      <p className="text-sm md:text-base text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3 font-light serif-display italic">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-8 space-y-4">
                    {resource.content && (
                      <div className="p-4 bg-stone-50 dark:bg-black/20 rounded-2xl border border-stone-100 dark:border-white/5 relative overflow-hidden">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Insight Preview</p>
                        <p className="text-sm italic font-serif text-stone-950 dark:text-stone-100 line-clamp-2 leading-relaxed opacity-90">"{resource.content}"</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {resource.fileUrl ? (
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-4 bg-brand-900 text-white rounded-xl hover:bg-brand-800 transition-colors text-[11px] font-bold uppercase tracking-widest shadow-md"
                        >
                          <Download className="w-4 h-4" />
                          Archives
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-4 bg-stone-50 dark:bg-stone-900 text-stone-300 rounded-xl text-[11px] font-bold uppercase tracking-widest opacity-50">
                          <FileText className="w-4 h-4" />
                          Vault
                        </div>
                      )}
                      
                      <button
                        onClick={() => onStudy(resource.title, resource.content || resource.description || "")}
                        className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-white/5 text-brand-900 dark:text-stone-100 border border-stone-200 dark:border-white/10 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-all font-bold uppercase tracking-widest text-[11px] shadow-sm"
                      >
                        <Bot className="w-4 h-4" />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-stone-950/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass rounded-[32px] md:rounded-[48px] p-6 md:p-12 w-full max-w-2xl shadow-2xl relative z-10 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-6 md:mb-10">
                <h3 className="text-2xl md:text-4xl font-bold tracking-tighter italic serif-display">Sacred <span className="text-brand-600">Provision</span></h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 bg-stone-50 dark:bg-white/5 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div>
                    <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 md:mb-2 ml-4">Resource Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Total Consecration Guide"
                      value={newResource.title}
                      onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                      className="w-full px-4 md:px-6 py-3 md:py-4 rounded-[18px] md:rounded-[24px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 md:mb-2 ml-4">Archive Section</label>
                    <select
                      value={newResource.category}
                      onChange={(e) => setNewResource({...newResource, category: e.target.value as Resource['category']})}
                      className="w-full px-4 md:px-6 py-3 md:py-4 rounded-[18px] md:rounded-[24px] font-bold"
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
                   <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 md:mb-2 ml-4">Brief Summary</label>
                   <input
                     type="text"
                     placeholder="What is this resource about?"
                     value={newResource.description}
                     onChange={(e) => setNewResource({...newResource, description: e.target.value})}
                     className="w-full px-4 md:px-6 py-3 md:py-4 rounded-[18px] md:rounded-[24px]"
                   />
                </div>

                <div>
                  <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 md:mb-2 ml-4">Key Content (Lyrics/Quotes)</label>
                  <textarea
                    value={newResource.content}
                    onChange={(e) => setNewResource({...newResource, content: e.target.value})}
                    placeholder="Provide a small preview of the content..."
                    className="w-full px-4 md:px-6 py-3 md:py-4 rounded-[24px] md:rounded-[32px] h-24 md:h-32 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-400 mb-1.5 md:mb-2 ml-4">Archive Document Location</label>
                  <input
                    type="url"
                    value={newResource.fileUrl}
                    onChange={(e) => setNewResource({...newResource, fileUrl: e.target.value})}
                    className="w-full px-4 md:px-6 py-3 md:py-4 rounded-[18px] md:rounded-[24px] font-mono text-[10px]"
                    placeholder="https://..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 md:py-6 bg-brand-900 text-white rounded-[24px] md:rounded-[32px] font-black uppercase tracking-[0.2em] hover:bg-brand-800 transition-all shadow-3xl shadow-brand-900/30 active:scale-[0.98] text-[10px] md:text-base"
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
