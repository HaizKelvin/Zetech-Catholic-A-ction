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
    <div className="max-w-4xl mx-auto py-8 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <span className="px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300 text-[10px] font-black uppercase tracking-[0.3em] mb-6 inline-block border border-brand-500/20 shadow-sm">
          Vocations & Membership
        </span>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-stone-900 to-brand-600 dark:from-white dark:to-brand-400">
          Walk with us in Faith.
        </h1>
        <p className="text-stone-500 dark:text-stone-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          The Zetech Catholic Action family is open and welcoming to all students. 
          Join a community of prayer, service, and spiritual growth.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        {/* Registration Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-7 glass-card p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 sparkle-bg opacity-10 pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="join-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-8 relative z-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400 flex items-center gap-3">
                      <User className="w-4 h-4" /> Full Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. John Doe"
                      className="w-full p-5 rounded-[26px] text-sm bg-white/50 backdrop-blur-xl border-brand-500/10 focus:border-brand-500/30 transition-all shadow-inner"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 flex items-center gap-3">
                      <GraduationCap className="w-4 h-4" /> Admission
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="BSCIT-01-0001/2024"
                      className="w-full p-5 rounded-[26px] text-sm bg-white/50 backdrop-blur-xl border-brand-500/10 focus:border-brand-500/30 transition-all shadow-inner"
                      value={formData.admissionNumber}
                      onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 flex items-center gap-3">
                      <Phone className="w-4 h-4" /> Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="0712 345 678"
                      className="w-full p-5 rounded-[26px] text-sm bg-white/50 backdrop-blur-xl border-brand-500/10 focus:border-brand-500/30 transition-all shadow-inner"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400 flex items-center gap-3">
                      <Mail className="w-4 h-4" /> School Email
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="john.doe@zetech.ac.ke"
                      className="w-full p-5 rounded-[26px] text-sm bg-white/50 backdrop-blur-xl border-brand-500/10 focus:border-brand-500/30 transition-all shadow-inner"
                      value={formData.schoolEmail}
                      onChange={e => setFormData({ ...formData, schoolEmail: e.target.value })}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full btn-adorable py-6 shadow-2xl mt-4"
                >
                  {loading ? (
                    'Recording Covenant...'
                  ) : (
                    <>
                      Confirm My Journey <Send className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 relative z-10"
              >
                <div className="w-24 h-24 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-10 animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-6 text-stone-900 dark:text-white">
                  Welcome Aboard!
                </h2>
                <p className="text-stone-500 dark:text-stone-400 mb-12 text-base max-w-sm mx-auto leading-relaxed">
                  Your registration has been received and recorded in our sanctified registry. 
                  We are excited to have you!
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="btn-adorable bg-stone-100 text-stone-600 shadow-none border border-stone-200"
                >
                  Register another soul?
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Community Links */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-5 space-y-8"
        >
          <div className="glass-card p-10 bg-brand-600 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 sparkle-bg opacity-20 pointer-events-none" />
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
            
            <h3 className="text-3xl font-black tracking-tight mb-6 relative z-10">Join the Group</h3>
            <p className="text-white/80 text-sm md:text-base leading-relaxed mb-10 relative z-10 font-medium">
              Connect instantly with fellow members via our official WhatsApp community for daily updates, prayer calls, and event notifications.
            </p>
            <motion.a
              href="https://chat.whatsapp.com/your-group-link" 
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-4 px-10 py-5 bg-white text-stone-900 rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl relative z-10"
            >
              Go to WhatsApp <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </motion.a>
          </div>

          <div className="glass-card p-10 border-brand-500/10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400 mb-6">
              Our Vision
            </h4>
            <div className="relative">
              <Quote className="absolute -top-4 -left-4 w-10 h-10 text-brand-500/10" />
              <p className="text-stone-600 dark:text-stone-300 text-sm md:text-base leading-relaxed italic font-serif pl-6 border-l-2 border-brand-500/20">
                "To be a vibrant Catholic community in academia, fostering spiritual nourishment and intellectual growth through prayer, faith sharing, and service."
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
