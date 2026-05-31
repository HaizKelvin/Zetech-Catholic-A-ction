import React, { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, OperationType, AppNotification } from './types';
import { handleFirestoreError, compressImage } from './utils';
import { NotificationManager } from './lib/notifications';

// Components
import AboutPage from './components/AboutPage';
import Chatbot from './components/Chatbot';
import GroupLibrary from './components/GroupLibrary';
import Dashboard from './components/Dashboard';
import Petitions from './components/Petitions';
import Payments from './components/Payments';
import Gallery from './components/Gallery';
import TriviaComponent from './components/Trivia';
import AdminPanel from './components/AdminPanel';
import SchedulePage from './components/SchedulePage';
import ChatPage from './components/ChatPage';
import ContactUs from './components/ContactUs';
import NotificationTicker from './components/NotificationTicker';
import UserGuide from './components/UserGuide';
import JoinUs from './components/JoinUs';

import { 
  LogIn, 
  Church, 
  Music, 
  Shield, 
  Loader2, 
  LayoutDashboard, 
  Heart, 
  Calendar, 
  DollarSign, 
  HelpCircle,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  MessageCircle,
  MessageSquare,
  Twitter,
  Instagram,
  Facebook,
  Mail,
  Phone,
  Settings,
  User as UserIcon,
  Bell,
  BellOff,
  Trash2,
  Youtube,
  Image as ImageIcon,
  Home,
  Hash,
  CreditCard,
  Trophy,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  BookOpen,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'home' | 'materials' | 'schedule' | 'petitions' | 'join' | 'payments' | 'trivia' | 'chat' | 'admin' | 'gallery' | 'contact' | 'about' | 'guide';

function SocialLink({ href, icon }: { href: string, icon: React.ReactNode }) {
  return (
    <motion.a 
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.9 }}
      href={href} 
      className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-brand-400 hover:bg-white/10 transition-all shadow-sm"
    >
      {icon}
    </motion.a>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsDetail, setShowTermsDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Initial state from URL if present
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as TabType;
      return tab || 'home';
    }
    return 'home';
  });
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );

  const requestNotif = async () => {
    try {
      if (!('Notification' in window)) {
        alert("Mobile notifications are not supported by this browser.");
        return;
      }
      
      const granted = await NotificationManager.requestPermission();
      setNotifPermission(granted ? 'granted' : 'denied');
      
      if (granted) {
        NotificationManager.sendNotification('Divine Notifications Enabled', {
          body: 'You will now receive spiritual updates and community news.'
        });
      } else {
        alert("Notifications were blocked. Please enable them in your browser settings (try opening the site in a new tab if you are in preview).");
      }
    } catch (error) {
      console.error("Notification error:", error);
      alert("Could not enable notifications. Please try opening the app in a new browser tab.");
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.tab) {
        setActiveTab(event.state.tab);
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL and history when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Toggle About dropdown if clicking about
    if (tab === 'about') {
      setIsAboutOpen(!isAboutOpen);
    }

    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    
    if (window.history.state?.tab !== tab) {
      window.history.pushState({ tab }, '', url.toString());
    }
    
    // Immediate scroll for speed
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0 });

    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [resetSent, setResetSent] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [savingState, setSavingState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [editForm, setEditForm] = useState({ 
    displayName: '', 
    photoURL: '', 
    contactNumber: '', 
    admissionNumber: '', 
    bio: '',
    isSubscribed: true 
  });
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [aiContext, setAiContext] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      // Progress calculation
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = winScroll / height;
      setScrollProgress(scrolled);

      // Menu visibility (sticky header behavior for floating icons)
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        setIsMenuVisible(false);
      } else {
        setIsMenuVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Peace be with you this morning.";
    if (hour < 18) return "Wishing you a blessed afternoon.";
    return "Peace be with you this evening.";
  };

  const handleStudyResource = (title: string, content: string) => {
    setAiContext(`I am studying the sacred material titled "${title}". 

Summary Content: 
${content}

Can you provide more insight, theological context, or a related prayer meditation for this resource?`);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    let profileUnsubscribe: () => void = () => {};

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Update presence
        const presenceDocRef = doc(db, 'users', firebaseUser.uid);
        updateDoc(presenceDocRef, { online: true, lastSeen: serverTimestamp() }).catch(() => {
           // If direct update fails (e.g. first time), fetchOrCreate will handle it
        });

        // Set offline on disconnect/visibility change
        const setOffline = () => {
          updateDoc(presenceDocRef, { online: false, lastSeen: serverTimestamp() });
        };
        
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            setOffline();
          } else {
            updateDoc(presenceDocRef, { online: true, lastSeen: serverTimestamp() });
          }
        };

        window.addEventListener('beforeunload', setOffline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Check/create initial profile
        await fetchOrCreateProfile(firebaseUser);
        
        // Listen for profile changes/deletions
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (snapshot) => {
          if (!snapshot.exists()) {
            // Profile was deleted from backend Firestore
            handleLogout();
          } else {
            const data = snapshot.data() as UserProfile;
            setProfile(data);
            setEditForm({ 
              displayName: data.displayName || firebaseUser.displayName || '', 
              photoURL: data.photoURL || firebaseUser.photoURL || '', 
              contactNumber: data.contactNumber || '', 
              admissionNumber: data.admissionNumber || '',
              bio: data.bio || '',
              isSubscribed: data.isSubscribed ?? true
            });
          }
        }, (error) => {
          // If permission denied (maybe user deleted from Firestore but rules block access), log out
          if (error.code === 'permission-denied') {
            handleLogout();
          }
        });
      } else {
        setProfile(null);
        profileUnsubscribe();
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      profileUnsubscribe();
    };
  }, []);

  const fetchOrCreateProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      const isNewUser = !userDoc.exists();
      
      const profileData: any = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        lastSeen: serverTimestamp(),
        online: true
      };

      if (isNewUser) {
        profileData.displayName = firebaseUser.displayName || authForm.name || 'Blessed Member';
        profileData.photoURL = firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`;
        profileData.role = firebaseUser.email === 'wachirakevin65@gmail.com' ? 'admin' : 'member';
        profileData.createdAt = serverTimestamp();
        profileData.bio = 'Walking in faith with ZUCA.';
      } else {
        // If user already exists but has no photo, and we have one from Google now, sync it
        const existingData = userDoc.data();
        if (!existingData.photoURL && firebaseUser.photoURL) {
          profileData.photoURL = firebaseUser.photoURL;
        }
        if (!existingData.displayName && firebaseUser.displayName) {
          profileData.displayName = firebaseUser.displayName;
        }
      }

      await setDoc(userDocRef, profileData, { merge: true });
      
      if (isNewUser) {
        // Create initial notification for new user
        const welcomeDocRef = doc(collection(db, 'notifications'));
        await setDoc(welcomeDocRef, {
          userId: firebaseUser.uid,
          title: 'Welcome Home',
          message: `Peace be with you, ${profileData.displayName.split(' ')[0]}. Welcome to our digital sanctuary. Your journey with ZUCA starts here.`,
          type: 'announcement',
          isRead: false,
          timestamp: serverTimestamp()
        });

        // Automatic Welcome Email
        try {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subject: "Welcome to ZUCA Sanctuary 🕊️",
              body: "Welcome to the fellowship.", // Logic handles the 'welcome' type template
              recipients: [firebaseUser.email],
              type: 'welcome',
              name: profileData.displayName.split(' ')[0]
            })
          });
        } catch (emailError) {
          console.error("Welcome email automation failed:", emailError);
        }
      }
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: editForm.displayName,
        photoURL: editForm.photoURL,
        contactNumber: editForm.contactNumber,
        admissionNumber: editForm.admissionNumber,
        bio: editForm.bio,
        isSubscribed: editForm.isSubscribed
      });
      setIsProfileModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const autoSaveProfileField = async (key: string, value: any) => {
    if (!user) return;
    setSavingState('saving');
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        [key]: value
      });
      setSavingState('saved');
      setTimeout(() => setSavingState('idle'), 2000);
    } catch (err) {
      console.error(`Auto-save of ${key} failed:`, err);
      setSavingState('error');
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setAuthLoading(true);
    setAuthError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/popup-blocked') {
        setAuthError('Popup blocked! Please allow popups or open this app in a new tab to sign in with Google.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setAuthError('Unauthorized domain! Please add ' + window.location.hostname + ' to your Firebase Authorized Domains in the console.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setAuthError('Google Sign-In is not enabled! Please enable it in your Firebase Console.');
      } else {
        setAuthError(error.message || 'Login failed. Try opening the app in a new tab.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    try {
      if (authMode === 'signup') {
        if (!acceptedTerms) {
          setAuthError('You must accept the Terms and Conditions to sign up.');
          setAuthLoading(false);
          return;
        }
        const { user: newUser } = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        await updateProfile(newUser, { displayName: authForm.name });
        // fetchOrCreateProfile will be triggered by onAuthStateChanged
      } else {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setAuthError(error.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.email) {
      setAuthError('Please enter your university email to receive a reset link.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, authForm.email);
      setResetSent(true);
    } catch (error: any) {
      console.error('Reset error:', error);
      let msg = error.message || 'Could not send reset email. Please verify your email address.';
      if (error.code === 'auth/user-not-found') {
        msg = "We couldn't find a soul registered with this email. Please check the spelling or sign up.";
      } else if (error.code === 'auth/network-request-failed') {
        msg = "A connection failure occurred. Please check your digital signal.";
      }
      setAuthError(msg + " Also, check your spam/junk folder in a few moments.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', 'in', [user.uid, 'all']),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      setNotifications(notifs);
    }, (error) => {
      console.error("Sanctuary Error: Could not listen to notifications", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 flex items-center justify-center">
        <div className="faith-bg" />
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full relative flex items-center justify-center p-4 md:p-6 bg-[#001a33] font-sans selection:bg-zetech-gold/30 overflow-y-auto">
        {/* Deep Atmospheric Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#003366] via-[#001a33] to-[#000d1a]" />
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[440px] my-8"
        >
          {/* Main Auth Card */}
          <div className="bg-white rounded-[32px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.6)] border border-white/10">
            
            {/* Header Image Section - The "Clear" Image at the Top */}
            <div className="relative h-48 md:h-60 overflow-hidden">
               <img 
                 src="https://i.ibb.co/tMNKfnYM/Technology-Park-Mangu-Campus.png" 
                 alt="Zetech University Technology Park" 
                 className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-1000"
                 onError={(e) => {
                   (e.target as any).src = "https://images.unsplash.com/photo-1541339907198-e08756ebafe1?q=80&w=2670";
                 }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/10" />
               
               {/* Floating Logo Badge */}
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl border-4 border-zetech-gold relative z-20 group">
                    <div className="absolute inset-0 rotate-45 border-2 border-zetech-gold/20 scale-110 rounded-2xl -z-10 group-hover:rotate-90 transition-transform duration-700" />
                    <Church className="text-zetech-blue w-10 h-10 group-hover:scale-110 transition-transform duration-500" />
                  </div>
               </div>
            </div>

            {/* Form Section */}
            <div className="p-8 md:p-10 pt-12">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-zetech-blue tracking-tight uppercase leading-none">
                  THE <span className="text-zetech-gold serif-display italic font-light lowercase">Sanctuary</span>
                </h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 mt-2">Zetech University Catholic Action</p>
                            <AnimatePresence mode="wait">
                  <motion.div
                    key={authMode + (resetSent ? '-sent' : '')}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="mt-6"
                  >
                    <h2 className="text-xl font-bold text-zetech-blue">
                      {resetSent 
                        ? 'Covenant Reset Sent' 
                        : authMode === 'login' 
                          ? 'Welcome Back' 
                          : authMode === 'signup' 
                            ? 'Create Account' 
                            : 'Restore Access'}
                    </h2>
                    <p className="text-stone-500 text-xs mt-1">
                      {resetSent 
                        ? 'Check your university email (including spam/junk) for the sacred reset link.' 
                        : authMode === 'forgot' 
                          ? 'Enter your email to receive a recovery link.' 
                          : authMode === 'login' 
                            ? 'Peace be with you. Re-enter the sanctuary.' 
                            : 'Join our spiritual collective today.'}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {!resetSent ? (
                <form onSubmit={authMode === 'forgot' ? handlePasswordReset : handleEmailAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <div className="relative group">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-zetech-blue transition-colors" />
                      <input
                        type="text"
                        required
                        placeholder="Sacred Name"
                        className="w-full pl-12 pr-5 py-4 rounded-xl bg-stone-50 border border-stone-200 focus:border-zetech-blue/50 focus:bg-white transition-all text-sm text-stone-900 font-medium outline-none"
                        value={authForm.name}
                        onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-zetech-blue transition-colors" />
                    <input
                      type="email"
                      required
                      placeholder="University Email"
                      className="w-full pl-12 pr-5 py-4 rounded-xl bg-stone-50 border border-stone-200 focus:border-zetech-blue/50 focus:bg-white transition-all text-sm text-stone-900 font-medium outline-none"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                    />
                  </div>

                  {authMode !== 'forgot' && (
                    <div className="space-y-1">
                      <div className="relative group">
                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-zetech-blue transition-colors" />
                        <input
                          type="password"
                          required
                          placeholder="Secret Password"
                          className="w-full pl-12 pr-5 py-4 rounded-xl bg-stone-50 border border-stone-200 focus:border-zetech-blue/50 focus:bg-white transition-all text-sm text-stone-900 font-medium outline-none"
                          value={authForm.password}
                          onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                        />
                      </div>
                      {authMode === 'login' && (
                        <div className="flex justify-end px-1">
                          <button 
                            type="button" 
                            onClick={() => {setAuthMode('forgot'); setAuthError('');}}
                            className="text-[10px] font-bold text-zetech-blue/60 hover:text-zetech-blue uppercase tracking-wider"
                          >
                            Forgot?
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-[10px] font-bold"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {authError}
                    </motion.div>
                  )}

                  {authMode === 'forgot' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-2xl bg-zetech-blue/5 border border-zetech-blue/10 mb-6"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-zetech-blue/10 flex items-center justify-center">
                          <ShieldCheck className="w-3.5 h-3.5 text-zetech-blue" />
                        </div>
                        <h4 className="text-[10px] font-black text-zetech-blue uppercase tracking-[0.2em]">Sacred Recovery Guidelines</h4>
                      </div>
                      <ul className="space-y-2.5 text-[10.5px] text-stone-600 font-medium leading-relaxed">
                        <li className="flex gap-2 underline decoration-zetech-gold/30">
                          <span className="text-zetech-gold">◈</span>
                          <span>Use your official <span className="font-bold text-zetech-blue">@zetech.ac.ke</span> email address.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-zetech-gold">◈</span>
                          <span>Check your <span className="font-bold">Spam/Junk</span> folder if the link is not in your Inbox.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-zetech-gold">◈</span>
                          <span>The link is sensitive and expires in <span className="font-bold">60 minutes</span>.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-zetech-gold">◈</span>
                          <span>Sender: <span className="font-bold italic">ZUCA Action</span> (via zuca2430@gmail.com).</span>
                        </li>
                      </ul>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={authLoading}
                    type="submit"
                    className="w-full bg-zetech-blue text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] shadow-lg shadow-zetech-blue/20 mt-4 flex items-center justify-center gap-2 hover:bg-[#002b55] transition-all"
                  >
                    {authLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {authMode === 'login' ? 'ENTER SANCTUARY' : authMode === 'signup' ? 'JOIN ASSEMBLY' : 'SEND RESET LINK'} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>

                  {authMode === 'forgot' && (
                    <button 
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="w-full text-center text-stone-400 font-bold tracking-wider block text-[10px] uppercase hover:text-zetech-blue transition-colors mt-2"
                    >
                      Back to Login
                    </button>
                  )}
                </form>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                    <Mail className="w-8 h-8 text-emerald-500" />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {setResetSent(false); setAuthMode('login');}}
                    className="w-full bg-zetech-blue text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] shadow-lg"
                  >
                    RETURN TO SANCTUARY
                  </motion.button>
                </div>
              )}

              <div className="mt-8 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
                  <div className="relative flex justify-center text-[8px] uppercase font-black tracking-widest"><span className="bg-white px-3 text-stone-400">Social Access</span></div>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={authLoading}
                  className="w-full py-3.5 rounded-xl border border-stone-200 hover:bg-stone-50 transition-all text-[10px] font-bold uppercase tracking-[0.1em] flex items-center justify-center gap-2 text-stone-600"
                >
                  <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" className="w-4 h-4" alt="Google" />
                  Continue with Google
                </button>

                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="w-full text-center text-stone-400 font-bold tracking-wider block text-[10px] uppercase hover:text-zetech-blue transition-colors"
                >
                  {authMode === 'login' ? "New member? Sign up" : "Already a member? Login"}
                </button>
              </div>
            </div>
          </div>

          <p className="text-center mt-12 text-white/30 text-[10px] font-bold uppercase tracking-[0.4em]">
            &copy; {new Date().getFullYear()} ZUCA • INVENT YOUR FUTURE
          </p>
        </motion.div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className={`min-h-screen transition-colors duration-700 flex relative overflow-hidden ${darkMode ? 'dark text-indigo-50 bg-[#09090b]' : 'text-stone-900 bg-[#fdfcfb]'}`}>
      {/* Divine Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="blur-[120px] w-[600px] h-[600px] bg-brand-200/20 dark:bg-brand-500/5 -top-40 -left-60" 
        />
        <motion.div 
          animate={{ 
            x: [0, -80, 0], 
            y: [0, 100, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="blur-[120px] w-[500px] h-[500px] bg-emerald-200/10 dark:bg-emerald-500/5 top-1/4 -right-20" 
        />
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, 150, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="blur-[120px] w-[700px] h-[700px] bg-amber-200/5 dark:bg-amber-500/5 -bottom-60 left-1/3" 
        />
        <div className="absolute inset-0 divine-pattern opacity-10 dark:opacity-5" />
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 glass border-r border-brand-500/10 dark:border-white/5 transition-all duration-300 ease-out overflow-hidden shadow-2xl ${
        isSidebarOpen ? 'translate-x-0 w-72 md:w-80' : '-translate-x-full w-72 md:w-80'
      }`}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-8 flex items-center gap-4 px-2 group cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <div className="w-12 h-12 bg-indigo-600 shrink-0 rounded-[18px] flex items-center justify-center shadow-2xl shadow-indigo-500/30 group-hover:rotate-3 transition-all duration-300 border border-white/10 overflow-hidden">
               <Church className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight text-stone-900 dark:text-white leading-none">ZUCA</h1>
                <p className="text-[10px] font-black text-indigo-600 dark:text-brand-400 tracking-wider uppercase opacity-80">Sacred Hub</p>
              </motion.div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-1">
              {isSidebarOpen && <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500 ml-4 mb-2">Sanctuary</p>}
              <NavItem active={activeTab === 'home'} onClick={() => handleTabChange('home')} icon={<Home className="w-4 h-4" />} label="Overview" isOpen={isSidebarOpen} />
              <NavItem active={activeTab === 'chat'} onClick={() => handleTabChange('chat')} icon={<Hash className="w-4 h-4" />} label="Community Hub" isOpen={isSidebarOpen} />
              <NavItem active={activeTab === 'materials'} onClick={() => handleTabChange('materials')} icon={<BookOpen className="w-4 h-4" />} label="Divine Library" isOpen={isSidebarOpen} />
              <NavItem active={activeTab === 'schedule'} onClick={() => handleTabChange('schedule')} icon={<Calendar className="w-4 h-4" />} label="Schedule & Events" isOpen={isSidebarOpen} />
              <NavItem active={activeTab === 'gallery'} onClick={() => handleTabChange('gallery')} icon={<ImageIcon className="w-4 h-4" />} label="Activities" isOpen={isSidebarOpen} />
            </div>

            <div className="space-y-1">
              {isSidebarOpen && <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500 ml-4 mb-3">Community</p>}
              <div className="space-y-1">
                <div className="relative">
                  <button
                    onClick={() => {
                      if (isSidebarOpen) setIsAboutOpen(!isAboutOpen);
                      else handleTabChange('about');
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-full transition-all duration-300 relative group ${
                      activeTab === 'about' || (isAboutOpen && isSidebarOpen)
                        ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20' 
                        : 'text-stone-500 dark:text-stone-400 hover:bg-brand-50/50 dark:hover:bg-white/5 hover:text-brand-700 dark:hover:text-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-5 h-5 shrink-0 flex items-center justify-center transition-all duration-700 ${activeTab === 'about' || isAboutOpen ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`}>
                        <Shield className="w-[18px] h-[18px]" />
                      </div>
                      {isSidebarOpen && <span className="text-[13px] font-medium whitespace-nowrap leading-none">About CA</span>}
                    </div>
                    {isSidebarOpen && (
                      <motion.div animate={{ rotate: isAboutOpen ? 180 : 0 }} className="mr-1">
                        <ChevronDown className="w-3.5 h-3.5 text-current opacity-40 ml-2" />
                      </motion.div>
                    )}
                  </button>

                  <AnimatePresence>
                    {isAboutOpen && isSidebarOpen && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="overflow-hidden bg-stone-100/50 dark:bg-white/5 rounded-3xl mt-2 ml-4 mb-2 shadow-inner"
                      >
                        <div className="p-2 space-y-1">
                          <SubNavItem active={activeTab === 'about'} onClick={() => handleTabChange('about')} label="Identity" />
                          <SubNavItem active={activeTab === 'join'} onClick={() => handleTabChange('join')} label="Sanctify (Join)" />
                          <SubNavItem active={activeTab === 'payments'} onClick={() => handleTabChange('payments')} label="Tithes (Payments)" />
                          <SubNavItem active={activeTab === 'guide'} onClick={() => handleTabChange('guide')} label="Holy Guide" />
                          <SubNavItem active={activeTab === 'contact'} onClick={() => handleTabChange('contact')} label="Messenger (Contact)" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <NavItem active={activeTab === 'trivia'} onClick={() => handleTabChange('trivia')} icon={<Trophy className="w-4 h-4" />} label="Daily Trivia" isOpen={isSidebarOpen} />
                <NavItem active={activeTab === 'petitions'} onClick={() => handleTabChange('petitions')} icon={<Heart className="w-4 h-4" />} label="Prayer Petitions" isOpen={isSidebarOpen} />
              </div>
            </div>
            
            {isAdmin && (
              <div className="pt-2">
                {isSidebarOpen && <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-300 dark:text-stone-600 ml-4 mb-2">Admin Only</p>}
                <NavItem active={activeTab === 'admin'} onClick={() => handleTabChange('admin')} icon={<Shield className="w-4 h-4 ml-0.5" />} label="Admin Panel" isOpen={isSidebarOpen} admin />
              </div>
            )}
          </nav>

          {/* Bottom Sidebar - Profile Card Refinement */}
          <div className="pt-6 border-t border-stone-100 dark:border-white/5">
            <div className={`p-4 ${isSidebarOpen ? 'bg-white dark:bg-white/5 rounded-[32px] border border-stone-100 dark:border-white/5 shadow-2xl shadow-stone-200/50 dark:shadow-none mb-4 group' : 'mb-2'}`}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-11 h-11 rounded-[18px] bg-brand-100 dark:bg-brand-900/20 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer shadow-inner"
                  onClick={() => setIsProfileModalOpen(true)}
                >
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-brand-600 dark:text-brand-400 font-extrabold text-sm">{profile?.displayName?.charAt(0)}</span>
                  )}
                </div>
                {isSidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-stone-900 dark:text-white truncate tracking-tight">{profile?.displayName || 'Faithful'}</p>
                    <button onClick={() => setIsProfileModalOpen(true)} className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest text-left opacity-70 hover:opacity-100 transition-opacity">Sanctify Profile</button>
                  </div>
                )}
                <button onClick={handleLogout} className="p-2 text-stone-300 dark:text-stone-700 hover:text-red-500 transition-all hover:scale-110">
                   <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile & Desktop Menu Trigger */}
      <AnimatePresence>
        {!isSidebarOpen && isMenuVisible && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-0 inset-x-0 h-32 pointer-events-none z-[60]"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-stone-950/20 to-transparent dark:from-brand-900/5" />
            </motion.div>
            <motion.button 
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              exit={{ opacity: 0, scale: 0.8, x: -20 }}
              onClick={() => setIsSidebarOpen(true)}
              className="fixed top-5 left-5 z-[70] w-10 h-10 flex items-center justify-center bg-stone-900 text-white shadow-2xl transition-all active:scale-90 rounded-xl group"
            >
              <Menu className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Navigation & User Actions - Circular Floating Gems */}
      <AnimatePresence>
        {isMenuVisible && user && !isSidebarOpen && (
          <div className="fixed top-5 right-5 z-[110] flex items-center gap-2">
            {/* Mode Gem */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white dark:bg-stone-900 text-amber-500 rounded-full shadow-md border border-stone-100 dark:border-white/10"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {/* Notification Gem */}
            <div className="relative">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white dark:bg-stone-900 text-stone-900 dark:text-white rounded-full shadow-md border border-stone-100 dark:border-white/10 relative"
              >
                <Bell className="w-4 h-4 md:w-5 md:h-5" />
                {notifications.length > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full text-[9px] font-black leading-none text-white shadow-lg border-2 border-white dark:border-stone-900 transition-colors duration-300 ${
                      notifications.some(n => !n.isRead) ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                  >
                    {notifications.some(n => !n.isRead) 
                      ? notifications.filter(n => !n.isRead).length 
                      : notifications.length}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {isNotificationOpen && (
                  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="relative w-full max-w-xl glass rounded-[40px] shadow-3xl border border-white/10 overflow-hidden flex flex-col"
                    >
                      <div className="p-6 md:p-8 border-b border-brand-500/10 flex items-center justify-between bg-stone-50/50 dark:bg-white/5">
                         <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
                             <Bell className="w-6 h-6 text-white" />
                           </div>
                           <div>
                            <h3 className="font-black text-xl text-stone-900 dark:text-white tracking-tight">Divine Alerts</h3>
                            <p className="text-[10px] text-brand-600/60 font-black uppercase tracking-widest">Sanctuary Notifications</p>
                           </div>
                         </div>
                         <button 
                           onClick={() => setIsNotificationOpen(false)}
                           className="w-10 h-10 rounded-full bg-stone-100 dark:bg-white/5 flex items-center justify-center text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
                         >
                           <X className="w-5 h-5" />
                         </button>
                      </div>
                      
                      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-6 space-y-3">
                         {notifications.length > 0 ? (
                           notifications.map((n, idx) => (
                             <motion.div
                               key={n.id}
                               initial={{ opacity: 0, x: 10 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: idx * 0.03 }}
                               className={`p-6 rounded-[28px] border transition-all duration-300 relative group ${
                                 !n.isRead 
                                   ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-500/10 shadow-sm' 
                                   : 'bg-white/5 border-transparent opacity-60'
                               }`}
                               onClick={async () => {
                                 if (!n.isRead) {
                                   const docRef = doc(db, 'notifications', n.id);
                                   await updateDoc(docRef, { isRead: true });
                                 }
                               }}
                             >
                               <div className="flex items-start gap-4">
                                 <div className={`mt-2 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-brand-500' : 'bg-stone-300 dark:bg-stone-700'}`} />
                                 <div className="flex-1 min-w-0">
                                   <div className="flex items-center justify-between mb-1">
                                     <p className="font-black text-[15px] text-stone-900 dark:text-white tracking-tight leading-snug">{n.title}</p>
                                     <button 
                                       onClick={async (e) => {
                                         e.stopPropagation();
                                         await deleteDoc(doc(db, 'notifications', n.id));
                                       }}
                                       className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-red-500 transition-all rounded-full hover:bg-red-500/10"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   </div>
                                   <p className="text-[13px] text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">{n.message}</p>
                                   <div className="flex items-center gap-2 mt-3">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                                        {n.timestamp?.toDate()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || 'Just now'}
                                      </span>
                                   </div>
                                 </div>
                               </div>
                             </motion.div>
                           ))
                         ) : (
                           <div className="py-20 text-center space-y-4">
                              <BellOff className="w-12 h-12 text-stone-200 mx-auto" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Divine silence in the sanctuary</p>
                           </div>
                         )}
                      </div>
  
                      <div className="p-6 md:p-8 grid grid-cols-2 gap-4 border-t border-white/5 bg-stone-50/50 dark:bg-white/5">
                        <button 
                          onClick={async () => {
                            const promises = notifications.filter(n => !n.isRead).map(n => 
                              updateDoc(doc(db, 'notifications', n.id), { isRead: true })
                            );
                            await Promise.all(promises);
                          }}
                          className="py-4 rounded-2xl bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 shadow-xl shadow-brand-600/20 transition-all"
                        >
                          Sanctify All
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm('Are you sure you want to clear all notifications from your portal?')) {
                              const promises = notifications.map(n => deleteDoc(doc(db, 'notifications', n.id)));
                              await Promise.all(promises);
                            }
                          }}
                          className="py-4 rounded-2xl bg-white dark:bg-white/10 border border-stone-200 dark:border-white/10 text-stone-600 dark:text-white text-[10px] font-black uppercase tracking-widest hover:bg-stone-50 dark:hover:bg-white/20 transition-all"
                        >
                          Clear Covenant
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Gem */}
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsProfileModalOpen(true)}
              className="w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-stone-900 rounded-full shadow-md flex items-center justify-center border border-stone-100 dark:border-white/10 overflow-hidden"
            >
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-black text-[9px] md:text-[10px]">
                  {profile?.displayName?.charAt(0) || 'K'}
                </div>
              )}
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main 
        onMouseDown={() => {
          if (isSidebarOpen) setIsSidebarOpen(false);
          if (isNotificationOpen) setIsNotificationOpen(false);
        }}
        className={`flex-1 transition-all duration-300 ease-out pt-16 md:pt-12 px-3 md:px-12 relative z-10 ${isSidebarOpen ? 'ml-0 md:ml-80' : 'ml-0'}`}
      >
        {/* Scroll Progress Bar */}
        <motion.div 
          className="fixed top-0 left-0 right-0 h-1 bg-brand-600 z-[60] origin-left"
          style={{ scaleX: scrollProgress }}
        />
        <div className="max-w-6xl mx-auto pt-2 md:pt-16">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                <Dashboard 
                  userName={profile?.displayName?.split(' ')[0] || 'Member'} 
                  onTabChange={(tab) => handleTabChange(tab)}
                />
              </motion.div>
            )}
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                <ChatPage currentUser={profile} />
              </motion.div>
            )}
            {activeTab === 'gallery' && (
              <motion.div key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Gallery profile={profile} />
              </motion.div>
            )}
            {activeTab === 'materials' && (
              <motion.div key="materials" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <GroupLibrary user={profile} isAdmin={isAdmin} onStudy={handleStudyResource} />
              </motion.div>
            )}
            {activeTab === 'schedule' && (
              <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <SchedulePage user={profile} isAdmin={isAdmin} />
              </motion.div>
            )}
            {activeTab === 'petitions' && (
              <motion.div key="petitions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Petitions />
              </motion.div>
            )}
            {activeTab === 'join' && (
              <motion.div key="join" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <JoinUs />
              </motion.div>
            )}
            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Payments isAdmin={isAdmin} />
              </motion.div>
            )}
            {activeTab === 'trivia' && (
              <motion.div key="trivia" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <TriviaComponent isAdmin={isAdmin} />
              </motion.div>
            )}
            {activeTab === 'contact' && (
              <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <ContactUs />
              </motion.div>
            )}
            {activeTab === 'about' && (
              <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <AboutPage />
              </motion.div>
            )}
            {activeTab === 'guide' && (
              <motion.div key="guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
                <UserGuide />
              </motion.div>
            )}
            {activeTab === 'admin' && isAdmin && (
              <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <AdminPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Profile Settings Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass p-8 md:p-12 rounded-[40px] w-full max-w-xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <button 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="absolute top-8 right-8 p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
                
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold">Spiritual Profile</h3>
                  <div className="flex items-center gap-2">
                    {savingState === 'saving' && (
                      <span className="flex items-center gap-1.5 text-[10px] text-brand-600 dark:text-brand-400 font-extrabold bg-brand-500/10 px-3 py-1.5 rounded-full animate-pulse uppercase tracking-wider">
                        <Loader2 className="w-3 h-3 animate-spin text-brand-600" />
                        Storing...
                      </span>
                    )}
                    {savingState === 'saved' && (
                      <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        🕊️ Auto-Stored
                      </span>
                    )}
                    {savingState === 'error' && (
                      <span className="flex items-center gap-1.5 text-[10px] text-red-600 dark:text-red-400 font-extrabold bg-red-500/10 px-3 py-1.5 rounded-full uppercase tracking-wider">
                        ⚠️ Retrying
                      </span>
                    )}
                    {savingState === 'idle' && (
                      <span className="text-[10px] text-stone-400 uppercase tracking-widest font-black">
                        Saved in Faith
                      </span>
                    )}
                  </div>
                </div>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="flex flex-col items-center gap-6 mb-8 text-center bg-stone-500/5 p-6 rounded-[32px] border border-stone-200/40 dark:border-white/5">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl relative group border-2 border-brand-500/20">
                      {editForm.photoURL ? (
                        <img src={editForm.photoURL} alt="Preview" className="w-full h-full object-cover animate-fade-in" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <UserIcon className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                      <label className="absolute inset-0 bg-brand-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <ImageIcon className="w-6 h-6 text-white" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file);
                                setEditForm({...editForm, photoURL: compressed});
                                await autoSaveProfileField('photoURL', compressed);
                              } catch (error) {
                                console.error("Compression failed:", error);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div className="w-full">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">
                        Choose Spiritual Guide or Upload Portrait
                      </p>
                      
                      <div className="grid grid-cols-6 gap-2 w-full max-w-sm mx-auto">
                        {[
                          { name: 'Dove', title: 'Peace', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=peace&mouth=smile' },
                          { name: 'Shield', title: 'Faith', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=faith&eyes=happy' },
                          { name: 'Spirit', title: 'Flame', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=spirit&mouth=smile' },
                          { name: 'Grace', title: 'Sanctuary', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=grace&eyes=happy' },
                          { name: 'Wisdom', title: 'Word', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wisdom&mouth=smile' },
                          { name: 'Joy', title: 'Hope', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=joy&eyes=happy' },
                        ].map((preset) => {
                          const isSelected = editForm.photoURL === preset.url;
                          return (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={async () => {
                                setEditForm(prev => ({ ...prev, photoURL: preset.url }));
                                await autoSaveProfileField('photoURL', preset.url);
                              }}
                              className={`p-1 rounded-xl border transition-all flex flex-col items-center gap-1 bg-white dark:bg-stone-900 ${
                                isSelected 
                                  ? 'border-brand-500 ring-2 ring-brand-500/20 scale-105' 
                                  : 'border-stone-200 dark:border-white/10 hover:border-brand-500/40 hover:scale-105'
                              }`}
                              title={preset.name}
                            >
                              <img src={preset.url} alt={preset.name} className="w-7 h-7 rounded-lg object-cover" />
                              <span className="text-[7px] font-black uppercase tracking-wider text-stone-400">{preset.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Display Name</label>
                    <input 
                      type="text" 
                      value={editForm.displayName} 
                      onChange={e => setEditForm({...editForm, displayName: e.target.value})} 
                      onBlur={() => autoSaveProfileField('displayName', editForm.displayName)}
                      className="w-full px-6 py-4 rounded-2xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 outline-none focus:border-brand-500 transition-colors" 
                      placeholder="Display Name"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Contact Number</label>
                    <input 
                        type="tel" 
                        value={editForm.contactNumber} 
                        onChange={e => setEditForm({...editForm, contactNumber: e.target.value})} 
                        onBlur={() => autoSaveProfileField('contactNumber', editForm.contactNumber)}
                        placeholder="+254..." 
                        className="w-full px-6 py-4 rounded-2xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 outline-none focus:border-brand-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Admission Number</label>
                    <input 
                        type="text" 
                        value={editForm.admissionNumber} 
                        onChange={e => setEditForm({...editForm, admissionNumber: e.target.value})} 
                        onBlur={() => autoSaveProfileField('admissionNumber', editForm.admissionNumber)}
                        placeholder="e.g. BSCIT..." 
                        className="w-full px-6 py-4 rounded-2xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 outline-none focus:border-brand-500 transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Spiritual Bio</label>
                    <textarea 
                      value={editForm.bio} 
                      onChange={e => setEditForm({...editForm, bio: e.target.value})} 
                      onBlur={() => autoSaveProfileField('bio', editForm.bio)}
                      placeholder="My journey in faith..." 
                      className="w-full px-6 py-4 rounded-3xl h-24 resize-none bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 outline-none focus:border-brand-500 transition-colors" 
                    />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-stone-100 dark:bg-white/5 rounded-3xl border border-stone-200 dark:border-white/10">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${editForm.isSubscribed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                        {editForm.isSubscribed ? <Mail className="w-5 h-5" /> : <X className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-black text-sm text-stone-900 dark:text-white leading-none mb-1">Email Resonance</p>
                        <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-widest">Divine Updates & News</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const nextVal = !editForm.isSubscribed;
                        setEditForm(prev => ({ ...prev, isSubscribed: nextVal }));
                        await autoSaveProfileField('isSubscribed', nextVal);
                      }}
                      className={`w-12 h-6 rounded-full relative transition-colors duration-500 ${editForm.isSubscribed ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-800'}`}
                    >
                      <motion.div 
                        animate={{ x: editForm.isSubscribed ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-6 border-t border-stone-100 dark:border-white/5">
                  {'Notification' in window && (
                    <button 
                      type="button" 
                      onClick={requestNotif}
                      className={`w-full py-4 flex items-center justify-center gap-3 rounded-[22px] font-black uppercase tracking-[0.1em] text-[10px] transition-all duration-300 ${
                        notifPermission === 'granted' 
                          ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/5 dark:text-brand-400 border border-brand-500/20' 
                          : 'bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 border border-transparent'
                      }`}
                    >
                      {notifPermission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      {notifPermission === 'granted' ? 'Divine Alerts Active' : 'Enable Mobile Notifications'}
                    </button>
                  )}
                  <button type="submit" className="w-full py-4 bg-brand-900 text-white rounded-[22px] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-brand-900/20 hover:bg-brand-800 transition-all">
                    Save Sanctified Profile
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setIsProfileModalOpen(false)} className="py-4 border border-stone-100 dark:border-stone-800 rounded-[22px] font-black uppercase tracking-[0.2em] text-[10px] text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                    <button type="button" onClick={() => { handleLogout(); setIsProfileModalOpen(false); }} className="py-4 bg-red-500/10 text-red-600 rounded-[22px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-500/20 transition-all">Logout</button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Chat */}
      <Chatbot 
        userName={profile?.displayName?.split(' ')[0]} 
        aiContext={aiContext} 
        onClearContext={() => setAiContext(null)} 
      />

      {/* Policy Modal Overlay */}
      <AnimatePresence>
        {showPolicyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 bg-stone-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-stone-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[32px] md:rounded-[48px] relative shadow-2xl custom-scrollbar"
            >
              <button 
                onClick={() => setShowPolicyModal(false)}
                className="absolute top-6 right-6 md:top-10 md:right-10 z-20 p-3 bg-stone-100 dark:bg-white/5 rounded-full hover:bg-brand-900 hover:text-white transition-all shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="p-0">
                <AboutPage />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const NavItem = React.memo(({ active, onClick, icon, label, isOpen, admin }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isOpen: boolean, admin?: boolean }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-3 rounded-full transition-all duration-300 relative group ${
        active 
          ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20' 
          : 'text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/5 hover:text-stone-900 dark:hover:text-stone-100'
      }`}
    >
      <div className={`w-5 h-5 shrink-0 flex items-center justify-center transition-all duration-300 ${active ? 'scale-105' : 'group-hover:scale-105'}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-[18px] h-[18px]' })}
      </div>
      {isOpen && (
        <motion.span 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className={`text-[13px] font-bold whitespace-nowrap leading-none transition-colors duration-500`}
        >
          {label}
        </motion.span>
      )}

      {active && isOpen && (
        <motion.div 
          layoutId="active-indicator" 
          initial={{ scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute right-5 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        />
      )}
    </button>
  );
});

const SubNavItem = React.memo(({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 font-bold text-[9px] uppercase tracking-wider relative group ${
        active 
          ? 'text-brand-600 dark:text-brand-400 bg-brand-500/10 shadow-sm' 
          : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5'
      }`}
    >
      <div className={`w-1 h-1 rounded-full transition-all duration-300 ${active ? 'bg-brand-500 scale-125' : 'bg-stone-300 dark:bg-stone-700 opacity-30 group-hover:opacity-100'}`} />
      <span className="truncate">{label}</span>
      {active && (
        <motion.div 
          layoutId="subnav-indicator"
          className="absolute left-0 w-1 h-4 bg-brand-500 rounded-r-full"
          initial={{ opacity: 0, x: -2 }}
          animate={{ opacity: 1, x: 0 }}
        />
      )}
    </button>
  );
});
