import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  doc,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Event, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { Calendar, MapPin, Clock, Plus, Trash2, X, Bell, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getDocs, writeBatch } from 'firebase/firestore';

export default function Events({ isAdmin }: { isAdmin: boolean }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', description: '' });

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'events');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const dateTime = new Date(`${form.date}T${form.time || '00:00'}`);
      await addDoc(collection(db, 'events'), {
        title: form.title,
        date: Timestamp.fromDate(dateTime),
        location: form.location,
        description: form.description,
        createdAt: serverTimestamp()
      });
      setShowAdd(false);
      setForm({ title: '', date: '', time: '', location: '', description: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete event?')) return;
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  };

  const handleDeleteExpired = async () => {
    if (!isAdmin || !window.confirm('Delete all past events?')) return;
    const now = new Date();
    const expiredEvents = events.filter(ev => ev.date?.toDate() < now);
    
    if (expiredEvents.length === 0) {
      alert('No expired events found.');
      return;
    }

    try {
      const batch = writeBatch(db);
      expiredEvents.forEach(ev => {
        batch.delete(doc(db, 'events', ev.id));
      });
      await batch.commit();
      alert(`Deleted ${expiredEvents.length} expired events.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'events_cleanup');
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
            <h1 className="text-5xl md:text-[8rem] font-black tracking-tighter italic serif-display leading-[0.8]">Sacred <span className="text-brand-600 dark:text-brand-500 not-italic uppercase font-black text-2xl md:text-3xl tracking-[0.3em] block mt-4">Gatherings</span></h1>
            <div className="flex items-center gap-6">
              <p className="text-stone-400 font-serif italic text-lg md:text-2xl opacity-80 pl-10 border-l-2 border-brand-500/30">Liturgy, fellowship, and divine movement.</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-6 w-full md:w-auto">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                onClick={handleDeleteExpired}
                className="flex-1 md:flex-none justify-center bg-white/5 border border-white/10 text-stone-300 px-8 py-5 rounded-[28px] font-black uppercase tracking-[0.3em] text-[10px] backdrop-blur-xl hover:bg-white/10 transition-all"
              >
                Clear Past
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowAdd(true)}
                className="flex-1 md:flex-none justify-center bg-brand-900 text-white px-8 py-5 rounded-[28px] font-black uppercase tracking-[0.3em] text-[10px] shadow-3xl shadow-brand-900/40 hover:bg-brand-800 transition-all"
              >
                Post Event
              </motion.button>
            </div>
          )}
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-12 lg:gap-20">
        <AnimatePresence>
          {events.length === 0 ? (
            <div className="text-center py-24 glass rounded-[40px]">
               <Calendar className="w-16 h-16 text-stone-100 dark:text-stone-800 mx-auto mb-4" />
               <p className="text-stone-400 font-medium tracking-wide italic">No scheduled events at the moment.</p>
            </div>
          ) : (
            events.map((ev) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={ev.id}
                className="glass p-8 md:p-12 rounded-[40px] shadow-sm flex flex-col md:flex-row gap-12 group hover:shadow-xl transition-all duration-500"
              >
        <div className="md:w-48 shrink-0 flex flex-col items-center justify-center p-8 bg-brand-50 dark:bg-brand-900/30 rounded-[32px] text-brand-900 dark:text-brand-400 group-hover:bg-brand-900 group-hover:text-stone-100 transition-colors duration-500">
                  <span className="text-xs font-black uppercase tracking-[0.2em] mb-2">{ev.date?.toDate().toLocaleDateString(undefined, { month: 'short' })}</span>
                  <span className="text-6xl font-bold tracking-tighter">{ev.date?.toDate().getDate()}</span>
                  <span className="text-xs font-bold mt-2">{ev.date?.toDate().getFullYear()}</span>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-3xl font-bold text-stone-900 dark:text-stone-100">{ev.title}</h3>
                    {isAdmin && (
                      <button onClick={() => handleDelete(ev.id)} className="text-stone-300 hover:text-red-500 transition-colors p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-6 text-sm font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-600" />
                      {ev.date?.toDate().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-600" />
                      {ev.location}
                    </div>
                  </div>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">{ev.description}</p>
                  <button className="flex items-center gap-2 text-brand-600 font-bold text-sm uppercase tracking-widest group/btn border-b-2 border-brand-100 dark:border-brand-900/30 pb-1 hover:border-brand-600 transition-all">
                    Set Reminder
                    <Bell className="w-4 h-4 group-hover/btn:animate-bounce" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass p-10 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] rounded-[40px]"
            >
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">New Event</h3>
                <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <input required type="text" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-6 py-4 rounded-2xl" />
                <div className="grid grid-cols-2 gap-4">
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="px-6 py-4 rounded-2xl" />
                  <input type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="px-6 py-4 rounded-2xl" />
                </div>
                <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full px-6 py-4 rounded-2xl" />
                <textarea placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-6 py-4 rounded-2xl h-32 resize-none" />
                <button type="submit" className="w-full py-5 bg-brand-900 text-white rounded-3xl font-bold shadow-xl shadow-brand-900/20">Publish Event</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
