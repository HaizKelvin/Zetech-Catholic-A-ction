import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl } from '../types';
import { Quote, BookOpen, User as UserIcon, Calendar, Loader2, Heart, Library, Trophy, ArrowUpRight, Sparkles } from 'lucide-react';
import { motion, Variants } from 'motion/react';

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

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] as any
      } 
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-20 md:space-y-32 pb-32"
    >
      {/* Editorial Header */}
      <motion.header 
        variants={item}
        className="relative py-20 md:py-40 px-10 md:px-24 rounded-[56px] md:rounded-[80px] overflow-hidden bg-stone-950 text-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] group"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
            src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            alt="Sanctuary Interior"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
          <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-brand-900/20 blur-[180px] rounded-full animate-pulse-gentle" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-brand-400/10 blur-[150px] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-16">
          <div className="space-y-10 md:space-y-12 max-w-4xl">
            <motion.div
              variants={item}
              className="inline-flex items-center gap-4 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-brand-400 shadow-xl"
            >
              <Sparkles className="w-4 h-4 text-brand-500 animate-pulse" />
              Cathedral of Connections
            </motion.div>
            <div className="space-y-4">
              <motion.p 
                variants={item}
                className="text-stone-400 text-sm md:text-xl font-medium tracking-[0.2em] font-serif italic"
              >
                Entrance to the Sanctuary
              </motion.p>
              <motion.h1 
                variants={item}
                className="text-6xl md:text-[10rem] font-bold tracking-tighter leading-[0.8] md:leading-[0.7]"
              >
                Pax, <br />
                <span className="serif-display italic font-light text-brand-600 lowercase drop-shadow-[0_20px_50px_rgba(59,130,246,0.3)]">{userName}</span>
              </motion.h1>
            </div>
            <motion.div 
              variants={item}
              className="relative"
            >
               <Quote className="absolute -top-6 -left-6 w-12 h-12 text-brand-500/20 opacity-50" />
               <p className="text-white md:text-stone-100 text-xl md:text-4xl font-serif italic max-w-2xl leading-tight border-l-2 border-brand-500/40 pl-10 ml-4">
                "In the silence of the heart, <br />
                God speaks."
              </p>
            </motion.div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-10">
            <motion.div 
              variants={item}
              className="glass px-10 py-6 rounded-[32px] border border-white/10 shadow-2xl backdrop-blur-3xl group-hover:scale-105 transition-transform duration-700"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-400 block mb-2">Soul Frequency</span>
              <div className="flex items-end gap-2">
                <p className="text-3xl md:text-5xl font-black font-mono tracking-tighter text-white">MAGNIFICENT</p>
                <div className="w-2 h-2 rounded-full bg-emerald-500 mb-2 animate-pulse" />
              </div>
            </motion.div>
            <motion.div 
              variants={item}
              className="flex items-center gap-6 text-stone-400 text-[10px] md:text-[12px] font-bold uppercase tracking-[0.4em]"
            >
              <Calendar className="w-5 h-5 text-brand-600" />
              {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
              <span className="w-2 h-2 rounded-full bg-white/10" />
              Ecclesiastical Year 2026
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Bento Grid Daily Bread */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16">
        {/* Divine Wisdom - Large Bento Card */}
        <motion.div 
          variants={item}
          className="lg:col-span-8 glass-card p-12 md:p-24 relative group overflow-hidden"
        >
          <div className="absolute inset-0 sacred-grid opacity-[0.03] dark:opacity-[0.02]" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-500/10 blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
          
          <div className="flex items-center gap-6 mb-16 md:mb-24 relative z-10">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-stone-950 dark:bg-white flex items-center justify-center shadow-2xl text-white dark:text-stone-950 transform group-hover:rotate-6 transition-transform duration-500">
              <BookOpen className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-brand-500">Sacred Manuscript</span>
              <p className="text-[10px] md:text-xs font-bold text-stone-500 dark:text-stone-400 tracking-tight uppercase tracking-[0.2em] mt-1">Liturgy of the Word</p>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex justify-center"><Loader2 className="w-16 h-16 animate-spin text-brand-600" /></div>
          ) : daily ? (
            <div className="space-y-12 md:space-y-20 relative z-10">
              <p className="text-4xl md:text-8xl font-serif italic font-light text-stone-900 dark:text-white leading-[1.05] tracking-tight">
                "{daily.verse}"
              </p>
              <div className="flex items-center gap-8">
                <div className="h-[2px] w-24 bg-brand-600/40" />
                <p className="text-sm md:text-xl font-black uppercase tracking-[0.8em] text-brand-600 dark:text-brand-400">
                  {daily.reference}
                </p>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Saintly Companion - Bento Side Card */}
        <motion.div 
          variants={item}
          className="lg:col-span-4 glass-card p-12 relative overflow-hidden flex flex-col group bg-stone-950 text-white"
        >
          <div className="absolute inset-0">
             <div className="absolute inset-0 bg-brand-900/10 pointer-events-none" />
             <div className="absolute inset-0 divine-pattern opacity-[0.05]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-5 mb-12">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <UserIcon className="w-7 h-7 text-brand-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Patron Saint</span>
            </div>

            <div className="flex-1 space-y-8">
              {loading ? (
                <div className="py-20 flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-white/20" /></div>
              ) : daily ? (
                <>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] serif-display italic">{daily.saintName}</h3>
                  <div className="w-16 h-1 bg-brand-500/40" />
                  <p className="text-stone-400 text-base md:text-lg leading-relaxed font-serif italic opacity-90 line-clamp-10">
                    {daily.saintInfo}
                  </p>
                </>
              ) : null}
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange('trivia')}
              className="mt-16 w-full py-6 rounded-[24px] bg-white text-stone-950 text-[10px] font-black uppercase tracking-[0.5em] shadow-2xl transition-all flex items-center justify-center gap-3 group/btn"
            >
              Hagiography <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Magnificent Navigation Section */}
      <motion.div 
        variants={item}
        className="space-y-16"
      >
        <div className="flex items-center gap-12">
          <div className="h-[1px] flex-1 bg-stone-200 dark:bg-white/10" />
          <h3 className="text-[12px] font-black uppercase tracking-[1em] text-stone-400 shrink-0">Sanctuary Map</h3>
          <div className="h-[1px] flex-1 bg-stone-200 dark:bg-white/10" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16">
          <QuickAction onClick={() => onTabChange('resources')} title="Library" icon={<Library className="w-8 h-8" />} color="text-brand-600" />
          <QuickAction onClick={() => onTabChange('petitions')} title="Altar" icon={<Heart className="w-8 h-8" />} color="text-rose-500" />
          <QuickAction onClick={() => onTabChange('events')} title="Matters" icon={<Calendar className="w-8 h-8" />} color="text-emerald-500" />
          <QuickAction onClick={() => onTabChange('trivia')} title="Devotion" icon={<Trophy className="w-8 h-8" />} color="text-amber-500" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuickAction({ title, icon, color, onClick }: { title: string, icon: React.ReactNode, color: string, onClick?: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02, y: -16 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card p-12 md:p-16 flex flex-col items-center justify-center gap-8 group"
    >
      <div className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center bg-stone-100 dark:bg-white/5 rounded-full shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:shadow-brand-500/20 border border-stone-200/50 dark:border-white/5 ${color}`}>
        {icon}
      </div>
      <span className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.5em] text-stone-600 dark:text-stone-400 text-center leading-tight group-hover:text-stone-950 dark:group-hover:text-white transition-colors">
        {title}
      </span>
    </motion.button>
  );
}
