import React, { useState, useEffect } from 'react';
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
  Church, 
  AlertCircle, 
  Loader2, 
  Users,
  Search,
  Trash2,
  X,
  Camera,
  ChevronDown,
  ChevronUp,
  Award,
  Image as ImageIcon
} from 'lucide-react';
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

// Single official ZUCA Credential Theme definition
export const OFFICIAL_CARD_STYLE = {
  name: 'Official Sanctuary Navy',
  colorHex: '#002244',
  background: 'linear-gradient(135deg, #011222 0%, #002244 50%, #003366 100%)',
  borderStyle: 'border-2 border-amber-500',
  accentText: 'text-amber-400',
  badgeStyle: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold',
  sealColor: 'text-amber-500/5',
  textColor: 'text-white',
  labelColor: 'text-amber-400'
};

/**
 * Pixel-perfect standalone Canvas renderer for Official ZUCA Membership Card.
 * Renders ONLY the isolated ID card in 300 DPI ID-1 standard dimensions (1028 x 648 px).
 */
async function generateOfficialCardCanvas(member: {
  fullName: string;
  admissionNumber: string;
  phoneNumber: string;
  schoolEmail?: string;
  photoUrl?: string;
  id?: string;
}): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const width = 1028;
  const height = 648;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not initialize 2D canvas context");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const radius = 32;

  // 1. Card Rounded Boundary Clip
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(width - radius, 0);
  ctx.quadraticCurveTo(width, 0, width, radius);
  ctx.lineTo(width, height - radius);
  ctx.quadraticCurveTo(width, height, width - radius, height);
  ctx.lineTo(radius, height);
  ctx.quadraticCurveTo(0, height, 0, height - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.clip();

  // 2. Official Sanctuary Navy Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#011222');
  bgGrad.addColorStop(0.45, '#002244');
  bgGrad.addColorStop(1, '#003366');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle luminous aura
  const radialGlow = ctx.createRadialGradient(width * 0.35, height * 0.25, 10, width * 0.35, height * 0.25, 420);
  radialGlow.addColorStop(0, 'rgba(59, 130, 246, 0.14)');
  radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, width, height);

  // 3. Watermark Holy Cross (✝) in soft golden opacity
  ctx.save();
  ctx.fillStyle = 'rgba(251, 191, 36, 0.05)';
  ctx.font = '330px "Times New Roman", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✝', width - 170, height / 2 + 25);
  ctx.restore();

  // 4. Gold Outer and Inner Dual Borders
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  const innerMargin = 12;
  const innerRadius = radius - 4;
  ctx.moveTo(innerMargin + innerRadius, innerMargin);
  ctx.lineTo(width - innerMargin - innerRadius, innerMargin);
  ctx.quadraticCurveTo(width - innerMargin, innerMargin, width - innerMargin, innerMargin + innerRadius);
  ctx.lineTo(width - innerMargin, height - innerMargin - innerRadius);
  ctx.quadraticCurveTo(width - innerMargin, height - innerMargin, width - innerMargin - innerRadius, height - innerMargin);
  ctx.lineTo(innerMargin + innerRadius, height - innerMargin);
  ctx.quadraticCurveTo(innerMargin, height - innerMargin, innerMargin, height - innerMargin - innerRadius);
  ctx.lineTo(innerMargin, innerMargin + innerRadius);
  ctx.quadraticCurveTo(innerMargin, innerMargin, innerMargin + innerRadius, innerMargin);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // 5. Header Section
  const padX = 52;
  const topY = 46;

  // Title: ZETECH UNIVERSITY
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 30px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('ZETECH UNIVERSITY', padX, topY);

  // Subtitle: Catholic Action Association (ZUCA)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 19px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('CATHOLIC ACTION ASSOCIATION (ZUCA)', padX, topY + 36);

  // Badge: ACADEMIC YEAR 2026/2027 (Top Right)
  const badgeWidth = 220;
  const badgeHeight = 36;
  const badgeX = width - padX - badgeWidth;
  const badgeY = topY + 6;
  
  ctx.save();
  ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 8);
  } else {
    ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YEAR 2026/2027', badgeX + badgeWidth / 2, badgeY + badgeHeight / 2);
  ctx.restore();

  // Header Divider Line
  const divider1Y = topY + 76;
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, divider1Y);
  ctx.lineTo(width - padX, divider1Y);
  ctx.stroke();

  // 6. Member Photo Frame (Right side)
  const photoSize = 175;
  const photoX = width - padX - photoSize;
  const photoY = divider1Y + 30;

  ctx.save();
  ctx.beginPath();
  const photoRadius = 18;
  if (ctx.roundRect) {
    ctx.roundRect(photoX, photoY, photoSize, photoSize, photoRadius);
  } else {
    ctx.rect(photoX, photoY, photoSize, photoSize);
  }
  ctx.fillStyle = '#021629';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.clip();

  let photoLoaded = false;
  if (member.photoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve) => {
        img.onload = () => {
          try {
            const aspect = img.width / img.height;
            let drawW = photoSize;
            let drawH = photoSize;
            let offsetX = photoX;
            let offsetY = photoY;

            if (aspect > 1) {
              drawW = photoSize * aspect;
              offsetX = photoX - (drawW - photoSize) / 2;
            } else {
              drawH = photoSize / aspect;
              offsetY = photoY - (drawH - photoSize) / 2;
            }
            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
            photoLoaded = true;
          } catch {
            // fallback
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = member.photoUrl!;
      });
    } catch {
      // ignore and use placeholder
    }
  }

  if (!photoLoaded) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = '64px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✝', photoX + photoSize / 2, photoY + photoSize / 2 - 12);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('MEMBER', photoX + photoSize / 2, photoY + photoSize / 2 + 38);
  }
  ctx.restore();

  // 7. Member Information Details (Left Column)
  const contentStartY = divider1Y + 32;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Field 1: STUDENT NAME
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('STUDENT NAME', padX, contentStartY);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  const displayName = (member.fullName || 'STUDENT FULL NAME').toUpperCase();
  let truncatedName = displayName;
  const maxNameWidth = photoX - padX - 30;
  if (ctx.measureText(truncatedName).width > maxNameWidth) {
    while (truncatedName.length > 3 && ctx.measureText(truncatedName + '...').width > maxNameWidth) {
      truncatedName = truncatedName.slice(0, -1);
    }
    truncatedName += '...';
  }
  ctx.fillText(truncatedName, padX, contentStartY + 24);

  // Field 2: ADMISSION NUMBER
  const admY = contentStartY + 76;
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('ADMISSION NUMBER', padX, admY);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px monospace';
  ctx.fillText((member.admissionNumber || 'BBIT-01-XXXX/2026').toUpperCase(), padX, admY + 22);

  // Field 3: CONTACT & EMAIL
  const contactY = admY + 66;
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('CONTACT & EMAIL', padX, contactY);

  ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
  ctx.font = 'bold 18px monospace';
  const contactText = `${member.phoneNumber || '07XXXXXXXX'} • ${member.schoolEmail || 'student@zetech.ac.ke'}`;
  let truncatedContact = contactText;
  if (ctx.measureText(truncatedContact).width > maxNameWidth) {
    while (truncatedContact.length > 3 && ctx.measureText(truncatedContact + '...').width > maxNameWidth) {
      truncatedContact = truncatedContact.slice(0, -1);
    }
    truncatedContact += '...';
  }
  ctx.fillText(truncatedContact, padX, contactY + 20);

  // 8. Footer Section
  const footerDividerY = height - 88;
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, footerDividerY);
  ctx.lineTo(width - padX, footerDividerY);
  ctx.stroke();

  const footerY = footerDividerY + 24;
  
  // Footer Left: ID Serial
  const cleanId = member.admissionNumber ? member.admissionNumber.replace(/[^A-Z0-9]/g, '').slice(-8) : 'ZUCA2026';
  ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`ID: #ZUCA-${cleanId}`, padX, footerY);

  // Footer Right: OFFICIAL REGISTERED MEMBER
  ctx.textAlign = 'right';
  const rightX = width - padX;
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(rightX - 250, footerY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('OFFICIAL REGISTERED MEMBER', rightX, footerY);

  ctx.restore();
  return canvas;
}

interface JoinUsProps {
  currentUser?: UserProfile | null;
}

export default function JoinUs({ currentUser }: JoinUsProps) {
  const [formData, setFormData] = useState({
    fullName: currentUser?.displayName || '',
    admissionNumber: currentUser?.admissionNumber || '',
    phoneNumber: currentUser?.contactNumber || '',
    schoolEmail: currentUser?.email?.includes('@zuca.zetech.ac.ke') ? '' : (currentUser?.email || ''),
    photoUrl: currentUser?.photoURL || ''
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
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'png' | null>(null);
  const [registrations, setRegistrations] = useState<RegisteredMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
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
          createdAt: rawDate,
          joinDate: displayDate
        } as RegisteredMember;
      });

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
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'registrations'), newRecord);

      setNotification({ type: 'success', message: 'Enrollment successful! Official card generated below.' });
      setTimeout(() => setNotification(null), 3500);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'registrations');
      setNotification({ type: 'error', message: 'Enrollment failed. Please try again.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Downloads ONLY the isolated ID Card (never the whole page).
   */
  const triggerExport = async (member: { 
    fullName: string; 
    admissionNumber: string; 
    phoneNumber: string; 
    schoolEmail?: string; 
    photoUrl?: string; 
    id?: string 
  }, format: 'pdf' | 'png' = 'pdf') => {
    try {
      setDownloadingFormat(format);
      setNotification({ type: 'info', message: `Generating isolated ${format.toUpperCase()} card...` });

      // Generate pristine standalone canvas
      const canvas = await generateOfficialCardCanvas({
        fullName: member.fullName || formData.fullName || 'Student Name',
        admissionNumber: member.admissionNumber || formData.admissionNumber || 'BBIT-01-XXXX/2026',
        phoneNumber: member.phoneNumber || formData.phoneNumber || '07XXXXXXXX',
        schoolEmail: member.schoolEmail || formData.schoolEmail || 'student@zetech.ac.ke',
        photoUrl: member.photoUrl || formData.photoUrl,
        id: member.id
      });

      const safeFileName = `ZUCA_MEMBERSHIP_CARD_${(member.fullName || 'STUDENT').toUpperCase().trim().replace(/[^A-Z0-9]/g, '_')}`;

      if (format === 'png') {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `${safeFileName}.png`;
        link.href = imgData;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setNotification({ type: 'success', message: 'ID Card image downloaded (PNG)!' });
      } else {
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [85.6, 54] // Standard ISO ID-1 dimensions
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54, undefined, 'FAST');
        pdf.save(`${safeFileName}.pdf`);
        setNotification({ type: 'success', message: 'Print-ready ID Card downloaded (PDF)!' });
      }
      
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error('Failed to generate card:', err);
      setNotification({ type: 'error', message: 'Could not generate card. Please try again.' });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setDownloadingFormat(null);
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
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `registrations/${id}`);
    }
  };

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

              {/* Passport Portrait Upload */}
              <div className="pt-2 space-y-2">
                <div className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-stone-200 dark:bg-stone-800 flex items-center justify-center overflow-hidden shrink-0 border border-stone-300 dark:border-stone-700">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                    <div className="text-xs">
                      <span className="font-bold text-stone-800 dark:text-stone-200 block">Portrait Photo</span>
                      <span className="text-stone-400 text-[10px]">Passport image for official card</span>
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
                          } catch {
                            setNotification({ type: 'error', message: 'Photo upload error' });
                            setTimeout(() => setNotification(null), 3000);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('card-photo-picker')?.click()}
                      className="px-3 py-1.5 bg-[#002244] hover:bg-[#003366] text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      {formData.photoUrl ? 'Change' : 'Upload'}
                    </button>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        className="p-1.5 text-stone-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Single Official Card Designation Badge */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-sky-300 font-medium">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Standard ZUCA Sanctuary Navy & Gold ID format with 2026 verification seal.</span>
                </div>
              </div>

              {/* Submit / Save Registration */}
              <button
                disabled={loading}
                type="submit"
                className="w-full py-3.5 bg-[#002244] hover:bg-[#003366] active:bg-[#001a33] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
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

          {/* Right Column: Live Interactive Card Preview & Instant Card Download */}
          <div className="lg:col-span-6 space-y-5 flex flex-col items-center">
            <div className="w-full border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                  Step 2: Official ID Card Preview
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Single official university layout ready for instant download.
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Preview
              </div>
            </div>

            {/* LIVE CARD PREVIEW ELEMENT - Official Single Style */}
            <div className="py-2 w-full flex justify-center">
              <div 
                id="live-preview-card"
                className="w-[340px] sm:w-[350px] h-[220px] text-white p-[18px] rounded-2xl flex flex-col justify-between select-none relative overflow-hidden shadow-2xl transition-all duration-300"
                style={{ 
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  background: OFFICIAL_CARD_STYLE.background,
                  boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)"
                }}
              >
                <div className={`absolute inset-0 rounded-2xl pointer-events-none ${OFFICIAL_CARD_STYLE.borderStyle}`} />
                <div className="absolute right-[12px] bottom-[28px] text-[130px] font-light text-amber-500/5 pointer-events-none select-none leading-none">
                  ✝
                </div>

                {/* Top Card Header */}
                <div className="border-b pb-[6px] flex justify-between items-start text-left relative z-10" style={{ borderColor: 'rgba(251,191,36,0.25)' }}>
                  <div>
                    <h3 className="text-[11px] font-extrabold tracking-wider uppercase text-amber-400 leading-tight">
                      ZETECH UNIVERSITY
                    </h3>
                    <p className="text-[7.5px] font-bold uppercase tracking-wider leading-none mt-0.5 opacity-90 text-white">
                      Catholic Action Association (ZUCA)
                    </p>
                  </div>
                  <div className="text-[7px] font-mono font-bold border rounded px-[5px] py-[1.5px] uppercase tracking-wider leading-none bg-amber-500/15 text-amber-300 border-amber-500/30">
                    YEAR 2026/2027
                  </div>
                </div>

                {/* Card Main Info */}
                <div className="flex-1 flex items-stretch gap-3 py-[6px] text-left relative z-10">
                  <div className="flex-1 flex flex-col justify-center space-y-1.5 py-[2px] min-w-0">
                    <div className="leading-none">
                      <span className="text-[6.5px] font-bold uppercase tracking-wider block font-mono text-amber-400">
                        STUDENT NAME
                      </span>
                      <span className="text-[11px] font-extrabold uppercase tracking-tight truncate block max-w-[190px] mt-0.5 text-white">
                        {formData.fullName.trim() || 'STUDENT FULL NAME'}
                      </span>
                    </div>
                    
                    <div className="leading-none">
                      <span className="text-[6.5px] font-bold uppercase tracking-wider block font-mono text-amber-400">
                        ADMISSION NUMBER
                      </span>
                      <span className="text-[10px] font-bold uppercase font-mono tracking-wide mt-0.5 block text-white">
                        {formData.admissionNumber.trim() || 'BBIT-01-XXXX/2026'}
                      </span>
                    </div>

                    <div className="leading-none">
                      <span className="text-[6.5px] font-bold uppercase tracking-wider block font-mono text-amber-400">
                        CONTACT & EMAIL
                      </span>
                      <span className="text-[8px] font-semibold font-mono truncate max-w-[190px] block mt-0.5 opacity-85 text-slate-200">
                        {formData.phoneNumber.trim() || '07XXXXXXXX'} • {formData.schoolEmail.trim() || 'student@zetech.ac.ke'}
                      </span>
                    </div>
                  </div>

                  {/* Photo Column */}
                  <div className="w-[68px] flex flex-col items-center justify-center shrink-0">
                    <div className="w-[56px] h-[56px] rounded-lg border border-amber-500/40 bg-black/30 flex flex-col items-center justify-center relative overflow-hidden text-center backdrop-blur-sm shadow-inner">
                      {formData.photoUrl ? (
                        <img 
                          src={formData.photoUrl} 
                          alt="Student Portrait" 
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <>
                          <span className="text-[22px] text-amber-400 font-light leading-none">✝</span>
                          <span className="text-[5.5px] font-bold opacity-80 uppercase tracking-wider mt-1 font-mono text-white">MEMBER</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t pt-[6px] flex justify-between items-center text-[7px] font-mono font-bold leading-none text-left relative z-10" style={{ borderColor: 'rgba(251,191,36,0.25)' }}>
                  <span className="uppercase opacity-70 tracking-wide text-slate-300">
                    ID: #{formData.admissionNumber ? formData.admissionNumber.replace(/[^A-Z0-9]/g, '').slice(-6) : 'ZUCA2026'}
                  </span>
                  <span className="text-emerald-400 font-bold tracking-wider uppercase flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" /> OFFICIAL MEMBER
                  </span>
                </div>
              </div>
            </div>

            {/* Isolated Card Download Actions (Strictly downloads the ID card only) */}
            <div className="w-full space-y-2.5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={downloadingFormat !== null}
                  onClick={() => triggerExport(formData, 'pdf')}
                  className="py-3 bg-[#002244] hover:bg-[#003366] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-70"
                >
                  {downloadingFormat === 'pdf' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-current" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download PDF Card</span>
                </button>

                <button
                  type="button"
                  disabled={downloadingFormat !== null}
                  onClick={() => triggerExport(formData, 'png')}
                  className="py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-70"
                >
                  {downloadingFormat === 'png' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-current" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  <span>Save PNG Image</span>
                </button>
              </div>

              <p className="text-[11px] text-center text-stone-400 dark:text-stone-500">
                Downloads the high-resolution ID card only (standard 85.6mm × 54mm ISO ID-1 dimensions).
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible Enrolled Students Directory Footer */}
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
                            title="Download PDF Card Only"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerExport(member, 'png')}
                            className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
                            title="Download PNG Card Only"
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> PNG
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
