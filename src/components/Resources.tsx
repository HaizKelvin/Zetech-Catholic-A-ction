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
import { Music, FileText, Play, Plus, Trash2, ExternalLink, Search, X, Book, Heart, ScrollText, Bot, Download, ArrowUp, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
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
  const [isFullWidth, setIsFullWidth] = useState(false);
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
    <div className={`${isFullWidth ? 'max-w-[98%] px-6' : 'max-w-7xl px-4'} mx-auto pb-32 transition-all duration-700 ease-in-out`}>
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
        className="relative py-12 md:py-32 px-6 md:px-28 rounded-[32px] md:rounded-[80px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-6 md:mb-12 mx-2 md:mx-0 transition-all duration-700"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548625361-9878235272a0?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover mix-blend-overlay opacity-30 scale-110 group-hover:scale-100 transition-transform duration-[15s]"
            alt="Library"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/60 to-transparent" />
          <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand-500/10 blur-[180px] rounded-full -mr-96 -mt-96" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-10 md:gap-14 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 md:px-8 md:py-3 rounded-full glass-dark border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-brand-300 shadow-2xl backdrop-blur-xl w-fit"
          >
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-400 shadow-[0_0_12px_rgba(92,133,255,1)]" />
            Sacred Repository
          </motion.div>
          
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-4xl md:text-[8rem] font-black tracking-[-0.05em] leading-tight md:leading-[0.8] text-white">
              Divine <br />
              <span className="serif-display italic font-light text-brand-400 lowercase drop-shadow-3xl">Library</span>
            </h1>
            
            <p className="text-stone-400 text-base md:text-2xl font-light max-w-2xl leading-relaxed italic serif-display opacity-80">
              Explore the curated archives of hymnals, liturgical guides, and spiritual manuscripts.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {role === 'admin' && (
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="flex flex-1 md:flex-none items-center justify-center gap-4 bg-brand-600 text-white px-8 py-5 md:px-10 md:py-6 rounded-[24px] md:rounded-[32px] hover:bg-brand-500 transition-all font-black uppercase tracking-[0.3em] shadow-3xl shadow-brand-600/40 text-[10px] md:text-[11px]"
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                Deposit Wisdom
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFullWidth(!isFullWidth)}
              className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-md text-white px-8 py-5 md:px-10 md:py-6 rounded-[24px] md:rounded-[32px] hover:bg-white/20 transition-all font-black uppercase tracking-[0.3em] border border-white/10 text-[10px] md:text-[11px]"
            >
              {isFullWidth ? (
                <>
                  <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
                  Minimize View
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
                  Maximize View
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="flex flex-col gap-8 px-4 md:px-0">
        {/* Search & Filter Bar */}
        <div className="sticky top-0 z-50 flex flex-col gap-4 py-8 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md">
          <div className="max-w-2xl mx-auto w-full px-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-brand-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative glass rounded-[24px] md:rounded-[40px] p-2 border border-stone-100 dark:border-white/5 shadow-2xl transition-all duration-500">
                <div className="relative flex items-center">
                  <Search className="absolute left-6 w-6 h-6 text-brand-600/50" />
                  <input
                    type="text"
                    placeholder="Search spiritual archives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 rounded-[18px] md:rounded-[32px] bg-stone-50/50 dark:bg-black/20 text-base md:text-2xl outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600 font-medium transition-all focus:bg-white dark:focus:bg-black/40"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative flex justify-center">
            <div className="flex overflow-x-auto gap-3 md:gap-6 pb-4 no-scrollbar scroll-smooth px-6 md:px-0 mask-fade-edges max-w-full">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 rounded-full whitespace-nowrap transition-all font-black text-[10px] md:text-[12px] uppercase tracking-[0.4em] border shadow-sm ${
                    activeCategory === cat.id 
                      ? 'bg-brand-900 text-white border-brand-900 shadow-2xl shadow-brand-950/30 scale-105' 
                      : 'bg-white dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:text-brand-900 border-stone-100 dark:border-white/10 hover:border-brand-500/30'
                  }`}
                >
                  <span className={`${activeCategory === cat.id ? 'scale-110' : 'opacity-40'} transition-transform`}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        <div className={`grid grid-cols-1 ${isFullWidth ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'} gap-8 md:gap-12 px-2 md:px-0 transition-all duration-700`}>
          <AnimatePresence mode="popLayout">
            {/* Spiritual Guide CTA Card */}
            <motion.div
              layout
              key="divine-study-ai-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-1 glass-dark rounded-[40px] md:rounded-[60px] p-8 md:p-16 border border-brand-500/20 bg-brand-950 text-white flex flex-col justify-between group relative overflow-hidden shadow-3xl min-h-[400px] md:min-h-[500px]"
            >
              <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
              
              <div className="relative z-10 space-y-6 md:space-y-10">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-[28px] md:rounded-[40px] bg-white/10 backdrop-blur-3xl text-white flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                  <Bot className="w-8 h-8 md:w-12 md:h-12" />
                </div>
                <div>
                  <h3 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 tracking-tight leading-none italic serif-display">
                    Divine <br />
                    <span className="text-brand-400 not-italic font-black uppercase tracking-[0.4em] text-[10px] md:text-xs">AI Assistant</span>
                  </h3>
                  <p className="text-sm md:text-lg text-stone-400 font-light leading-relaxed serif-display italic opacity-80">
                    Deep-dive into sacred archives for spiritual edification and biblical clarity.
                  </p>
                </div>
                <div className="flex items-center gap-3 md:gap-4 px-6 py-2.5 md:px-8 md:py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 w-fit">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-emerald-200">System Ready</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ x: 10 }}
                onClick={() => onStudy("General Assistance", "I need help understanding these archives.")}
                className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-400 flex items-center gap-4 transition-all hover:text-brand-300"
              >
                Summon Assistant <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>

            {filteredResources.length === 0 ? (
               <motion.div 
                 key="no-resources-found"
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="col-span-full py-40 text-center bg-stone-50 dark:bg-stone-900/20 rounded-[40px] md:rounded-[80px] border-2 border-dashed border-stone-200 dark:border-stone-800"
               >
                  <Search className="w-20 h-20 text-stone-200 dark:text-stone-900 mx-auto mb-8" />
                  <p className="text-stone-400 font-black tracking-[0.4em] uppercase text-sm">Silence in the archives</p>
               </motion.div>
            ) : (
              filteredResources.map((resource) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={resource.id}
                  className="bg-white dark:bg-stone-900/40 p-8 md:p-14 group relative flex flex-col h-full border border-stone-100 dark:border-white/5 hover:border-brand-500/30 shadow-2xl rounded-[40px] md:rounded-[90px] transition-all duration-700"
                >
                  <div className="flex items-start justify-between mb-8 md:mb-16">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center rounded-[24px] md:rounded-[28px] shadow-sm group-hover:rotate-6 transition-transform duration-500">
                      <div className="text-brand-600 dark:text-brand-400">
                        {getIcon(resource.category)}
                      </div>
                    </div>
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-stone-300 hover:text-red-500 transition-all p-4 bg-stone-50 dark:bg-white/5 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-6 md:space-y-10">
                    <div className="space-y-2">
                       <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.6em] text-stone-400 dark:text-brand-300/30">
                         {resource.category}
                       </span>
                    </div>
                    <h4 className="text-3xl md:text-5xl font-black text-stone-900 dark:text-white leading-tight tracking-tighter serif-display">
                      {resource.title}
                    </h4>
                    {resource.description && (
                      <p className="text-stone-500 dark:text-stone-400 text-sm md:text-xl leading-relaxed serif-display italic opacity-80">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-10 md:mt-20 space-y-6 md:space-y-10">
                    {resource.content && (
                      <div className="p-8 md:p-12 bg-stone-50 dark:bg-stone-950/80 rounded-[40px] md:rounded-[60px] border border-stone-100 dark:border-white/5 relative overflow-hidden group/preview shadow-inner">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/preview:rotate-12 transition-transform duration-1000">
                           <ScrollText className="w-20 h-20 md:w-32 md:h-32" />
                        </div>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 mb-6">Scripture Preview</p>
                        <p className="text-lg md:text-2xl italic font-serif text-stone-950 dark:text-stone-100 line-clamp-4 leading-relaxed opacity-90">
                          "{resource.content}"
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-4">
                      {resource.fileUrl ? (
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 py-6 bg-brand-900 text-white rounded-[28px] md:rounded-[36px] hover:bg-brand-800 transition-all font-black uppercase tracking-[0.4em] text-[10px] md:text-[11px] shadow-3xl shadow-brand-900/40 active:scale-[0.98]"
                        >
                          <Download className="w-5 h-5 md:w-6 md:h-6" />
                          Vault
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-3 py-6 bg-stone-50 dark:bg-stone-900/50 text-stone-300 rounded-[28px] md:rounded-[36px] text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] opacity-40 border border-dashed border-stone-200">
                          <FileText className="w-5 h-5 md:w-6 md:h-6" />
                          Restricted
                        </div>
                      )}
                      
                      <button
                        onClick={() => onStudy(resource.title, resource.content || resource.description || "")}
                        className="flex items-center justify-center gap-3 py-6 bg-white dark:bg-white/5 text-brand-600 dark:text-brand-400 font-black tracking-[0.4em] text-[10px] rounded-[28px] border border-stone-100 dark:border-white/10 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all shadow-sm"
                      >
                        <Bot className="w-5 h-5 md:w-6 md:h-6" />
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
