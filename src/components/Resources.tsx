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
import { Music, FileText, Play, Plus, Trash2, ExternalLink, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ResourcesProps {
  role: UserRole;
}

export default function Resources({ role }: ResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    category: 'Hymn' as Resource['category'],
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
      setNewResource({ title: '', category: 'Hymn', content: '', fileUrl: '' });
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

  const filteredResources = resources.filter(r => 
    r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (category: Resource['category']) => {
    switch (category) {
      case 'Hymn': return <Music className="w-5 h-5" />;
      case 'Sheet Music': return <FileText className="w-5 h-5" />;
      case 'Audio': return <Play className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-300" />
          <input
            type="text"
            placeholder="Search hymns, sheet music, or guides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-2xl"
          />
        </div>
        {role === 'admin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 bg-brand-900 text-white px-6 py-4 rounded-2xl hover:bg-brand-800 transition-all font-bold shadow-xl shadow-brand-900/20 active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" />
            Add New Resource
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredResources.map((resource) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={resource.id} 
              className="glass p-8 rounded-[32px] shadow-sm hover:shadow-xl transition-all duration-500 group relative flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-8">
                <div className={`p-4 rounded-2xl transition-colors duration-500 ${
                  resource.category === 'Hymn' ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600' :
                  resource.category === 'Sheet Music' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' :
                  resource.category === 'Audio' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600' :
                  'bg-stone-50 dark:bg-stone-900/30 text-stone-600'
                }`}>
                  {getIcon(resource.category)}
                </div>
                {role === 'admin' && (
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="text-stone-300 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2 block">
                  {resource.category}
                </span>
                <h4 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4 leading-tight group-hover:text-brand-600 transition-colors">
                  {resource.title}
                </h4>
                {resource.content && (
                  <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed line-clamp-4 mb-8 italic font-serif">
                    "{resource.content}"
                  </p>
                )}
              </div>

              {resource.fileUrl && (
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-between w-full p-4 bg-stone-50/50 dark:bg-stone-900/50 rounded-2xl group/link hover:bg-brand-900 transition-all duration-300"
                >
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover/link:text-white transition-colors">
                    Access Resource
                  </span>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover/link:text-white transition-colors" />
                </a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass rounded-[40px] p-10 w-full max-w-xl shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">New Resource</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Title</label>
                    <input
                      required
                      type="text"
                      value={newResource.title}
                      onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Category</label>
                    <select
                      value={newResource.category}
                      onChange={(e) => setNewResource({...newResource, category: e.target.value as Resource['category']})}
                      className="w-full px-4 py-3 rounded-2xl"
                    >
                      <option value="Hymn">Hymn</option>
                      <option value="Sheet Music">Sheet Music</option>
                      <option value="Liturgical Guide">Liturgical Guide</option>
                      <option value="Audio">Audio</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Content/Lyrics Snippet</label>
                  <textarea
                    value={newResource.content}
                    onChange={(e) => setNewResource({...newResource, content: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl h-32 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">External File URL</label>
                  <input
                    type="url"
                    value={newResource.fileUrl}
                    onChange={(e) => setNewResource({...newResource, fileUrl: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl"
                    placeholder="https://..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-5 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/20 active:scale-[0.98]"
                >
                  Publish Resource
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
