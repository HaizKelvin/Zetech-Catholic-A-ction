import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  getDocs,
  addDoc,
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
import { Settings, Users, BookOpen, Download, ShieldCheck, Loader2, Trash2, UserX, UserPlus, ChevronDown, ChevronUp, MessageCircle, Share2, Calendar, Phone, Zap } from 'lucide-react';
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
  const [isWhatsAppAutoSync, setIsWhatsAppAutoSync] = useState(false);
  const [isEmailAutoSync, setIsEmailAutoSync] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [announcement, setAnnouncement] = useState({ title: '', message: '' });
  const [shareStatus, setShareStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [whatsAppGroupLink, setWhatsAppGroupLink] = useState('https://chat.whatsapp.com/JLH8fWq8d8H05Y6zW92bX');
  const [savingSettings, setSavingSettings] = useState(false);

  const displayedUsers = showAllUsers ? users : users.slice(0, 3);

  useEffect(() => {
    const q = query(collection(db, 'users'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          uid: data.uid || doc.id, 
          ...data 
        };
      }) as (UserProfile & { id: string })[];
      setUsers(usersData);
      setTotalCount(usersData.length);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    const qEvents = query(collection(db, 'schedule'), limit(10), orderBy('date', 'asc'));
    const subEvents = onSnapshot(qEvents, (s) => {
      setEvents(s.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const subSettings = onSnapshot(doc(db, 'control', 'settings'), (d) => {
      if (d.exists()) {
        const data = d.data();
        setIsWhatsAppAutoSync(data.isWhatsAppAutoSync || false);
        setIsEmailAutoSync(data.isEmailAutoSync || false);
        if (data.whatsAppGroupLink) {
          setWhatsAppGroupLink(data.whatsAppGroupLink);
        }
      }
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

    return () => { unsubscribe(); subControl(); subEvents(); subSettings(); };
  }, []);

  const toggleWhatsAppSync = async () => {
    try {
      const nextValue = !isWhatsAppAutoSync;
      await setDoc(doc(db, 'control', 'settings'), { isWhatsAppAutoSync: nextValue }, { merge: true });
      setIsWhatsAppAutoSync(nextValue);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'control/settings');
    }
  };

  const toggleEmailSync = async () => {
    try {
      const nextValue = !isEmailAutoSync;
      await setDoc(doc(db, 'control', 'settings'), { isEmailAutoSync: nextValue }, { merge: true });
      setIsEmailAutoSync(nextValue);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'control/settings');
    }
  };

  const sendViaEmail = async (subject: string, body: string, recipientList?: string[]) => {
    setEmailLoading(true);
    setShareStatus(null);
    try {
      // Default to all subscribed users if no specific list
      const emails = recipientList || users
        .filter(u => u.isSubscribed !== false) // Only subscribed souls
        .map(u => u.email)
        .filter(Boolean);
      
      if (emails.length === 0) {
        setShareStatus({ type: 'error', message: "No subscribed recipients found." });
        return;
      }

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          recipients: emails
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to send emails");
      
      setShareStatus({ type: 'success', message: `Gracefully sent to ${emails.length} souls.` });
      
      // Clear success message after 5 seconds
      setTimeout(() => setShareStatus(null), 5000);
    } catch (error: any) {
      console.error("Email error:", error);
      setShareStatus({ type: 'error', message: `Resonance failure: ${error.message}` });
    } finally {
      setEmailLoading(false);
    }
  };

  const shareToWhatsApp = (text: string, phone?: string) => {
    const encodedText = encodeURIComponent(text);
    const url = phone 
      ? `https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}&text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(url, '_blank');
  };

  const broadcastDaily = () => {
    if (!dailyForm.verse) return;
    const message = `*✨ ZUCA DAILY BREAD ✨*
*──────────────────*

📖 *WORD OF GOD*
_${dailyForm.verse}_
— *${dailyForm.reference}*

🙏 *SAINT OF THE DAY*
*${dailyForm.saintName.toUpperCase()}*
${dailyForm.saintInfo}

🕊️ *JOIN THE FELLOWSHIP*
Visit the Sanctuary: ${window.location.host}

*──────────────────*
_Peace be with you always._ 🤍`;
    shareToWhatsApp(message);
  };

  const emailDaily = () => {
    if (!dailyForm.verse) return;
    const subject = `🕊️ ZUCA: Daily Bread (${dailyForm.reference})`;
    const htmlBody = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eef2ff; border-radius: 32px; background: #ffffff; box-shadow: 0 20px 60px rgba(0,0,0,0.06);">
        <div style="text-align: center; margin-bottom: 40px;">
          <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #4f46e5, #4338ca); border-radius: 20px; line-height: 64px; color: white; font-size: 32px; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);">⛪</div>
          <h2 style="color: #4338ca; text-transform: uppercase; letter-spacing: 0.4em; font-size: 12px; margin-top: 20px; font-weight: 800;">ZUCA Catholic Community</h2>
        </div>
        
        <h1 style="font-size: 36px; color: #111; text-align: center; margin-bottom: 15px; font-weight: 900; letter-spacing: -0.02em;">Bread of Life</h1>
        <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 45px; text-transform: uppercase; letter-spacing: 0.2em;">${new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}</p>
        
        <div style="margin: 40px 0; padding: 40px; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 28px; position: relative;">
           <div style="text-align: center; color: #6366f1; font-weight: 800; font-size: 11px; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 0.1em;">Daily Scripture</div>
           <p style="font-size: 26px; color: #0f172a; line-height: 1.6; text-align: center; font-weight: 300; font-style: italic;">"${dailyForm.verse}"</p>
           <p style="font-size: 16px; color: #64748b; margin-top: 25px; text-align: center; font-weight: 600;">— ${dailyForm.reference} —</p>
        </div>

        <div style="margin-top: 40px; padding: 35px; border: 1px dashed #e2e8f0; border-radius: 28px;">
          <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.3em; color: #6366f1; margin: 0 0 20px 0; font-weight: 800;">🙏 Patron Reflection</h3>
          <p style="font-weight: 900; margin: 0; font-size: 22px; color: #0f172a;">${dailyForm.saintName}</p>
          <p style="color: #475569; font-size: 16px; line-height: 1.8; margin-top: 15px;">${dailyForm.saintInfo}</p>
        </div>

        <div style="margin-top: 50px; text-align: center;">
          <a href="${window.location.origin}" style="display: inline-block; background: #0f172a; color: white; padding: 20px 45px; text-decoration: none; border-radius: 16px; font-weight: 800; font-family: sans-serif; font-size: 13px; letter-spacing: 0.15em; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.2);">VISIT THE SANCTUARY</a>
        </div>
        
        <div style="margin-top: 60px; text-align: center; padding-top: 30px; border-top: 1px solid #f1f5f9;">
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
            Bound by Faith, United in Spirit.<br />
            <strong>Zetech University Catholic Action</strong>
          </p>
        </div>
      </div>
    `;
    sendViaEmail(subject, htmlBody);
  };

  const broadcastEvent = (event: any) => {
    const d = event.date instanceof Timestamp ? event.date.toDate() : new Date(event.date);
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
    const dateStr = d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const message = `*🔔 ZUCA: ${event.title.toUpperCase()}* ✨
*──────────────────*
📅 *${dayName}, ${dateStr}*
⏰ *${timeStr}*
📍 *${event.location}*

📝 *INSIGHTS*
${event.description.slice(0, 100)}...

🌟 *JOIN OUR FELLOWSHIP*
${window.location.origin}
*──────────────────*
_United in Spirit and Faith._ 🫂`;
    shareToWhatsApp(message);
  };

  const emailEvent = (event: any) => {
    const d = event.date instanceof Timestamp ? event.date.toDate() : new Date(event.date);
    const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
    const dateStr = d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const subject = `🔔 ZUCA Event: ${event.title}`;
    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #fff; border: 1px solid #eaeaea; border-radius: 20px;">
        <p style="color: #5c85ff; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3em; font-size: 10px; margin-bottom: 20px;">FELLOWSHIP ANNOUNCEMENT</p>
        <h1 style="font-size: 32px; font-weight: 900; tracking: tight; margin: 0; color: #111;">${event.title}</h1>
        <div style="margin: 30px 0; border-left: 4px solid #5c85ff; padding-left: 20px;">
          <p style="margin: 5px 0;">📅 <strong>${dayName}, ${dateStr}</strong></p>
          <p style="margin: 5px 0;">⏰ <strong>${timeStr}</strong></p>
          <p style="margin: 5px 0;">📍 <strong>${event.location}</strong></p>
        </div>
        <p style="font-size: 16px; color: #444; line-height: 1.6; margin-bottom: 30px;">${event.description}</p>
        <a href="${window.location.origin}" style="display: inline-block; background: #111; color: #fff; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; letter-spacing: 0.1em;">JOIN THE FELLOWSHIP</a>
      </div>
    `;
    sendViaEmail(subject, htmlBody);
  };

  const broadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement.title || !announcement.message) return;

    setLoading(true);
    try {
      // 1. Post to Notifications (Internal)
      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title: announcement.title,
        message: announcement.message,
        type: 'announcement',
        isRead: false,
        timestamp: serverTimestamp()
      });

      // 2. Email Broadcast
      if (isEmailAutoSync) {
        const subject = `🕊️ ZUCA: ${announcement.title}`;
        const htmlBody = `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 40px; background: #fff; border: 1px solid #eaeaea; border-radius: 20px;">
            <p style="color: #5c85ff; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3em; font-size: 10px; margin-bottom: 20px;">COMMUNITY ANNOUNCEMENT</p>
            <h1 style="font-size: 32px; font-weight: 900; tracking: tight; margin: 0; color: #111;">${announcement.title}</h1>
            <hr style="border: 0; border-top: 1px solid #f0f0f0; margin: 30px 0;" />
            <p style="font-size: 16px; color: #444; line-height: 1.6; margin-bottom: 30px;">${announcement.message}</p>
            <div style="text-align: center;">
              <a href="${window.location.origin}" style="display: inline-block; background: #5c85ff; color: #fff; padding: 18px 36px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 12px; letter-spacing: 0.1em;">VISIT THE SANCTUARY</a>
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #aaa; text-align: center;">Bound by Faith, United in Spirit.</p>
          </div>
        `;
        await sendViaEmail(subject, htmlBody);
      } else {
        alert("Sanctuary updated internal feed. (Email sync inactive)");
      }
      
      setAnnouncement({ title: '', message: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    } finally {
      setLoading(false);
    }
  };

  const sendSingleEmail = async (user: UserProfile) => {
    const subject = `🕊️ ZUCA Sanctuary: Message from Authority`;
    const message = prompt(`Compose sacred message for ${user.displayName}:`);
    if (!message) return;

    const htmlBody = `
      <div style="font-family: serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #eee; border-radius: 20px;">
        <h2 style="color: #5c85ff; text-transform: uppercase; letter-spacing: 0.2em; font-size: 14px;">ZUCA Sanctuary</h2>
        <h1 style="font-size: 24px;">Blessings, ${user.displayName}</h1>
        <p style="font-size: 16px; color: #444; line-height: 1.6;">${message}</p>
        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
          <p style="font-size: 12px; color: #999;">Peace and Grace be with you.</p>
        </div>
      </div>
    `;
    
    await sendViaEmail(subject, htmlBody, [user.email]);
  };

  const updateDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'control', 'daily_bread'), {
        ...dailyForm,
        updatedAt: serverTimestamp()
      });

      // Notification for daily update
      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title: 'Daily Bread Refreshed',
        message: 'The daily scripture and saintly wisdom have been updated. Come and be nourished.',
        type: 'announcement',
        isRead: false,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'control/daily_bread');
    } finally {
      setLoading(false);
      if (isWhatsAppAutoSync) {
        broadcastDaily();
      }
      if (isEmailAutoSync) {
        emailDaily();
      }
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
            onClick={toggleWhatsAppSync}
            className={`flex-1 px-6 py-4 md:px-8 md:py-5 rounded-[20px] md:rounded-[28px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all text-[9px] md:text-[10px] ${
              isWhatsAppAutoSync 
                ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                : 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
            }`}
          >
            <Zap className={`w-4 h-4 ${isWhatsAppAutoSync ? 'animate-pulse' : 'opacity-30'}`} />
            {isWhatsAppAutoSync ? 'WA Sync' : 'WA Sync'}
          </motion.button>

          <motion.button 
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleEmailSync}
            className={`flex-1 px-6 py-4 md:px-8 md:py-5 rounded-[20px] md:rounded-[28px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all text-[9px] md:text-[10px] ${
              isEmailAutoSync 
                ? 'bg-blue-600 text-white shadow-blue-500/20' 
                : 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
            }`}
          >
            <Zap className={`w-4 h-4 ${isEmailAutoSync ? 'animate-pulse' : 'opacity-30'}`} />
            {isEmailAutoSync ? 'Email Sync' : 'Email Sync'}
          </motion.button>
          
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
                disabled={emailLoading}
                onClick={emailDaily}
                className="w-full py-5 md:py-6 bg-blue-600 text-white rounded-[24px] md:rounded-[32px] font-black uppercase tracking-[0.3em] text-[10px] md:text-xs shadow-xl flex items-center justify-center gap-4 mt-4"
              >
                {emailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Email Broadcast <Share2 className="w-5 h-5" /></>}
              </motion.button>

              <AnimatePresence>
                {shareStatus && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`mt-4 p-5 rounded-[24px] flex items-center gap-4 border-2 ${
                      shareStatus.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${shareStatus.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                    <p className="text-xs font-black uppercase tracking-widest flex-1">{shareStatus.message}</p>
                    <button type="button" onClick={() => setShareStatus(null)} className="text-[10px] font-black uppercase opacity-50 hover:opacity-100">Dismiss</button>
                  </motion.div>
                )}
              </AnimatePresence>
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
                          onClick={() => emailEvent(event)}
                          disabled={emailLoading}
                          className="px-6 py-3 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                        >
                          {emailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Email <Share2 className="w-3.5 h-3.5" /></>}
                        </button>
                        <button 
                          onClick={() => broadcastEvent(event)}
                          className="px-6 py-3 bg-[#25D366] text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                          WhatsApp <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Community Announcement Section */}
            <div className="pt-12 border-t border-stone-200 dark:border-white/5 space-y-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[24px] bg-brand-600 flex items-center justify-center shadow-2xl shadow-brand-900/20 text-white shrink-0">
                  <Zap className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Broadcast Tower</h2>
                  <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1">Universal Community Update</p>
                </div>
              </div>

              <form onSubmit={broadcastAnnouncement} className="space-y-6">
                <div className="space-y-4">
                  <input 
                    required 
                    type="text" 
                    value={announcement.title} 
                    onChange={e => setAnnouncement({...announcement, title: e.target.value})} 
                    className="w-full glass-card p-5 font-bold text-stone-900 dark:text-white outline-none" 
                    placeholder="Announcement Title" 
                  />
                  <textarea 
                    required 
                    value={announcement.message} 
                    onChange={e => setAnnouncement({...announcement, message: e.target.value})} 
                    className="w-full glass-card p-5 min-h-[120px] text-stone-800 dark:text-stone-200 outline-none" 
                    placeholder="Sacred message to all souls..." 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-5 bg-stone-900 dark:bg-stone-800 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl flex items-center justify-center gap-3 hover:bg-stone-800 transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Initiate Universal Broadcast <Zap className="w-4 h-4" /></>}
                </button>
              </form>
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
                        <button 
                          onClick={() => sendSingleEmail(u)}
                          disabled={emailLoading}
                          className="p-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 disabled:opacity-50"
                          title="Send Email"
                        >
                          {emailLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-4 h-4" />}
                        </button>
                        {u.contactNumber && (
                          <button 
                            onClick={() => shareToWhatsApp(`*SACRED GREETING*
━━━━━━━━━━━━━━━━━━

*Dear Fellow Servant,*

Blessings from the ZUCA community! We celebrate your presence in our fellowship and wish you peace, grace, and spiritual growth on this day.

━━━━━━━━━━━━━━━━━━
*ZUCA PORTAL:* ${window.location.origin}
✧────────────────✧`, u.contactNumber)}
                            className="p-2 text-[#25D366] opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                            title="Send WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <div className="px-2 py-0.5 md:px-3 md:py-1 bg-white dark:bg-white/5 rounded-lg border border-stone-100 dark:border-white/5 shadow-sm flex items-center gap-2">
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-stone-500 dark:text-stone-400">{u.role}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isSubscribed !== false ? 'bg-emerald-500' : 'bg-red-500'}`} title={u.isSubscribed !== false ? 'Subscribed' : 'Not Subscribed'} />
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

            {/* WhatsApp Group Link Configuration Card */}
            <div className="glass-card p-6 md:p-12 border-white/5 rounded-[32px] md:rounded-[40px] space-y-6 text-left">
              <div className="space-y-1">
                <h3 className="font-bold text-lg md:text-xl text-stone-900 dark:text-white serif-display">WhatsApp Group Link</h3>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500">Community Access Node</p>
              </div>
              <p className="text-stone-500 dark:text-stone-400 text-[11px] leading-relaxed">
                Configure the invite link for the official ZUCA WhatsApp Group. This allows members of ZUCA to join the group directly from the Overview dashboard.
              </p>
              <div className="space-y-4">
                <input 
                  type="text" 
                  value={whatsAppGroupLink} 
                  onChange={e => setWhatsAppGroupLink(e.target.value)} 
                  className="w-full glass-card p-4 text-xs font-semibold text-stone-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20" 
                  placeholder="https://chat.whatsapp.com/..." 
                />
                <button 
                  onClick={async () => {
                    try {
                      setSavingSettings(true);
                      await setDoc(doc(db, 'control', 'settings'), { whatsAppGroupLink }, { merge: true });
                      alert("WhatsApp Group Link updated successfully!");
                    } catch (error) {
                      handleFirestoreError(error, OperationType.UPDATE, 'control/settings');
                    } finally {
                      setSavingSettings(false);
                    }
                  }}
                  disabled={savingSettings}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl tracking-widest text-[10px] uppercase shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Update Invite Link <ShieldCheck className="w-4 h-4" /></>}
                </button>
              </div>
            </div>
        </section>
      </div>
    </div>
  );
}
