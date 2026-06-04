import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Send, 
  MessageCircle, 
  CheckCircle2, 
  GraduationCap, 
  Phone, 
  Mail, 
  User, 
  Quote, 
  Download, 
  ShieldCheck, 
  Church, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  BookmarkCheck,
  ChevronRight 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function JoinUs() {
  const [formData, setFormData] = useState({
    fullName: '',
    admissionNumber: '',
    phoneNumber: '',
    schoolEmail: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [membershipInfo, setMembershipInfo] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Form Field Validation helpers
  const getInitials = (name: string) => {
    if (!name) return 'ZU';
    return name
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const isNameValid = formData.fullName.trim().length >= 3;
  const isAdmissionValid = formData.admissionNumber.trim().length >= 4;
  const isPhoneValid = formData.phoneNumber.trim().replace(/\D/g, '').length >= 9;
  const isEmailValid = formData.schoolEmail.trim().includes('@') && formData.schoolEmail.trim().includes('.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isNameValid || !isAdmissionValid || !isPhoneValid || !isEmailValid) {
      setNotification({ 
        type: 'error', 
        message: 'Please complete all details correctly before joining.' 
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setLoading(true);
    
    try {
      const path = 'registrations';
      const docRef = await addDoc(collection(db, path), {
        ...formData,
        createdAt: serverTimestamp()
      });
      
      const info = {
        ...formData,
        id: docRef.id.slice(-8).toUpperCase(),
        joinDate: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      };
      
      setMembershipInfo(info);
      setSubmitted(true);
      setNotification({ type: 'success', message: 'Covenant recorded successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
      setNotification({ type: 'error', message: 'Failed to submit. Please try again.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    if (cardRef.current && membershipInfo) {
      try {
        setLoading(true);
        setNotification({ type: 'info', message: 'Generating your sacred identity card...' });
        
        await new Promise(resolve => setTimeout(resolve, 600));
        await document.fonts.ready;
        
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#ffffff',
          scale: 3, // High scale for pristine printable quality
          useCORS: true,
          logging: false,
          allowTaint: false,
          scrollX: 0,
          scrollY: -window.scrollY,
          onclone: (clonedDoc) => {
            const card = clonedDoc.getElementById('membership-card-render');
            if (card) {
               card.style.transform = 'none';
               card.style.boxShadow = 'none';
               card.style.borderRadius = '24px';
               card.style.position = 'static';
               card.style.margin = '0 auto';
            }
          }
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [85, 135] 
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 85, 135, undefined, 'FAST');
        pdf.save(`ZUCA-ID-${membershipInfo.fullName.replace(/\s+/g, '-')}.pdf`);
        
        setNotification({ type: 'success', message: 'Certificate secured & downloaded!' });
        setTimeout(() => setNotification(null), 4000);
      } catch (err) {
        console.error('Failed to generate PDF', err);
        setNotification({ type: 'error', message: 'Export failed. Standard printable version ready on screen.' });
        setTimeout(() => setNotification(null), 5000);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 lg:space-y-24 pb-32">
      {/* Dynamic Toast Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-full shadow-3xl border flex items-center gap-3 backdrop-blur-3xl min-w-[320px] justify-center ${
              notification.type === 'success' ? 'bg-emerald-600/95 border-emerald-400 text-white shadow-emerald-500/20' :
              notification.type === 'error' ? 'bg-rose-600/95 border-rose-400 text-white shadow-rose-500/20' :
              'bg-brand-600/95 border-brand-400 text-white shadow-brand-500/20'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {notification.type === 'info' && <Loader2 className="w-5 h-5 animate-spin" />}
            <span className="text-[11px] font-black uppercase tracking-[0.15em] leading-none">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Banner */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-16 md:py-32 px-6 md:px-20 rounded-[32px] md:rounded-[64px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mx-2 md:mx-0 text-left"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-20 transition-transform duration-[15s] group-hover:scale-100"
            alt="Sanctuary Fellowship"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/50 to-transparent" />
        </div>
        
        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass-dark border border-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zetech-gold shadow-2xl backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-zetech-gold animate-pulse" />
            Orientation Intake 2026
          </div>
          
          <h1 className="text-3xl md:text-7xl font-black tracking-tight leading-none text-white uppercase font-sans">
            Become a <span className="serif-display italic font-light text-zetech-gold font-serif pl-1 lowercase">Covenant Member</span>
          </h1>
          
          <p className="text-stone-300 text-xs md:text-lg font-medium max-w-2xl leading-relaxed">
            Skip the queues and register instantly! Provide your detail inputs below to join Zetech Catholic Action (ZUCA) and secure your official, printable membership credential card in seconds.
          </p>
        </div>
      </motion.header>

      {/* Main Registration Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 px-2 md:px-0">
        
        {/* Registration Form Column - Streamlined and Focused for Orientation Day */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 xl:col-span-7 bg-white dark:bg-stone-900/80 p-6 md:p-12 relative overflow-hidden rounded-[32px] border border-stone-200/40 dark:border-white/5 shadow-xl text-left"
        >
          <div className="absolute inset-0 divine-pattern opacity-[0.02] pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="join-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleSubmit} 
                className="space-y-8 relative z-10"
              >
                {/* Visual Header / Instruction */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-stone-100 dark:border-white/5 gap-4">
                  <div>
                    <h3 className="text-xl font-black text-stone-950 dark:text-white uppercase tracking-tight">Enrollment Registry</h3>
                    <p className="text-xs text-stone-400 uppercase font-black tracking-widest mt-1">First Year Orientation Portal</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#5c85ff]/10 text-brand-600 dark:text-brand-400 px-4 py-2 rounded-full border border-[#5c85ff]/20">
                    <Church className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Holy Covenant 2026</span>
                  </div>
                </div>

                {/* Microinteractive Preview Seal (Replaces camera/image upload) */}
                <div className="p-6 rounded-3xl bg-stone-500/5 border border-stone-200/40 dark:border-white/5 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#003366] to-[#5c85ff] border-4 border-white shadow-xl flex items-center justify-center relative shrink-0">
                    <div className="absolute inset-0 bg-white/5 flex items-center justify-center" />
                    <span className="text-2xl font-black text-white uppercase font-sans tracking-tighter">
                      {getInitials(formData.fullName)}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-center md:text-left">
                    <span className="text-[9px] font-black uppercase bg-zetech-gold/20 text-brand-800 dark:text-zetech-gold px-2.5 py-1 rounded-full tracking-widest inline-block leading-none mb-1">
                      Dynamic Monogram Seal
                    </span>
                    <h4 className="text-sm font-black text-stone-950 dark:text-white uppercase tracking-tight">Instant Covenant Generation</h4>
                    <p className="text-xs text-stone-400 dark:text-stone-500 font-semibold leading-relaxed">
                      Instead of a profile image, your official card features an elegant, high-contrast dynamic seal based on your name initials. Clear, clean, and prints beautifully!
                    </p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-6 pt-2">
                  
                  {/* Full Name Input */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400 flex items-center gap-2">
                        <User className="w-4 h-4 text-brand-500" /> Full Name
                      </label>
                      {formData.fullName && (
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isNameValid ? 'text-emerald-500' : 'text-stone-400'}`}>
                          {isNameValid ? '✓ Verified Format' : 'Too Short'}
                        </span>
                      )}
                    </div>
                    <input
                      required
                      type="text"
                      placeholder="e.g. John Doe"
                      className="w-full px-6 py-4 rounded-2xl text-stone-950 dark:text-white bg-stone-50/50 dark:bg-black/20 border border-stone-200 dark:border-white/5 focus:border-brand-500 focus:bg-white dark:focus:bg-stone-900 transition-all font-bold tracking-tight outline-none shadow-sm"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>

                  {/* Admission Input */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center px-2">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-brand-500" /> Admission / Student Number
                      </label>
                      {formData.admissionNumber && (
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isAdmissionValid ? 'text-emerald-500' : 'text-stone-400'}`}>
                          {isAdmissionValid ? '✓ Checked' : 'Required'}
                        </span>
                      )}
                    </div>
                    <input
                      required
                      type="text"
                      placeholder="e.g. BBIT-01-9999/2026 or BSCIT..."
                      className="w-full px-6 py-4 rounded-2xl text-stone-950 dark:text-white bg-stone-50/50 dark:bg-black/20 border border-stone-200 dark:border-white/5 focus:border-brand-500 focus:bg-white dark:focus:bg-stone-900 transition-all font-bold tracking-tight outline-none shadow-sm"
                      value={formData.admissionNumber}
                      onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })}
                    />
                  </div>

                  {/* Double Row: Phone & Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Phone Number Input */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-brand-500" /> WhatsApp Number
                        </label>
                        {formData.phoneNumber && (
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isPhoneValid ? 'text-emerald-500' : 'text-stone-400'}`}>
                            {isPhoneValid ? '✓ Valid' : 'Too Short'}
                          </span>
                        )}
                      </div>
                      <input
                        required
                        type="tel"
                        placeholder="e.g. 0712345678"
                        className="w-full px-6 py-4 rounded-2xl text-stone-950 dark:text-white bg-stone-50/50 dark:bg-black/20 border border-stone-200 dark:border-white/5 focus:border-brand-500 focus:bg-white dark:focus:bg-stone-900 transition-all font-bold tracking-tight outline-none shadow-sm"
                        value={formData.phoneNumber}
                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-brand-500" /> Email Address
                        </label>
                        {formData.schoolEmail && (
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isEmailValid ? 'text-emerald-500' : 'text-stone-400'}`}>
                            {isEmailValid ? '✓ Valid' : 'Format @...'}
                          </span>
                        )}
                      </div>
                      <input
                        required
                        type="email"
                        placeholder="e.g. student@zetech.ac.ke"
                        className="w-full px-6 py-4 rounded-2xl text-stone-950 dark:text-white bg-stone-50/50 dark:bg-black/20 border border-stone-200 dark:border-white/5 focus:border-brand-500 focus:bg-white dark:focus:bg-stone-900 transition-all font-bold tracking-tight outline-none shadow-sm"
                        value={formData.schoolEmail}
                        onChange={e => setFormData({ ...formData, schoolEmail: e.target.value })}
                      />
                    </div>

                  </div>
                </div>

                {/* Submit Action Block */}
                <motion.button
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={loading}
                  type="submit"
                  className="w-full bg-[#003366] hover:bg-[#002244] text-white py-5 rounded-2xl font-black uppercase tracking-[0.25em] shadow-lg shadow-brand-900/10 transition-all text-xs flex items-center justify-center gap-3 cursor-pointer mt-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Recording Entry...
                    </>
                  ) : (
                    <>
                      Confirm & Enroll <Send className="w-4 h-4 text-white" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 flex flex-col items-center"
              >
                {membershipInfo && (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-500/20 shadow-md">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-2 text-stone-950 dark:text-white uppercase">
                      Covenant Created
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mb-8 max-w-sm font-semibold leading-relaxed">
                      Your registry entry with ZUCA is verified. Download or print your modern credential card below!
                    </p>

                    {/* Clear & Concise Vector Membership Card */}
                    <div className="mb-8 w-full flex justify-center">
                      <div 
                        ref={cardRef}
                        id="membership-card-render"
                        className="w-[300px] h-[450px] rounded-[24px] bg-white text-stone-900 relative overflow-hidden shadow-2xl border border-stone-200 flex flex-col justify-between select-none"
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        {/* Sacred Head Banner */}
                        <div className="w-full h-24 bg-[#003366] flex items-center justify-between px-6 relative shrink-0">
                           <div className="absolute inset-0 bg-gradient-to-tr from-[#002244] to-transparent" />
                           <div className="flex items-center gap-2.5 z-10">
                              <Church className="w-5 h-5 text-zetech-gold" />
                              <div className="text-left">
                                <h4 className="text-white font-black tracking-widest text-[9px] uppercase leading-none">ZUCA Sanctuary</h4>
                                <p className="text-zetech-gold/90 font-black text-[6.5px] uppercase tracking-[0.14em] mt-0.5 leading-none">Catholic Action</p>
                              </div>
                           </div>
                           <div className="z-10 bg-white/10 px-2.5 py-1 rounded-full text-[8px] font-black uppercase text-white tracking-widest border border-white/5">
                              YEAR 2026
                           </div>
                        </div>
                        
                        {/* Seal Emblem & Main Details Area */}
                        <div className="flex-1 w-full flex flex-col justify-between p-6">
                           
                           {/* Initials Gold Emblazoned Stamp Holder */}
                           <div className="flex justify-center pt-2">
                             <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#003366] via-[#002244] to-brand-900 border-4 border-stone-100 flex items-center justify-center shadow-md relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/[0.03] flex items-center justify-center" />
                                <span className="text-2xl font-black text-white uppercase tracking-tighter">
                                   {getInitials(membershipInfo.fullName)}
                                </span>
                             </div>
                           </div>

                           {/* Name and Member ID Card Accent */}
                           <div className="text-center space-y-1">
                              <h3 className="text-lg font-black text-stone-950 uppercase tracking-tight truncate max-w-[240px] mx-auto px-2">{membershipInfo.fullName}</h3>
                              <div className="inline-block px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[9px] font-bold tracking-widest border border-brand-100/50 leading-none">
                                 MEMBER ID: #{membershipInfo.id}
                              </div>
                           </div>
                           
                           {/* Details Grid Table */}
                           <div className="w-full space-y-2.5 pt-4 border-t border-stone-100">
                              <div className="flex justify-between items-center text-left">
                                 <span className="text-[8px] font-black text-stone-400 uppercase tracking-wider">Admission</span>
                                 <span className="text-xs font-bold text-stone-950 uppercase">{membershipInfo.admissionNumber}</span>
                              </div>
                              <div className="flex justify-between items-center text-left">
                                 <span className="text-[8px] font-black text-stone-400 uppercase tracking-wider">Contact</span>
                                 <span className="text-xs font-bold text-stone-950">{membershipInfo.phoneNumber}</span>
                              </div>
                              <div className="flex justify-between items-center text-left">
                                 <span className="text-[8px] font-black text-stone-400 uppercase tracking-wider">Official Email</span>
                                 <span className="text-xs font-bold text-stone-950 lowercase max-w-[150px] truncate">{membershipInfo.schoolEmail}</span>
                              </div>
                              <div className="flex justify-between items-center text-left">
                                 <span className="text-[8px] font-black text-stone-400 uppercase tracking-wider">Enrolled On</span>
                                 <span className="text-xs font-bold text-stone-950">{membershipInfo.joinDate}</span>
                              </div>
                           </div>
                        </div>

                        {/* Seal validation signature line footer */}
                        <div className="w-full py-4 bg-stone-50 flex flex-col items-center border-t border-stone-100">
                           <div className="flex items-center gap-1.5 text-emerald-600 mb-1 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100/60 shadow-sm">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span className="text-[8px] font-black uppercase tracking-widest leading-none">Holy Covenant Verified</span>
                           </div>
                           <p className="text-[6.5px] font-bold text-stone-400 uppercase tracking-[0.3em]">Official Sanctuary Digitized Credential</p>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                      <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={downloadCard}
                        className="flex-1 bg-[#003366] text-white py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-900/10 flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        Print PDF <Download className="w-4 h-4 text-white" />
                      </motion.button>
                      
                      <button 
                        onClick={() => {
                          setSubmitted(false);
                          setFormData({
                            fullName: '',
                            admissionNumber: '',
                            phoneNumber: '',
                            schoolEmail: ''
                          });
                        }}
                        className="flex-1 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 py-4.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-200 dark:hover:bg-white/10 transition-all border border-stone-200/50 dark:border-white/5 cursor-pointer"
                      >
                        Enroll New Member
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Orientation Faith Checklist Side Panel - Highly Functional for Tomorrow */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 xl:col-span-5 flex flex-col gap-8 text-left"
        >
          {/* Real-time Validation Checklist Tracker */}
          <div className="bg-white dark:bg-stone-900/80 p-8 rounded-[32px] border border-stone-200/40 dark:border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 divine-pattern opacity-[0.015] pointer-events-none" />
            <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#003366] dark:text-brand-400 mb-6 flex items-center gap-3">
              <BookmarkCheck className="w-4 h-4 text-[#003366] dark:text-brand-400" />
              Enrollment Checklist
            </h4>
            
            <div className="space-y-4">
              {[
                { label: "Give Full Name", done: isNameValid, tip: "At least 3 letters" },
                { label: "Add Uni Admission No", done: isAdmissionValid, tip: "Unique university digits" },
                { label: "Provide Phone Contact", done: isPhoneValid, tip: "Preferably WhatsApp enabled" },
                { label: "Record Official Email", done: isEmailValid, tip: "Contains @ and dot suffix" }
              ].map((step, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-4 p-4 rounded-2xl transition-all border ${
                    step.done 
                      ? 'bg-emerald-550/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-400' 
                      : 'bg-stone-500/5 border-stone-100 dark:border-white/5 text-stone-500'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border ${
                    step.done 
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-600' 
                      : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-400'
                  }`}>
                    {step.done ? (
                      <span className="text-[10px] font-black">✓</span>
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider leading-none mt-1">{step.label}</h5>
                    <p className="text-[9px] text-stone-400 uppercase font-black tracking-widest mt-1.5">{step.tip}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-stone-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#5c85ff]">Registry Progress</span>
              <span className="text-xs font-black font-mono">
                {[isNameValid, isAdmissionValid, isPhoneValid, isEmailValid].filter(Boolean).length} / 4 Done
              </span>
            </div>
          </div>

          {/* Social Links Block */}
          <div className="bg-[#003366] text-white p-8 rounded-[32px] shadow-xl relative overflow-hidden group">
            <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
            <div className="absolute -right-16 -bottom-16 w-60 h-60 bg-zetech-gold/15 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <span className="text-[8px] font-black uppercase text-zetech-gold tracking-[0.4em]">Connect Instantly</span>
              <h3 className="text-xl md:text-2xl font-black uppercase">Official WhatsApp</h3>
              <p className="text-stone-300 text-xs font-medium leading-relaxed">
                Connect and coordinate directly with ZUCA group leads, choir, and general parish announcements.
              </p>
            </div>
            
            <motion.a
              href="https://chat.whatsapp.com/GxuvB559sZLIurYvXbxHmU" 
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              className="mt-6 inline-flex items-center justify-between gap-4 px-6 py-4.5 bg-white text-brand-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg w-full"
            >
              Enter Parish Chat <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </motion.a>
          </div>

          {/* Vision Quote Block */}
          <div className="bg-white dark:bg-stone-900/80 p-8 rounded-[32px] border border-stone-200/40 dark:border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 divine-pattern opacity-[0.015] pointer-events-none" />
            <div className="relative">
              <Quote className="absolute -top-4 -left-4 w-12 h-12 text-brand-500/5" />
              <p className="text-base text-stone-900 dark:text-stone-200 leading-relaxed italic font-serif pl-6 border-l-2 border-brand-500/20">
                "For where two or three are gathered together in my name, there am I in the midst of them." — Matthew 18:20
              </p>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
