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
  FileText,
  MessageCircle,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'Meeting' as 'Mass' | 'Meeting' | 'Social' | 'Other',
    downloadUrl: ''
  });

  useEffect(() => {
    NotificationManager.requestPermission();
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
      const data = {
        ...newActivity,
        date: Timestamp.fromDate(new Date(newActivity.date)),
        updatedAt: serverTimestamp()
      };

      if (editingActivityId) {
        await updateDoc(doc(db, 'schedule', editingActivityId), data);
      } else {
        await addDoc(collection(db, 'schedule'), {
          ...data,
          addedBy: user.displayName || 'Admin',
          createdAt: serverTimestamp()
        });

        // Notify everyone of the new event
        await addDoc(collection(db, 'notifications'), {
          userId: 'all',
          title: `Divine Appointment: ${newActivity.title}`,
          message: `A new ${newActivity.type} has been scheduled at ${newActivity.location} for ${new Date(newActivity.date).toLocaleDateString()}.`,
          type: 'announcement',
          isRead: false,
          timestamp: serverTimestamp()
        });
      }
      
      setIsAddModalOpen(false);
      setEditingActivityId(null);
      setNewActivity({ title: '', description: '', date: '', location: '', type: 'Meeting', downloadUrl: '' });
    } catch (error) {
      console.error("Error saving activity:", error);
    }
  };

  const handleEdit = (act: Activity) => {
    const d = act.date instanceof Timestamp ? act.date.toDate() : new Date(act.date);
    setNewActivity({
      title: act.title,
      description: act.description || '',
      date: format(d, "yyyy-MM-dd'T'HH:mm"),
      location: act.location,
      type: act.type,
      downloadUrl: act.downloadUrl || ''
    });
    setEditingActivityId(act.id);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this activity from the schedule?')) {
      try {
        await deleteDoc(doc(db, 'schedule', id));
      } catch (error) {
        console.error("Error deleting activity:", error);
        alert("Failed to delete activity. Please check your permissions or connection.");
      }
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

  const handleDayClick = (day: Date) => {
    const isSelectedMonth = isSameMonth(day, monthStart);
    if (!isSelectedMonth) return;

    setSelectedDate(day);

    if (isAdmin) {
      const formattedDate = format(day, "yyyy-MM-dd'T'12:00");
      setNewActivity(prev => ({ ...prev, date: formattedDate }));
      setIsAddModalOpen(true);
    }
  };

  const shareActivity = (act: any) => {
    const d = act.date instanceof Timestamp ? act.date.toDate() : new Date(act.date);
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
    const dateStr = d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = `*URGENT: ${act.title.toUpperCase()}*

*Day:* ${dayName}
*Date:* ${dateStr}
*Time:* ${timeStr}
*Venue:* ${act.location}

*Details:*
${act.description}

*Your presence is highly anticipated.* Join us as we gather in faith and fellowship. Do not miss this divine experience.

━━━━━━━━━━━━━━━━━━
*ZUCA PORTAL:* ${window.location.origin}
✧────────────────✧`;
    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24 text-stone-900 dark:text-stone-100">
      {/* Header - Compacted */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-6 md:py-24 px-4 md:px-12 rounded-[24px] md:rounded-[48px] overflow-hidden bg-brand-950 text-white shadow-xl group mb-4 md:mb-12 mx-1 md:mx-0 border border-white/5"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1506784919141-935043324940?q=80&w=2670&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20 transform group-hover:scale-110 transition-transform duration-[3s]" 
            alt="Schedule"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/60 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-12 max-w-full">
          <div className="space-y-2 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-dark border border-white/10 text-[7px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-300 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
              Timeline
            </motion.div>
            
            <h1 className="text-2xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none text-white serif-display">
              Sacred <span className="serif-display italic font-light text-emerald-400 lowercase">Events & Plans</span>
            </h1>
          </div>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setNewActivity(prev => ({ ...prev, date: format(new Date(), "yyyy-MM-dd'T'12:00") }));
                setIsAddModalOpen(true);
              }}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 md:px-8 md:py-5 rounded-xl md:rounded-[32px] hover:bg-emerald-500 transition-all font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/30 text-[8px] md:text-[10px]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Event
            </motion.button>
          )}
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 px-1 md:px-0">
        {/* Calendar Side */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass rounded-[24px] md:rounded-[48px] p-4 md:p-10 border border-brand-500/10 shadow-2xl bg-white/40 dark:bg-stone-900/40 backdrop-blur-3xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl md:text-4xl font-black uppercase tracking-tight serif-display">{format(currentMonth, 'MMMM')} <span className="text-emerald-500 font-light">{format(currentMonth, 'yyyy')}</span></h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 md:p-3 bg-stone-100 dark:bg-white/5 rounded-xl hover:bg-emerald-500/10 transition-all border border-stone-200 dark:border-white/5 group"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-stone-500 group-hover:text-emerald-500" />
                </button>
                <button 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 md:p-3 bg-stone-100 dark:bg-white/5 rounded-xl hover:bg-emerald-500/10 transition-all border border-stone-200 dark:border-white/5 group"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-stone-500 group-hover:text-emerald-500" />
                </button>
              </div>
            </div>

            {/* Calendar Grid - Modern Optimized */}
            <div className="grid grid-cols-7 gap-1.5 md:gap-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[7px] md:text-[11px] font-black uppercase tracking-[0.2em] text-stone-400 py-3">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, idx) => {
                const dayActivities = getActivitiesForDay(day);
                const isSelectedMonth = isSameMonth(day, monthStart);
                const isCurrentToday = isToday(day);
                const isSelected = isSameDay(day, selectedDate);
                
                return (
                  <motion.div
                    key={day.toString()}
                    layoutId={`day-${day.toString()}`}
                    whileHover={isSelectedMonth ? { y: -4, scale: 1.02, zIndex: 10 } : {}}
                    whileTap={isSelectedMonth ? { scale: 0.98 } : {}}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[70px] md:min-h-[140px] p-2 md:p-4 rounded-2xl md:rounded-[32px] border transition-all relative group cursor-pointer overflow-hidden ${
                      !isSelectedMonth 
                        ? 'opacity-5 pointer-events-none' 
                        : isSelected
                          ? 'bg-emerald-500 shadow-2xl shadow-emerald-500/20 border-emerald-400 z-10'
                          : isCurrentToday
                            ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/10'
                            : 'bg-white/90 dark:bg-stone-900/60 border-stone-200/50 dark:border-white/5 hover:border-emerald-500/40 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] md:text-sm font-black transition-colors ${
                        isSelected 
                          ? 'text-white' 
                          : isCurrentToday ? 'text-emerald-500' : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-900 dark:group-hover:text-white'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {isAdmin && isSelectedMonth && !isSelected && (
                        <Plus className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100" />
                      )}
                    </div>
                    
                    <div className="space-y-1 md:space-y-1.5 overflow-hidden">
                      {dayActivities.slice(0, 3).map(act => (
                        <div 
                          key={act.id} 
                          className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg text-[6px] md:text-[9px] font-bold truncate tracking-wide border shadow-sm ${
                            isSelected
                              ? 'bg-white/20 text-white border-white/30'
                              : act.type === 'Mass' ? 'bg-amber-500/10 text-amber-500 border-amber-600/10' :
                                act.type === 'Meeting' ? 'bg-blue-500/10 text-blue-500 border-blue-600/10' :
                                act.type === 'Social' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-600/10' :
                                'bg-emerald-500/10 text-emerald-500 border-emerald-600/10'
                          }`}
                        >
                          {act.title}
                        </div>
                      ))}
                      {dayActivities.length > 3 && (
                         <div className={`text-[6px] md:text-[8px] font-black ml-1.5 uppercase tracking-widest opacity-60 ${isSelected ? 'text-white' : 'text-stone-400'}`}>
                           + {dayActivities.length - 3} More
                         </div>
                      )}
                    </div>
                    
                    {isCurrentToday && !isSelected && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Info Side */}
        <div className="lg:col-span-4 space-y-8">
          {/* Day Agenda View */}
          <div className="glass rounded-[32px] p-6 md:p-8 border border-emerald-500/20 shadow-2xl relative overflow-hidden group bg-white dark:bg-stone-900 min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-1">Day's Agenda</p>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight serif-display">
                    {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')} <span className="text-emerald-500 opacity-60 font-light">{format(selectedDate, 'MMM d')}</span>
                  </h3>
                </div>
                <CalendarIcon className="w-6 h-6 text-emerald-500 opacity-20" />
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {getActivitiesForDay(selectedDate).length === 0 && (
                   <div className="text-center py-12 md:py-20 opacity-30 italic flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/5 flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-xs font-medium">The silence of reflection.</p>
                      <p className="text-[10px] uppercase tracking-widest mt-1">No activities for this day</p>
                      {isAdmin && (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDayClick(selectedDate)}
                          className="mt-6 px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20"
                        >
                          Appoint Ritual
                        </motion.button>
                      )}
                   </div>
                )}
                {getActivitiesForDay(selectedDate).map(act => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={act.id} 
                    className="p-4 bg-stone-50 dark:bg-white/5 rounded-[24px] border border-stone-100 dark:border-white/5 relative group hover:border-emerald-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full">
                            {isAdmin && (
                              <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-stone-900/60 dark:bg-stone-800/60 backdrop-blur-sm rounded-full">
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="w-6 h-6 flex items-center justify-center bg-brand-500 text-white rounded-full shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(act);
                                  }}
                                >
                                  <Pencil className="w-3 h-3" />
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(act.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </motion.button>
                              </div>
                            )}
                            <span className={`w-2.5 h-2.5 rounded-full shadow-md ${
                              act.type === 'Mass' ? 'bg-amber-500 shadow-amber-500/20' :
                              act.type === 'Meeting' ? 'bg-blue-500 shadow-blue-500/20' :
                              act.type === 'Social' ? 'bg-indigo-500 shadow-indigo-500/20' :
                              'bg-emerald-500 shadow-emerald-500/20'
                            }`} />
                          </div>
                           <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{act.type}</span>
                        </div>
                        <h4 className="font-bold text-stone-900 dark:text-white leading-tight pr-4">{act.title}</h4>
                      </div>
                      <button 
                        onClick={() => shareActivity(act)}
                        className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-full transition-all"
                        title="Share Activity"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] text-stone-500 dark:text-stone-400 font-bold uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-emerald-500" /> {format(act.date instanceof Timestamp ? act.date.toDate() : new Date(act.date), 'HH:mm')}</span>
                       <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-500" /> {act.location}</span>
                    </div>
                    {act.description && (
                       <p className="mt-3 text-[11px] text-stone-500 dark:text-stone-500 leading-relaxed line-clamp-2 italic font-serif">
                         {act.description}
                       </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

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
              className="bg-stone-900 border border-white/10 w-full max-w-xl max-h-[90vh] rounded-[40px] shadow-3xl overflow-y-auto p-5 md:p-8 relative custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight italic serif-display">Prophetic <span className="text-emerald-500 not-italic">Timing</span></h2>
                  <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-2">{editingActivityId ? 'Modify Sacred Event' : 'New Schedule Entry'}</p>
                </div>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingActivityId(null);
                  }} 
                  className="p-3 bg-white/5 rounded-2xl text-stone-400 hover:text-red-500 transition-colors"
                >
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
                  {editingActivityId ? 'Sanctify Changes' : 'Proclaim Appointment'}
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
