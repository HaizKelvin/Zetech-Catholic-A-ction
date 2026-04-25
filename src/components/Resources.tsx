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
    <div className="max-w-7xl mx-auto space-y-16 lg:space-y-32 pb-32">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-16 md:py-32 px-8 md:px-24 rounded-[48px] md:rounded-[80px] overflow-hidden bg-stone-950 text-white shadow-3xl shadow-brand-900/10 group mb-12"
      >
        <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-brand-500/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-[8rem] font-black tracking-tighter italic serif-display leading-[0.8]">Sacred <span className="text-brand-600 dark:text-brand-500 not-italic uppercase font-black text-2xl md:text-3xl tracking-[0.3em] block mt-4">Archives</span></h1>
            <div className="flex items-center gap-6">
              <p className="text-stone-400 font-serif italic text-lg md:text-2xl opacity-80 pl-10 border-l-2 border-brand-500/30">Hymnals, guides, and divine manuscripts.</p>
            </div>
          </div>
          {role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="w-full md:w-auto flex items-center justify-center gap-4 bg-brand-900 text-white px-8 py-5 rounded-[28px] hover:bg-brand-800 transition-all font-black uppercase tracking-[0.2em] shadow-3xl shadow-brand-900/40 text-[10px]"
            >
              <Plus className="w-4 h-4" />
              Deposit New Revelation
            </motion.button>
          )}
        </div>
      </motion.header>

      <div className="flex flex-col gap-12 lg:gap-20">
        {/* Search & Filter Bar */}
        <div className="p-2 lg:p-4 glass rounded-[48px] bg-white/20 dark:bg-black/10 shadow-2xl flex flex-col gap-4 lg:gap-6 border border-white/20">
          <div className="relative flex-1">
            <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-brand-600/40" />
            <input
              type="text"
              placeholder="Search documents, guides, or hymns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-20 pr-10 py-8 rounded-[40px] bg-transparent border-none text-xl md:text-2xl outline-none placeholder:text-stone-300 font-bold tracking-tight"
            />
          </div>
          
          <div className="flex overflow-x-auto gap-3 px-4 pb-4 custom-scrollbar no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-3 px-8 py-5 rounded-[28px] whitespace-nowrap transition-all font-black text-[10px] uppercase tracking-[0.3em] backdrop-blur-2xl ${
                  activeCategory === cat.id 
                    ? 'bg-brand-900 text-white shadow-2xl shadow-brand-900/50 scale-105' 
                    : 'bg-white/40 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-white/80 dark:hover:bg-white/10 hover:text-brand-600 border border-white/20'
                }`}
              >
                <span className={activeCategory === cat.id ? 'animate-float' : ''}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
          <AnimatePresence mode="popLayout">
            {/* Spiritual Guide CTA Card */}
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-1 glass rounded-[56px] p-12 lg:p-16 border-2 border-brand-500/20 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 text-white flex flex-col justify-between group relative h-full overflow-hidden shadow-3xl shadow-brand-900/40"
            >
              <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-500/20 blur-[120px] rounded-full animate-pulse" />
              
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-[32px] bg-white/20 backdrop-blur-3xl text-white flex items-center justify-center shadow-inner mb-12 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                  <Bot className="w-10 h-10" />
                </div>
                <h3 className="text-4xl lg:text-5xl font-bold mb-8 tracking-tighter leading-[1.1] italic serif-display">
                  Divine Study <br />
                  <span className="text-brand-300 not-italic font-black uppercase tracking-[0.2em] text-xs">AI Assistant</span>
                </h3>
                <p className="text-sm lg:text-base text-stone-200/80 font-medium leading-relaxed mb-10">
                  Perplexed by a sacred text? Our spiritual assistant can analyze any archive for your edification.
                </p>
                <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 w-fit shadow-2xl">
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400 relative" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">AI Analysis Active</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ x: 10 }}
                onClick={() => onStudy("General Assistance", "I need help understanding these archives.")}
                className="mt-16 text-[11px] font-black uppercase tracking-[0.5em] text-white flex items-center gap-4 group/btn"
              >
                Summon Assistant 
                <span className="group-hover/btn:translate-x-2 transition-transform">→</span>
              </motion.button>
            </motion.div>

            {filteredResources.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="col-span-full py-32 text-center glass-card border-dashed border-stone-200 dark:border-stone-800"
               >
                  <Search className="w-20 h-20 text-stone-100 dark:text-stone-800 mx-auto mb-6" />
                  <p className="text-stone-400 font-black tracking-[0.3em] uppercase text-[10px]">No archives matching your search</p>
               </motion.div>
            ) : (
              filteredResources.map((resource) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={resource.id} 
                  className="glass-card p-10 group relative flex flex-col h-full bg-stone-100/30 dark:bg-stone-900/10 border-subtle hover:border-brand-500/20 shadow-xl"
                >
                  <div className="flex items-start justify-between mb-10">
                    <div className="w-16 h-16 rounded-[24px] bg-stone-100 dark:bg-white/5 text-stone-900 dark:text-white flex items-center justify-center shadow-inner group-hover:bg-brand-900 group-hover:text-white transition-all duration-500 group-hover:rotate-3">
                      {getIcon(resource.category)}
                    </div>
                    {role === 'admin' && (
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all p-3 rounded-2xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-6">
                    <div className="space-y-1">
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400 inline-block">
                         {resource.category}
                       </span>
                       <div className="h-0.5 w-8 bg-stone-100 dark:bg-white/5 group-hover:w-full group-hover:bg-brand-500/20 transition-all duration-700" />
                    </div>
                    <h4 className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-[1.1] tracking-tighter serif-display group-hover:text-brand-900 dark:group-hover:text-brand-400 transition-colors">
                      {resource.title}
                    </h4>
                    {resource.description && (
                      <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed line-clamp-3 font-medium italic">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-12 space-y-5">
                    {resource.content && (
                      <div className="p-6 bg-stone-50/50 dark:bg-black/20 rounded-[28px] border border-stone-100 dark:border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                           <Book className="w-12 h-12" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-stone-900 dark:text-stone-300 mb-3">Manifest Summary</p>
                        <p className="text-xs italic font-serif text-stone-900 dark:text-stone-100 line-clamp-4 leading-relaxed whitespace-pre-wrap">"{resource.content}"</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {resource.fileUrl ? (
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-3 py-5 bg-brand-900 text-white rounded-[24px] group/link hover:shadow-xl transition-all duration-500 text-[10px] font-black uppercase tracking-widest"
                        >
                          <Download className="w-4 h-4" />
                          Document
                        </a>
                      ) : (
                        <div className="flex items-center justify-center gap-3 py-5 bg-stone-200 dark:bg-stone-800 text-stone-400 rounded-[24px] text-[10px] font-black uppercase tracking-widest">
                          <FileText className="w-4 h-4" />
                          Archive
                        </div>
                      )}
                      
                      <button
                        onClick={() => onStudy(resource.title, resource.content || resource.description || "")}
                        className="flex items-center justify-center gap-3 py-5 bg-white dark:bg-white/5 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-white/10 rounded-[24px] hover:bg-stone-50 dark:hover:bg-white/10 transition-all font-black uppercase tracking-widest text-[10px]"
                      >
                        <Bot className="w-4 h-4 text-brand-600" />
                        Study AI
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
