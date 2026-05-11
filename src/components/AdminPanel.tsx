import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
  limit,
  orderBy,
  Timestamp,
  getCountFromServer,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, DailyControl, OperationType, MembershipRegistration } from '../types';
import { handleFirestoreError } from '../utils';
import { Settings, Users, BookOpen, Download, ShieldCheck, Loader2, Trash2, UserX, UserPlus, ChevronDown, ChevronUp, MessageCircle, Share2, Calendar, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [dailyForm, setDailyForm] = useState({ verse: '', reference: '', saintName: '', saintInfo: '' });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'group' | 'members'>('group');
  const [events, setEvents] = useState<any[]>([]);

  const displayedUsers = showAllUsers ? users : users.slice(0, 3);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (UserProfile & { id: string })[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const qEvents = query(collection(db, 'schedule'), limit(10), orderBy('date', 'asc'));
    const subEvents = onSnapshot(qEvents, (s) => {
      setEvents(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const subControl = onSnapshot(doc(db, 'control', 'daily_bread'), (d) => {
      if (d.exists()) {
        const data = d.data() as DailyControl;
        setDailyForm({
          verse: data.verse,
          reference: data.reference,
          saintName: data.saintName,
          saintInfo: data.saintInfo
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'control/daily_bread');
    });

    const fetchCount = async () => {
      const path = 'users';
      try {
        const coll = collection(db, path);
        const snapshot = await getCountFromServer(coll);
        setTotalCount(snapshot.data().count);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, path);
      }
    };
    fetchCount();
    
    return () => { unsubscribe(); subControl(); subEvents(); };
  }, []);

  const shareToWhatsApp = (text: string, phone?: string) => {
    const encodedText = encodeURIComponent(text);
    const url = phone 
      ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    window.open(url, '_blank');
  };

  const broadcastDaily = () => {
    const message = `✨ *Daily Oracle - ZUCA* ✨\n\n📖 *Scripture:* ${dailyForm.verse}\n📍 *Reference:* ${dailyForm.reference}\n\n🙏 *Saint of the Day:* ${dailyForm.saintName}\n📜 *About:* ${dailyForm.saintInfo}\n\nJoin our community: ${window.location.origin}`;
    shareToWhatsApp(message);
  };

  const broadcastEvent = (event: any) => {
    const dateStr = event.date instanceof Timestamp ? event.date.toDate().toLocaleDateString() : new Date(event.date).toLocaleDateString();
    const timeStr = event.date instanceof Timestamp ? event.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const message = `📢 *Upcoming Event Alert* 📢\n\n🗓 *Event:* ${event.title}\n📅 *Date:* ${dateStr}\n⏰ *Time:* ${timeStr}\n📍 *Location:* ${event.location}\n\n📝 *Description:* ${event.description}\n\nSee you there! 🙌`;
    shareToWhatsApp(message);
  };

  const updateDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'control', 'daily_bread'), {
        ...dailyForm,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'control/daily_bread');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (uid: string) => {
    if (uid === auth.currentUser?.uid) {
      alert("You cannot resonance-purge your own authority access.");
      return;
    }
    if (!window.confirm('Are you sure you want to purge this user from the community matrix? This action is irreversible.')) return;
    
    setDeletingId(uid);
    const path = `users/${uid}`;
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setDeletingId(null);
    }
  };

  const downloadUsers = () => {
    const headers = ['UID', 'Name', 'Email', 'Role', 'Joined Date'];
    const rows = users.map(u => [
      u.uid,
      u.displayName || 'N/A',
      u.email,
      u.role,
      u.createdAt?.toDate()?.toLocaleDateString() || 'N/A'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `registered_members_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadRegistrations = async () => {
    try {
      const q = query(collection(db, 'registrations'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as MembershipRegistration);
      
      if (data.length === 0) {
        alert("No resonance found in the Join Us registry yet.");
        return;
      }

      const headers = ['Name', 'Admission No', 'Phone', 'Email', 'Applied At'];
      const rows = data.map(r => [
        r.fullName.replace(/,/g, ' '),
        r.admissionNumber.replace(/,/g, ' '),
        r.phoneNumber.replace(/,/g, ' '),
        r.schoolEmail.replace(/,/g, ' '),
        r.createdAt?.toDate()?.toLocaleString().replace(/,/g, ' ') || 'N/A'
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `CA_Applicants_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'registrations');
    }
  };

  return (
    <div className="space-y-12 md:space-y-24 pb-24 px-4 md:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pb-12 border-b border-stone-200 dark:border-white/5">
        <div className="space-y-4">
           <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-brand-900/5 dark:bg-brand-400/5 border border-brand-500/10">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-600 dark:text-brand-400">Authority Oversight</span>
           </div>
           <h1 className="text-4xl md:text-7xl font-bold tracking-tighter text-stone-900 dark:text-stone-100 leading-none">Admin <span className="serif-display text-brand-600 italic font-light lowercase">Commander</span></h1>
           <p className="text-stone-500 dark:text-stone-400 font-serif italic text-base md:text-lg max-w-xl leading-relaxed">Curate the spiritual resonance and oversee the community matrix.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto mt-4 md:mt-0">
          <motion.button 
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadUsers}
            className="flex-1 bg-stone-900 dark:bg-stone-800 text-white px-6 py-4 md:px-8 md:py-5 rounded-[20px] md:rounded-[28px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all text-[9px] md:text-[10px]"
          >
            <Download className="w-4 h-4 opacity-50" />
            Members CSV
          </motion.button>
          
          <motion.button 
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={downloadRegistrations}
            className="flex-1 bg-brand-600 text-white px-6 py-4 md:px-8 md:py-5 rounded-[20px] md:rounded-[28px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl hover:shadow-brand-500/20 transition-all text-[9px] md:text-[10px]"
          >
            <UserPlus className="w-4 h-4" />
            Applicants CSV
          </motion.button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20">
        {/* Daily Control Form */}
        <section className="lg:col-span-7 space-y-8 md:space-y-12">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[24px] bg-brand-950 flex items-center justify-center shadow-2xl shadow-brand-900/20 text-white shrink-0">
                <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Daily Oracle</h2>
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1">Spiritual Provision Control</p>
              </div>
            </div>
            
            <form onSubmit={updateDaily} className="space-y-8 md:space-y-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400 mb-3 md:mb-4 block">Scripture Meditation</label>
                  <textarea required value={dailyForm.verse} onChange={e => setDailyForm({...dailyForm, verse: e.target.value})} className="w-full glass-card bg-stone-50/50 dark:bg-black/20 p-6 md:p-12 min-h-[150px] md:min-h-[200px] text-lg md:text-2xl font-serif italic border-none outline-none focus:ring-2 focus:ring-brand-500/20 text-stone-900 dark:text-stone-100 placeholder:text-stone-300" placeholder="Type the daily verse..." />
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400 mb-3 md:mb-4 block">Meditation Origin</label>
                  <input required type="text" value={dailyForm.reference} onChange={e => setDailyForm({...dailyForm, reference: e.target.value})} className="w-full glass-card p-5 md:p-8 font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-xs md:text-sm text-stone-900 dark:text-stone-100 outline-none" placeholder="e.g. John 1:1" />
                </div>
              </div>

              <div className="pt-8 md:pt-12 border-t border-stone-200 dark:border-white/5 space-y-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-6 h-px bg-brand-500" />
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-brand-700 dark:text-brand-400">Saint Manifest</span>
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400 mb-3 md:mb-4 block">Full Title</label>
                  <input required type="text" value={dailyForm.saintName} onChange={e => setDailyForm({...dailyForm, saintName: e.target.value})} className="w-full glass-card p-5 md:p-8 font-bold text-base md:text-xl text-stone-900 dark:text-stone-100 outline-none" placeholder="Name of the Saint" />
                </div>
                <div>
                  <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400 mb-3 md:mb-4 block">Hagiography excerpt</label>
                  <textarea required value={dailyForm.saintInfo} onChange={e => setDailyForm({...dailyForm, saintInfo: e.target.value})} className="w-full glass-card bg-stone-50/50 dark:bg-black/20 p-6 md:p-10 min-h-[120px] md:min-h-[150px] text-xs md:text-base leading-relaxed text-stone-800 dark:text-stone-200 outline-none" placeholder="Information about the saint..." />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 md:py-6 bg-brand-900 text-white rounded-[24px] md:rounded-[32px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-brand-800 transition-all disabled:opacity-50 text-[10px] md:text-xs shadow-3xl flex items-center justify-center gap-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Calibrate Dashboard <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 opacity-50" /></>}
              </button>

              <motion.button 
                type="button"
                whileHover={{ scale: 1.02 }}
                onClick={broadcastDaily}
                className="w-full py-5 md:py-6 bg-[#25D366] text-white rounded-[24px] md:rounded-[32px] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs shadow-xl flex items-center justify-center gap-4 mt-4"
              >
                Broadcast to WhatsApp <MessageCircle className="w-5 h-5" />
              </motion.button>
            </form>

            {/* Event Broadcast Section */}
            <div className="pt-12 border-t border-stone-200 dark:border-white/5 space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[24px] bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-900/20 text-white shrink-0">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Event Dispatcher</h2>
                  <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1">Manual Community Broadcast</p>
                </div>
              </div>

              <div className="space-y-4">
                {events.length === 0 ? (
                  <p className="text-stone-500 text-sm italic">No upcoming events scheduled.</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="glass-card p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex-1">
                        <h4 className="font-bold text-stone-900 dark:text-white uppercase tracking-tight">{event.title}</h4>
                        <p className="text-xs text-stone-500">{event.location} • {event.date instanceof Timestamp ? event.date.toDate().toLocaleDateString() : new Date(event.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => broadcastEvent(event)}
                          className="px-6 py-3 bg-[#25D366] text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          Broadcast <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
        </section>

        {/* Community Overview */}
        <section className="lg:col-span-5 space-y-8 md:space-y-12">
            <div className="glass-card bg-stone-950 text-white p-8 md:p-16 relative overflow-hidden group border-none rounded-[32px] md:rounded-[40px]">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 to-transparent opacity-30 group-hover:opacity-50 transition-opacity" />
              <Users className="absolute -bottom-12 -right-12 w-48 h-48 md:w-64 md:h-64 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" />
              <div className="relative z-10 space-y-6 md:space-y-8">
                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-brand-400 leading-none">Collective Magnitude</p>
                <div className="space-y-1 md:space-y-2">
                  <h2 className="text-6xl md:text-[10rem] font-bold tracking-tighter leading-none">{totalCount || users.length}</h2>
                  <p className="text-lg md:text-2xl font-serif italic text-stone-400 opacity-80">Synchronized Souls</p>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6 md:p-12 border-white/5 rounded-[32px] md:rounded-[40px]">
              <div className="flex justify-between items-center mb-8 md:mb-10">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg md:text-xl text-stone-900 dark:text-white serif-display">Recent Resonance</h3>
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-stone-400">Live Member Feed</p>
                </div>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-500/10 flex items-center justify-center shrink-0">
                   <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                 <AnimatePresence mode="popLayout">
                  {displayedUsers.map((u, i) => (
                    <motion.div 
                      key={u.uid || `user-${i}`}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center justify-between p-3 md:p-4 bg-stone-50/50 dark:bg-white/5 rounded-[20px] md:rounded-2xl hover:bg-stone-100 dark:hover:bg-white/10 transition-all border border-transparent hover:border-brand-500/10 group overflow-hidden shadow-sm"
                    >
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                         <div className="relative shrink-0">
                           <div className="w-10 h-10 md:w-12 md:h-12 rounded-[16px] md:rounded-[18px] bg-gradient-to-br from-brand-600 to-brand-400 p-[1.5px] shadow-lg shadow-brand-500/10 group-hover:scale-105 transition-transform duration-500">
                              <div className="w-full h-full rounded-[14.5px] md:rounded-[16.5px] bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-950 flex items-center justify-center shrink-0">
                                 <span className="text-[11px] md:text-sm font-black text-brand-600 dark:text-brand-300 uppercase leading-none">{u.displayName?.charAt(0)}</span>
                              </div>
                           </div>
                           {u.online && (
                             <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-white dark:bg-stone-900 flex items-center justify-center shadow-lg border border-stone-50 dark:border-stone-800">
                               <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                             </div>
                           )}
                         </div>
                         <div className="overflow-hidden min-w-0">
                           <p className="font-bold text-[11px] md:text-sm text-stone-900 dark:text-stone-100 tracking-tight group-hover:text-brand-600 transition-colors truncate">{u.displayName || 'Anonymous Candidate'}</p>
                           <p className="text-[8px] md:text-[10px] text-stone-400 dark:text-stone-500 font-medium tracking-tight truncate leading-none mt-0.5">{u.email}</p>
                           {u.contactNumber && (
                             <p className="text-[8px] md:text-[9px] text-indigo-500 dark:text-indigo-400 font-black tracking-widest mt-1 flex items-center gap-1 uppercase">
                               <Phone className="w-2 h-2" /> {u.contactNumber}
                             </p>
                           )}
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        {u.contactNumber && (
                          <button 
                            onClick={() => shareToWhatsApp("Blessings from ZUCA community!", u.contactNumber)}
                            className="p-2 text-[#25D366] opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                            title="Send WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <div className="px-2 py-0.5 md:px-3 md:py-1 bg-white dark:bg-white/5 rounded-lg border border-stone-100 dark:border-white/5 shadow-sm">
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-stone-500 dark:text-stone-400">{u.role}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveUser(u.uid)}
                          disabled={deletingId === u.uid}
                          className="p-1.5 md:p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                        >
                          {deletingId === u.uid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {users.length > 3 && (
                <button 
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className="w-full mt-6 py-4 border border-dashed border-stone-200 dark:border-white/10 rounded-[18px] md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-stone-400 hover:text-brand-600 hover:border-brand-500/30 hover:bg-brand-50/50 transition-all flex items-center justify-center gap-2"
                >
                  {showAllUsers ? (
                    <>Hide Hidden Members <ChevronUp className="w-4 h-4" /></>
                  ) : (
                    <>Show All {users.length} Members <ChevronDown className="w-4 h-4" /></>
                  )}
                </button>
              )}
            </div>
        </section>
      </div>
    </div>
  );
}
