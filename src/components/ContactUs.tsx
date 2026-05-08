import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, MessageSquare, Send, CheckCircle2, User, Phone } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';

export default function ContactUs() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    message: '',
    type: 'feedback' as 'feedback' | 'complaint' | 'inquiry'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        ...form,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: auth.currentUser.displayName,
        timestamp: serverTimestamp()
      });
      setSuccess(true);
      setForm({ subject: '', message: '', type: 'feedback' });
    } catch (error) {
      console.error("Error sending feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </motion.div>
        <h2 className="text-3xl font-bold">Message Received</h2>
        <p className="text-stone-700 dark:text-stone-300 max-w-sm">
          Thank you for reaching out. Our sanctuary administrators will review your message soon.
        </p>
        <button 
          onClick={() => setSuccess(false)}
          className="text-brand-600 font-bold hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 lg:space-y-32 pb-32">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-12 md:py-48 px-6 md:px-32 rounded-[40px] md:rounded-[120px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-8 md:mb-20 mx-4 md:mx-0"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-30 transition-transform duration-[15s] group-hover:scale-100"
            alt="Sanctuary Assistance"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
        </div>
        
        <div className="relative z-10 space-y-6 md:space-y-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 md:px-8 md:py-3 rounded-full glass-dark border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-brand-300 shadow-2xl backdrop-blur-xl"
          >
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-400 animate-pulse shadow-[0_0_12px_rgba(92,133,255,1)]" />
            Sanctuary Assistance
          </motion.div>
          
          <h1 className="text-4xl md:text-[9rem] font-black tracking-[-0.05em] leading-tight md:leading-[0.8] text-white serif-display italic">
            Seek & <br className="hidden md:block" />
            <span className="text-brand-400 not-italic uppercase font-black text-xl md:text-5xl tracking-[0.4em] block mt-2 md:mt-4">Inquire</span>
          </h1>
          
          <p className="text-stone-400 text-sm md:text-3xl font-light max-w-2xl leading-relaxed italic serif-display opacity-80">
            Have a complaint, feedback, or inquiry? We are here to listen and grow together in faith.
          </p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 px-4">
        <div className="lg:col-span-12 xl:col-span-4 space-y-6 md:space-y-8">
          <div className="p-6 md:p-10 glass rounded-[32px] md:rounded-[50px] space-y-4 md:space-y-6 border border-stone-100 dark:border-white/5 shadow-2xl group overflow-hidden">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-500/10 dark:bg-brand-500/20 rounded-[20px] md:rounded-[28px] flex items-center justify-center border border-brand-500/20 group-hover:bg-brand-900 group-hover:text-white transition-all duration-700">
              <Mail className="w-5 h-5 md:w-8 md:h-8 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-stone-400 mb-1 md:mb-2 text-xs">Sacred Mail</h3>
              <p className="text-base md:text-xl font-bold text-stone-900 dark:text-stone-100">zuca@zetech.ac.ke</p>
            </div>
          </div>

          <div className="p-6 md:p-10 glass rounded-[32px] md:rounded-[50px] space-y-4 md:space-y-6 border border-stone-100 dark:border-white/5 shadow-2xl group overflow-hidden">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-500/10 dark:bg-brand-500/20 rounded-[20px] md:rounded-[28px] flex items-center justify-center border border-brand-500/20 group-hover:bg-brand-900 group-hover:text-white transition-all duration-700">
              <Phone className="w-5 h-5 md:w-8 md:h-8 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h3 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] text-stone-400 mb-1 md:mb-2 text-xs">Voice Assistance</h3>
              <p className="text-base md:text-xl font-bold text-stone-900 dark:text-stone-100">+254 700 000 000</p>
            </div>
          </div>

          <div className="p-8 md:p-12 bg-brand-950 text-white rounded-[32px] md:rounded-[60px] space-y-8 md:space-y-10 shadow-3xl shadow-brand-900/40 relative overflow-hidden">
             <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
             <h3 className="text-2xl md:text-3xl font-black tracking-tight serif-display italic relative z-10">Sanctuary Hours</h3>
             <div className="space-y-4 md:space-y-6 text-[10px] md:text-sm relative z-10">
               <p className="flex justify-between items-center opacity-70 group hover:opacity-100 transition-opacity">
                 <span className="font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Mon - Fri</span> 
                 <span className="font-black">08:00 - 18:00</span>
               </p>
               <p className="flex justify-between items-center opacity-70 group hover:opacity-100 transition-opacity">
                 <span className="font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Saturday</span> 
                 <span className="font-black">09:00 - 13:00</span>
               </p>
               <div className="h-px bg-white/10 w-full" />
               <p className="flex justify-between items-center text-brand-400">
                 <span className="font-bold uppercase tracking-widest text-[8px] md:text-[10px]">Sunday</span> 
                 <span className="font-black tracking-widest uppercase">Sanctuary Mode</span>
               </p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-12 xl:col-span-8">
          <form onSubmit={handleSubmit} className="glass p-8 md:p-20 rounded-[40px] md:rounded-[80px] border border-stone-100 dark:border-white/5 shadow-2xl space-y-8 md:space-y-12 relative overflow-hidden">
            <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative z-10">
              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-brand-600 dark:text-brand-400 ml-4 mb-1 md:mb-2 block">Matter Subject</label>
                <input 
                  required
                  type="text" 
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                  className="w-full px-6 md:px-8 py-5 md:py-7 rounded-[28px] md:rounded-[32px] bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all font-bold tracking-tight text-sm md:text-lg shadow-inner outline-none"
                  placeholder="The focus..."
                />
              </div>
              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-brand-600 dark:text-brand-400 ml-4 mb-1 md:mb-2 block">Inquiry Class</label>
                <select 
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value as any})}
                  className="w-full px-6 md:px-8 py-5 md:py-7 rounded-[28px] md:rounded-[32px] bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all font-black tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-base shadow-inner outline-none uppercase appearance-none"
                >
                  <option value="feedback">Sanctuary Feedback</option>
                  <option value="complaint">Internal Complaint</option>
                  <option value="inquiry">Divine Inquiry</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4 relative z-10">
              <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-brand-600 dark:text-brand-400 ml-4 mb-1 md:mb-2 block">Revelation / Message</label>
              <textarea 
                required
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                className="w-full px-6 md:px-8 py-6 md:py-8 rounded-[32px] md:rounded-[40px] bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all h-48 md:h-60 resize-none font-medium text-sm md:text-xl shadow-inner outline-none leading-relaxed italic serif-display scrollbar-none"
                placeholder="Share your thoughts..."
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-6 md:py-8 bg-brand-900 text-white rounded-[28px] md:rounded-[40px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] flex items-center justify-center gap-4 md:gap-6 shadow-3xl shadow-brand-900/40 transition-all group disabled:opacity-50 text-[10px] md:text-sm lg:text-base"
            >
              {loading ? (
                <>
                  <Send className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
                  <span>TRANSMITTING...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-3 transition-transform" />
                  <span>SUBMIT TO SANCTUARY</span>
                </>
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
}
