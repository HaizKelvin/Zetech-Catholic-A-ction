import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl } from '../types';
import { Quote, BookOpen, User as UserIcon, Calendar, Loader2, Heart, Library, Trophy } from 'lucide-react';
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
    <div className="space-y-16 pb-24">
      {/* Editorial Header */}
      <header className="relative py-16 md:py-32 px-8 md:px-20 rounded-[40px] md:rounded-[64px] overflow-hidden bg-stone-950 text-white shadow-[0_30px_90px_-15px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-30 mix-blend-overlay scale-105 animate-float"
            alt="Sanctuary Interior"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-900/10 blur-[150px] rounded-full -mr-48 -mt-48 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-400/5 blur-[120px] rounded-full -ml-32 -mb-32" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-12">
          <div className="space-y-6 md:space-y-8 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-400"
            >
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse shadow-[0_0_10px_#de6044]" />
              Sacred Digital Space
            </motion.div>
            <div className="space-y-2">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-stone-400 text-sm md:text-lg font-black uppercase tracking-[0.3em]"
              >
                Welcome back
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-[9rem] font-bold tracking-tighter leading-[0.8] md:leading-[0.75]"
              >
                Blessings, <br />
                <span className="serif-display italic font-light text-brand-400 lowercase drop-shadow-2xl">{userName}</span>
              </motion.h1>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-stone-500 dark:text-stone-300 text-lg md:text-2xl font-serif italic max-w-xl leading-relaxed border-l-2 border-brand-900 pl-8 ml-2"
            >
              "In the silence of the heart, God speaks."
            </motion.p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6 relative">
            <div className="glass px-8 py-4 rounded-3xl border border-white/5 shadow-2xl">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-300 inline-block mb-1">Soul Status</span>
              <p className="text-2xl md:text-3xl font-black font-mono tracking-tighter text-white">READY</p>
            </div>
            <div className="flex items-center gap-4 text-stone-500 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em]">
              <Calendar className="w-5 h-5 text-brand-600" />
              {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              Year of Grace 2026
            </div>
          </div>
        </div>
      </header>

      {/* Daily Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14">
        {/* Daily Verse Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-8 glass-card p-10 md:p-20 relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/5 via-transparent to-transparent pointer-events-none" />
          <Quote className="absolute -top-8 -right-8 w-40 h-40 md:w-64 md:h-64 text-brand-900/[0.03] group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000" />
          
          <div className="flex items-center gap-5 mb-12 md:mb-20 relative z-10">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-stone-900 flex items-center justify-center shadow-2xl text-white">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-500">Divine Wisdom</span>
              <p className="text-[10px] md:text-xs font-bold text-stone-400 tracking-tight uppercase tracking-[0.1em]">Sacred Scripture Meditation</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-12 h-12 animate-spin text-brand-600" /></div>
          ) : daily ? (
            <div className="space-y-10 md:space-y-16 relative z-10">
              <p className="text-3xl md:text-6xl font-serif italic text-stone-900 dark:text-white leading-[1.1] tracking-tight">
                "{daily.verse}"
              </p>
              <div className="flex items-center gap-6">
                <div className="h-[2px] w-16 bg-brand-500" />
                <p className="text-xs md:text-sm font-black uppercase tracking-[0.5em] text-stone-900 dark:text-stone-300">
                  {daily.reference}
                </p>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Saint Card */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-4 glass-card p-10 md:p-12 relative overflow-hidden flex flex-col group"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-white/5 text-stone-950 dark:text-white flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Saint Companion</span>
          </div>

          <div className="flex-1 space-y-6">
            {loading ? (
              <div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-stone-400" /></div>
            ) : daily ? (
              <>
                <h3 className="text-3xl md:text-4xl font-bold tracking-tighter leading-none">{daily.saintName}</h3>
                <div className="h-px w-16 bg-brand-500/30" />
                <p className="text-stone-500 dark:text-stone-400 text-sm md:text-base leading-relaxed font-serif italic line-clamp-[8]">
                  {daily.saintInfo}
                </p>
              </>
            ) : null}
          </div>

          <button 
            onClick={() => onTabChange('trivia')}
            className="mt-12 w-full py-5 rounded-[22px] bg-stone-950 text-white dark:bg-white dark:text-stone-950 text-[10px] font-black uppercase tracking-[0.4em] hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all flex items-center justify-center gap-3"
          >
            Explore Lives <Trophy className="w-3 h-3" />
          </button>
        </motion.div>
      </div>

      {/* Elegant Quick Actions */}
      <div className="space-y-12">
        <div className="flex items-center gap-8">
          <div className="h-px flex-1 bg-stone-200 dark:bg-white/5" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-stone-400 shrink-0">Sacred Navigation</h3>
          <div className="h-px flex-1 bg-stone-200 dark:bg-white/5" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <QuickAction onClick={() => onTabChange('resources')} title="Sanctuary Library" icon={<Library className="w-7 h-7" />} color="text-brand-600" />
          <QuickAction onClick={() => onTabChange('petitions')} title="Altar Petitions" icon={<Heart className="w-7 h-7" />} color="text-rose-500" />
          <QuickAction onClick={() => onTabChange('events')} title="CA Calendar" icon={<Calendar className="w-7 h-7" />} color="text-emerald-500" />
          <QuickAction onClick={() => onTabChange('trivia')} title="Daily Devotion" icon={<Trophy className="w-7 h-7" />} color="text-amber-500" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, icon, color, onClick }: { title: string, icon: React.ReactNode, color: string, onClick?: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.05, y: -12 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="glass-card p-10 md:p-14 flex flex-col items-center justify-center gap-6 border border-white/5 group"
    >
      <div className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-white dark:bg-white/5 rounded-3xl shadow-2xl transition-all duration-500 group-hover:rotate-6 ${color}`}>
        {icon}
      </div>
      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-stone-500 dark:text-stone-400 text-center leading-tight">
        {title}
      </span>
    </motion.button>
  );
}
