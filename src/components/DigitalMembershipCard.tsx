import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  CreditCard, 
  QrCode, 
  User, 
  GraduationCap, 
  Phone, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  RotateCw, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Church, 
  Award, 
  FileText, 
  Eye,
  X
} from 'lucide-react';
import { UserProfile } from '../types';
import { compressImage } from '../utils';

interface DigitalMembershipCardProps {
  currentUser?: UserProfile | null;
  onSaveProfile?: (updatedData: { displayName: string; admissionNumber: string; contactNumber: string; photoURL: string }) => Promise<void>;
  embedded?: boolean;
}

export default function DigitalMembershipCard({ currentUser, onSaveProfile, embedded = false }: DigitalMembershipCardProps) {
  // Member Card Form State
  const [fullName, setFullName] = useState(currentUser?.displayName || 'Kevin Wachira');
  const [admissionNumber, setAdmissionNumber] = useState(currentUser?.admissionNumber || 'BBIT-01-9876/2026');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.contactNumber || currentUser?.phone || '0712 345 678');
  const [faculty, setFaculty] = useState('Faculty of Information & Computing');
  const [campus, setCampus] = useState('Technology Park Mangu Campus');
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photoURL || '');
  
  // Card Display State
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<'png' | 'pdf' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Reference strictly to the ID card element for html2canvas capture
  const cardRef = useRef<HTMLDivElement>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.displayName) setFullName(currentUser.displayName);
      if (currentUser.admissionNumber) setAdmissionNumber(currentUser.admissionNumber);
      if (currentUser.contactNumber || currentUser.phone) setPhoneNumber(currentUser.contactNumber || currentUser.phone || '');
      if (currentUser.photoURL) setPhotoUrl(currentUser.photoURL);
    }
  }, [currentUser]);

  // Clean formatted member ID
  const cleanId = admissionNumber 
    ? admissionNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-7)
    : '2026001';
  const memberSerial = `ZUCA-${cleanId}`;

  // Generate QR Code data payload
  const qrVerificationPayload = JSON.stringify({
    institution: "Zetech University",
    association: "Catholic Action Association (ZUCA)",
    memberSerial: memberSerial,
    fullName: fullName.trim() || "Student Member",
    admissionNumber: admissionNumber.trim().toUpperCase() || "BBIT-01-XXXX/2026",
    status: "VERIFIED ACTIVE MEMBER",
    academicYear: "2026/2027",
    verifiedAt: new Date().toISOString().split('T')[0],
    chaplaincyContact: "chaplaincy@zetech.ac.ke"
  }, null, 2);

  // Generate QR Code as high-contrast DataURL whenever details change
  useEffect(() => {
    let isSubscribed = true;
    setIsGeneratingQr(true);

    QRCode.toDataURL(qrVerificationPayload, {
      errorCorrectionLevel: 'M',
      width: 320,
      margin: 1,
      color: {
        dark: '#002244',
        light: '#FFFFFF'
      }
    })
      .then((url) => {
        if (isSubscribed) {
          setQrDataUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch((err) => {
        console.error("Error generating QR code:", err);
        if (isSubscribed) setIsGeneratingQr(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [fullName, admissionNumber, memberSerial, qrVerificationPayload]);

  /**
   * Capture strictly the digital ID card element using html2canvas and download as PNG
   */
  const handleDownloadImage = async () => {
    if (!cardRef.current) {
      showToast('error', 'Card element reference not found.');
      return;
    }

    try {
      setDownloading('png');
      showToast('info', 'Capturing high-resolution ID card image...');

      // Render solely the card container with scale 3 for crisp 300 DPI retina quality
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure cloned card is fully visible without transform quirks
          const clonedCard = clonedDoc.querySelector('#zuca-digital-id-card');
          if (clonedCard) {
            (clonedCard as HTMLElement).style.transform = 'none';
            (clonedCard as HTMLElement).style.boxShadow = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const safeAdm = (admissionNumber || 'STUDENT').replace(/[^A-Z0-9]/gi, '_');
      const filename = `ZUCA_ID_CARD_${safeAdm}_${cardSide.toUpperCase()}.png`;

      // Trigger direct browser download
      const downloadLink = document.createElement('a');
      downloadLink.href = imgData;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast('success', `ID Card (${cardSide.toUpperCase()}) saved as PNG image!`);
    } catch (err: any) {
      console.error('Failed to capture card with html2canvas:', err);
      showToast('error', 'Image capture failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  /**
   * Capture strictly the ID card and export as print-ready ISO ID-1 PDF (85.6mm × 54mm)
   */
  const handleDownloadPdf = async () => {
    if (!cardRef.current) {
      showToast('error', 'Card element reference not found.');
      return;
    }

    try {
      setDownloading('pdf');
      showToast('info', 'Compiling print-ready PDF card...');

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.querySelector('#zuca-digital-id-card');
          if (clonedCard) {
            (clonedCard as HTMLElement).style.transform = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 54] // Standard ISO ID-1 card dimensions
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 54, undefined, 'FAST');
      const safeAdm = (admissionNumber || 'STUDENT').replace(/[^A-Z0-9]/gi, '_');
      pdf.save(`ZUCA_ID_CARD_${safeAdm}_${cardSide.toUpperCase()}.pdf`);

      showToast('success', 'Print-ready PDF card downloaded!');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('error', 'PDF creation failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3800);
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrVerificationPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
    showToast('success', 'Digital verification payload copied!');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('info', 'Processing portrait photo...');
      const compressed = await compressImage(file, 260, 260, 0.8);
      setPhotoUrl(compressed);
      showToast('success', 'Portrait updated on your card!');
    } catch {
      showToast('error', 'Could not process selected image.');
    }
  };

  const handleSaveToProfile = async () => {
    if (!onSaveProfile) return;
    setIsSavingProfile(true);
    try {
      await onSaveProfile({
        displayName: fullName.trim(),
        admissionNumber: admissionNumber.trim().toUpperCase(),
        contactNumber: phoneNumber.trim(),
        photoURL: photoUrl
      });
      showToast('success', 'Card details saved to your sanctuary profile!');
    } catch {
      showToast('error', 'Could not update profile in database.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className={`w-full max-w-5xl mx-auto ${embedded ? 'p-0' : 'p-3 sm:p-6'} space-y-8 font-sans`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl border flex items-center gap-3 backdrop-blur-xl shadow-2xl min-w-[280px] max-w-md justify-center ${
              notification.type === 'success' ? 'bg-emerald-600/95 border-emerald-400 text-white' :
              notification.type === 'error' ? 'bg-rose-600/95 border-rose-400 text-white' :
              'bg-[#002244]/95 border-amber-500/40 text-white'
            }`}
          >
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />}
            {notification.type === 'info' && <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />}
            <span className="text-xs font-semibold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <div className="bg-[#002244] text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden text-left">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              Digital ID Card Generator
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Official Digital Membership Card
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 max-w-xl font-normal leading-relaxed">
              Real-time verified credential with embedded QR verification, personal photo, and instant HTML2Canvas image capture.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs text-stone-200 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="text-[10px] text-amber-400 block uppercase font-mono font-bold leading-none">Status</span>
                <span className="font-semibold text-white">Active Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Two-Column Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Live ID Card Preview & Download Controls */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-6">
          <div className="w-full flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Card Visual Preview ({cardSide.toUpperCase()} SIDE)</span>
            </div>

            {/* Toggle Card Front / Back */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 text-xs">
              <button
                type="button"
                onClick={() => setCardSide('front')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  cardSide === 'front' 
                    ? 'bg-[#002244] text-white shadow-sm' 
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Front View
              </button>
              <button
                type="button"
                onClick={() => setCardSide('back')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  cardSide === 'back' 
                    ? 'bg-[#002244] text-white shadow-sm' 
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                Back View
              </button>
            </div>
          </div>

          {/* CARD CONTAINER TO CAPTURE - Exactly this node is passed to html2canvas */}
          <div className="w-full flex justify-center py-2 overflow-x-auto">
            <div
              ref={cardRef}
              id="zuca-digital-id-card"
              className="relative w-[380px] sm:w-[410px] h-[245px] sm:h-[255px] rounded-[24px] text-white select-none overflow-hidden shrink-0 flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, #011222 0%, #002244 48%, #003366 100%)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(251, 191, 36, 0.35)',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                padding: '18px 20px'
              }}
            >
              {/* Dual Golden Border Accent */}
              <div 
                className="absolute inset-[3px] rounded-[21px] pointer-events-none"
                style={{
                  border: '1.5px solid rgba(251, 191, 36, 0.4)'
                }}
              />

              {/* Watermark Holy Cross (✝) */}
              <div 
                className="absolute right-[22px] top-1/2 -translate-y-1/2 text-[145px] text-amber-400/[0.045] pointer-events-none select-none font-serif leading-none"
              >
                ✝
              </div>

              {cardSide === 'front' ? (
                /* ================= FRONT SIDE ================= */
                <>
                  {/* Card Header */}
                  <div 
                    className="flex items-start justify-between pb-2.5 relative z-10"
                    style={{ borderBottom: '1px solid rgba(251, 191, 36, 0.25)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-serif text-sm font-bold shrink-0">
                        ✝
                      </div>
                      <div className="text-left">
                        <h2 className="text-[11px] sm:text-[12px] font-extrabold uppercase tracking-widest text-amber-400 leading-tight">
                          ZETECH UNIVERSITY
                        </h2>
                        <p className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wider text-white/90 leading-none mt-0.5">
                          Catholic Action Association (ZUCA)
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-block px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/35 text-[7px] sm:text-[7.5px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                        AY 2026/2027
                      </div>
                      <span className="block text-[6px] text-sky-300/80 font-mono tracking-wider mt-0.5">
                        OFFICIAL PASS
                      </span>
                    </div>
                  </div>

                  {/* Card Center Body: Photo + Student Details + QR Code */}
                  <div className="flex items-center gap-3 py-1.5 relative z-10 text-left">
                    {/* 1. Student Portrait Photo Frame */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div 
                        className="w-[66px] h-[74px] sm:w-[72px] sm:h-[82px] rounded-xl overflow-hidden bg-slate-900/90 relative flex items-center justify-center shadow-inner"
                        style={{ border: '2px solid rgba(251, 191, 36, 0.65)' }}
                      >
                        {photoUrl ? (
                          <img 
                            src={photoUrl} 
                            alt={fullName} 
                            className="w-full h-full object-cover object-center"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-1 text-center">
                            <span className="text-2xl text-amber-400 font-serif">✝</span>
                            <span className="text-[6.5px] font-mono font-bold text-stone-300 uppercase mt-0.5 tracking-wider">MEMBER</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[6.5px] font-mono font-bold text-amber-300/90 tracking-widest mt-1 uppercase">
                        STUDENT
                      </span>
                    </div>

                    {/* 2. Primary Information Block */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div>
                        <span className="text-[6.5px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                          STUDENT NAME
                        </span>
                        <h3 className="text-[12px] sm:text-[13px] font-extrabold text-white uppercase tracking-tight truncate leading-tight">
                          {fullName.trim() || 'STUDENT FULL NAME'}
                        </h3>
                      </div>

                      <div>
                        <span className="text-[6.5px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                          ADMISSION NUMBER
                        </span>
                        <p className="text-[10px] sm:text-[11px] font-mono font-bold text-white tracking-wider truncate">
                          {admissionNumber.trim().toUpperCase() || 'BBIT-01-XXXX/2026'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[6px] font-mono font-semibold uppercase tracking-wider text-stone-300/80 block">
                          CAMPUS & CONTACT
                        </span>
                        <p className="text-[7.5px] sm:text-[8px] font-medium text-stone-200 truncate font-mono">
                          {campus.replace(' Campus', '')} • {phoneNumber || '07XXXXXXXX'}
                        </p>
                      </div>
                    </div>

                    {/* 3. The Digital Verification QR Code */}
                    <div className="shrink-0 flex flex-col items-center pl-1">
                      <div 
                        className="w-[66px] h-[66px] sm:w-[72px] sm:h-[72px] p-1 bg-white rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden"
                        style={{ border: '2px solid rgba(251, 191, 36, 0.7)' }}
                      >
                        {qrDataUrl ? (
                          <img 
                            src={qrDataUrl} 
                            alt="Verification QR Code" 
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Loader2 className="w-5 h-5 text-blue-900 animate-spin" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[6.5px] font-mono font-bold text-amber-300">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                        <span>SCAN TO VERIFY</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Footer Bar */}
                  <div 
                    className="flex items-center justify-between pt-2 relative z-10 text-[7.5px] sm:text-[8px] font-mono font-bold"
                    style={{ borderTop: '1px solid rgba(251, 191, 36, 0.25)' }}
                  >
                    <span className="text-stone-300 font-mono tracking-wider">
                      SERIAL: #{memberSerial}
                    </span>

                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="tracking-wider uppercase">ACTIVE REGISTERED PILGRIM</span>
                    </div>
                  </div>
                </>
              ) : (
                /* ================= BACK SIDE ================= */
                <>
                  <div 
                    className="flex items-center justify-between pb-2 relative z-10"
                    style={{ borderBottom: '1px solid rgba(251, 191, 36, 0.25)' }}
                  >
                    <div className="text-left">
                      <span className="text-[7px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                        CARD CONDITIONS & MOTTO
                      </span>
                      <h4 className="text-[10px] font-bold text-white tracking-wide">
                        "Omnia Instaurare in Christo"
                      </h4>
                    </div>

                    <div className="text-[7.5px] font-mono text-stone-300 text-right">
                      OFFICIAL CREDENTIAL
                    </div>
                  </div>

                  <div className="py-2 space-y-2 text-left relative z-10 text-[7px] sm:text-[7.5px] text-stone-200 leading-relaxed font-sans">
                    <p className="bg-white/5 p-2 rounded-xl border border-white/5">
                      <strong className="text-amber-300">ZUCA Pledge:</strong> This card certifies that the bearer is a recognized member of the Zetech University Catholic Action, committed to prayer, academic excellence, liturgical fellowship, and community service.
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[7px]">
                      <div className="p-1.5 rounded-lg bg-black/20 border border-white/5">
                        <span className="text-amber-400 font-bold block font-mono">CHAPLAINCY OFFICE:</span>
                        <span className="text-stone-300">chaplaincy@zetech.ac.ke</span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-black/20 border border-white/5">
                        <span className="text-amber-400 font-bold block font-mono">EMERGENCY HOTLINE:</span>
                        <span className="text-stone-300">+254 712 345 678</span>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="flex items-center justify-between pt-2 relative z-10 text-[7px] font-mono text-stone-400"
                    style={{ borderTop: '1px solid rgba(251, 191, 36, 0.25)' }}
                  >
                    <span>PROPERTY OF ZETECH CATHOLIC ACTION</span>
                    <span className="text-amber-300/80">NON-TRANSFERABLE</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS: Download Image via html2canvas (Primary Task Requirement) */}
          <div className="w-full max-w-[420px] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* html2canvas PNG Download Button */}
              <button
                type="button"
                disabled={downloading !== null}
                onClick={handleDownloadImage}
                className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {downloading === 'png' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Download className="w-4 h-4 text-white" />
                )}
                <span>Download PNG</span>
              </button>

              {/* Print-ready PDF Button */}
              <button
                type="button"
                disabled={downloading !== null}
                onClick={handleDownloadPdf}
                className="py-3.5 px-4 bg-[#002244] hover:bg-[#003366] active:bg-[#001a33] text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-500/30 disabled:opacity-60"
              >
                {downloading === 'pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                ) : (
                  <FileText className="w-4 h-4 text-amber-300" />
                )}
                <span>Download PDF</span>
              </button>
            </div>

            {/* Quick Helper Tools */}
            <div className="flex items-center justify-between px-1 text-xs text-stone-500 dark:text-stone-400">
              <button
                type="button"
                onClick={() => setCardSide(cardSide === 'front' ? 'back' : 'front')}
                className="hover:text-blue-600 dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flip to {cardSide === 'front' ? 'Back Side' : 'Front Side'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="hover:text-blue-600 dark:hover:text-sky-400 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Verify QR Payload</span>
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 text-center">
              Captures strictly the isolated membership ID card component using <span className="font-mono font-bold text-blue-600 dark:text-sky-400">html2canvas</span> at 300 DPI retina resolution.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Information Customizer */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900/70 p-6 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xl space-y-5 text-left">
          <div className="border-b border-stone-100 dark:border-stone-800 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                Card Information Details
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Updates reflected instantly on the card and QR code.
              </p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-4">
            {/* Student Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                Full Student Name
              </label>
              <input
                type="text"
                placeholder="e.g. Kelvin Wachira"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white font-semibold text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            {/* Admission Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                Admission Number
              </label>
              <input
                type="text"
                placeholder="e.g. BBIT-01-9876/2026"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white font-mono font-semibold text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all uppercase"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value.toUpperCase())}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. 0712 345 678"
                className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white font-semibold text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            {/* Campus & Faculty Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Church className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  Campus Location
                </label>
                <select
                  value={campus}
                  onChange={(e) => setCampus(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-white font-medium text-xs outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="Technology Park Mangu Campus">Mangu Campus (Tech Park)</option>
                  <option value="Town Campus Nairobi">Town Campus (Nairobi)</option>
                  <option value="Virtual Learning Campus">Virtual Campus</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                  Card Status
                </label>
                <div className="px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified 2026/2027</span>
                </div>
              </div>
            </div>

            {/* Portrait Photo Upload */}
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-stone-200 dark:bg-stone-800 overflow-hidden flex items-center justify-center shrink-0 border border-stone-300 dark:border-stone-700">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Portrait" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-white block">ID Portrait</span>
                    <span className="text-[11px] text-stone-400">Passport photo for card</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="digital-card-photo"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('digital-card-photo')?.click()}
                    className="px-3 py-1.5 rounded-xl bg-[#002244] hover:bg-[#003366] text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    {photoUrl ? 'Replace' : 'Upload'}
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Sync to Profile Button */}
            {onSaveProfile && currentUser && (
              <button
                type="button"
                disabled={isSavingProfile}
                onClick={handleSaveToProfile}
                className="w-full py-3 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                )}
                <span>Save Changes to My Account Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Payload & Decoder Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-sky-400">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                      Digital QR Code Data
                    </h3>
                    <p className="text-[11px] text-stone-400">What security officers scan</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowQrModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* QR Image & Payload */}
              <div className="flex flex-col items-center p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200/80 dark:border-stone-800">
                {qrDataUrl && (
                  <img src={qrDataUrl} alt="Verification QR" className="w-36 h-36 rounded-xl bg-white p-2 shadow-sm" />
                )}
                <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED 2026/2027 MEMBER
                </span>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider block">
                  Decoded JSON Payload:
                </span>
                <pre className="p-3 bg-stone-100 dark:bg-stone-950 rounded-xl text-[10px] font-mono text-stone-800 dark:text-stone-300 overflow-x-auto max-h-40 border border-stone-200 dark:border-stone-800">
                  {qrVerificationPayload}
                </pre>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="flex-1 py-2.5 bg-[#002244] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPayload ? 'Copied!' : 'Copy Verification Data'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
