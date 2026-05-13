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
    const message = `*DAILY BREAD | ${today.toUpperCase()}*

*Scripture Reference:*
${daily.reference}

*The Holy Word:*
"${daily.verse}"

*Saint of the Day:*
${daily.saintName}

*Reflections:*
${daily.saintInfo}

━━━━━━━━━━━━━━━━━━
*ZUCA PORTAL:* ${window.location.origin}
✧────────────────✧`;
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
      {/* Immersive Header - Magazine Style */}
      <motion.header 
        variants={item}
        className="relative py-12 md:py-32 px-6 md:px-20 rounded-[32px] md:rounded-[80px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/20 group h-auto flex items-center mb-8 md:mb-12"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-30 transition-transform duration-[20s] group-hover:scale-100"
            alt="Sanctuary"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/60 to-transparent" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 blur-[150px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-indigo-500/10 blur-[130px] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col gap-10 md:gap-16 max-w-7xl w-full">
          <motion.div
            variants={item}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-dark border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-brand-300 shadow-2xl backdrop-blur-3xl w-fit"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse shadow-[0_0_12px_rgba(92,133,255,1)]" />
            Cathedral of Digital Fellowship
          </motion.div>
          
          <div className="space-y-4 md:space-y-8">
            <motion.h1 
              variants={item}
              className="text-5xl md:text-[10rem] font-black tracking-[-0.04em] leading-[0.8] text-white text-left"
            >
              Welcome, <br />
              <span className="serif-display italic font-light text-brand-400 lowercase drop-shadow-3xl shadow-brand-400/20">
                {userName?.toLowerCase() || 'member'}
              </span>
            </motion.h1>
            
            <motion.p variants={item} className="text-stone-400 text-sm md:text-2xl font-light max-w-2xl leading-relaxed italic serif-display opacity-80 text-left pl-2 md:pl-4 border-l border-brand-500/30">
              Your digital sanctuary for community devotion, divine wisdom, and authentic connection.
            </motion.p>
          </div>
        </div>
      </motion.header>

      {/* Main Insights Bento Grid - Optimized Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Divine Bread - Primary Card */}
        <motion.div 
          variants={item}
          className="lg:col-span-8 bg-white dark:bg-stone-900/40 p-8 md:p-16 relative overflow-hidden group shadow-2xl rounded-[40px] md:rounded-[80px] border border-stone-100 dark:border-white/5"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/5 blur-[100px] rounded-full group-hover:bg-brand-500/10 transition-colors duration-1000" />
          
          <div className="relative z-10 space-y-8 md:space-y-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center rounded-[24px] md:rounded-[32px] shadow-sm group-hover:rotate-6 transition-transform duration-700">
                  <BookOpen className="w-6 h-6 md:w-10 md:h-10 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.6em] text-stone-400 dark:text-brand-300/30">Liturgy of the Word</span>
                  <p className="text-brand-600 dark:text-brand-400 font-serif italic text-lg md:text-2xl mt-1">Morning Devotion</p>
                </div>
              </div>
              
              <div className="hidden md:flex flex-col items-end">
                 <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                 <p className="text-[8px] font-bold text-brand-500/40 uppercase tracking-[0.4em]">Solemnity</p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 md:py-32 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand-200" /></div>
            ) : daily ? (
              <div className="space-y-10 md:space-y-16">
                <div className="relative">
                   <Quote className="absolute -top-12 -left-8 w-24 h-24 text-brand-500/5 -z-10 group-hover:scale-110 transition-transform duration-[2s]" />
                   <p className="text-3xl md:text-6xl lg:text-7xl font-serif italic font-light text-stone-950 dark:text-white leading-[1] tracking-tight group-hover:-translate-x-1 transition-transform duration-1000">
                     "{daily.verse}"
                   </p>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex items-center gap-6">
                    <div className="h-[1px] w-12 md:w-24 bg-brand-500/20 rounded-full group-hover:w-32 transition-all duration-1000" />
                    <p className="text-xs md:text-xl font-black uppercase tracking-[0.5em] text-brand-500 italic drop-shadow-sm font-sans">
                      {daily.reference}
                    </p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={shareDaily}
                    className="flex items-center gap-3 px-10 py-5 bg-[#25D366] text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#25D366]/20 transition-all hover:bg-[#128C7E]"
                  >
                    Share Liturgy <MessageCircle className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Saint Insight & Atmosphere Column */}
        <div className="lg:col-span-4 flex flex-col gap-8 md:gap-12">
          <motion.div 
            variants={item}
            className="flex-1 p-8 md:p-12 bg-stone-50 dark:bg-stone-950/80 border border-stone-100 dark:border-white/5 rounded-[40px] md:rounded-[64px] relative overflow-hidden group shadow-xl"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
            <div className="relative z-10 flex flex-col h-full space-y-6 md:space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[28px] bg-white dark:bg-stone-900 flex items-center justify-center shadow-md dark:shadow-none border border-stone-100 dark:border-white/5">
                  <UserIcon className="w-6 h-6 md:w-8 md:h-8 text-brand-500" />
                </div>
                <div>
                   <h2 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-stone-400 dark:text-brand-300/30">Holy Patron</h2>
                   <p className="text-brand-600 dark:text-brand-400 text-xs md:text-sm font-bold tracking-widest uppercase mt-0.5">Daily Guide</p>
                </div>
              </div>

              {daily && (
                <div className="space-y-4 md:space-y-6 flex-1">
                  <h3 className="text-2xl md:text-4xl font-black text-stone-900 dark:text-white leading-tight tracking-tight uppercase">{daily.saintName}</h3>
                  <p className="text-stone-500 dark:text-stone-400 text-sm md:text-xl leading-relaxed opacity-80 line-clamp-6 md:line-clamp-8 serif-display italic font-light">
                    {daily.saintInfo}
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => onTabChange('trivia')}
                className="w-full py-5 md:py-7 bg-brand-950 text-white font-black tracking-[0.4em] text-[10px] md:text-xs rounded-[24px] md:rounded-[32px] hover:bg-brand-900 transition-all shadow-2xl shadow-brand-950/20 flex items-center justify-center gap-4 group"
              >
                ENTER DEVOTION <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          <motion.div 
            variants={item}
            className="p-8 md:p-12 glass-dark rounded-[40px] md:rounded-[64px] overflow-hidden group relative border border-white/5 shadow-2xl flex items-center justify-center min-h-[160px] md:min-h-[220px]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-transparent group-hover:scale-125 transition-transform duration-[3s]" />
             <motion.div 
               animate={{ scale: [1, 1.05, 1] }} 
               transition={{ duration: 4, repeat: Infinity }}
               className="relative z-10 text-center space-y-3 md:space-y-5"
             >
              <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-brand-400/60 block">Sacred Realm</span>
              <p className="text-4xl md:text-6xl font-black text-white tracking-[0.2em] drop-shadow-[0_0_20px_rgba(92,133,255,0.3)]">DIVINE</p>
            </motion.div>
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
