import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl } from '../types';
import { Quote, BookOpen, User as UserIcon, Calendar, Loader2, Music, Heart, Library } from 'lucide-react';
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
    <div className="space-y-12 pb-24">
      <header className="relative py-12 md:py-28 px-6 md:px-16 rounded-[32px] md:rounded-[48px] overflow-hidden bg-stone-950 text-white shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {/* Animated Background for Header */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay scale-110"
            alt="Sanctuary Interior"
          />
          <div className="absolute inset-0 bg-stone-950/60 transition-opacity" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-900/20 blur-[120px] rounded-full -mr-48 -mt-48 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-900/10 blur-[100px] rounded-full -ml-32 -mb-32" />
          <div className="absolute inset-0 faith-bg opacity-[0.03]" />
        </div>

        <div className="relative z-10 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-400"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Digital Sanctuary
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-8xl font-bold tracking-tight leading-[0.9] md:leading-[0.85]"
            >
              Welcome back, <br />
              <span className="serif-display italic font-light text-brand-400">{userName}</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-stone-400 text-sm md:text-xl font-serif italic max-w-xl"
            >
              "Where faith meets excellence, and community reflects the light of Christ."
            </motion.p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-3 md:translate-y-[-10px]">
             <div className="px-5 py-2 md:px-6 md:py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-brand-300">Sanctuary Status</span>
                <p className="text-lg md:text-xl font-bold font-mono tracking-tighter text-white">CONNECTED</p>
             </div>
             <div className="flex items-center gap-3 text-stone-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest">
               <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-600" />
               {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Daily Verse - Main Card (7 columns) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-7 glass rounded-[32px] md:rounded-[48px] p-8 md:p-16 relative overflow-hidden shadow-2xl border border-white/40 dark:border-white/5 bg-white/50 dark:bg-stone-900/30 backdrop-blur-3xl group"
        >
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-brand-900/10 to-transparent pointer-events-none" />
          <img 
            src="https://images.unsplash.com/photo-1548625340-97743f7cb594?q=80&w=2670&auto=format&fit=crop" 
            className="absolute inset-0 w-full h-full object-cover opacity-[0.03] grayscale transition-opacity group-hover:opacity-[0.05]"
            alt="Spiritual Backdrop"
          />
          <Quote className="absolute -top-6 -right-6 w-32 h-32 md:w-48 md:h-48 text-brand-900/5 group-hover:scale-110 transition-transform duration-1000" />
          <div className="flex items-center gap-4 mb-10 md:mb-14">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-brand-900 text-white flex items-center justify-center shadow-xl shadow-brand-900/20">
              <BookOpen className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Word of the Day</span>
              <p className="text-[10px] md:text-xs font-bold text-stone-400 underline decoration-brand-500/30 decoration-2 underline-offset-4 tracking-tight">Scripture Meditation</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 md:py-20 flex justify-center"><Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-brand-600" /></div>
          ) : daily ? (
            <div className="space-y-8 md:space-y-12 relative z-10">
              <div className="relative">
                <div className="absolute -left-8 md:-left-12 top-0 h-full w-[2px] bg-gradient-to-b from-brand-500/50 to-transparent hidden sm:block" />
                <p className="text-2xl md:text-5xl font-medium leading-tight font-serif italic text-stone-900 dark:text-stone-100 drop-shadow-sm">
                  "{daily.verse}"
                </p>
              </div>
              <div className="flex items-center gap-4 md:gap-6">
                <div className="h-[2px] w-12 md:w-16 bg-stone-900 dark:bg-brand-500" />
                <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] text-stone-900 dark:text-white">
                  {daily.reference}
                </p>
              </div>
            </div>
          ) : (
             <p className="text-stone-300 italic text-lg md:text-xl relative z-10">Spiritual nourishment is on its way...</p>
          )}
        </motion.div>

        {/* Saint of the Day (5 columns) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 glass rounded-[32px] md:rounded-[48px] p-8 md:p-12 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between border border-white/40 dark:border-white/5 bg-white/5 dark:bg-stone-900/20"
        >
          <div className="space-y-8 md:space-y-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">The Saints Path</span>
            </div>
            {loading ? (
              <div className="py-12 md:py-20 flex justify-center"><Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-orange-600" /></div>
            ) : daily ? (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tighter leading-none">{daily.saintName}</h3>
                <div className="h-[1px] w-full bg-stone-100 dark:bg-white/5" />
                <p className="text-stone-500 dark:text-stone-400 text-sm md:text-base leading-relaxed line-clamp-4 md:line-clamp-6 font-medium italic serif-display">
                  {daily.saintInfo}
                </p>
              </div>
            ) : (
              <p className="text-stone-300 italic tracking-wider text-sm md:text-base relative z-10">Awaiting the lives of the faithful...</p>
            )}
          </div>
          
          <button 
            onClick={() => onTabChange('trivia')}
            className="mt-10 md:mt-12 w-full py-4 rounded-2xl bg-stone-950 text-white dark:bg-white dark:text-stone-950 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Learn More Divine History
          </button>
        </motion.div>
      </div>

      {/* Enhanced Action Hub */}
      <div className="space-y-10">
        <div className="flex items-center gap-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Sanctuary Actions</h3>
          <div className="h-[1px] flex-1 bg-stone-100 dark:bg-white/5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <QuickAction onClick={() => onTabChange('resources')} title="Divine Library" icon={<Library className="w-6 h-6" />} color="text-brand-600" bg="bg-brand-50/50 dark:bg-brand-900/10" />
          <QuickAction onClick={() => onTabChange('petitions')} title="Prayer Desk" icon={<Heart className="w-6 h-6" />} color="text-rose-600" bg="bg-rose-50/50 dark:bg-rose-900/10" />
          <QuickAction onClick={() => onTabChange('events')} title="Events Wall" icon={<Calendar className="w-6 h-6" />} color="text-indigo-600" bg="bg-indigo-50/50 dark:bg-indigo-900/10" />
          <QuickAction onClick={() => onTabChange('trivia')} title="Holy Trivia" icon={<BookOpen className="w-6 h-6" />} color="text-amber-600" bg="bg-amber-50/50 dark:bg-amber-900/10" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, icon, color, bg, onClick }: { title: string, icon: React.ReactNode, color: string, bg: string, onClick?: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-6 md:p-10 rounded-[32px] md:rounded-[40px] glass ${bg} flex flex-col items-center justify-center text-center gap-4 md:gap-5 cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 border border-white/20`}
    >
      <div className={`w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white dark:bg-black/40 rounded-2xl md:rounded-3xl shadow-xl ${color} ring-4 ring-black/5`}>{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">{title}</span>
    </motion.button>
  );
}
