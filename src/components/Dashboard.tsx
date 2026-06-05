import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl, OperationType } from '../types';
import { Quote, BookOpen, User as UserIcon, Calendar, Loader2, Heart, Library, Trophy, ArrowUpRight, HelpCircle, MessageCircle, Share2, Sparkles, QrCode, ArrowRight, UserPlus, X, Upload } from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'motion/react';
import { handleFirestoreError } from '../utils';

export default function Dashboard({ userName, onTabChange }: { userName: string, onTabChange: (tab: any) => void }) {
  const [daily, setDaily] = useState<DailyControl | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewQr, setViewQr] = useState(false);
  const [customQr, setCustomQr] = useState<string | null>(null);
  const [whatsAppGroupLink, setWhatsAppGroupLink] = useState('https://chat.whatsapp.com/JLH8fWq8d8H05Y6zW92bX');

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        try {
          await setDoc(doc(db, 'control', 'booth_qr'), {
            qrCode: base64String,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'control/booth_qr');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQrClear = async () => {
    try {
      await deleteDoc(doc(db, 'control', 'booth_qr'));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'control/booth_qr');
    }
  };

  useEffect(() => {
    const unsubscribeDaily = onSnapshot(doc(db, 'control', 'daily_bread'), (doc) => {
      if (doc.exists()) {
        setDaily(doc.data() as DailyControl);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'control/daily_bread');
      setLoading(false);
    });

    const unsubscribeQr = onSnapshot(doc(db, 'control', 'booth_qr'), (doc) => {
      if (doc.exists() && doc.data().qrCode) {
        setCustomQr(doc.data().qrCode);
      } else {
        setCustomQr(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'control/booth_qr');
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'control', 'settings'), (doc) => {
      if (doc.exists() && doc.data().whatsAppGroupLink) {
        setWhatsAppGroupLink(doc.data().whatsAppGroupLink);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'control/settings');
    });

    return () => {
      unsubscribeDaily();
      unsubscribeQr();
      unsubscribeSettings();
    };
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

  const shareWhatsApp = () => {
    if (!daily) return;
    const message = `*✨ ZUCA DAILY BREAD ✨*
*──────────────────*

📖 *WORD OF GOD*
_${daily.verse}_
— *${daily.reference}*

🙏 *SAINT OF THE DAY*
*${daily.saintName.toUpperCase()}*
${daily.saintInfo}

🕊️ *JOIN THE FELLOWSHIP*
Visit the Sanctuary: ${window.location.host}

*──────────────────*
_Peace be with you always._ 🤍`;
    const encodedText = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`, '_blank');
  };

  const shareEmail = () => {
    if (!daily) return;
    const subject = encodeURIComponent(`🕊️ ZUCA: Daily Bread (${daily.reference})`);
    const body = encodeURIComponent(`Peace be with you,

Here is your Daily Bread from the ZUCA Sanctuary:

📖 WORD OF GOD:
"${daily.verse}"
— ${daily.reference}

🙏 SAINT OF THE DAY:
${daily.saintName}
${daily.saintInfo}

Join our digital sanctuary for more fellowship: ${window.location.host}

Blessings and Grace,
ZUCA Community`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
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
          <div className="flex flex-wrap items-center gap-4">
            <motion.div
              variants={item}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-dark border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-brand-300 shadow-2xl backdrop-blur-3xl w-fit"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse shadow-[0_0_12px_rgba(92,133,255,1)]" />
              Cathedral of Digital Fellowship
            </motion.div>

            <motion.div
              variants={item}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-emerald-400 shadow-xl backdrop-blur-xl w-fit group/live relative"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="relative">
                <span className="tabular-nums">14</span> SEEKERS ACTIVE
              </span>
              
              {/* Inviting Hover Message */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/live:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                The Sanctuary is vibrant today! 🙏
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-600 rotate-45" />
              </div>
            </motion.div>
          </div>
          
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

      {/* 🌟 Orientation & Recruitment Hub - High-Conversion Centerpiece for First Years */}
      <motion.div 
        variants={item}
        className="relative p-6 md:p-12 rounded-[32px] md:rounded-[48px] overflow-hidden bg-gradient-to-br from-[#003366] via-[#002244] to-brand-950 text-white shadow-3xl border border-white/5"
      >
        <div className="absolute inset-0 divine-pattern opacity-[0.04] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-zetech-gold/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8 justify-between">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2.5 px-4.5 py-1.5 rounded-full bg-zetech-gold/10 border border-zetech-gold/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zetech-gold shadow-lg">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-zetech-gold" />
              Orientation Day 2026
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase text-white font-sans">
              Welcome First Years <span className="serif-display italic font-light text-zetech-gold font-serif pl-1 lowercase">class of 2026</span>
            </h2>
            <p className="text-stone-300 text-xs md:text-base leading-relaxed font-semibold">
              Embark on a beautiful path of vibrant faith, lasting friendships, and meaningful growth with Zetech Catholic Action (ZUCA). Register below to create your official student membership card instantly!
            </p>
          </div>

          <div className="flex flex-wrap gap-4 w-full lg:w-auto justify-start lg:justify-end shrink-0">
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onTabChange('join')}
              className="px-6 py-4 bg-zetech-gold text-stone-950 font-black rounded-2xl tracking-[0.2em] text-[10px] md:text-[11px] uppercase shadow-lg shadow-zetech-gold/20 transition-all flex items-center gap-3 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-stone-950" /> Enroll in ZUCA Now
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setViewQr(true)}
              className="px-6 py-4 bg-white/10 dark:bg-white/5 text-white border border-white/10 font-black rounded-2xl tracking-[0.2em] text-[10px] md:text-[11px] uppercase hover:bg-white/20 transition-all flex items-center gap-3 shadow-lg cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-white" /> Booth QR Code
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.open(whatsAppGroupLink, '_blank')}
              className="px-6 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white font-black rounded-2xl tracking-[0.2em] text-[10px] md:text-[11px] uppercase shadow-lg shadow-[#25D366]/25 transition-all flex items-center gap-3 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-white" /> Join WhatsApp Group
            </motion.button>
          </div>
        </div>

        {/* Freshman Quick Survival Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 pt-10 border-t border-white/10 relative z-10 text-left">
          {[
            {
              title: "Sacred gatherings",
              desc: "Join us for Jumuiya in PG 6 Room every Wednesday at 4:20 PM, Choir Practice on Thursday at 4:30 PM, Saturday & Sunday at 3:00 PM, and Sunday Holy Mass at 9:00 AM.",
              action: "Schedule & Locations",
              tab: "schedule"
            },
            {
              title: "Frictionless IDs",
              desc: "Tap 'Enroll' to fill out your student details, upload your profile picture, and instantly generate a printable PDF covenant card.",
              action: "Generate Member Card",
              tab: "join"
            },
            {
              title: "Meet Sanctuary Spirit",
              desc: "Have any questions about university life, spiritual matters, or ZUCA sub-groups? Click the chat button to talk with our AI guide.",
              action: "Ask Sanctuary AI",
              tab: "chat"
            }
          ].map((itm, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -4 }}
              className="p-6 rounded-[24px] bg-white/5 hover:bg-white/[0.08] border border-white/5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase text-zetech-gold/80 tracking-widest block font-sans">Survival Guide {idx + 1}</span>
                <h4 className="text-base font-black text-white uppercase font-sans mt-1">{itm.title}</h4>
                <p className="text-stone-300 text-[11px] md:text-xs leading-relaxed font-medium mt-1">{itm.desc}</p>
              </div>
              <button 
                onClick={() => onTabChange(itm.tab)}
                className="mt-6 text-[9px] font-black uppercase tracking-widest text-brand-300 hover:text-white transition-colors flex items-center gap-2 cursor-pointer w-fit"
              >
                {itm.action} <ArrowRight className="w-3.5 h-3.5 text-brand-300" />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Insights Bento Grid - Optimized Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Divine Bread - Primary Card */}
        <motion.div 
          variants={item}
          className="lg:col-span-8 bg-white dark:bg-stone-900/40 p-8 md:p-16 relative overflow-hidden group shadow-2xl rounded-[40px] md:rounded-[80px] border border-stone-100 dark:border-white/5"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/5 blur-[100px] rounded-full group-hover:bg-brand-500/10 transition-colors duration-500" />
          
          <div className="relative z-10 space-y-8 md:space-y-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center rounded-[24px] md:rounded-[32px] shadow-sm group-hover:rotate-6 transition-transform duration-300">
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
                   <p className="text-3xl md:text-6xl lg:text-7xl font-serif italic font-light text-stone-950 dark:text-white leading-[1] tracking-tight group-hover:-translate-x-1 transition-transform duration-500">
                     "{daily.verse}"
                   </p>
                </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex items-center gap-6">
                    <div className="h-[1px] w-12 md:w-24 bg-brand-500/20 rounded-full group-hover:w-32 transition-all duration-500" />
                    <p className="text-xs md:text-xl font-black uppercase tracking-[0.5em] text-brand-500 italic drop-shadow-sm font-sans">
                      {daily.reference}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={shareWhatsApp}
                      className="flex items-center gap-3 px-8 py-5 bg-[#25D366] text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl shadow-[#25D366]/20 transition-all hover:bg-[#128C7E]"
                    >
                      WhatsApp <MessageCircle className="w-5 h-5" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={shareEmail}
                      className="flex items-center gap-3 px-8 py-5 bg-blue-600 text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-700"
                    >
                      Email <Share2 className="w-5 h-5" />
                    </motion.button>
                  </div>
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
            className="p-8 md:p-10 bg-gradient-to-br from-emerald-950/40 to-stone-900/40 border border-emerald-500/10 dark:border-white/5 rounded-[40px] md:rounded-[64px] overflow-hidden group relative shadow-2xl flex flex-col justify-between min-h-[220px] text-left"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent group-hover:scale-125 transition-transform duration-[3s]" />
            <div className="relative z-10 space-y-3">
              <span className="text-[9px] md:text-[10.5px] font-black uppercase tracking-[0.4em] text-emerald-400 block font-sans">COMMUNITY PORTAL</span>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase font-sans">ZUCA WHATSAPP</h3>
              <p className="text-stone-300 text-[11px] md:text-xs leading-relaxed font-semibold">
                Receive scriptures, announcements, and connect with other Catholic Action members instantly.
              </p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open(whatsAppGroupLink, '_blank')}
              className="relative z-10 mt-6 w-full py-4.5 bg-[#25D366] text-white font-black tracking-[0.3em] text-[10px] uppercase rounded-[20px] hover:bg-[#128C7E] transition-all shadow-xl shadow-[#25D366]/20 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-white animate-pulse" /> JOIN OUR CHAT
            </motion.button>
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

      {/* 📱 Booth QR Code Scan Modal */}
      <AnimatePresence>
        {viewQr && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-stone-900 rounded-[32px] md:rounded-[48px] p-8 md:p-12 max-w-md w-full relative border border-stone-200 dark:border-white/10 shadow-[0_30px_70px_-15px_rgba(0,51,102,0.4)] text-center space-y-8"
            >
              <button 
                onClick={() => setViewQr(false)}
                className="absolute top-6 right-6 p-3 hover:bg-stone-100 dark:hover:bg-white/5 rounded-full text-stone-400 hover:text-stone-950 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="space-y-3 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-600 text-[10px] font-black tracking-widest uppercase mx-auto">
                  <QrCode className="w-4 h-4 text-brand-500" /> Booth Enrollment Scan
                </div>
                <h3 className="text-2xl md:text-3xl font-black uppercase text-stone-950 dark:text-white font-sans mt-2">QR Code</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-semibold max-w-sm mx-auto">
                  {customQr 
                    ? "Showing your custom uploaded registration QR code. Scan this code with your phone camera!"
                    : "Scan this code with your phone camera to instantly launch the ZUCA Sanctuary registration portal on your mobile device!"
                  }
                </p>
              </div>

              {/* QR Image Wrapper */}
              <div className="bg-stone-100 dark:bg-stone-950 p-6 rounded-[28px] border border-stone-100 dark:border-white/5 inline-block mx-auto relative group shadow-inner">
                <img 
                  src={customQr || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '?tab=join')}`} 
                  alt="ZUCA Join Portal QR" 
                  className="w-48 h-48 md:w-60 md:h-60 rounded-xl object-contain bg-white"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Scanner line effect */}
                <div className="absolute inset-x-6 top-6 h-1 bg-brand-500/40 shadow-[0_0_15px_rgba(92,133,255,1)] rounded-full animate-bounce pointer-events-none" />
              </div>

              <div className="flex flex-col items-center gap-3">
                <label className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-black rounded-xl text-[10px] uppercase tracking-widest cursor-pointer shadow-md transition-all flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  {customQr ? "Change QR Code" : "Upload your QR"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleQrUpload} 
                    className="hidden" 
                  />
                </label>
                
                {customQr && (
                  <button 
                    onClick={handleQrClear}
                    className="text-[9px] font-black uppercase text-rose-500 hover:text-rose-600 tracking-widest transition-colors cursor-pointer"
                  >
                    Reset to Default QR
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black tracking-[0.3em] text-[#5c85ff] uppercase flex items-center justify-center gap-2 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Connection Established
                </span>
                <p className="text-[9px] text-stone-400 uppercase font-bold tracking-widest font-mono">{window.location.origin}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
      <div className={`w-16 h-16 md:w-28 md:h-28 rounded-[20px] md:rounded-[40px] flex items-center justify-center transition-all duration-300 bg-white dark:bg-stone-900/50 shadow-lg group-hover:shadow-2xl border border-stone-100 dark:border-white/5 relative overflow-hidden shadow-stone-200/50 dark:shadow-none`}>
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${color.split(' ')[0]}`} />
        <div className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${color.split(' ')[1]}`}>
          {icon}
        </div>
      </div>
      <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-stone-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
        {title}
      </span>
    </motion.button>
  );
}
