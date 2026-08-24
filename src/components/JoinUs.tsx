import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, query, onSnapshot, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { OperationType, UserProfile } from '../types';
import { handleFirestoreError, compressImage } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
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
  Camera,
  Palette,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface RegisteredMember {
  id: string;
  fullName: string;
  admissionNumber: string;
  phoneNumber: string;
  schoolEmail: string;
  photoUrl?: string;
  cardTheme?: string;
  createdAt: any;
  joinDate?: string;
}

export const CARD_THEMES: Record<string, {
  name: string;
  colorHex: string;
  background: string;
  borderStyle: string;
  accentText: string;
  badgeStyle: string;
  sealColor: string;
  textColor: string;
  labelColor: string;
}> = {
  classic: {
    name: 'Sanctuary Navy',
    colorHex: '#003366',
    background: 'linear-gradient(135deg, #021222 0%, #003366 100%)',
    borderStyle: 'border-2 border-amber-500',
    accentText: 'text-amber-500',
    badgeStyle: 'bg-amber-500/10 text-amber-400 border-amber-500/30 font-bold',
    sealColor: 'text-amber-500/5',
    textColor: 'text-white',
    labelColor: 'text-amber-400'
  },
  emerald: {
    name: 'Divine Emerald',
    colorHex: '#0e3d28',
    background: 'linear-gradient(135deg, #04140a 0%, #0e3d28 100%)',
    borderStyle: 'border-2 border-emerald-400',
    accentText: 'text-emerald-400',
    badgeStyle: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/30 font-bold',
    sealColor: 'text-emerald-400/5',
    textColor: 'text-white',
    labelColor: 'text-emerald-400'
  },
  crimson: {
    name: 'Vatican Crimson',
    colorHex: '#4a000c',
    background: 'linear-gradient(135deg, #180003 0%, #4a000c 100%)',
    borderStyle: 'border-2 border-yellow-500',
    accentText: 'text-yellow-500',
    badgeStyle: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30 font-bold',
    sealColor: 'text-yellow-500/5',
    textColor: 'text-white',
    labelColor: 'text-yellow-400'
  },
  violet: {
    name: 'Royal Violet',
    colorHex: '#250247',
    background: 'linear-gradient(135deg, #0d011c 0%, #250247 100%)',
    borderStyle: 'border-2 border-amber-400',
    accentText: 'text-amber-400',
    badgeStyle: 'bg-amber-400/15 text-amber-300 border-amber-400/30 font-bold',
    sealColor: 'text-amber-400/5',
    textColor: 'text-white',
    labelColor: 'text-amber-300'
  },
  obsidian: {
    name: 'Midnight Steel',
    colorHex: '#1e2430',
    background: 'linear-gradient(135deg, #080a0e 0%, #1e2430 100%)',
    borderStyle: 'border-2 border-stone-400',
    accentText: 'text-stone-300',
    badgeStyle: 'bg-white/10 text-stone-200 border-white/20 font-bold',
    sealColor: 'text-white/5',
    textColor: 'text-white',
    labelColor: 'text-stone-300'
  },
  whitegold: {
    name: 'Angelic Ivory',
    colorHex: '#f0ece1',
    background: 'linear-gradient(135deg, #fbfaf5 0%, #ece9e0 100%)',
    borderStyle: 'border-2 border-stone-800',
    accentText: 'text-stone-800',
    badgeStyle: 'bg-stone-800/10 text-stone-800 border-stone-800/30 font-bold',
    sealColor: 'text-stone-800/5',
    textColor: 'text-stone-900',
    labelColor: 'text-stone-800 font-bold'
  }
};

interface JoinUsProps {
  currentUser?: UserProfile | null;
}

export default function JoinUs({ currentUser }: JoinUsProps) {
  const [formData, setFormData] = useState({
    fullName: currentUser?.displayName || '',
    admissionNumber: currentUser?.admissionNumber || '',
    phoneNumber: currentUser?.contactNumber || '',
    schoolEmail: currentUser?.email?.includes('@zuca.zetech.ac.ke') ? '' : (currentUser?.email || ''),
    photoUrl: currentUser?.photoURL || '',
    cardTheme: 'classic'
  });

  // Sync with currentUser when loaded or changed
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || currentUser.displayName || '',
        admissionNumber: prev.admissionNumber || currentUser.admissionNumber || '',
        phoneNumber: prev.phoneNumber || currentUser.contactNumber || '',
        schoolEmail: prev.schoolEmail || (currentUser.email?.includes('@zuca.zetech.ac.ke') ? '' : (currentUser.email || '')),
        photoUrl: prev.photoUrl || currentUser.photoURL || ''
      }));
    }
  }, [currentUser]);

  const [loading, setLoading] = useState(false);
  const [lastRegistered, setLastRegistered] = useState<RegisteredMember | null>(null);
  const [registrations, setRegistrations] = useState<RegisteredMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [exportingMember, setExportingMember] = useState<RegisteredMember | null>(null);
  const [showDirectory, setShowDirectory] = useState(false);

  // Real-time listener for registrations
  useEffect(() => {
    const q = query(collection(db, 'registrations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
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
          id: docSnap.id,
          fullName: data.fullName || '',
          admissionNumber: data.admissionNumber || '',
          phoneNumber: data.phoneNumber || '',
          schoolEmail: data.schoolEmail || '',
          photoUrl: data.photoUrl || '',
          cardTheme: data.cardTheme || 'classic',
          createdAt: rawDate,
          joinDate: displayDate
        } as RegisteredMember;
      });

      // Sort client-side descending by creation date
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setRegistrations(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'registrations');
    });

    return () => unsubscribe();
  }, []);

  const isNameValid = formData.fullName.trim().length >= 3;
  const isAdmissionValid = formData.admissionNumber.trim().length >= 3;
  const isPhoneValid = formData.phoneNumber.trim().length >= 6;
  const isEmailValid = !formData.schoolEmail || (formData.schoolEmail.includes('@') && formData.schoolEmail.includes('.'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid || !isAdmissionValid || !isPhoneValid) {
      setNotification({ type: 'error', message: 'Please fill all required student details.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setLoading(true);
    setNotification({ type: 'info', message: 'Saving enrollment and generating student card...' });

    try {
      const newRecord = {
        fullName: formData.fullName.trim(),
        admissionNumber: formData.admissionNumber.trim().toUpperCase(),
        phoneNumber: formData.phoneNumber.trim(),
        schoolEmail: formData.schoolEmail.trim() || `${formData.admissionNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}@student.zetech.ac.ke`,
        photoUrl: formData.photoUrl || '',
        cardTheme: formData.cardTheme || 'classic',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'registrations'), newRecord);

      const savedMember: RegisteredMember = {
        id: docRef.id,
        fullName: newRecord.fullName,
        admissionNumber: newRecord.admissionNumber,
        phoneNumber: newRecord.phoneNumber,
        schoolEmail: newRecord.schoolEmail,
        photoUrl: newRecord.photoUrl,
        cardTheme: newRecord.cardTheme,
        createdAt: new Date(),
        joinDate: 'Just Now'
      };

      setLastRegistered(savedMember);
      setNotification({ type: 'success', message: 'Enrollment successful! Card is ready.' });
      setTimeout(() => setNotification(null), 3500);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
      setNotification({ type: 'error', message: 'Enrollment failed. Please try again.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const triggerExport = async (member: { fullName: string; admissionNumber: string; phoneNumber: string; schoolEmail: string; photoUrl?: string; cardTheme?: string; id?: string }, format: 'pdf' | 'png' = 'pdf') => {
    try {
      setNotification({ type: 'info', message: `Generating printable ${format.toUpperCase()} card...` });
      
      const pseudoMember: RegisteredMember = {
        id: member.id || 'MEM-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        fullName: member.fullName,
        admissionNumber: member.admissionNumber,
        phoneNumber: member.phoneNumber,
        schoolEmail: member.schoolEmail,
        photoUrl: member.photoUrl,
        cardTheme: member.cardTheme || 'classic',
        createdAt: new Date()
      };

      setExportingMember(pseudoMember);
      await new Promise(resolve => setTimeout(resolve, 300));

      const element = document.getElementById('live-preview-card') || document.getElementById('export-card-node');
      if (!element) {
        throw new Error("Target card element was not found");
      }

      await document.fonts.ready;
      
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 3.5,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const imgData = canvas.toDataURL(mimeType, 1.0);
      const safeFileName = `ZUCA_CARD_${member.fullName.toUpperCase().trim().replace(/\s+/g, '_')}`;
      
      if (format === 'png') {
        const link = document.createElement('a');
        link.download = `${safeFileName}.png`;
        link.href = imgData;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setNotification({ type: 'success', message: 'Card downloaded as PNG Image!' });
      } else {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [85.6, 54]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54, undefined, 'FAST');
        pdf.save(`${safeFileName}.pdf`);
        setNotification({ type: 'success', message: 'Printable ID Card downloaded as PDF!' });
      }
      
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to generate card', err);
      window.print();
      setNotification({ type: 'error', message: 'Direct download issue. Browser print triggered as fallback.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setExportingMember(null);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this membership record?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'registrations', id));
      setNotification({ type: 'success', message: 'Record deleted.' });
      setTimeout(() => setNotification(null), 2500);
      if (lastRegistered && lastRegistered.id === id) {
        setLastRegistered(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `registrations/${id}`);
    }
  };

  const activeTheme = CARD_THEMES[formData.cardTheme] || CARD_THEMES.classic;

  const filteredRegistrations = registrations.filter(r => 
    r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 px-2 sm:px-4">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full border flex items-center gap-3 backdrop-blur-xl shadow-2xl min-w-[300px] justify-center ${
              notification.type === 'success' ? 'bg-emerald-600/95 border-emerald-400 text-white' :
              notification.type === 'error' ? 'bg-rose-600/95 border-rose-400 text-white' :
              'bg-blue-950/95 border-blue-500/40 text-white'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-white shrink-0" />}
            {notification.type === 'info' && <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />}
            <span className="text-xs font-semibold leading-none">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Off-screen dynamic capture node */}
      <div 
        className="fixed pointer-events-none z-[-50] overflow-hidden" 
        style={{ bottom: '-1000px', right: '-1000px', width: '350px', height: '220px' }}
        aria-hidden="true"
      >
        {exportingMember && (() => {
          const t = CARD_THEMES[exportingMember.cardTheme || 'classic'] || CARD_THEMES.classic;
          return (
            <div 
              id="export-card-node"
              className={`w-[350px] h-[220px] ${t.textColor} p-[18px] rounded-2xl flex flex-col justify-between select-none relative overflow-hidden`}
              style={{ 
                fontFamily: "system-ui, -apple-system, sans-serif",
                background: t.background,
                boxShadow: "inset 0 0 20px rgba(0,0,0,0.35)"
              }}
            >
              <div className={`absolute inset-0 rounded-2xl pointer-events-none ${t.borderStyle}`} />
              <div className={`absolute right-[12px] bottom-[28px] text-[130px] font-light ${t.sealColor} pointer-events-none select-none leading-none`}>
                ✝
              </div>

              <div className="border-b pb-[6px] flex justify-between items-start text-left relative z-10" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
                <div>
                  <h3 className={`text-[11px] font-extrabold tracking-wider uppercase ${t.labelColor} leading-tight`}>ZETECH UNIVERSITY</h3>
                  <p className="text-[7.5px] font-bold uppercase tracking-wider leading-none mt-0.5 opacity-90">Catholic Action Association (ZUCA)</p>
                </div>
                <div className={`text-[7px] font-mono font-bold border rounded px-[5px] py-[1.5px] uppercase tracking-wider leading-none ${t.badgeStyle}`}>
                  YEAR 2026/2027
                </div>
              </div>

              <div className="flex-1 flex items-stretch gap-3 py-[6px] text-left relative z-10">
                <div className="flex-1 flex flex-col justify-center space-y-1.5 py-[2px] min-w-0">
                  <div className="leading-none">
                    <span className={`text-[6.5px] font-bold uppercase tracking-wider block font-mono ${t.labelColor}`}>STUDENT NAME</span>
                    <span className="text-[11px] font-extrabold uppercase tracking-tight truncate block max-w-[200px] mt-0.5">{exportingMember.fullName || 'Student Name'}</span>
                  </div>
                  
                  <div className="leading-none">
                    <span className={`text-[6.5px] font-bold uppercase tracking-wider block font-mono ${t.labelColor}`}>ADMISSION NUMBER</span>
                    <span className="text-[10px] font-bold uppercase font-mono tracking-wide mt-0.5 block">{exportingMember.admissionNumber || 'ADMISSION NO'}</span>
                  </div>

                  <div className="leading-none">
                    <span className={`text-[6.5px] font-bold uppercase tracking-wider block font-mono ${t.labelColor}`}>CONTACT & EMAIL</span>
                    <span className="text-[8px] font-semibold font-mono truncate max-w-[200px] block mt-0.5 opacity-85">{exportingMember.phoneNumber || 'Phone'} • {exportingMember.schoolEmail || 'Email'}</span>
                  </div>
                </div>

                <div className="w-[68px] flex flex-col items-center justify-center shrink-0">
                  <div className="w-[56px] h-[56px] rounded-lg border bg-black/20 flex flex-col items-center justify-center relative overflow-hidden text-center backdrop-blur-sm shadow-inner" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
                    {exportingMember.photoUrl ? (
                      <img 
                        src={exportingMember.photoUrl} 
                        alt="Profile photo" 
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <>
                        <span className={`text-[22px] ${t.labelColor} font-light leading-none`}>✝</span>
                        <span className="text-[5.5px] font-bold opacity-80 uppercase tracking-wider mt-1 font-mono">MEMBER</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-[6px] flex justify-between items-center text-[7px] font-mono font-bold leading-none text-left relative z-10" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
                <span className="uppercase opacity-70 tracking-wide">ID: #{exportingMember.id.slice(-8).toUpperCase()}</span>
                <span className="text-emerald-400 font-bold tracking-wider uppercase flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" /> OFFICIAL MEMBER
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* SINGLE UNIFIED CARD OVERALL */}
      <div className="w-full bg-white dark:bg-stone-900 rounded-[28px] md:rounded-[36px] border border-stone-200/80 dark:border-white/10 shadow-xl overflow-hidden text-left">
        {/* Card Top Branding Header */}
        <div className="p-6 md:p-8 bg-[#002244] text-white border-b border-white/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sky-300 text-[10px] font-bold uppercase tracking-wider">
                <Church className="w-3.5 h-3.5 text-amber-400" />
                Zetech Catholic Action
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Student Enrollment & Membership Card
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 font-normal">
                Register as a Catholic student and generate your official ZUCA membership card.
              </p>
            </div>

            {currentUser && (
              <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-stone-200 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Logged In Profile</span>
                <span className="font-semibold">{currentUser.displayName || 'Member'}</span>
                {currentUser.contactNumber && (
                  <span className="block text-[11px] text-stone-300">{currentUser.contactNumber}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Card Body - Dual Responsive Pane */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Enrollment Form & Options */}
          <div className="lg:col-span-6 space-y-5">
            <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                Step 1: Student Details
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Details are automatically loaded if you signed up with your phone or email.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" /> Full Student Name *
                  </label>
                  {formData.fullName && (
                    <span className={`text-[10px] font-semibold ${isNameValid ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {isNameValid ? 'Validated' : 'Too Short'}
                    </span>
                  )}
                </div>
                <input
                  required
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2.5 rounded-xl text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold outline-none text-sm"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              {/* Admission Number */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" /> Admission Number *
                  </label>
                  {formData.admissionNumber && (
                    <span className={`text-[10px] font-semibold ${isAdmissionValid ? 'text-emerald-600' : 'text-stone-400'}`}>
                      {isAdmissionValid ? 'Validated' : 'Required'}
                    </span>
                  )}
                </div>
                <input
                  required
                  type="text"
                  placeholder="e.g. BBIT-01-1234/2026"
                  className="w-full px-4 py-2.5 rounded-xl text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono font-semibold outline-none text-sm"
                  value={formData.admissionNumber}
                  onChange={e => setFormData({ ...formData, admissionNumber: e.target.value.toUpperCase() })}
                />
              </div>

              {/* Phone & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" /> Phone Number *
                    </label>
                  </div>
                  <input
                    required
                    type="tel"
                    placeholder="e.g. 0712345678"
                    className="w-full px-4 py-2.5 rounded-xl text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold outline-none text-sm"
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" /> Student Email
                    </label>
                  </div>
                  <input
                    type="email"
                    placeholder="student@zetech.ac.ke"
                    className="w-full px-4 py-2.5 rounded-xl text-stone-900 dark:text-white bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold outline-none text-sm"
                    value={formData.schoolEmail}
                    onChange={e => setFormData({ ...formData, schoolEmail: e.target.value })}
                  />
                </div>
              </div>

              {/* Theme & Photo Customization */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" /> Choose Card Theme
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CARD_THEMES).map(([slug, t]) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, cardTheme: slug }))}
                      className={`p-2 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center gap-2 ${
                        formData.cardTheme === slug 
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-800 dark:text-sky-300 ring-1 ring-blue-600' 
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                      }`}
                    >
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 border border-black/10" 
                        style={{ backgroundColor: t.colorHex }} 
                      />
                      <span className="truncate text-[11px]">{t.name}</span>
                    </button>
                  ))}
                </div>

                {/* Passport Portrait Upload */}
                <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-stone-200 dark:bg-stone-800 flex items-center justify-center overflow-hidden shrink-0 border border-stone-300 dark:border-stone-700">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-stone-800 dark:text-stone-200 block">Portrait Photo</span>
                      <span className="text-stone-400 text-[10px]">Optional passport picture</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      id="card-photo-picker"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setNotification({ type: 'info', message: 'Optimizing portrait photo...' });
                            const compressed = await compressImage(file, 220, 220, 0.75);
                            setFormData(prev => ({ ...prev, photoUrl: compressed }));
                            setNotification({ type: 'success', message: 'Photo ready for card!' });
                            setTimeout(() => setNotification(null), 2000);
                          } catch (err) {
                            setNotification({ type: 'error', message: 'Photo upload error' });
                            setTimeout(() => setNotification(null), 3000);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('card-photo-picker')?.click()}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {formData.photoUrl ? 'Change' : 'Upload'}
                    </button>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-all"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit / Save Registration */}
              <button
                disabled={loading}
                type="submit"
                className="w-full py-3.5 bg-[#002244] hover:bg-[#003366] active:bg-[#001a33] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Enrollment...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Save Enrollment to Registry</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Interactive Card Preview & Instant Downloads */}
          <div className="lg:col-span-6 space-y-5 flex flex-col items-center">
            <div className="w-full border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  Step 2: Live ID Card Preview
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Live print-ready ID badge updates in real-time.
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview
              </div>
            </div>

            {/* LIVE CARD PREVIEW ELEMENT */}
            <div className="py-2 w-full flex justify-center">
              <div 
                id="live-preview-card"
                className={`w-[340px] sm:w-[350px] h-[220px] ${activeTheme.textColor} p-[18px] rounded-2xl flex flex-col justify-between select-none relative overflow-hidden shadow-2xl transition-all duration-300`}
                style={{ 
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  background: activeTheme.background,
                  boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)"
                }}
              >
                <div className={`absolute inset-0 rounded-2xl pointer-events-none ${activeTheme.borderStyle}`} />
                <div className={`absolute right-[12px] bottom-[28px] text-[130px] font-light ${activeTheme.sealColor} pointer-events-none select-none leading-none`}>
                  ✝
                </div>

                {/* Top Card Header */}
                <div className="border-b pb-[6px] flex justify-between items-start text-left relative z-10" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
                  <div>
                    <h3 className={`text-[11px] font-extrabold tracking-wider uppercase ${activeTheme.labelColor} leading-tight`}>ZETECH UNIVERSITY</h3>
                    <p className="text-[7.5px] font-bold uppercase tracking-wider leading-none mt-0.5 opacity-90">Catholic Action Association (ZUCA)</p>
                  </div>
                  <div className={`text-[7px] font-mono font-bold border rounded px-[5px] py-[1.5px] uppercase tracking-wider leading-none ${activeTheme.badgeStyle}`}>
                    YEAR 2026/2027
                  </div>
                </div>

                {/* Card Main Info */}
                <div className="flex-1 flex items-stretch gap-3 py-[6px] text-left relative z-10">
                  <div className="flex-1 flex flex-col justify-center space-y-1.5 py-[2px] min-w-0">
                    <div className="leading-none">
                      <span className={`text-[6.5px] font-bold uppercase tracking-wider block font-mono ${activeTheme.labelColor}`}>STUDENT NAME</span>
                      <span className="text-[11px] font-extrabold uppercase tracking-tight truncate block max-w-[190px] mt-0.5">
                        {formData.fullName.trim() || 'STUDENT FULL NAME'}
                      </span>
                    </div>
                    
                    <div className="leading-none">
                      <span className={`text-[6.5px] font-bold uppercase tracking-wider block font-mono ${activeTheme.labelColor}`}>ADMISSION NUMBER</span>
                      <span className="text-[10px] font-bold uppercase font-mono tracking-wide mt-0.5 block">
                        {formData.admissionNumber.trim() || 'BBIT-01-XXXX/2026'}
                      </span>
                    </div>

                    <div className="leading-none">
                      <span className={`text-[6.5px] font-bold uppercase tracking-wider block font-mono ${activeTheme.labelColor}`}>CONTACT & EMAIL</span>
                      <span className="text-[8px] font-semibold font-mono truncate max-w-[190px] block mt-0.5 opacity-85">
                        {formData.phoneNumber.trim() || '07XXXXXXXX'} • {formData.schoolEmail.trim() || 'student@zetech.ac.ke'}
                      </span>
                    </div>
                  </div>

                  {/* Photo Column */}
                  <div className="w-[68px] flex flex-col items-center justify-center shrink-0">
                    <div className="w-[56px] h-[56px] rounded-lg border bg-black/20 flex flex-col items-center justify-center relative overflow-hidden text-center backdrop-blur-sm shadow-inner" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
                      {formData.photoUrl ? (
                        <img 
                          src={formData.photoUrl} 
                          alt="Student Portrait" 
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <>
                          <span className={`text-[22px] ${activeTheme.labelColor} font-light leading-none`}>✝</span>
                          <span className="text-[5.5px] font-bold opacity-80 uppercase tracking-wider mt-1 font-mono">MEMBER</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t pt-[6px] flex justify-between items-center text-[7px] font-mono font-bold leading-none text-left relative z-10" style={{ borderColor: 'rgba(150,150,150,0.2)' }}>
                  <span className="uppercase opacity-70 tracking-wide">ID: #{formData.admissionNumber ? formData.admissionNumber.replace(/[^A-Z0-9]/g, '').slice(-6) : 'ZUCA2026'}</span>
                  <span className="text-emerald-400 font-bold tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" /> OFFICIAL MEMBER
                  </span>
                </div>
              </div>
            </div>

            {/* Instant Download Action Buttons */}
            <div className="w-full space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => triggerExport({
                    fullName: formData.fullName || 'Student',
                    admissionNumber: formData.admissionNumber || 'ZUCA',
                    phoneNumber: formData.phoneNumber || '',
                    schoolEmail: formData.schoolEmail || '',
                    photoUrl: formData.photoUrl,
                    cardTheme: formData.cardTheme
                  }, 'pdf')}
                  className="py-3 bg-[#002244] hover:bg-[#003366] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerExport({
                    fullName: formData.fullName || 'Student',
                    admissionNumber: formData.admissionNumber || 'ZUCA',
                    phoneNumber: formData.phoneNumber || '',
                    schoolEmail: formData.schoolEmail || '',
                    photoUrl: formData.photoUrl,
                    cardTheme: formData.cardTheme
                  }, 'png')}
                  className="py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Save PNG Image</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-stone-400">
                Standard ISO ID-1 card dimensions (85.6mm × 54mm) ready for mobile wallet or print.
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible Enrolled Students Directory Footer inside the same card */}
        <div className="border-t border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/40 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-sky-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  Enrolled Students Directory
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {registrations.length} registered members in Catholic Action
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDirectory(!showDirectory)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{showDirectory ? 'Hide Directory' : 'View Registered Students'}</span>
              {showDirectory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Directory Content */}
          <AnimatePresence>
            {showDirectory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 space-y-4 overflow-hidden pt-4 border-t border-stone-200/60 dark:border-stone-800"
              >
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by student name, admission number, or phone..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-white outline-none focus:border-blue-600"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {filteredRegistrations.length === 0 ? (
                    <div className="text-center py-8 text-xs text-stone-400 font-medium">
                      No student records found matching "{searchQuery}".
                    </div>
                  ) : (
                    filteredRegistrations.map((member) => (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-stone-900 dark:text-white block truncate">
                            {member.fullName}
                          </span>
                          <span className="text-stone-400 font-mono text-[11px]">
                            {member.admissionNumber} • {member.phoneNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => triggerExport(member, 'pdf')}
                            className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-400 hover:bg-blue-600 hover:text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                            title="Download PDF Card"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRegistration(member.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
