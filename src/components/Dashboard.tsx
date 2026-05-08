import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl } from '../types';
import { Quote, BookOpen, User as UserIcon, Calendar, Loader2, Heart, Library, Trophy, ArrowUpRight, HelpCircle } from 'lucide-react';
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
      className="space-y-10 md:space-y-20 pb-20 mt-6 md:mt-20 px-2 md:px-10"
    >
      {/* Immersive Header - More spacious and clean */}
      <motion.header 
        variants={item}
        className="relative py-12 md:py-52 px-6 md:px-28 rounded-[32px] md:rounded-[120px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group h-auto flex items-center mb-6 md:mb-12"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-20 transition-transform duration-[15s] group-hover:scale-100"
            alt="Sanctuary"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
          <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand-500/10 blur-[180px] rounded-full -mr-96 -mt-96" />
        </div>

        <div className="relative z-10 flex flex-col gap-16 max-w-6xl">
          <motion.div
            variants={item}
            className="inline-flex items-center gap-3 px-6 py-2 md:px-8 md:py-3 rounded-full glass-dark border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-brand-300 shadow-2xl backdrop-blur-xl"
          >
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-400 animate-pulse shadow-[0_0_12px_rgba(92,133,255,1)]" />
            Cathedral of Connections
          </motion.div>
          
          <div className="space-y-6 md:space-y-10">
            <motion.h1 
              variants={item}
              className="text-4xl md:text-[10rem] font-black tracking-[-0.05em] leading-tight md:leading-[0.8] text-white"
            >
              Welcome Home, <br />
              <span className="serif-display italic font-light text-brand-400 lowercase drop-shadow-3xl">{userName}</span>
            </motion.h1>
            
            <motion.p variants={item} className="text-stone-400 text-base md:text-3xl font-light max-w-2xl leading-relaxed italic serif-display opacity-80">
              Your digital sanctuary for community, devotion, and divine exploration.
            </motion.p>
          </div>
        </div>
      </motion.header>

      {/* Main Insights Bento Grid - More Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-16">
        {/* Divine Bread - Primary Card */}
        <motion.div 
          variants={item}
          className="lg:col-span-8 bg-white dark:bg-stone-900/40 p-8 md:p-24 relative overflow-hidden group shadow-2xl rounded-[40px] md:rounded-[90px] border border-stone-100 dark:border-white/5"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.02] pointer-events-none" />
          <div className="relative z-10 space-y-10 md:space-y-16">
            <div className="flex items-center gap-6 md:gap-8">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center rounded-[22px] md:rounded-[28px] shadow-sm group-hover:rotate-6 transition-transform duration-500">
                <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.6em] text-stone-400 dark:text-brand-300/30">Daily Bread</span>
                <p className="text-brand-600 dark:text-brand-400 font-serif italic text-lg md:text-xl">Morning Meditation</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 md:py-20 flex justify-center"><Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-brand-100" /></div>
            ) : daily ? (
              <div className="space-y-8 md:space-y-12">
                <p className="text-3xl md:text-7xl font-serif italic font-light text-stone-950 dark:text-white leading-[1.05] tracking-tight group-hover:-translate-x-2 transition-transform duration-1000">
                  "{daily.verse}"
                </p>
                <div className="flex items-center gap-4 md:gap-8">
                  <div className="h-[1px] w-12 md:w-20 bg-brand-500/20 rounded-full group-hover:w-40 transition-all duration-1000" />
                  <p className="text-[11px] md:text-xl font-black uppercase tracking-[0.5em] text-brand-500 italic">
                    {daily.reference}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Saint Insight & Community Stat Column */}
        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-10">
          <motion.div 
            variants={item}
            className="flex-1 p-8 md:p-10 bg-stone-50 dark:bg-stone-950/80 border border-stone-100 dark:border-white/5 rounded-[40px] md:rounded-[70px] relative overflow-hidden group shadow-xl"
          >
            <div className="relative z-10 flex flex-col h-full space-y-6 md:space-y-10">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-[18px] md:rounded-[20px] bg-white dark:bg-stone-900 flex items-center justify-center shadow-md">
                  <UserIcon className="w-6 h-6 md:w-7 md:h-7 text-brand-500" />
                </div>
                <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] text-stone-400 dark:text-brand-300/30">Patron Guide</h2>
              </div>

              {daily && (
                <div className="space-y-4 md:space-y-5 flex-1">
                  <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-stone-900 dark:text-white leading-tight">{daily.saintName}</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm md:text-base leading-relaxed font-medium opacity-80 line-clamp-5 serif-display italic">
                    {daily.saintInfo}
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => onTabChange('trivia')}
                className="w-full py-5 bg-white dark:bg-white/5 text-brand-600 dark:text-brand-400 font-black tracking-[0.4em] text-[10px] rounded-[28px] border border-stone-100 dark:border-white/10 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all shadow-sm"
              >
                DAILY DEVOTION
              </button>
            </div>
          </motion.div>

          <motion.div 
            variants={item}
            className="p-8 md:p-10 glass-dark rounded-[40px] md:rounded-[70px] overflow-hidden group relative border border-white/5 shadow-2xl flex items-center justify-center min-h-[160px] md:min-h-[200px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-transparent group-hover:scale-125 transition-transform duration-[2s]" />
            <div className="relative z-10 text-center space-y-3 md:space-y-4">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.6em] text-brand-400">Atmosphere</span>
              <p className="text-3xl md:text-5xl font-black text-white tracking-[0.2em] animate-pulse-gentle">DIVINE</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions - Floating Style */}
      <div className="relative pt-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
        
        <motion.div 
          variants={item}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12"
        >
          <CompactAction onClick={() => onTabChange('chat')} title="Chat" icon={<HelpCircle className="w-5 h-5 md:w-6 md:h-6" />} color="bg-indigo-500/10 text-indigo-500" />
          <CompactAction onClick={() => onTabChange('resources')} title="Study" icon={<Library className="w-5 h-5 md:w-6 md:h-6" />} color="bg-brand-500/10 text-brand-500" />
          <CompactAction onClick={() => onTabChange('gallery')} title="Activities" icon={<Trophy className="w-5 h-5 md:w-6 md:h-6" />} color="bg-amber-500/10 text-amber-500" />
          <CompactAction onClick={() => onTabChange('petitions')} title="Altar" icon={<Heart className="w-5 h-5 md:w-6 md:h-6" />} color="bg-rose-500/10 text-rose-500" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function CompactAction({ title, icon, color, onClick }: { title: string, icon: React.ReactNode, color: string, onClick?: () => void }) {
  return (
    <motion.button 
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center gap-3 md:gap-5 group"
    >
      <div className={`w-16 h-16 md:w-28 md:h-28 rounded-[20px] md:rounded-[40px] flex items-center justify-center transition-all duration-500 bg-white dark:bg-stone-900/50 shadow-lg group-hover:shadow-2xl border border-stone-100 dark:border-white/5 relative overflow-hidden shadow-stone-200/50 dark:shadow-none`}>
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${color.split(' ')[0]}`} />
        <div className={`relative z-10 transition-transform duration-500 group-hover:scale-110 ${color.split(' ')[1]}`}>
          {icon}
        </div>
      </div>
      <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
        {title}
      </span>
    </motion.button>
  );
}
