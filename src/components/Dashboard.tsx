import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DailyControl, OperationType, UserProfile } from '../types';
import { 
  Quote, 
  BookOpen, 
  User as UserIcon, 
  Calendar, 
  Loader2, 
  Heart, 
  Library, 
  Trophy, 
  ArrowUpRight, 
  HelpCircle, 
  MessageCircle, 
  Share2, 
  Sparkles, 
  QrCode, 
  ArrowRight, 
  UserPlus, 
  X, 
  Upload, 
  Image as ImageIcon,
  UserCheck,
  GraduationCap,
  Church,
  CheckCircle2
} from 'lucide-react';
import { motion, Variants, AnimatePresence } from 'motion/react';
import { handleFirestoreError } from '../utils';

interface DashboardProps {
  userName?: string;
  currentUser?: UserProfile | null;
  onTabChange: (tab: any) => void;
}

export default function Dashboard({ userName, currentUser, onTabChange }: DashboardProps) {
  const [daily, setDaily] = useState<DailyControl | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewQr, setViewQr] = useState(false);
  const [customQr, setCustomQr] = useState<string | null>(null);
  const [whatsAppGroupLink, setWhatsAppGroupLink] = useState('https://chat.whatsapp.com/GxuvB559sZLIurYvXbxHmU');

  // Compute recognized user details
  const rawName = (currentUser?.displayName || userName || '').trim();
  const displayName = rawName || 'Friend';
  const firstName = displayName.split(' ')[0] || 'Friend';
  const admissionNumber = currentUser?.admissionNumber || '';
  const phoneNumber = currentUser?.contactNumber || currentUser?.phone || '';
  const isRecognized = !!rawName && rawName.toLowerCase() !== 'member' && rawName.toLowerCase() !== 'friend';

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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
        className="relative py-12 md:py-24 px-6 md:px-16 rounded-[32px] md:rounded-[60px] overflow-hidden bg-stone-950 text-white shadow-2xl border border-white/10 group h-auto flex items-center mb-8 md:mb-12"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&w=1600&q=80" 
            className="w-full h-full object-cover mix-blend-overlay scale-105 opacity-40 transition-transform duration-[15s] group-hover:scale-100"
            alt="Catholic Altar & Chapel"
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-stone-950/80 to-transparent" />
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-sky-500/10 blur-[130px] rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col gap-8 md:gap-12 max-w-7xl w-full">
          <div className="flex flex-wrap items-center gap-3">
            <motion.div
              variants={item}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-400/20 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-sky-300 shadow-xl backdrop-blur-md w-fit"
            >
              <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_10px_rgba(56,189,248,1)]" />
              Zetech Catholic Community
            </motion.div>

            {isRecognized && (
              <motion.div
                variants={item}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-900/40 border border-sky-400/30 text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-sky-200 shadow-md backdrop-blur-md w-fit"
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Recognized Student: <strong className="text-white font-extrabold">{displayName}</strong></span>
                {admissionNumber && <span className="text-amber-300 font-mono">({admissionNumber})</span>}
              </motion.div>
            )}

            <motion.div
              variants={item}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-emerald-400 shadow-lg backdrop-blur-md w-fit group/live relative"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="relative">
                <span className="tabular-nums font-bold">14+</span> Students Online
              </span>
            </motion.div>
          </div>
          
          <div className="space-y-4 md:space-y-5">
            <motion.div variants={item} className="space-y-2">
              <p className="text-sky-400 font-bold text-xs md:text-sm uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {getTimeGreeting()}, {firstName}! Peace be with you.
              </p>
              <motion.h1 
                variants={item}
                className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white text-left"
              >
                Welcome, <span className="text-sky-400 capitalize">{displayName}</span>! <br className="hidden sm:inline" />
                <span className="text-stone-100 font-bold">Faith, Unity & Student Life at Zetech.</span>
              </motion.h1>
            </motion.div>
            
            <motion.p variants={item} className="text-stone-300 text-sm md:text-lg font-normal max-w-3xl leading-relaxed pl-3 md:pl-4 border-l-2 border-sky-400 text-left">
              Join us for weekly Holy Mass, prayer meetings, choir practice, charity missions, and real university friendships in Christ.
            </motion.p>
          </div>
        </div>
      </motion.header>

      {/* 🌟 Orientation & Recruitment Hub - Personalized Recognition */}
      <motion.div 
        variants={item}
        className="relative p-6 md:p-10 rounded-[32px] md:rounded-[40px] overflow-hidden bg-gradient-to-br from-[#002244] via-[#003366] to-[#040813] text-white shadow-2xl border border-blue-500/20"
      >
        <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-8 justify-between">
          <div className="space-y-3 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-[10px] font-bold uppercase tracking-wider text-amber-300 shadow-md">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
              New Student Enrollment 2026
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-snug text-white font-sans">
              {isRecognized ? (
                <>Welcome to ZUCA, <span className="text-amber-300">{firstName}</span>!</>
              ) : (
                <>Welcome First Year Students!</>
              )}
            </h2>
            <p className="text-stone-300 text-xs md:text-sm leading-relaxed font-normal">
              {isRecognized ? (
                `Hello ${displayName}! Your student profile is active. You can generate or download your official 2026 ZUCA membership card, join your Jumuiya fellowship, or connect with chaplaincy.`
              ) : (
                `Make Zetech feel like home! Register with Zetech Catholic Action (ZUCA) in 1 minute to get your official member card, join your campus Jumuiya, and connect with fellow Catholic students.`
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3.5 w-full lg:w-auto justify-start lg:justify-end shrink-0">
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabChange('join')}
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-stone-950" /> 
              {isRecognized ? `Generate ID Card for ${firstName}` : 'Register as New Student'}
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setViewQr(true)}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/15 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 shadow-md cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-white" /> Show QR Code
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open(whatsAppGroupLink, '_blank')}
              className="px-5 py-3.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-white" /> WhatsApp Group
            </motion.button>
          </div>
        </div>

        {/* New Student Orientation Quick Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-8 pt-8 border-t border-white/10 relative z-10 text-left">
          {[
            {
              title: "Weekly Mass & Meetings",
              desc: "Join Jumuiya in PG 6 Room every Wednesday at 4:20 PM, Choir Practice on Thursday & weekends, and Sunday Holy Mass at 9:00 AM.",
              action: "View Full Schedule",
              tab: "schedule"
            },
            {
              title: "Instant Student Member ID",
              desc: "Fill in your name, admission number, and photo to generate your official downloadable ZUCA membership card.",
              action: "Get Your ID Card",
              tab: "join"
            },
            {
              title: "Questions & AI Chaplain",
              desc: "Ask anything about Catholic prayers, university life, choir, or Mass schedules anytime with our Catholic AI assistant.",
              action: "Open Chat Assistant",
              tab: "chat"
            }
          ].map((itm, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -3 }}
              className="p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-300/90 tracking-wider block">Step {idx + 1}</span>
                <h4 className="text-sm font-bold text-white mt-1">{itm.title}</h4>
                <p className="text-stone-300 text-xs leading-relaxed mt-1">{itm.desc}</p>
              </div>
              <button 
                onClick={() => onTabChange(itm.tab)}
                className="mt-4 text-[11px] font-bold uppercase tracking-wider text-sky-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer w-fit"
              >
                {itm.action} <ArrowRight className="w-3.5 h-3.5 text-sky-300" />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Main Insights Bento Grid - Optimized Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Daily Scripture Card */}
        <motion.div 
          variants={item}
          className="lg:col-span-8 bg-white dark:bg-stone-900/60 p-6 md:p-12 relative overflow-hidden group shadow-xl rounded-[32px] md:rounded-[48px] border border-stone-200/80 dark:border-white/5"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full group-hover:bg-blue-500/10 transition-colors duration-500" />
          
          <div className="relative z-10 space-y-6 md:space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center rounded-2xl shadow-sm text-blue-600 dark:text-sky-400">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">Daily Scripture</span>
                  <p className="text-blue-900 dark:text-sky-300 font-bold text-base md:text-xl mt-0.5">Word of the Day</p>
                </div>
              </div>
              
              <div className="hidden sm:flex flex-col items-end">
                 <p className="text-xs font-bold text-stone-600 dark:text-stone-300">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                 <p className="text-[10px] font-medium text-blue-600 dark:text-sky-400 uppercase tracking-wide">Daily Reflection</p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 md:py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : daily ? (
              <div className="space-y-6 md:space-y-8">
                <div className="relative">
                   <Quote className="absolute -top-6 -left-4 w-16 h-16 text-blue-500/10 -z-10" />
                   <p className="text-2xl md:text-4xl lg:text-5xl font-serif italic text-stone-900 dark:text-stone-100 leading-snug tracking-tight">
                     "{daily.verse}"
                   </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="h-[2px] w-8 bg-blue-600 rounded-full" />
                    <p className="text-sm md:text-lg font-bold text-blue-700 dark:text-sky-400 font-sans">
                      {daily.reference}
                    </p>
                  </div>
                  <div className="flex gap-2.5">
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={shareWhatsApp}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <span>Share WhatsApp</span> <MessageCircle className="w-4 h-4" />
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={shareEmail}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <span>Email</span> <Share2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Saint Insight & Community Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <motion.div 
            variants={item}
            className="flex-1 p-6 md:p-8 bg-white dark:bg-stone-900/60 border border-stone-200/80 dark:border-white/5 rounded-[32px] md:rounded-[40px] relative overflow-hidden group shadow-xl flex flex-col justify-between"
          >
            <div className="relative z-10 flex flex-col h-full space-y-4 md:space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                   <h2 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Patron Saint</h2>
                   <p className="text-stone-900 dark:text-white text-sm font-bold mt-0.5">Saint of the Day</p>
                </div>
              </div>

              {daily && (
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-white leading-tight">{daily.saintName}</h3>
                  <p className="text-stone-600 dark:text-stone-300 text-xs md:text-sm leading-relaxed line-clamp-4">
                    {daily.saintInfo}
                  </p>
                </div>
              )}
              
              <button 
                onClick={() => onTabChange('trivia')}
                className="w-full py-3.5 bg-stone-900 dark:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-stone-950 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Play Faith Trivia</span> <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          <motion.div 
            variants={item}
            className="p-6 bg-gradient-to-br from-emerald-900/30 to-stone-900/50 border border-emerald-500/20 rounded-[32px] md:rounded-[40px] overflow-hidden group relative shadow-xl flex flex-col justify-between text-left"
          >
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Stay Connected</span>
              <h3 className="text-lg md:text-xl font-bold text-white">ZUCA WhatsApp Channel</h3>
              <p className="text-stone-300 text-xs leading-relaxed">
                Get daily Mass readings, event announcements, and group updates directly on WhatsApp.
              </p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.open(whatsAppGroupLink, '_blank')}
              className="relative z-10 mt-4 w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-white" /> Join WhatsApp Group
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="relative pt-4">
        <motion.div 
          variants={item}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-6"
        >
          <CompactAction onClick={() => onTabChange('join')} title="Enrollment" icon={<UserPlus className="w-5 h-5 md:w-6 md:h-6" />} color="bg-emerald-500/10 text-emerald-500" />
          <CompactAction onClick={() => onTabChange('materials')} title="Songbook & Prayers" icon={<BookOpen className="w-5 h-5 md:w-6 md:h-6" />} color="bg-blue-500/10 text-blue-500" />
          <CompactAction onClick={() => onTabChange('gallery')} title="Photo Gallery" icon={<ImageIcon className="w-5 h-5 md:w-6 md:h-6" />} color="bg-amber-500/10 text-amber-500" />
          <CompactAction onClick={() => onTabChange('petitions')} title="Prayer Requests" icon={<Heart className="w-5 h-5 md:w-6 md:h-6" />} color="bg-rose-500/10 text-rose-500" />
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
