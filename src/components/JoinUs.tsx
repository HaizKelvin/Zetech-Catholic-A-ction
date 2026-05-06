import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Send, MessageCircle, CheckCircle2, GraduationCap, Phone, Mail, User, Quote } from 'lucide-react';

export default function JoinUs() {
  const [formData, setFormData] = useState({
    fullName: '',
    admissionNumber: '',
    phoneNumber: '',
    schoolEmail: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const path = 'registrations';
      await addDoc(collection(db, path), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-16 lg:space-y-32 pb-32">
      {/* Hero Section - Cinematic Upgrade */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-24 md:py-48 px-10 md:px-32 rounded-[60px] md:rounded-[120px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-12 md:mb-20"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-30 transition-transform duration-[15s] group-hover:scale-100"
            alt="Sanctuary Fellowship"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
        </div>
        
        <div className="relative z-10 space-y-8 md:space-y-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-4 px-8 py-3 rounded-full glass-dark border border-white/10 text-[11px] font-black uppercase tracking-[0.6em] text-brand-300 shadow-2xl backdrop-blur-xl"
          >
            <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shadow-[0_0_12px_rgba(92,133,255,1)]" />
            Sanctify Your Path
          </motion.div>
          
          <h1 className="text-6xl md:text-[9rem] font-black tracking-[-0.05em] leading-[0.8] text-white serif-display italic">
            Walk with <br />
            <span className="text-brand-400 not-italic uppercase font-black text-2xl md:text-5xl tracking-[0.4em] block mt-4">Us in Faith</span>
          </h1>
          
          <p className="text-stone-400 text-xl md:text-3xl font-light max-w-2xl leading-relaxed italic serif-display opacity-80">
            A sanctuary for students seeking spiritual nourishment, intellectual growth, and authentic community.
          </p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-20 px-4">
        {/* Registration Form - Refined */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 xl:col-span-7 glass p-12 md:p-20 relative overflow-hidden rounded-[60px] md:rounded-[80px] border border-stone-100 dark:border-white/5 shadow-2xl"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="join-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit} 
                className="space-y-12 relative z-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400 flex items-center gap-4 ml-4">
                      <User className="w-5 h-5" /> Full Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. John Doe"
                      className="w-full px-8 py-7 rounded-[32px] text-lg bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all shadow-inner font-bold tracking-tight"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400 flex items-center gap-4 ml-4">
                      <GraduationCap className="w-5 h-5" /> Admission
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="BSCIT-01-0001/2024"
                      className="w-full px-8 py-7 rounded-[32px] text-lg bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all shadow-inner font-bold tracking-tight"
                      value={formData.admissionNumber}
                      onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400 flex items-center gap-4 ml-4">
                      <Phone className="w-5 h-5" /> Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="0712 345 678"
                      className="w-full px-8 py-7 rounded-[32px] text-lg bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all shadow-inner font-bold tracking-tight"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400 flex items-center gap-4 ml-4">
                      <Mail className="w-5 h-5" /> School Email
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="john.doe@zetech.ac.ke"
                      className="w-full px-8 py-7 rounded-[32px] text-lg bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all shadow-inner font-bold tracking-tight"
                      value={formData.schoolEmail}
                      onChange={e => setFormData({ ...formData, schoolEmail: e.target.value })}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full bg-brand-900 text-white py-8 rounded-[40px] font-black uppercase tracking-[0.4em] shadow-3xl shadow-brand-900/40 mt-6 text-sm lg:text-base flex items-center justify-center gap-6 group"
                >
                  {loading ? (
                    'Recording Covenant...'
                  ) : (
                    <>
                      Confirm My Journey <Send className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 relative z-10"
              >
                <div className="w-32 h-32 bg-emerald-500/10 rounded-[48px] flex items-center justify-center mx-auto mb-10 animate-pulse border border-emerald-500/20">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 text-stone-900 dark:text-white serif-display italic">
                  Welcome Home
                </h2>
                <p className="text-xl text-stone-500 dark:text-stone-400 mb-16 max-w-sm mx-auto leading-relaxed italic font-light serif-display">
                  "Your registration has been recorded in our sanctified registry. We are excited to have you in the family."
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="px-12 py-6 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 rounded-full font-black uppercase tracking-[0.3em] text-[10px] hover:bg-brand-500 hover:text-white transition-all shadow-sm"
                >
                  Register another soul
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Community Links - Balanced */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 xl:col-span-5 flex flex-col gap-10 md:gap-16"
        >
          <div className="glass-dark p-12 md:p-16 bg-brand-950 text-white shadow-3xl shadow-brand-900/20 relative overflow-hidden group rounded-[60px] flex flex-col justify-between h-full min-h-[400px]">
            <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-500/20 blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-[3s]" />
            
            <div className="space-y-8 relative z-10">
              <h3 className="text-4xl md:text-5xl font-black tracking-tight serif-display italic">The Assembly</h3>
              <p className="text-stone-400 text-lg md:text-xl font-light leading-relaxed italic serif-display">
                "Connect instantly with fellow members via our official WhatsApp community for daily updates and prayer calls."
              </p>
            </div>
            
            <motion.a
              href="https://chat.whatsapp.com/your-group-link" 
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -5 }}
              className="inline-flex items-center justify-between gap-6 px-10 py-7 bg-white text-brand-950 rounded-[40px] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl relative z-10 w-full hover:bg-brand-50 transition-colors"
            >
              Go to WhatsApp <MessageCircle className="w-6 h-6 text-[#25D366]" />
            </motion.a>
          </div>

          <div className="glass p-12 md:p-16 border-stone-100 dark:border-white/5 rounded-[60px] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 divine-pattern opacity-[0.02] pointer-events-none" />
            <h4 className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-600 mb-10 flex items-center gap-4">
              <div className="w-8 h-px bg-brand-600/30" /> Our Vision
            </h4>
            <div className="relative">
              <Quote className="absolute -top-6 -left-6 w-16 h-16 text-brand-500/5 group-hover:scale-125 transition-transform duration-1000" />
              <p className="text-2xl md:text-3xl text-stone-900 dark:text-stone-200 leading-[1.3] italic font-serif pl-8 border-l-2 border-brand-500/20">
                To be a vibrant Catholic community in academia, fostering spiritual nourishment and intellectual growth through prayer and service.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
