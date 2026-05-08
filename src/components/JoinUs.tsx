import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Send, MessageCircle, CheckCircle2, GraduationCap, Phone, Mail, User, Quote, Camera, Download, ShieldCheck, Zap, QrCode } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function JoinUs() {
  const [formData, setFormData] = useState({
    fullName: '',
    admissionNumber: '',
    phoneNumber: '',
    schoolEmail: '',
    profileImage: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [membershipInfo, setMembershipInfo] = useState<any>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Image is too large. Please select a photo under 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.profileImage) {
      alert('Please upload a profile photo for your membership card.');
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
        joinDate: new Date().toLocaleDateString()
      };
      
      setMembershipInfo(info);
      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
    } finally {
      setLoading(false);
    }
  };

  const downloadCard = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#ffffff',
          scale: 2, // Moderate scale for better mobile compatibility
          useCORS: true,
          logging: false,
          allowTaint: true,
          width: cardRef.current.offsetWidth,
          height: cardRef.current.offsetHeight
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [85, 135] // Standard vertical ID card size
        });
        
        pdf.addImage(imgData, 'JPEG', 0, 0, 85, 135);
        pdf.save(`ZUCA-ID-${membershipInfo.fullName.replace(/\s+/g, '-')}.pdf`);
        
        alert('Covenant Identity Secured. Your registration is complete.');
      } catch (err) {
        console.error('Failed to generate PDF', err);
        alert('Failed to generate PDF. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 lg:space-y-32 pb-32">
      {/* Hero Section - Cinematic Upgrade */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-12 md:py-48 px-6 md:px-32 rounded-[32px] md:rounded-[120px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-6 md:mb-20 mx-2 md:mx-0"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-30 transition-transform duration-[15s] group-hover:scale-100"
            alt="Sanctuary Fellowship"
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
            Sanctify Your Path
          </motion.div>
          
          <h1 className="text-4xl md:text-[9rem] font-black tracking-[-0.05em] leading-tight md:leading-[0.8] text-white serif-display italic">
            Walk with <br className="hidden md:block" />
            <span className="text-brand-400 not-italic uppercase font-black text-xl md:text-5xl tracking-[0.4em] block mt-2 md:mt-4">Us in Faith</span>
          </h1>
          
          <p className="text-stone-400 text-sm md:text-3xl font-light max-w-2xl leading-relaxed italic serif-display opacity-80">
            A sanctuary for students seeking spiritual nourishment, intellectual growth, and authentic community.
          </p>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-20 px-4">
        {/* Registration Form - Refined */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-12 xl:col-span-7 glass p-6 md:p-20 relative overflow-hidden rounded-[32px] md:rounded-[80px] border border-stone-100 dark:border-white/5 shadow-2xl"
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
                className="space-y-8 md:space-y-12 relative z-10"
              >
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center justify-center space-y-6 mb-4">
                   <div className="relative group cursor-pointer">
                     <div className="w-32 h-32 md:w-48 md:h-48 rounded-[40px] md:rounded-[56px] bg-stone-100 dark:bg-white/5 border-2 border-dashed border-stone-200 dark:border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-brand-500/50 group-hover:bg-brand-50/50 dark:group-hover:bg-brand-500/5 shadow-inner ring-0 group-hover:ring-8 ring-brand-500/5">
                        {formData.profileImage ? (
                          <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        ) : (
                          <div className="text-center p-4">
                            <Camera className="w-8 h-8 md:w-12 md:h-12 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-400">Click to Upload</p>
                            <p className="text-[6px] md:text-[8px] font-bold text-stone-300 dark:text-stone-700 uppercase mt-1">Identity Capture</p>
                          </div>
                        )}
                     </div>
                     <input 
                       type="file" 
                       accept="image/*" 
                       onChange={handleImageChange}
                       className="absolute inset-0 opacity-0 cursor-pointer z-10"
                     />
                     <div className="absolute -bottom-2 -right-2 bg-brand-600 text-white p-3 md:p-4 rounded-3xl shadow-xl shadow-brand-600/30 group-hover:scale-110 group-hover:rotate-6 transition-all">
                        <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
                     </div>
                   </div>
                   <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 text-center">Profile Authentication Required</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <div className="space-y-3 md:space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400 flex items-center gap-3 md:gap-4 ml-4">
                      <User className="w-4 h-4 md:w-5 md:h-5" /> Full Name
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. John Doe"
                      className="w-full px-6 md:px-8 py-5 md:py-7 rounded-[24px] md:rounded-[32px] text-sm md:text-lg bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all shadow-inner font-bold tracking-tight"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400 flex items-center gap-3 md:gap-4 ml-4">
                      <GraduationCap className="w-4 h-4 md:w-5 md:h-5" /> Admission
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="BSCIT-01..."
                      className="w-full px-6 md:px-8 py-5 md:py-7 rounded-[24px] md:rounded-[32px] text-sm md:text-lg bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all shadow-inner font-bold tracking-tight"
                      value={formData.admissionNumber}
                      onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <div className="space-y-3 md:space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400 flex items-center gap-3 md:gap-4 ml-4">
                      <Phone className="w-4 h-4 md:w-5 md:h-5" /> Phone Number
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="0712 345 678"
                      className="w-full px-6 md:px-8 py-5 md:py-7 rounded-[24px] md:rounded-[32px] text-sm md:text-lg bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all shadow-inner font-bold tracking-tight"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400 flex items-center gap-3 md:gap-4 ml-4">
                      <Mail className="w-4 h-4 md:w-5 md:h-5" /> School Email
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="john.doe@zetech.ac.ke"
                      className="w-full px-6 md:px-8 py-5 md:py-7 rounded-[24px] md:rounded-[32px] text-sm md:text-lg bg-stone-50/50 dark:bg-black/20 border border-stone-100 dark:border-white/5 focus:border-brand-500/30 transition-all shadow-inner font-bold tracking-tight"
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
                  className="w-full bg-brand-900 text-white py-6 md:py-8 rounded-[24px] md:rounded-[40px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] shadow-3xl shadow-brand-900/40 mt-4 md:mt-6 text-[10px] md:text-sm flex items-center justify-center gap-4 md:gap-6 group"
                >
                  {loading ? (
                    'Recording Covenant...'
                  ) : (
                    <>
                      Confirm My Journey <Send className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-3 transition-transform" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 md:py-12 relative z-10 flex flex-col items-center"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 rounded-[24px] flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                  <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-emerald-600 dark:text-emerald-500" />
                </div>
                
                <h2 className="text-3xl md:text-6xl font-black tracking-tighter mb-4 text-stone-900 dark:text-white leading-none">
                  REGISTERED <br />
                  <span className="text-brand-600 dark:text-brand-400 serif-display italic font-light lowercase">Successfully</span>
                </h2>
                <p className="text-sm md:text-lg text-stone-500 dark:text-stone-400 mb-12 max-w-sm font-medium tracking-tight">
                  Your covenant with ZUCA is now official. Please secure your membership card below.
                </p>

                {/* Membership Card - Minimalist ID Card */}
                <div className="mb-16 w-full flex justify-center">
                  <div 
                    ref={cardRef}
                    className="w-[300px] h-[450px] rounded-[24px] bg-white text-stone-900 relative overflow-hidden shadow-2xl border border-stone-100 flex flex-col items-center"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {/* Brand Banner */}
                    <div className="w-full h-24 bg-brand-600 flex items-center justify-center px-6 relative">
                       <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/10 to-transparent" />
                       <div className="flex items-center gap-3 z-10">
                          <Church className="w-6 h-6 text-white" />
                          <h4 className="text-white font-black tracking-widest text-sm uppercase">ZUCA ASSEMBLY</h4>
                       </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-1 w-full flex flex-col items-center justify-center p-8 space-y-6">
                       <div className="w-32 h-32 rounded-full border-4 border-stone-50 overflow-hidden shadow-lg ring-1 ring-stone-100">
                          <img src={membershipInfo.profileImage} alt="" className="w-full h-full object-cover" />
                       </div>
                       
                       <div className="text-center space-y-1 w-full overflow-hidden">
                          <h3 className="text-xl font-black text-stone-900 uppercase truncate px-2">{membershipInfo.fullName}</h3>
                          <div className="inline-block px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                             Member ID: #{membershipInfo.id}
                          </div>
                       </div>
                       
                       <div className="w-full space-y-3 pt-6 border-t border-stone-100">
                          <div className="flex justify-between items-center px-1">
                             <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">Admission</span>
                             <span className="text-xs font-bold text-stone-900">{membershipInfo.admissionNumber}</span>
                          </div>
                          <div className="flex justify-between items-center px-1">
                             <span className="text-[9px] font-bold text-stone-300 uppercase tracking-widest">Since Date</span>
                             <span className="text-xs font-bold text-stone-900">{membershipInfo.joinDate}</span>
                          </div>
                       </div>
                    </div>

                    {/* Footer / QR */}
                    <div className="w-full p-6 bg-stone-50/50 flex flex-col items-center">
                       <div className="flex items-center gap-2 text-emerald-600 mb-4 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                          <ShieldCheck className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest leading-none">Holy Covenant Verified</span>
                       </div>
                       <p className="text-[8px] font-bold text-stone-300 uppercase tracking-[0.3em]">Official Sanctuary Credential</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-md">
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={downloadCard}
                    className="flex-1 bg-brand-600 text-white py-5 md:py-6 rounded-full font-black uppercase tracking-[0.3em] text-[10px] md:text-[12px] shadow-3xl shadow-brand-600/30 flex items-center justify-center gap-4 group"
                  >
                    Download Certificate <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  </motion.button>
                  <button 
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        fullName: '',
                        admissionNumber: '',
                        phoneNumber: '',
                        schoolEmail: '',
                        profileImage: ''
                      });
                    }}
                    className="flex-1 bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-stone-400 py-5 md:py-6 rounded-full font-black uppercase tracking-[0.3em] text-[10px] md:text-[12px] hover:bg-stone-200 dark:hover:bg-white/10 transition-all border border-stone-200/50 dark:border-white/5"
                  >
                    Register Another
                  </button>
                </div>
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
          <div className="glass-dark p-10 md:p-16 bg-brand-950 text-white shadow-3xl shadow-brand-900/20 relative overflow-hidden group rounded-[40px] md:rounded-[60px] flex flex-col justify-between h-full min-h-[300px] md:min-h-[400px]">
            <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-500/20 blur-[100px] rounded-full group-hover:scale-150 transition-transform duration-[3s] shadow-2xl" />
            
            <div className="space-y-6 md:space-y-8 relative z-10">
              <h3 className="text-3xl md:text-5xl font-black tracking-tight serif-display italic">The Assembly</h3>
              <p className="text-stone-400 text-base md:text-xl font-light leading-relaxed italic serif-display">
                "Connect instantly with fellow members via our official WhatsApp community for daily updates and prayer calls."
              </p>
            </div>
            
            <motion.a
              href="https://chat.whatsapp.com/your-group-link" 
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -5 }}
              className="mt-8 inline-flex items-center justify-between gap-6 px-8 py-5 md:px-10 md:py-7 bg-white text-brand-950 rounded-[28px] md:rounded-[40px] text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl relative z-10 w-full hover:bg-brand-50 transition-colors"
            >
              Go to WhatsApp <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-[#25D366]" />
            </motion.a>
          </div>

          <div className="glass p-8 md:p-16 border-stone-100 dark:border-white/5 rounded-[40px] md:rounded-[60px] shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 divine-pattern opacity-[0.02] pointer-events-none" />
            <h4 className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] text-brand-600 mb-6 md:mb-10 flex items-center gap-4">
              <div className="w-6 md:w-8 h-px bg-brand-600/30" /> Our Vision
            </h4>
            <div className="relative">
              <Quote className="absolute -top-6 -left-6 w-12 md:w-16 h-12 md:h-16 text-brand-500/5 group-hover:scale-125 transition-transform duration-1000 shrink-0" />
              <p className="text-lg md:text-3xl text-stone-900 dark:text-stone-200 leading-snug md:leading-[1.3] italic font-serif pl-6 md:pl-8 border-l-2 border-brand-500/20">
                To be a vibrant Catholic community in academia, fostering spiritual nourishment and intellectual growth through prayer and service.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
