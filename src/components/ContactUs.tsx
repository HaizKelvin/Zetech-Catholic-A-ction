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
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="text-center space-y-4">
         <h1 className="text-5xl font-bold tracking-tighter">Contact <span className="serif-display text-brand-600 italic">Us</span>.</h1>
         <p className="text-stone-500 dark:text-stone-400 max-w-lg mx-auto">
           Have a complaint, feedback, or inquiry? We are here to listen and grow together in faith.
         </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 glass rounded-3xl space-y-4 border border-white/10 shadow-sm">
            <div className="w-12 h-12 bg-brand-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h3 className="font-bold">Email Us</h3>
              <p className="text-xs text-stone-700 dark:text-stone-400">zuca@zetech.ac.ke</p>
            </div>
          </div>

          <div className="p-6 glass rounded-3xl space-y-4 border border-white/10 shadow-sm">
            <div className="w-12 h-12 bg-brand-50 dark:bg-white/5 rounded-2xl flex items-center justify-center">
              <Phone className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <h3 className="font-bold">Call Us</h3>
              <p className="text-xs text-stone-700 dark:text-stone-400">+254 700 000 000</p>
            </div>
          </div>

          <div className="p-6 bg-brand-900 text-white rounded-3xl space-y-4 shadow-xl shadow-brand-900/20">
             <h3 className="font-bold">Sanctuary Hours</h3>
             <div className="space-y-2 text-xs opacity-70">
               <p className="flex justify-between"><span>Mon - Fri</span> <span>08:00 - 18:00</span></p>
               <p className="flex justify-between"><span>Saturday</span> <span>09:00 - 13:00</span></p>
               <p className="flex justify-between"><span>Sunday</span> <span>Sanctuary Mode</span></p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="glass p-8 md:p-12 rounded-[40px] border border-white/10 shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-400">Subject</label>
                <input 
                  required
                  type="text" 
                  value={form.subject}
                  onChange={e => setForm({...form, subject: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-stone-50/50 dark:bg-white/5 border border-stone-200/50 dark:border-none outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-medium"
                  placeholder="What is this regarding?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-400">Type</label>
                <select 
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value as any})}
                  className="w-full px-5 py-4 rounded-2xl bg-stone-50/50 dark:bg-white/5 border border-stone-200/50 dark:border-none outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-bold"
                >
                  <option value="feedback">Feedback</option>
                  <option value="complaint">Complaint</option>
                  <option value="inquiry">Inquiry</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-400">Message</label>
              <textarea 
                required
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                className="w-full px-5 py-4 rounded-3xl bg-stone-50/50 dark:bg-white/5 border border-stone-200/50 dark:border-none outline-none focus:ring-2 focus:ring-brand-500/20 transition-all h-40 resize-none font-medium"
                placeholder="Share your thoughts with the sanctuary..."
              />
            </div>

            <button
              disabled={loading}
              className="w-full py-5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-[28px] font-bold flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <>
                  <Send className="w-5 h-5 animate-bounce" />
                  <span>Sending Message...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 flex-shrink-0" />
                  <span>Send Sanctuary Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
