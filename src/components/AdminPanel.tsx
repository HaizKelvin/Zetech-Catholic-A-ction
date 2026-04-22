import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  getDocs,
  setDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, DailyControl, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { Settings, Users, BookOpen, Download, ShieldCheck, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [dailyForm, setDailyForm] = useState({ verse: '', reference: '', saintName: '', saintInfo: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (UserProfile & { id: string })[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
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

    return () => { unsubscribe(); subControl(); };
  }, []);

  const updateDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await setDoc(doc(db, 'control', 'daily_bread'), {
        ...dailyForm,
        updatedAt: serverTimestamp()
      });
      alert('Updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'control/daily_bread');
    } finally {
      setLoading(false);
    }
  };

  const downloadUsers = () => {
    const headers = ['UID', 'Name', 'Email', 'Role', 'Joined Date'];
    const rows = users.map(u => [
      u.uid,
      u.displayName || 'N/A',
      u.email,
      u.role,
      u.createdAt?.toDate().toLocaleDateString()
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

  return (
    <div className="space-y-16 pb-24">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-5xl font-bold tracking-tighter text-stone-900 dark:text-stone-100">Admin <span className="serif-display text-brand-600 dark:text-brand-400">Commander</span>.</h1>
           <p className="text-stone-500 dark:text-stone-400 mt-2">Manage daily inspiration and community data.</p>
        </div>
        <button 
          onClick={downloadUsers}
          className="bg-brand-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-brand-800 shadow-xl shadow-brand-900/20"
        >
          <Download className="w-5 h-5" />
          Export Member List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Daily Control Form */}
        <section className="glass p-12 rounded-[48px] shadow-xl">
           <div className="flex items-center gap-3 mb-10">
              <BookOpen className="w-8 h-8 text-brand-600" />
              <h2 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">Daily Inspiration</h2>
           </div>
           <form onSubmit={updateDaily} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Bible Verse</label>
                <textarea required value={dailyForm.verse} onChange={e => setDailyForm({...dailyForm, verse: e.target.value})} className="w-full p-6 bg-white/50 dark:bg-stone-900/50 rounded-3xl outline-none resize-none font-serif italic text-lg" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Reference (e.g. John 3:16)</label>
                <input required type="text" value={dailyForm.reference} onChange={e => setDailyForm({...dailyForm, reference: e.target.value})} className="w-full px-6 py-4 rounded-2xl font-bold" />
              </div>
              <div className="border-t border-stone-50 dark:border-stone-800 pt-10">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Saint Name</label>
                <input required type="text" value={dailyForm.saintName} onChange={e => setDailyForm({...dailyForm, saintName: e.target.value})} className="w-full px-6 py-4 rounded-2xl font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Saint Info/Bio</label>
                <textarea required value={dailyForm.saintInfo} onChange={e => setDailyForm({...dailyForm, saintInfo: e.target.value})} className="w-full p-6 bg-white/50 dark:bg-stone-900/50 rounded-3xl outline-none h-32 resize-none" />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-stone-900 dark:bg-brand-900 text-white rounded-[32px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Update Dashboard'}
              </button>
           </form>
        </section>

        {/* Community Overview */}
        <section className="space-y-8">
           <div className="bg-brand-900 text-white p-12 rounded-[48px] shadow-2xl relative overflow-hidden">
              <Users className="absolute -bottom-8 -right-8 w-48 h-48 opacity-10" />
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-300 mb-4">Total Membership</p>
              <h2 className="text-8xl font-black tracking-tighter">{users.length}</h2>
              <p className="text-brand-300 mt-6 font-medium">Registered members in our network.</p>
           </div>
           
           <div className="glass p-8 rounded-[40px] shadow-sm overflow-hidden">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-stone-900 dark:text-stone-100">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                Recent Sign-ups
              </h3>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {users.slice(0, 8).map((u, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/30 dark:bg-stone-950/30 rounded-2xl">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-[10px] font-bold text-brand-900 dark:text-brand-400">
                          {u.displayName?.charAt(0)}
                       </div>
                       <div>
                        <p className="font-bold text-sm text-stone-900 dark:text-stone-100">{u.displayName}</p>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 font-bold">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white dark:bg-stone-800 px-2 py-1 rounded-full border border-stone-100 dark:border-stone-800">
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}
