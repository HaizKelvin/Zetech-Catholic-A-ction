import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl } from '../types';
import { Quote, BookOpen, User as UserIcon, Calendar, Loader2, Music, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard({ userName, onTabChange }: { userName: string, onTabChange: (tab: any) => void }) {
  const [daily, setDaily] = useState<DailyControl | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'control', 'daily_bread'), (doc) => {
      if (doc.exists()) {
        setDaily(doc.data() as DailyControl);
      }
      setLoading(false);
    }, (error) => {
      console.error("Dashboard error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-12 pb-20">
      <header className="relative py-12 md:py-20 md:px-12 rounded-[40px] overflow-hidden bg-brand-900 text-white shadow-2xl">
        <div className="absolute inset-0 faith-bg opacity-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative z-10 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block px-4 py-1.5 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-[0.3em] mb-6"
          >
            Digital Sanctuary
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-7xl font-bold tracking-tight mb-4"
          >
            Welcome back, <br className="md:hidden" />
            <span className="serif-display italic font-light text-brand-300">{userName}</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-brand-100/80 text-sm md:text-lg italic font-serif max-w-xl mx-auto md:mx-0"
          >
            "Let your light so shine before men, that they may see your good works..." — Matthew 5:16
          </motion.p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Verse */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-[40px] p-10 relative overflow-hidden shadow-sm hover:shadow-xl transition-all border border-white/40 dark:border-white/5"
        >
          <Quote className="absolute -top-4 -right-4 w-32 h-32 text-brand-900/5" />
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-900 dark:text-brand-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">Daily Verse</span>
          </div>
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
          ) : daily ? (
            <div className="space-y-8">
              <p className="text-2xl md:text-3xl font-medium leading-tight font-serif italic text-stone-900 dark:text-stone-100">
                "{daily.verse}"
              </p>
              <div className="flex items-center gap-4">
                <div className="h-[1px] w-12 bg-stone-200 dark:bg-stone-800" />
                <p className="text-xs font-black uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  {daily.reference}
                </p>
              </div>
            </div>
          ) : (
             <p className="text-stone-300 italic">No spiritual bread posted for today.</p>
          )}
        </motion.div>

        {/* Saint of the Day */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-[40px] p-10 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between border border-white/40 dark:border-white/5"
        >
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400">
                <UserIcon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">Saint of the Day</span>
            </div>
            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>
            ) : daily ? (
              <div className="space-y-4">
                <h3 className="text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">{daily.saintName}</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm md:text-base leading-relaxed line-clamp-4 font-medium italic">
                  {daily.saintInfo}
                </p>
              </div>
            ) : (
              <p className="text-stone-300 italic tracking-wider">Saint information appearing soon.</p>
            )}
          </div>
          <div className="mt-10 pt-8 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-stone-400">
               <Calendar className="w-4 h-4 text-brand-600" />
               {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Hub */}
      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-stone-400 dark:text-stone-500 text-center md:text-left">Quick Sanctuary Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <QuickAction onClick={() => onTabChange('choir')} title="Choir Hub" icon={<Music />} color="text-brand-600 bg-brand-50/50 dark:bg-brand-900/20" />
          <QuickAction onClick={() => onTabChange('petitions')} title="Prayer Desk" icon={<Heart />} color="text-red-600 bg-red-50/50 dark:bg-red-900/20" />
          <QuickAction onClick={() => onTabChange('events')} title="Events Wall" icon={<Calendar />} color="text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20" />
          <QuickAction onClick={() => onTabChange('trivia')} title="Holy Trivia" icon={<BookOpen />} color="text-amber-600 bg-amber-50/50 dark:bg-amber-900/20" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, icon, color, onClick }: { title: string, icon: React.ReactNode, color: string, onClick?: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-6 md:p-8 rounded-[32px] glass ${color} flex flex-col items-center justify-center text-center gap-4 cursor-pointer shadow-sm hover:shadow-xl transition-all border border-white/20`}
    >
      <div className="w-12 h-12 flex items-center justify-center bg-white/50 dark:bg-black/20 rounded-2xl shadow-inner">{icon}</div>
      <span className="text-xs md:text-sm font-black uppercase tracking-widest">{title}</span>
    </motion.button>
  );
}
