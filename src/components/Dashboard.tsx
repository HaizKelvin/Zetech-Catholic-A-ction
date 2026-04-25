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
      className="space-y-12 md:space-y-40 pb-20 md:pb-40"
    >
      {/* Immersive Cinematic Header */}
      <motion.header 
        variants={item}
        className="relative py-16 md:py-52 px-6 md:px-32 rounded-[48px] md:rounded-[100px] overflow-hidden bg-stone-950 text-white shadow-3xl shadow-brand-900/20 group"
      >
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.5 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
            src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop" 
            className="w-full h-full object-cover mix-blend-overlay"
            alt="Sanctuary Sanctuary"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/20 via-stone-950/80 to-stone-950" />
          <div className="absolute inset-0 noise-pattern opacity-[0.03] pointer-events-none" />
          
          {/* Divine Light Blurs */}
          <div className="absolute -top-1/2 -right-1/4 w-[1000px] h-[1000px] bg-brand-500/20 blur-[200px] rounded-full animate-pulse-gentle" />
          <div className="absolute -bottom-1/2 -left-1/4 w-[800px] h-[800px] bg-brand-900/30 blur-[180px] rounded-full" />
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
            
            <div className="space-y-6 md:space-y-8">
              <motion.div variants={item} className="flex items-center gap-4 md:gap-6">
                <div className="h-px w-10 md:w-16 bg-brand-500/40" />
                <p className="text-stone-400 text-sm md:text-2xl font-serif italic tracking-widest">
                  Sacred Entrance
                </p>
              </motion.div>
              
              <motion.h1 
                variants={item}
                className="text-5xl md:text-[8rem] font-black tracking-[-0.03em] md:tracking-[-0.05em] leading-[0.8] md:leading-[0.65]"
              >
                Welcome, <br />
                <span className="serif-display italic font-light text-brand-500 lowercase drop-shadow-3xl">{userName}</span>
              </motion.h1>
            </div>

            <motion.div 
              variants={item}
              className="relative group/quote"
            >
               <Quote className="absolute -top-6 -left-6 md:-top-10 md:-left-10 w-12 h-12 md:w-20 md:h-20 text-brand-500/10 transition-transform group-hover/quote:scale-110 duration-700" />
               <p className="text-lg md:text-3xl font-serif italic text-stone-100 max-w-3xl leading-[1.2] md:leading-[1.1] border-l-2 md:border-l-[3px] border-brand-500/30 pl-8 md:pl-12 ml-4 md:ml-6 bg-gradient-to-r from-white/5 to-transparent py-3 md:py-4 rounded-r-3xl">
                "In the silence of the heart, <br />
                <span className="text-brand-400">Divine Wisdom</span> speaks."
              </p>
            </motion.div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-8 md:gap-12">
            <motion.div 
              variants={item}
              whileHover={{ y: -10 }}
              className="glass px-8 md:px-12 py-6 md:py-8 rounded-[32px] md:rounded-[48px] border border-white/10 shadow-3xl backdrop-blur-3xl transition-all duration-700 relative group/stat overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.5em] md:tracking-[0.6em] text-brand-500 block mb-3 md:mb-4">Soul Frequency</span>
              <div className="flex items-baseline gap-3 md:gap-4">
                <p className="text-3xl md:text-7xl font-black font-mono tracking-tighter text-white">MAGNIFICENT</p>
                <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-brand-500 animate-pulse mb-2 md:mb-3" />
              </div>
            </motion.div>

            <motion.div 
              variants={item}
              className="flex items-center gap-6 md:gap-8 text-stone-500 text-[10px] md:text-[13px] font-bold uppercase tracking-[0.4em] md:tracking-[0.5em]"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-brand-600" />
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
              <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-white/20" />
              <span className="italic serif-display lowercase tracking-normal text-stone-400">Anno Domini</span> 2026
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Advanced Bento Sanctuary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-20">
        {/* Divine Wisdom - Master Bento Card */}
        <motion.div 
          variants={item}
          className="lg:col-span-8 glass rounded-[48px] md:rounded-[64px] p-8 md:p-28 relative group overflow-hidden border border-white/20 shadow-2xl"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-brand-500/10 blur-[150px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
          
          <div className="flex items-center justify-between mb-12 md:mb-32 relative z-10">
            <div className="flex items-center gap-6 md:gap-8">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-[24px] md:rounded-[32px] bg-stone-950 flex items-center justify-center shadow-3xl text-white transform group-hover:rotate-12 transition-all duration-700">
                <BookOpen className="w-8 h-8 md:w-12 md:h-12 text-brand-400" />
              </div>
              <div>
                <span className="text-[10px] md:text-[13px] font-black uppercase tracking-[0.6em] md:tracking-[0.7em] text-brand-600">Sacred Manuscript</span>
                <p className="text-stone-500 font-serif italic text-base md:text-lg opacity-80">The Liturgy of Life</p>
              </div>
            </div>
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-brand-500/20 animate-spin-slow" />
          </div>

          {loading ? (
            <div className="py-24 md:py-32 flex justify-center"><Loader2 className="w-16 h-16 md:w-20 md:h-20 animate-spin text-brand-600" /></div>
          ) : daily ? (
            <div className="space-y-12 md:space-y-24 relative z-10">
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-[4.5rem] font-serif italic font-light text-stone-950 dark:text-white leading-[1.1] md:leading-[0.95] tracking-[-0.02em] md:tracking-[-0.03em]"
              >
                "{daily.verse}"
              </motion.p>
              <div className="flex items-center gap-8 md:gap-10">
                <div className="h-[2px] md:h-[3px] w-20 md:w-32 bg-brand-600/40 rounded-full" />
                <p className="text-lg md:text-3xl font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-brand-600 dark:text-brand-500 italic serif-display">
                  {daily.reference}
                </p>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Saintly Companion - Portrait Bento */}
        <motion.div 
          variants={item}
          className="lg:col-span-4 glass rounded-[48px] md:rounded-[64px] p-8 md:p-12 relative overflow-hidden flex flex-col group bg-stone-950 text-white shadow-3xl border border-white/5"
        >
          <div className="absolute inset-0">
             <div className="absolute inset-0 bg-brand-900/20 pointer-events-none" />
             <div className="absolute inset-0 sacred-grid opacity-[0.05]" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-10 md:mb-16">
              <div className="flex items-center gap-5 md:gap-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-[24px] md:rounded-3xl bg-white/10 backdrop-blur-3xl flex items-center justify-center border border-white/10 group-hover:bg-brand-500/20 transition-all duration-700">
                  <UserIcon className="w-7 h-7 md:w-8 md:h-8 text-brand-400" />
                </div>
                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] md:tracking-[0.6em] text-stone-500">Patron Saint</span>
              </div>
            </div>

            <div className="flex-1 space-y-8 md:space-y-10">
              {loading ? (
                <div className="py-20 md:py-24 flex items-center justify-center"><Loader2 className="w-12 h-12 md:w-16 md:h-16 animate-spin text-white/20" /></div>
              ) : daily ? (
                <>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] md:leading-[0.8] serif-display italic text-brand-50">{daily.saintName}</h3>
                  <div className="w-16 md:w-24 h-0.5 md:h-[3px] bg-brand-500/60 rounded-full" />
                  <p className="text-stone-300 text-base md:text-xl leading-relaxed font-serif italic opacity-80 line-clamp-8 md:line-clamp-12">
                    {daily.saintInfo}
                  </p>
                </>
              ) : null}
            </div>

            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: '#3b82f6', color: '#fff' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange('trivia')}
              className="mt-12 md:mt-20 w-full py-6 md:py-8 rounded-[24px] md:rounded-[32px] bg-white text-stone-950 text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] md:tracking-[0.6em] shadow-3xl transition-all duration-500 flex items-center justify-center gap-3 md:gap-4 group/btn"
            >
              Hagiography <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:translate-x-2 group-hover/btn:-translate-y-2 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Magnificent Navigation Map */}
      <motion.div 
        variants={item}
        className="space-y-12 md:space-y-20"
      >
        <div className="flex items-center gap-8 md:gap-16 px-4">
          <div className="h-[1px] md:h-[2px] flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
          <h3 className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.8em] md:tracking-[1.2em] text-stone-400 shrink-0 italic serif-display">Sanctuary Map</h3>
          <div className="h-[1px] md:h-[2px] flex-1 bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-20">
          <QuickAction onClick={() => onTabChange('resources')} title="The Library" icon={<Library className="w-8 h-8 md:w-10 md:h-10" />} color="text-brand-600" />
          <QuickAction onClick={() => onTabChange('petitions')} title="The Altar" icon={<Heart className="w-8 h-8 md:w-10 md:h-10" />} color="text-rose-500" />
          <QuickAction onClick={() => onTabChange('events')} title="Matters" icon={<Calendar className="w-8 h-8 md:w-10 md:h-10" />} color="text-emerald-500" />
          <QuickAction onClick={() => onTabChange('trivia')} title="Devotion" icon={<Trophy className="w-8 h-8 md:w-10 md:h-10" />} color="text-amber-500" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuickAction({ title, icon, color, onClick }: { title: string, icon: React.ReactNode, color: string, onClick?: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.05, y: -24 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="glass rounded-[32px] md:rounded-[56px] p-8 md:p-20 flex flex-col items-center justify-center gap-6 md:gap-10 group relative overflow-hidden border border-white/20 shadow-xl"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className={`w-16 h-16 md:w-32 md:h-32 flex items-center justify-center bg-white dark:bg-white/5 rounded-full shadow-3xl transition-all duration-700 group-hover:scale-110 group-hover:shadow-brand-500/20 border border-stone-100 dark:border-white/10 ${color}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6 md:w-10 md:h-10' })}
      </div>
      <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-stone-500 dark:text-stone-400 text-center leading-tight group-hover:text-stone-950 dark:group-hover:text-white transition-colors relative z-10">
        {title}
      </span>
    </motion.button>
  );
}
