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
import { Music, FileText, Play, Plus, Trash2, ExternalLink, Search, X, Book, Heart, ScrollText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResourcesProps {
  role: UserRole;
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

export default function Resources({ role }: ResourcesProps) {
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
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
           <h1 className="text-5xl font-bold tracking-tighter">Divine <span className="serif-display text-brand-600 dark:text-brand-400">Library</span>.</h1>
           <p className="text-stone-500 dark:text-stone-400 italic">"Study to show thyself approved..." — 2 Timothy 2:15</p>
        </div>
        
        {role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 bg-brand-900 text-white px-8 py-4 rounded-3xl hover:bg-brand-800 transition-all font-bold shadow-xl shadow-brand-900/20 active:scale-95 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            Publish New Content
          </button>
        )}
      </header>

      <div className="flex flex-col gap-8">
        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
            <input
              type="text"
              placeholder="Search documents, guides, or hymns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 rounded-[32px] glass focus:ring-4 ring-brand-500/10 border-white/20 transition-all font-medium"
            />
          </div>
          
          <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2.5 px-6 py-4 rounded-[24px] whitespace-nowrap transition-all font-bold text-xs uppercase tracking-widest ${
                  activeCategory === cat.id 
                    ? 'bg-brand-900 text-white shadow-xl shadow-brand-900/20' 
                    : 'glass text-stone-400 hover:text-stone-900 dark:hover:text-white border-white/10'
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredResources.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 className="col-span-full py-24 text-center glass rounded-[48px]"
               >
                  <Search className="w-16 h-16 text-stone-100 dark:text-stone-800 mx-auto mb-4" />
                  <p className="text-stone-400 font-bold tracking-widest uppercase text-xs">No records found for this search</p>
               </motion.div>
            ) : (
              filteredResources.map((resource) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={resource.id} 
                  className="glass p-10 rounded-[48px] shadow-sm hover:shadow-2xl transition-all duration-700 group relative flex flex-col h-full bg-white/50 dark:bg-stone-900/20 border-white/20"
                >
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-16 h-16 rounded-[24px] bg-brand-900 text-white flex items-center justify-center shadow-2xl shadow-brand-900/20 group-hover:rotate-6 transition-transform">
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
                  
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">
                         {resource.category}
                       </span>
                    </div>
                    <h4 className="text-3xl font-bold text-stone-900 dark:text-stone-100 leading-[1.1] tracking-tight decoration-brand-500/0 decoration-4 underline-offset-4 group-hover:decoration-brand-500/20 transition-all">
                      {resource.title}
                    </h4>
                    {resource.description && (
                      <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed line-clamp-3 font-medium">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-12 space-y-4">
                    {resource.content && (
                      <div className="p-6 bg-stone-50/50 dark:bg-black/20 rounded-[32px] border border-stone-100 dark:border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3 block">Quick Excerpt</p>
                        <p className="text-xs italic font-serif text-stone-600 dark:text-stone-400 line-clamp-3">"{resource.content}"</p>
                      </div>
                    )}
                    
                    {resource.fileUrl && (
                      <a
                        href={resource.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between w-full p-6 bg-brand-900 text-white rounded-[32px] group/link hover:bg-brand-800 transition-all duration-500 shadow-xl shadow-brand-900/10 hover:shadow-brand-900/30"
                      >
                        <span className="text-sm font-black uppercase tracking-widest">
                          Access Portal
                        </span>
                        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center group-hover/link:rotate-45 transition-transform">
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </a>
                    )}
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
                <h3 className="text-4xl font-bold tracking-tighter italic serif-display">Spiritual <span className="text-brand-600">Provision</span></h3>
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
                    <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-4">Library Section</label>
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
                  <label className="block text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 ml-4">Document Link (PDF/Drive URL)</label>
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
                  Deposit to Library
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
