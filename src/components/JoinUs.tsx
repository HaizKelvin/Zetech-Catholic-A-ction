import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, onSnapshot, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Send, 
  CheckCircle2, 
  GraduationCap, 
  Phone, 
  Mail, 
  User, 
  Download, 
  ShieldCheck, 
  Church, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Users,
  Search,
  Check,
  Eye,
  Trash2,
  X,
  FileSpreadsheet
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface RegisteredMember {
  id: string;
  fullName: string;
  admissionNumber: string;
  phoneNumber: string;
  schoolEmail: string;
  createdAt: any;
  joinDate?: string;
}

export default function JoinUs() {
  const [formData, setFormData] = useState({
    fullName: '',
    admissionNumber: '',
    phoneNumber: '',
    schoolEmail: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [lastRegistered, setLastRegistered] = useState<RegisteredMember | null>(null);
  const [registrations, setRegistrations] = useState<RegisteredMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [previewMember, setPreviewMember] = useState<RegisteredMember | null>(null);
  const [exportingMember, setExportingMember] = useState<RegisteredMember | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Real-time listener for registrations (sorted client-side to prevent Firestore composite index request crashes)
  useEffect(() => {
    const q = query(collection(db, 'registrations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => {
        const data = doc.data();
        let displayDate = 'Just Now';
        let rawDate = new Date();
        
        if (data.createdAt) {
          rawDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          displayDate = rawDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        }
        
        return {
          id: doc.id,
          fullName: data.fullName || '',
          admissionNumber: data.admissionNumber || '',
          phoneNumber: data.phoneNumber || '',
          schoolEmail: data.schoolEmail || '',
          createdAt: rawDate,
          joinDate: displayDate
        } as RegisteredMember;
      });

      // Sort descending by registration date
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRegistrations(list);
    }, (error) => {
      console.error("Firestore synchronisation error:", error);
    });
    return () => unsubscribe();
  }, []);

  const isNameValid = formData.fullName.trim().length >= 3;
  const isAdmissionValid = formData.admissionNumber.trim().length >= 4;
  const isPhoneValid = formData.phoneNumber.trim().replace(/\D/g, '').length >= 9;
  const isEmailValid = formData.schoolEmail.trim().includes('@') && formData.schoolEmail.trim().includes('.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isNameValid || !isAdmissionValid || !isPhoneValid || !isEmailValid) {
      setNotification({ 
        type: 'error', 
        message: 'Please fill in all parameters accurately before saving.' 
      });
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    setLoading(true);
    
    try {
      const path = 'registrations';
      const docRef = await addDoc(collection(db, path), {
        fullName: formData.fullName.trim(),
        admissionNumber: formData.admissionNumber.trim().toUpperCase(),
        phoneNumber: formData.phoneNumber.trim(),
        schoolEmail: formData.schoolEmail.trim().toLowerCase(),
        createdAt: serverTimestamp()
      });
      
      const newMember: RegisteredMember = {
        id: docRef.id,
        fullName: formData.fullName.trim(),
        admissionNumber: formData.admissionNumber.trim().toUpperCase(),
        phoneNumber: formData.phoneNumber.trim(),
        schoolEmail: formData.schoolEmail.trim().toLowerCase(),
        createdAt: new Date(),
        joinDate: new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      };
      
      setLastRegistered(newMember);
      setPreviewMember(newMember); // Instantly trigger preview
      
      // Clear form inputs so registrar can immediately register the next student!
      setFormData({
        fullName: '',
        admissionNumber: '',
        phoneNumber: '',
        schoolEmail: ''
      });

      setNotification({ type: 'success', message: 'First Year student enrolled!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
      setNotification({ type: 'error', message: 'Enrollment failed. Try again.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const triggerExport = async (member: RegisteredMember, format: 'pdf' | 'png') => {
    try {
      setNotification({ type: 'info', message: `Preparing high-quality ${format.toUpperCase()} card...` });
      
      // Update state to render offscreen card (fallback)
      setExportingMember(member);
      
      // Wait slightly longer (350ms) to ensure React state and offscreen layout are 100% finished updating and stable
      await new Promise(resolve => setTimeout(resolve, 350));
      
      // Look for the already rendered card on the page first, fallback to the offscreen element
      const element = document.getElementById(`printable-card-${member.id}`) || document.getElementById('export-card-node');
      if (!element) {
        throw new Error("Target export element was not rendered in the layout");
      }

      await document.fonts.ready;
      
      const canvas = await html2canvas(element, {
        backgroundColor: null, // Keeps the custom gradient transparency intact
        scale: 3.5, // High DPI print resolution
        useCORS: true,
        logging: false,
        allowTaint: true, // Prevents cross-origin taint errors
        scrollX: 0,
        scrollY: 0,
        windowWidth: 350,
        windowHeight: 220
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const safeFileName = `ZUCA_MEMBER_${member.fullName.toUpperCase().trim().replace(/\s+/g, '_')}`;
      
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${safeFileName}.png`;
        link.href = imgData;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setNotification({ type: 'success', message: 'Card saved as Image (PNG)!' });
      } else {
        // High quality standard landscape credit card dimensions [85.6mm x 54mm]
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [85.6, 54]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54, undefined, 'FAST');
        pdf.save(`${safeFileName}.pdf`);
        
        setNotification({ type: 'success', message: 'Printable PDF Card downloaded!' });
      }
      
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to generate credential card', err);
      // Fallback
      window.print();
      setNotification({ type: 'error', message: 'Direct download issue. Browser print triggered as fallback.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      // Clear offscreen render to keep DOM lightweight
      setExportingMember(null);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this membership card? This action cannot be undone.")) {
      return;
    }
    try {
      setNotification({ type: 'info', message: 'Deleting registration card...' });
      await deleteDoc(doc(db, 'registrations', id));
      setNotification({ type: 'success', message: 'Registration deleted successfully.' });
      setTimeout(() => setNotification(null), 3000);
      
      if (previewMember && previewMember.id === id) {
        setPreviewMember(null);
      }
      if (lastRegistered && lastRegistered.id === id) {
        setLastRegistered(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `registrations/${id}`);
      setNotification({ type: 'error', message: 'Failed to delete registration.' });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Filter registrations list based on search bar query
  const filteredRegistrations = registrations.filter(r => 
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 lg:space-y-16 pb-32">
      {/* Toast Overlay notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -45, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-full border flex items-center gap-3 backdrop-blur-2xl shadow-2xl min-w-[340px] justify-center ${
              notification.type === 'success' ? 'bg-emerald-600/95 border-emerald-400 text-white' :
              notification.type === 'error' ? 'bg-rose-600/95 border-rose-400 text-white' :
              'bg-brand-950/95 border-brand-500/30 text-white'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-white" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-white" />}
            {notification.type === 'info' && <Loader2 className="w-5 h-5 animate-spin text-zetech-gold" />}
            <span className="text-[11px] font-black uppercase tracking-[0.15em] leading-none">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Off-screen dynamic capture node for reliable PDF/PNG generations */}
      <div 
        className="fixed pointer-events-none z-[-50] overflow-hidden" 
        style={{ bottom: '-1000px', right: '-1000px', width: '350px', height: '220px' }}
        aria-hidden="true"
      >
        {exportingMember && (
          <div 
            id="export-card-node"
            className="w-[350px] h-[220px] text-white p-[18px] rounded-2xl flex flex-col justify-between select-none relative overflow-hidden"
            style={{ 
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              background: "linear-gradient(135deg, #001a36 0%, #002d5c 100%)",
              border: "3px solid #d4af37",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.4)"
            }}
          >
            {/* Soft decorative background watermark cross */}
            <div className="absolute right-[12px] bottom-[30px] text-[130px] font-light text-[#d4af37]/5 pointer-events-none select-none font-sans leading-none">
              ✝
            </div>

            {/* Top Header Section */}
            <div className="border-b border-[#d4af37]/30 pb-[6px] flex justify-between items-start text-left relative z-10">
              <div>
                <h3 className="text-[11px] font-black tracking-[0.14em] uppercase text-[#d4af37] leading-tight">ZETECH UNIVERSITY</h3>
                <p className="text-[7.5px] font-extrabold text-white/95 uppercase tracking-[0.12em] leading-none mt-0.5">Catholic Action Fraternity (ZUCA)</p>
              </div>
              <div className="text-[7px] font-mono font-black border border-[#d4af37]/60 rounded px-[5px] py-[1.5px] uppercase tracking-wider leading-none text-[#d4af37] bg-white/5">
                YEAR 2026/2027
              </div>
            </div>

            {/* Grid values of absolute clarity */}
            <div className="flex-1 flex items-stretch gap-3 py-[6px] text-left relative z-10">
              {/* Member Info Fields */}
              <div className="flex-1 flex flex-col justify-center space-y-1.5 py-[2px] min-w-0">
                <div className="leading-none">
                  <span className="text-[6px] font-extrabold text-[#d4af37] uppercase tracking-[0.18em] block font-mono">MEMBER NAME</span>
                  <span className="text-[11px] font-black text-white uppercase tracking-tight truncate block max-w-[200px] mt-0.5">{exportingMember.fullName}</span>
                </div>
                
                <div className="leading-none">
                  <span className="text-[6px] font-extrabold text-[#d4af37] uppercase tracking-[0.18em] block font-mono">ADMISSION NO</span>
                  <span className="text-[10px] font-bold text-white uppercase font-mono tracking-wide mt-0.5 block">{exportingMember.admissionNumber}</span>
                </div>

                <div className="leading-none">
                  <span className="text-[6px] font-extrabold text-[#d4af37] uppercase tracking-[0.18em] block font-mono">WHATSAPP & EMAIL</span>
                  <span className="text-[8px] font-bold text-white/80 font-mono truncate max-w-[200px] block mt-0.5">{exportingMember.phoneNumber} • {exportingMember.schoolEmail}</span>
                </div>
              </div>

              {/* Photo & Seal Column */}
              <div className="w-[68px] flex flex-col items-center justify-center shrink-0">
                <div className="w-[56px] h-[56px] rounded-lg border border-[#d4af37]/40 bg-[#001021]/60 flex flex-col items-center justify-center relative overflow-hidden text-center backdrop-blur-sm shadow-inner">
                  {/* Subtle golden cross inside avatar placeholder */}
                  <span className="text-[20px] text-[#d4af37]/40 font-light leading-none">✝</span>
                  <span className="text-[5px] font-extrabold text-[#d4af37]/80 uppercase tracking-widest mt-1 font-mono">PILGRIM</span>
                  <div className="absolute inset-0 border border-white/5 rounded-lg pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Pure typographic Footer stamp style block */}
            <div className="border-t border-[#d4af37]/30 pt-[6px] flex justify-between items-center text-[7px] font-mono font-bold leading-none text-left relative z-10">
              <span className="uppercase text-white/50 tracking-wide">MEMBER ID: #{exportingMember.id.slice(-8).toUpperCase()}</span>
              <span className="text-emerald-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> COVENANT MEMBER
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modern High-Conversion Header Banner */}
      <header className="relative py-12 md:py-24 px-6 md:px-16 rounded-[28px] overflow-hidden bg-[#001f3f] text-white shadow-xl text-left">
        <div className="absolute inset-0 z-0 opacity-15 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zetech-gold/10 border border-zetech-gold/20 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zetech-gold shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-zetech-gold animate-pulse" />
            Orientation Intake 2026
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none text-white uppercase font-sans">
            Streamlined <span className="serif-display italic font-light text-zetech-gold pl-1 lowercase font-serif">Registry & Credentials</span>
          </h1>
          <p className="text-stone-300 text-xs md:text-base font-semibold max-w-2xl leading-relaxed">
            Optimized for live registration desks. Enroll first years rapidly, view real-time logs, and access simple, image-free, highly readable print-friendly membership cards instantly.
          </p>
        </div>
      </header>

      {/* Main Split Layout: Form Left, Roster Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Data Entry Intake Desk */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-8">
          <div className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-white/5 p-6 md:p-10 rounded-[28px] shadow-lg text-left relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-stone-100 dark:border-white/5 gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black text-stone-900 dark:text-white uppercase tracking-tight">Student Enrollment Form</h3>
                <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest mt-0.5">High-Speed Intake Setup</p>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-500/10 text-[#003366] dark:text-brand-400 px-3 py-1.5 rounded-full border border-brand-100 dark:border-brand-500/20">
                <Church className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-wider leading-none">ZUCA 2026</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Info Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#003366] dark:text-brand-400 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#003366] dark:text-brand-400" /> Full Student Name
                  </label>
                  {formData.fullName && (
                    <span className={`text-[9.5px] font-extrabold uppercase tracking-wider ${isNameValid ? 'text-emerald-500' : 'text-stone-400'}`}>
                      {isNameValid ? '✓ Correct Format' : 'Too Short'}
                    </span>
                  )}
                </div>
                <input
                  required
                  type="text"
                  placeholder="e.g. Kelvin Wachira"
                  className="w-full px-5 py-4 rounded-xl text-stone-900 dark:text-white bg-stone-50/50 dark:bg-stone-950/40 border border-stone-200 dark:border-white/5 focus:border-brand-500 focus:bg-white dark:focus:bg-stone-900 transition-all font-bold tracking-tight outline-none shadow-sm text-sm"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              {/* Admission Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#003366] dark:text-brand-400 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#003366] dark:text-brand-400" /> Admission / Student Number
                  </label>
                  {formData.admissionNumber && (
                    <span className={`text-[9.5px] font-extrabold uppercase tracking-wider ${isAdmissionValid ? 'text-emerald-500' : 'text-stone-400'}`}>
                      {isAdmissionValid ? '✓ Validated' : 'Required'}
                    </span>
                  )}
                </div>
                <input
                  required
                  type="text"
                  placeholder="e.g. BBIT-01-1234/2026 or BSCIT..."
                  className="w-full px-5 py-4 rounded-xl text-stone-900 dark:text-white bg-stone-50/50 dark:bg-stone-950/40 border border-stone-200 dark:border-white/5 focus:border-brand-500 focus:bg-white dark:focus:bg-stone-900 transition-all font-mono font-bold tracking-tight outline-none shadow-sm text-sm"
                  value={formData.admissionNumber}
                  onChange={e => setFormData({ ...formData, admissionNumber: e.target.value })}
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#003366] dark:text-brand-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#003366] dark:text-brand-400" /> WhatsApp Contact
                    </label>
                    {formData.phoneNumber && (
                      <span className={`text-[9.5px] font-extrabold uppercase tracking-wider ${isPhoneValid ? 'text-emerald-500' : 'text-stone-400'}`}>
                        {isPhoneValid ? '✓ Checked' : 'Too Short'}
                      </span>
                    )}
                  </div>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 0712345678"
                    className="w-full px-5 py-4 rounded-xl text-stone-900 dark:text-white bg-stone-50/50 dark:bg-stone-950/40 border border-stone-200 dark:border-white/5 focus:border-brand-500 focus:bg-white dark:focus:bg-stone-900 transition-all font-bold tracking-tight outline-none shadow-sm text-sm"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-[#003366] dark:text-brand-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#003366] dark:text-brand-400" /> Official Email
                    </label>
                    {formData.schoolEmail && (
                      <span className={`text-[9.5px] font-extrabold uppercase tracking-wider ${isEmailValid ? 'text-emerald-500' : 'text-stone-400'}`}>
                        {isEmailValid ? '✓ Valid Format' : 'Must include @'}
                      </span>
                    )}
                  </div>
                  <input
                    required
                    type="email"
                    placeholder="student@zetech.ac.ke"
                    className="w-full px-5 py-4 rounded-xl text-stone-900 dark:text-white bg-stone-50/50 dark:bg-stone-950/40 border border-stone-200 dark:border-white/5 focus:border-brand-500 focus:bg-white dark:focus:bg-stone-900 transition-all font-bold tracking-tight outline-none shadow-sm text-sm"
                    value={formData.schoolEmail}
                    onChange={e => setFormData({ ...formData, schoolEmail: e.target.value })}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
                disabled={loading}
                type="submit"
                className="w-full bg-[#003366] hover:bg-[#002244] text-white py-4.5 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-brand-900/10 transition-all text-xs flex items-center justify-center gap-3 cursor-pointer mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Syncing Student to Registry...
                  </>
                ) : (
                  <>
                    Submit & Generate Concise Card <UserPlus className="w-4 h-4 text-white" />
                  </>
                )}
              </motion.button>
            </form>
          </div>

          {/* LAST REGISTERED QUICK PREVIEW PANEL */}
          <AnimatePresence mode="wait">
            {lastRegistered && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-emerald-500/[0.04] dark:bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 p-6 rounded-[28px] text-left relative"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-tight">Active Enrollment Feedback</h4>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-extrabold uppercase tracking-wider">Student successfully registered. Card is fully prepared below.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={() => triggerExport(lastRegistered, 'pdf')} 
                      className="px-3 py-1.5 bg-[#003366] hover:bg-[#002244] text-white text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                      title="Download as printable PDF"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                    <button 
                      onClick={() => triggerExport(lastRegistered, 'png')} 
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer transition-all"
                      title="Save as PNG image"
                    >
                      <Download className="w-3 h-3" /> PNG Image
                    </button>
                    <button 
                      onClick={() => setLastRegistered(null)}
                      className="p-1.5 hover:bg-stone-200 dark:hover:bg-white/10 rounded-lg text-stone-500 cursor-pointer transition-all"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* THE CLEAR AND CONCISE MEMBERSHIP CARD DISPLAY (LANDSCAPE, Swiss Modernist Style, NO IMAGES) */}
                <div className="flex justify-center py-4 bg-white/45 dark:bg-stone-900/40 rounded-2xl border border-stone-200/40 dark:border-white/5 shadow-inner">
                  
                  {/* Target node layout template for exact high-dpi screenshot */}
                  <div className="relative p-2">
                    <div 
                      id={`printable-card-${lastRegistered.id}`}
                      className="w-[350px] h-[220px] text-white p-[18px] rounded-2xl flex flex-col justify-between select-none relative overflow-hidden shadow-2xl"
                      style={{ 
                        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                        background: "linear-gradient(135deg, #001a36 0%, #002d5c 100%)",
                        border: "3px solid #d4af37",
                        boxShadow: "inset 0 0 20px rgba(0,0,0,0.4)"
                      }}
                    >
                      {/* Soft decorative background watermark cross */}
                      <div className="absolute right-[12px] bottom-[30px] text-[130px] font-light text-[#d4af37]/5 pointer-events-none select-none font-sans leading-none">
                        ✝
                      </div>

                      {/* Top Header Section */}
                      <div className="border-b border-[#d4af37]/30 pb-[6px] flex justify-between items-start text-left relative z-10">
                        <div>
                          <h3 className="text-[11px] font-black tracking-[0.14em] uppercase text-[#d4af37] leading-tight">ZETECH UNIVERSITY</h3>
                          <p className="text-[7.5px] font-extrabold text-white/95 uppercase tracking-[0.12em] leading-none mt-0.5">Catholic Action Fraternity (ZUCA)</p>
                        </div>
                        <div className="text-[7px] font-mono font-black border border-[#d4af37]/60 rounded px-[5px] py-[1.5px] uppercase tracking-wider leading-none text-[#d4af37] bg-white/5">
                          YEAR 2026/2027
                        </div>
                      </div>

                      {/* Grid values of absolute clarity */}
                      <div className="flex-1 flex items-stretch gap-3 py-[6px] text-left relative z-10">
                        {/* Member Info Fields */}
                        <div className="flex-1 flex flex-col justify-center space-y-1.5 py-[2px] min-w-0">
                          <div className="leading-none">
                            <span className="text-[6px] font-extrabold text-[#d4af37] uppercase tracking-[0.18em] block font-mono">MEMBER NAME</span>
                            <span className="text-[11px] font-black text-white uppercase tracking-tight truncate block max-w-[200px] mt-0.5">{lastRegistered.fullName}</span>
                          </div>
                          
                          <div className="leading-none">
                            <span className="text-[6px] font-extrabold text-[#d4af37] uppercase tracking-[0.18em] block font-mono">ADMISSION NO</span>
                            <span className="text-[10px] font-bold text-white uppercase font-mono tracking-wide mt-0.5 block">{lastRegistered.admissionNumber}</span>
                          </div>

                          <div className="leading-none">
                            <span className="text-[6px] font-extrabold text-[#d4af37] uppercase tracking-[0.18em] block font-mono">WHATSAPP & EMAIL</span>
                            <span className="text-[8px] font-bold text-white/80 font-mono truncate max-w-[200px] block mt-0.5">{lastRegistered.phoneNumber} • {lastRegistered.schoolEmail}</span>
                          </div>
                        </div>

                        {/* Photo & Seal Column */}
                        <div className="w-[68px] flex flex-col items-center justify-center shrink-0">
                          <div className="w-[56px] h-[56px] rounded-lg border border-[#d4af37]/40 bg-[#001021]/60 flex flex-col items-center justify-center relative overflow-hidden text-center backdrop-blur-sm shadow-inner">
                            {/* Subtle golden cross inside avatar placeholder */}
                            <span className="text-[20px] text-[#d4af37]/40 font-light leading-none">✝</span>
                            <span className="text-[5px] font-extrabold text-[#d4af37]/80 uppercase tracking-widest mt-1 font-mono">PILGRIM</span>
                            <div className="absolute inset-0 border border-white/5 rounded-lg pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Typographic Footer stamp style block */}
                      <div className="border-t border-[#d4af37]/30 pt-[6px] flex justify-between items-center text-[7px] font-mono font-bold leading-none text-left relative z-10">
                        <span className="uppercase text-white/50 tracking-wide">MEMBER ID: #{lastRegistered.id.slice(-8).toUpperCase()}</span>
                        <span className="text-emerald-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> COVENANT MEMBER
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: Real-Time Roster Ledger Registry (Extremely helpful for Tomorrow) */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-white/5 p-6 md:p-8 rounded-[28px] shadow-lg text-left relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_0.5px,transparent_0.5px)] [background-size:12px_12px] pointer-events-none" />
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#003366] dark:text-brand-400" />
                  <h4 className="text-base font-black text-stone-900 dark:text-white uppercase tracking-tight">Elections Feed</h4>
                </div>
                <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-brand-500/15">
                  {registrations.length} Total Enrolled
                </span>
              </div>
              <p className="text-[11px] text-stone-400 dark:text-stone-400 leading-relaxed font-semibold">
                This table syncs live from the Firestore database. Simply click "Download" on any member to secure their printable text card.
              </p>

              {/* Real-time Filter Search box */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by student name, admission or phone..."
                  className="w-full pl-11 pr-4 py-3 bg-stone-100 dark:bg-black/30 text-xs text-stone-900 dark:text-white rounded-xl placeholder-stone-400 border border-transparent focus:border-brand-500 transition-all outline-none font-bold"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* LIVE FEED TABLE */}
            <div className="space-y-3.5 max-h-[480px] overflow-y-auto custom-scrollbar pr-1 relative z-10">
              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-stone-100 dark:border-white/5 rounded-2xl">
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-wider">No registry entries found</p>
                  <p className="text-[10.5px] text-stone-400 dark:text-stone-500 font-semibold mt-1">Begin typing in the left form to enroll</p>
                </div>
              ) : (
                filteredRegistrations.map((member) => (
                  <div 
                    key={member.id}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950/40 hover:bg-stone-100 hover:dark:bg-stone-950/85 border border-stone-100 dark:border-white/5 shadow-sm transition-all flex justify-between items-center group/item"
                  >
                    <div className="space-y-1 max-w-[190px] md:max-w-[210px]">
                      <div className="flex items-center gap-1.5 h-4.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase truncate tracking-tight">{member.fullName}</h4>
                      </div>
                      <div className="text-[10px] text-stone-400 dark:text-stone-500 font-black tracking-wider uppercase font-mono">
                        {member.admissionNumber} • <span className="text-[9px] lowercase font-semibold">{member.schoolEmail}</span>
                      </div>
                    </div>

                    {/* Fast Desk Actions */}
                    <div className="flex gap-2 shrink-0 items-center">
                      <button 
                        onClick={() => setPreviewMember(member)}
                        className="p-2 border border-stone-200 dark:border-white/10 dark:hover:border-white/25 rounded-lg text-[#003366] dark:text-brand-400 hover:text-white hover:bg-[#003366] dark:hover:bg-brand-500 transition-all cursor-pointer shadow-sm"
                        title="View & Download options"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => triggerExport(member, 'pdf')}
                        className="px-2.5 py-1.5 bg-[#003366]/10 text-[#003366] hover:bg-[#003366] hover:text-white dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500 dark:hover:text-stone-950 transition-all text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Quick Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                      <button 
                        onClick={() => handleDeleteRegistration(member.id)}
                        className="p-2 border border-rose-200 dark:border-rose-950/20 text-rose-600 hover:text-white hover:bg-rose-600 dark:text-rose-400 dark:hover:bg-rose-600 transition-all rounded-lg cursor-pointer shadow-sm shadow-rose-500/5 animate-none"
                        title="Delete registration card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* POPUP PREVIEW MODAL FOR A SELECTED MEMBER'S TEXT-ONLY CONDENSED CARD */}
      <AnimatePresence>
        {previewMember && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-stone-900 rounded-[28px] p-6 md:p-10 max-w-md w-full relative border border-stone-200 dark:border-white/10 shadow-[0_30px_70px_-15px_rgba(0,51,102,0.4)] text-center space-y-6"
            >
              <button 
                onClick={() => setPreviewMember(null)}
                className="absolute top-5 right-5 p-2 hover:bg-stone-100 dark:hover:bg-white/5 rounded-full text-stone-400 hover:text-stone-950 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 text-[9px] font-black tracking-widest uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" /> Credential Preview
                </div>
                <h3 className="text-xl md:text-2xl font-black uppercase text-stone-900 dark:text-white font-sans">Official Card</h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold leading-relaxed max-w-sm mx-auto">
                  Simple, image-free, Swiss-engineered print layout. Clean values display beautifully on any output device.
                </p>
              </div>

               {/* Landscape Card Rendering Node Holder */}
              <div className="bg-stone-100 dark:bg-stone-950 p-4 rounded-2xl border border-stone-100 dark:border-white/5 inline-block mx-auto relative group shadow-inner">
                
                <div 
                  id={`printable-card-${previewMember.id}`}
                  className="w-[350px] h-[220px] text-white p-[18px] rounded-2xl flex flex-col justify-between select-none relative overflow-hidden shadow-2xl"
                  style={{ 
                    fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                    background: "linear-gradient(135deg, #001a36 0%, #002d5c 100%)",
                    border: "3px solid #d4af37",
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.4)"
                  }}
                >
                  {/* Soft decorative background watermark cross */}
                  <div className="absolute right-[12px] bottom-[30px] text-[130px] font-light text-[#d4af37]/5 pointer-events-none select-none font-sans leading-none">
                    ✝
                  </div>

                  {/* Top Header Section */}
                  <div className="border-b border-[#d4af37]/30 pb-[6px] flex justify-between items-start text-left relative z-10">
                    <div>
                      <h3 className="text-[11px] font-black tracking-[0.14em] uppercase text-[#d4af37] leading-tight">ZETECH UNIVERSITY</h3>
                      <p className="text-[7.5px] font-extrabold text-white/95 uppercase tracking-[0.12em] leading-none mt-0.5">Catholic Action Fraternity (ZUCA)</p>
                    </div>
                    <div className="text-[7px] font-mono font-black border border-[#d4af37]/60 rounded px-[5px] py-[1.5px] uppercase tracking-wider leading-none text-[#d4af37] bg-white/5">
                      YEAR 2026/2027
                    </div>
                  </div>

                  {/* Grid values of absolute clarity */}
                  <div className="flex-1 flex items-stretch gap-3 py-[6px] text-left relative z-10">
                    {/* Member Info Fields */}
                    <div className="flex-1 flex flex-col justify-center space-y-1.5 py-[2px] min-w-0">
                      <div className="leading-none">
                        <span className="text-[6px] font-extrabold text-[#d4af37] uppercase tracking-[0.18em] block font-mono">MEMBER NAME</span>
                        <span className="text-[11px] font-black text-white uppercase tracking-tight truncate block max-w-[200px] mt-0.5">{previewMember.fullName}</span>
                      </div>
                      
                      <div className="leading-none">
                        <span className="text-[6px] font-extrabold text-[#d4af37] uppercase tracking-[0.18em] block font-mono">ADMISSION NO</span>
                        <span className="text-[10px] font-bold text-white uppercase font-mono tracking-wide mt-0.5 block">{previewMember.admissionNumber}</span>
                      </div>

                      <div className="leading-none">
                        <span className="text-[6px] font-extrabold text-[#d4af37] uppercase tracking-[0.18em] block font-mono">WHATSAPP & EMAIL</span>
                        <span className="text-[8px] font-bold text-white/80 font-mono truncate max-w-[200px] block mt-0.5">{previewMember.phoneNumber} • {previewMember.schoolEmail}</span>
                      </div>
                    </div>

                    {/* Photo & Seal Column */}
                    <div className="w-[68px] flex flex-col items-center justify-center shrink-0">
                      <div className="w-[56px] h-[56px] rounded-lg border border-[#d4af37]/40 bg-[#001021]/60 flex flex-col items-center justify-center relative overflow-hidden text-center backdrop-blur-sm shadow-inner">
                        {/* Subtle golden cross inside avatar placeholder */}
                        <span className="text-[20px] text-[#d4af37]/40 font-light leading-none">✝</span>
                        <span className="text-[5px] font-extrabold text-[#d4af37]/80 uppercase tracking-widest mt-1 font-mono">PILGRIM</span>
                        <div className="absolute inset-0 border border-white/5 rounded-lg pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Typographic Footer stamp style block */}
                  <div className="border-t border-[#d4af37]/30 pt-[6px] flex justify-between items-center text-[7px] font-mono font-bold leading-none text-left relative z-10">
                    <span className="uppercase text-white/50 tracking-wide">MEMBER ID: #{previewMember.id.slice(-8).toUpperCase()}</span>
                    <span className="text-emerald-400 font-extrabold tracking-widest uppercase flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" /> COVENANT MEMBER
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Buttons inside Modal */}
              <div className="flex flex-col gap-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => triggerExport(previewMember, 'pdf')}
                    className="bg-[#003366] hover:bg-[#002244] text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4 text-white" /> Download PDF
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => triggerExport(previewMember, 'png')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4 text-white" /> Save as PNG
                  </motion.button>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleDeleteRegistration(previewMember.id)}
                  className="w-full border-2 border-rose-500/30 hover:border-transparent text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all mt-1 bg-transparent"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Registration Card
                </motion.button>
                <button 
                  onClick={() => setPreviewMember(null)}
                  className="w-full py-2 hover:bg-stone-100 dark:hover:bg-white/5 transition-all text-[10px] text-stone-500 font-extrabold uppercase tracking-widest cursor-pointer mt-1"
                >
                  Back to Registration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
