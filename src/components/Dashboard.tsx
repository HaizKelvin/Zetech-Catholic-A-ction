import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl } from '../types';
import { Quote, BookOpen, User as UserIcon, Calendar, Loader2, Heart, Library, Trophy, ArrowUpRight } from 'lucide-react';
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
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 md:space-y-12"
    >
      {/* Immersive Cinematic Header */}
      <motion.header 
        variants={item}
        className="relative py-16 md:py-40 px-6 md:px-32 rounded-[48px] md:rounded-[100px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/20 group"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-40"
            alt="Sanctuary"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/20 via-brand-950/40 to-brand-950" />
          
          {/* Divine Light Blurs */}
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] bg-brand-500/20 blur-[200px] rounded-full animate-float" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-brand-800/30 blur-[180px] rounded-full animate-pulse-gentle" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 md:gap-24">
          <div className="space-y-8 md:space-y-16 max-w-5xl">
            <motion.div
              variants={item}
              className="inline-flex items-center gap-3 md:gap-5 px-5 md:px-8 py-2 md:py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-3xl text-[9px] md:text-[12px] font-black uppercase tracking-[0.5em] md:tracking-[0.6em] text-brand-400 shadow-2xl"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
              Cathedral of Connections
            </motion.div>
            
            <motion.h1 
              variants={item}
              className="text-5xl md:text-[8rem] font-black tracking-[-0.03em] md:tracking-[-0.05em] leading-[0.8] md:leading-[0.65] group-hover:text-white transition-colors duration-700"
            >
              Welcome Home, <br />
              <span className="serif-display italic font-light text-brand-500 lowercase drop-shadow-3xl group-hover:text-brand-400 transition-colors duration-700">{userName}</span>
            </motion.h1>

            <motion.div variants={item} className="p-8 bg-white/5 backdrop-blur-3xl rounded-[32px] md:rounded-[48px] border border-white/10 max-w-3xl relative group/quote">
               <Quote className="absolute -top-6 -left-6 md:-top-10 md:-left-10 w-12 h-12 md:w-20 md:h-20 text-brand-500/10 transition-transform group-hover/quote:scale-110 duration-700" />
               <p className="text-xl md:text-4xl font-serif italic text-stone-100 leading-[1.2] md:leading-[1.1]">
                "In the silence of the heart, <br />
                <span className="text-brand-400">Divine Wisdom</span> speaks."
              </p>
            </motion.div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-8 md:gap-12">
            <motion.div 
              variants={item}
              className="glass px-8 md:px-12 py-6 md:py-8 rounded-[32px] md:rounded-[48px] border border-white/10 shadow-3xl backdrop-blur-3xl transition-all duration-700 relative group/stat overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] md:tracking-[0.6em] text-brand-500 block mb-3 md:mb-4">Soul Frequency</span>
              <div className="flex items-baseline gap-3 md:gap-4">
                <p className="text-3xl md:text-7xl font-black font-mono tracking-tighter text-white">MAGNIFICENT</p>
                <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-brand-500 animate-pulse mb-2 md:mb-3" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Cinematic Footer for Header */}
        <motion.div 
          variants={item}
          className="mt-12 md:mt-24 pt-8 md:pt-12 border-t border-white/10 flex items-center justify-between text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-white/40"
        >
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 text-brand-500" />
              <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span className="serif-display italic lowercase opacity-60">anno domini</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span>{new Date().getFullYear()}</span>
          </div>
        </motion.div>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10">
        {/* Divine Wisdom Card */}
        <motion.div 
          variants={item}
          className="md:col-span-8 bg-white dark:bg-slate-900/50 p-8 md:p-16 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.02)] rounded-[56px] border border-slate-100 dark:border-white/5"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.05] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-10">
              <div className="w-14 h-14 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center rounded-[22px] shadow-sm">
                <BookOpen className="w-7 h-7 text-brand-600" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Word of the Day</span>
                <p className="text-brand-600 font-serif italic text-sm">Spiritual Nourishment</p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand-200" /></div>
            ) : daily ? (
              <div className="space-y-8">
                <p className="text-3xl md:text-5xl font-serif italic font-light text-slate-900 dark:text-white leading-[1.2] tracking-tight">
                  "{daily.verse}"
                </p>
                <div className="flex items-center gap-6">
                  <div className="h-[3px] w-10 bg-brand-500/30 rounded-full" />
                  <p className="text-xs md:text-lg font-black uppercase tracking-[0.3em] text-brand-500 italic">
                    {daily.reference}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Saintly Insights Card */}
        <motion.div 
          variants={item}
          className="md:col-span-4 p-8 md:p-10 bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-white/5 rounded-[56px] relative overflow-hidden group shadow-sm"
        >
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-md">
                <UserIcon className="w-6 h-6 text-brand-500" />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Patron Guide</h2>
            </div>

            <div className="flex-1 space-y-4">
              {loading ? (
                <div className="py-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>
              ) : daily ? (
                <>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 leading-tight">{daily.saintName}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-bold opacity-80 line-clamp-5">
                    {daily.saintInfo}
                  </p>
                </>
              ) : null}
            </div>

            <button 
              onClick={() => onTabChange('trivia')}
              className="mt-8 w-full py-4 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-brand-600 font-black tracking-[0.3em] text-[10px] rounded-[24px] shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all border border-slate-100 dark:border-white/5"
            >
              DISCOVER MORE <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      <motion.div 
        variants={item}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
      >
        <QuickAction onClick={() => onTabChange('resources')} title="The Library" icon={<Library className="w-8 h-8" />} color="text-brand-500" />
        <QuickAction onClick={() => onTabChange('petitions')} title="Divine Altar" icon={<Heart className="w-8 h-8" />} color="text-rose-400" />
        <QuickAction onClick={() => onTabChange('events')} title="Matters" icon={<Calendar className="w-8 h-8" />} color="text-emerald-500" />
        <QuickAction onClick={() => onTabChange('trivia')} title="Devotion" icon={<Trophy className="w-8 h-8" />} color="text-amber-500" />
      </motion.div>
    </motion.div>
  );
}

function QuickAction({ title, icon, color, onClick }: { title: string, icon: React.ReactNode, color: string, onClick?: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.05, y: -10 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-900 p-8 md:p-14 flex flex-col items-center justify-center gap-6 group relative overflow-hidden border border-slate-100 dark:border-white/5 shadow-[0_15px_35px_rgba(0,0,0,0.02)] rounded-[48px]"
    >
      <div className="absolute inset-0 bg-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-[28px] shadow-inner transition-all duration-700 group-hover:scale-110 group-hover:bg-brand-500/10 ${color}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
      </div>
      <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 text-center leading-tight group-hover:text-brand-600 transition-colors relative z-10 font-sans">
        {title}
      </span>
    </motion.button>
  );
}
