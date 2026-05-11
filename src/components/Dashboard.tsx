import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl } from '../types';
import { Quote, BookOpen, User as UserIcon, Calendar, Loader2, Heart, Library, Trophy, ArrowUpRight, HelpCircle, MessageCircle } from 'lucide-react';
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

  const shareDaily = () => {
    if (!daily) return;
    const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    const message = `━━━━━━━━━━━━━━━━━━
*ZUCA OFFICIAL BROADCAST*
━━━━━━━━━━━━━━━━━━

*DAILY BREAD*
_${today}_

*Scripture Reference*
${daily.reference}

*Verse*
"${daily.verse}"

*Saint of the Day*
${daily.saintName}

*Reflections*
${daily.saintInfo}

━━━━━━━━━━━━━━━━━━
*ZUCA HOLY PORTAL*
${window.location.origin}
━━━━━━━━━━━━━━━━━━`;
    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10 md:space-y-20 pb-20 mt-6 md:mt-20 px-2 md:px-10"
    >
      {/* Immersive Header - More compact and clean */}
      <motion.header 
        variants={item}
        className="relative py-6 md:py-24 px-4 md:px-12 rounded-[24px] md:rounded-[48px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group h-auto flex items-center mb-4 md:mb-8"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-20 transition-transform duration-[15s] group-hover:scale-100"
            alt="Sanctuary"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 md:gap-12 max-w-6xl">
          <motion.div
            variants={item}
            className="inline-flex items-center gap-2 px-3 py-1 md:px-6 md:py-2 rounded-full glass-dark border border-white/10 text-[7px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-300 shadow-2xl backdrop-blur-xl"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(92,133,255,1)]" />
            Cathedral of Connections
          </motion.div>
          
          <div className="space-y-2 md:space-y-6">
            <motion.h1 
              variants={item}
              className="text-2xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-none text-white text-left"
            >
              Welcome Home, <br />
              <span className="serif-display italic font-light text-brand-400 lowercase drop-shadow-3xl">{userName}</span>
            </motion.h1>
            
            <motion.p variants={item} className="text-stone-400 text-xs md:text-xl font-light max-w-xl leading-relaxed italic serif-display opacity-80 text-left">
              Your digital sanctuary for community, devotion, and divine exploration.
            </motion.p>
          </div>
        </div>
      </motion.header>

      {/* Main Insights Bento Grid - Optimized Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Divine Bread - Primary Card */}
        <motion.div 
          variants={item}
          className="lg:col-span-8 bg-white dark:bg-stone-900/40 p-6 md:p-12 relative overflow-hidden group shadow-xl rounded-[32px] md:rounded-[64px] border border-stone-100 dark:border-white/5"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.02] pointer-events-none" />
          <div className="relative z-10 space-y-6 md:space-y-10">
            <div className="flex items-center gap-4 md:gap-6">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center rounded-[18px] md:rounded-[22px] shadow-sm group-hover:rotate-6 transition-transform duration-500">
                <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-brand-300/30">Daily Bread</span>
                <p className="text-brand-600 dark:text-brand-400 font-serif italic text-base md:text-lg">Morning Meditation</p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 md:py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-100" /></div>
            ) : daily ? (
              <div className="space-y-6 md:space-y-8">
                <p className="text-2xl md:text-4xl lg:text-5xl font-serif italic font-light text-stone-950 dark:text-white leading-[1.1] tracking-tight group-hover:-translate-x-1 transition-transform duration-1000">
                  "{daily.verse}"
                </p>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-3 md:gap-6">
                    <div className="h-[1px] w-10 md:w-16 bg-brand-500/20 rounded-full group-hover:w-24 transition-all duration-1000" />
                    <p className="text-[10px] md:text-base font-black uppercase tracking-[0.4em] text-brand-500 italic">
                      {daily.reference}
                    </p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={shareDaily}
                    className="flex items-center gap-2 px-6 py-3 bg-[#25D366]/10 text-[#25D366] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#25D366]/20 transition-all hover:bg-[#25D366] hover:text-white"
                  >
                    Share <MessageCircle className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Saint Insight & Community Stat Column */}
        <div className="lg:col-span-4 flex flex-col gap-6 md:gap-8">
          <motion.div 
            variants={item}
            className="flex-1 p-6 md:p-8 bg-stone-50 dark:bg-stone-950/80 border border-stone-100 dark:border-white/5 rounded-[32px] md:rounded-[48px] relative overflow-hidden group shadow-lg"
          >
            <div className="relative z-10 flex flex-col h-full space-y-5 md:space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-[14px] md:rounded-[18px] bg-white dark:bg-stone-900 flex items-center justify-center shadow-md">
                  <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-brand-500" />
                </div>
                <h2 className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] text-stone-400 dark:text-brand-300/30">Patron Guide</h2>
              </div>

              {daily && (
                <div className="space-y-2 md:space-y-3 flex-1">
                  <h3 className="text-lg md:text-xl font-black text-stone-900 dark:text-white leading-tight">{daily.saintName}</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-[11px] md:text-sm leading-relaxed opacity-80 line-clamp-4 md:line-clamp-6 serif-display italic">
                    {daily.saintInfo}
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => onTabChange('trivia')}
                className="w-full py-3 md:py-4 bg-white dark:bg-white/5 text-brand-600 dark:text-brand-400 font-black tracking-[0.3em] text-[9px] rounded-2xl border border-stone-100 dark:border-white/10 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all shadow-sm"
              >
                DAILY DEVOTION
              </button>
            </div>
          </motion.div>

          <motion.div 
            variants={item}
            className="p-6 md:p-8 glass-dark rounded-[32px] md:rounded-[48px] overflow-hidden group relative border border-white/5 shadow-2xl flex items-center justify-center min-h-[120px] md:min-h-[160px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-transparent group-hover:scale-125 transition-transform duration-[2s]" />
            <div className="relative z-10 text-center space-y-2 md:space-y-3">
              <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] text-brand-400">Atmosphere</span>
              <p className="text-2xl md:text-3xl font-black text-white tracking-[0.1em] animate-pulse-gentle">DIVINE</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions - Floating Style */}
      <div className="relative pt-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-stone-200 dark:via-white/10 to-transparent" />
        
        <motion.div 
          variants={item}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8"
        >
          <CompactAction onClick={() => onTabChange('chat')} title="Chat" icon={<HelpCircle className="w-5 h-5 md:w-6 md:h-6" />} color="bg-indigo-500/10 text-indigo-500" />
          <CompactAction onClick={() => onTabChange('materials')} title="Library" icon={<Library className="w-5 h-5 md:w-6 md:h-6" />} color="bg-brand-500/10 text-brand-500" />
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
