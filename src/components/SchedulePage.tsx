import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Download, 
  Bell, 
  Trash2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationManager } from '../lib/notifications';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';

interface Activity {
  id: string;
  title: string;
  description: string;
  date: any; // Timestamp
  location: string;
  type: 'Mass' | 'Meeting' | 'Social' | 'Other';
  downloadUrl?: string;
  addedBy: string;
}

export default function SchedulePage({ isAdmin, user }: { isAdmin: boolean, user: any }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'Meeting' as const,
    downloadUrl: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'schedule'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
      setActivities(docs);
      
      // Check for notifications
      checkUpcomingActivities(docs);
    });
    return unsubscribe;
  }, []);

  const checkUpcomingActivities = (docs: Activity[]) => {
    const now = new Date();
    docs.forEach(activity => {
      const activityDate = activity.date instanceof Timestamp ? activity.date.toDate() : new Date(activity.date);
      const diff = activityDate.getTime() - now.getTime();
      const minutes = diff / (1000 * 60);

      // Notify if within 30 minutes and not in the past
      if (minutes > 0 && minutes <= 30) {
        const notifiedKey = `notified_${activity.id}`;
        if (!localStorage.getItem(notifiedKey)) {
          NotificationManager.sendNotification('Upcoming Activity', {
            body: `${activity.title} is starting in ${Math.round(minutes)} minutes at ${activity.location}.`
          });
          localStorage.setItem(notifiedKey, 'true');
        }
      }
    });
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'schedule'), {
        ...newActivity,
        date: Timestamp.fromDate(new Date(newActivity.date)),
        addedBy: user.displayName || 'Admin',
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewActivity({ title: '', description: '', date: '', location: '', type: 'Meeting', downloadUrl: '' });
    } catch (error) {
      console.error("Error adding activity:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this activity from the schedule?')) {
      await deleteDoc(doc(db, 'schedule', id));
    }
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const getActivitiesForDay = (day: Date) => {
    return activities.filter(a => {
      const aDate = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
      return isSameDay(aDate, day);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 text-stone-900 dark:text-stone-100">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-8 md:py-24 px-6 md:px-12 rounded-[24px] md:rounded-[48px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-6 md:mb-12 mx-2 md:mx-0"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1506784919141-935043324940?q=80&w=2670&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20 transform group-hover:scale-110 transition-transform duration-[3s]" 
            alt="Schedule"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 max-w-full">
          <div className="space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark border border-white/10 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-300 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
              Community Timeline
            </motion.div>
            
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight text-white serif-display">
              Sacred <br />
              <span className="serif-display italic font-light text-emerald-400 lowercase">Schedule</span>
            </h1>
            
            <p className="text-stone-400 text-sm md:text-xl font-light max-w-xl leading-relaxed italic serif-display opacity-80">
              Align your spirit with the rhythms of our community. Semester plans and daily liturgy.
            </p>
          </div>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddModalOpen(true)}
              className="w-full md:w-auto flex items-center justify-center gap-3 bg-emerald-600 text-white px-6 py-4 md:px-8 md:py-5 rounded-2xl md:rounded-3xl hover:bg-emerald-500 transition-all font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/30 text-[9px] md:text-[10px]"
            >
              <Plus className="w-4 h-4" />
              Schedule Event
            </motion.button>
          )}
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
        {/* Calendar Side */}
        <div className="lg:col-span-8 space-y-8">
          <div className="glass rounded-[32px] md:rounded-[48px] p-6 md:p-10 border border-brand-500/10 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight serif-display">{format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-3 bg-stone-100 dark:bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-stone-200 dark:border-white/5"
                >
                  <ChevronLeft className="w-5 h-5 text-stone-500" />
                </button>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-3 bg-stone-100 dark:bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-stone-200 dark:border-white/5"
                >
                  <ChevronRight className="w-5 h-5 text-stone-500" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 md:gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-stone-400 py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayActivities = getActivitiesForDay(day);
                return (
                  <motion.div
                    key={day.toString()}
                    whileHover={{ y: -2 }}
                    className={`min-h-[100px] md:min-h-[140px] p-2 md:p-4 rounded-2xl md:rounded-3xl border transition-all relative group ${
                      !isSameMonth(day, monthStart) 
                        ? 'opacity-20 pointer-events-none' 
                        : isToday(day)
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : 'bg-white/40 dark:bg-white/5 border-stone-100 dark:border-white/5 hover:border-brand-500/30'
                    }`}
                  >
                    <span className={`text-xs font-black ${isToday(day) ? 'text-emerald-500' : 'text-stone-500'}`}>
                      {format(day, 'd')}
                    </span>
                    
                    <div className="mt-2 space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
                      {dayActivities.map(act => (
                        <div 
                          key={act.id} 
                          className="px-2 py-1 bg-stone-900 dark:bg-emerald-500 text-white dark:text-black rounded-lg text-[8px] font-bold truncate tracking-wide"
                          title={act.title}
                        >
                          {act.title}
                        </div>
                      ))}
                    </div>

                    {dayActivities.length > 0 && (
                      <div className="absolute inset-x-0 bottom-2 flex justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info Side */}
        <div className="lg:col-span-4 space-y-8">
          {/* Upcoming Card */}
          <div className="glass rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black uppercase tracking-tight serif-display">Coming <span className="text-emerald-500">Fast</span></h3>
                <Bell className="w-5 h-5 text-emerald-500 animate-bounce" />
              </div>
              
              <div className="space-y-6">
                {activities.length === 0 && (
                   <p className="text-sm text-stone-500 italic">No scheduled activities for now. Reflect and stay patient.</p>
                )}
                {activities.filter(a => {
                  const date = a.date instanceof Timestamp ? a.date.toDate() : new Date(a.date);
                  return date > new Date();
                }).slice(0, 3).map(act => (
                  <div key={act.id} className="relative pl-6 border-l-2 border-emerald-500/30">
                    <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">
                      {format(act.date instanceof Timestamp ? act.date.toDate() : new Date(act.date), 'MMM d • HH:mm')}
                    </p>
                    <h4 className="font-bold text-stone-900 dark:text-white leading-tight mb-1">{act.title}</h4>
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                       <MapPin className="w-3 h-3" /> {act.location}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="pt-6 border-t border-white/5">
                <button className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                  Notify Me for All
                </button>
              </div>
            </div>
          </div>

          {/* Downloads Card */}
          <div className="glass rounded-[32px] p-8 border border-white/10 shadow-xl">
            <h3 className="text-xl font-black uppercase tracking-tight serif-display mb-6">Archive <span className="text-indigo-500">Scrolls</span></h3>
            <div className="space-y-4">
              {activities.filter(a => a.downloadUrl).map(act => (
                <div key={act.id} className="flex items-center justify-between p-4 bg-stone-100 dark:bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{act.type} Plan</p>
                      <p className="text-sm font-bold text-stone-900 dark:text-white truncate max-w-[120px]">{act.title}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => act.downloadUrl && window.open(act.downloadUrl, '_blank')}
                    className="p-3 bg-stone-900 dark:bg-white text-white dark:text-black rounded-xl hover:scale-110 transition-all"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {activities.filter(a => a.downloadUrl).length === 0 && (
                <div className="text-center py-12 opacity-30 italic">
                  <Download className="w-8 h-8 mx-auto mb-4" />
                  <p className="text-sm">No downloadable schedules yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-stone-900 border border-white/10 w-full max-w-xl rounded-[40px] shadow-3xl overflow-hidden p-8 md:p-12 relative"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight italic serif-display">Prophetic <span className="text-emerald-500 not-italic">Timing</span></h2>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-2">New Schedule Entry</p>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-white/5 rounded-2xl text-stone-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddActivity} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-4">Event Vision</label>
                    <input
                      required
                      type="text"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm text-white"
                      placeholder="e.g. Choir Rehearsal"
                      value={newActivity.title}
                      onChange={e => setNewActivity({...newActivity, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-4">Appointed Hour</label>
                    <input
                      required
                      type="datetime-local"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm text-white"
                      value={newActivity.date}
                      onChange={e => setNewActivity({...newActivity, date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-4">Sanctuary Spot</label>
                    <input
                      required
                      type="text"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm text-white"
                      placeholder="e.g. St. Peters Hall"
                      value={newActivity.location}
                      onChange={e => setNewActivity({...newActivity, location: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-4">Sacred Tier</label>
                    <select
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm text-white appearance-none"
                      value={newActivity.type}
                      onChange={e => setNewActivity({...newActivity, type: e.target.value as any})}
                    >
                      <option value="Mass">Holy Mass</option>
                      <option value="Meeting">Council Meeting</option>
                      <option value="Social">Community Social</option>
                      <option value="Other">Ritual/Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-4">Resource Link (PDF/DOC)</label>
                    <input
                      type="url"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm text-white"
                      placeholder="https://..."
                      value={newActivity.downloadUrl}
                      onChange={e => setNewActivity({...newActivity, downloadUrl: e.target.value})}
                    />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-4">Insight Description</label>
                  <textarea
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm text-white h-24 resize-none"
                    placeholder="Provide depth to this appointed hour..."
                    value={newActivity.description}
                    onChange={e => setNewActivity({...newActivity, description: e.target.value})}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all mt-4"
                >
                  Proclaim Appointment
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 right-6 md:right-12 z-50">
         <div className="bg-emerald-500 text-black px-6 py-3 rounded-full flex items-center gap-3 shadow-3xl shadow-emerald-500/40 animate-pulse-gentle">
            <Clock className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Ritual Pulse Active</span>
         </div>
      </div>
    </div>
  );
}
