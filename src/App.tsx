import React, { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
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
  AlertCircle
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
    } else {
      // Auto-expand about if a sub-tab is clicked from elsewhere (if we had specific subtabs)
    }

    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    
    // Only push state if the tab is different from the current one in history
    if (window.history.state?.tab !== tab) {
      window.history.pushState({ tab }, '', url.toString());
    }
    
    // Explicit scroll to top when changing tabs
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });

    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
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
  const [editForm, setEditForm] = useState({ displayName: '', photoURL: '', contactNumber: '', admissionNumber: '', bio: '' });
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
              bio: data.bio || '' 
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
        bio: editForm.bio
      });
      
      setProfile(prev => prev ? { 
        ...prev, 
        displayName: editForm.displayName,
        photoURL: editForm.photoURL,
        contactNumber: editForm.contactNumber,
        admissionNumber: editForm.admissionNumber,
        bio: editForm.bio
      } : null);
      setIsProfileModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
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
      <div className="flex flex-col lg:flex-row min-h-screen bg-brand-950 overflow-hidden text-white font-sans selection:bg-brand-500/30">
        {/* Left Panel: Cinematic Visual & Brand Message */}
        <div className="hidden lg:flex lg:w-3/5 relative flex-col justify-between p-16 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            <motion.div 
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.4 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
              className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop')] bg-cover bg-center"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
            
            {/* Animated Atmospheric Glows */}
            <motion.div 
               animate={{ 
                 scale: [1, 1.2, 1],
                 opacity: [0.1, 0.2, 0.1],
                 x: [0, 50, 0]
               }}
               transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-brand-500/20 blur-[150px] rounded-full" 
            />
            <motion.div 
               animate={{ 
                 scale: [1.2, 1, 1.2],
                 opacity: [0.1, 0.2, 0.1],
                 y: [0, -50, 0]
               }}
               transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
               className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full" 
            />
          </div>

          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative z-10"
          >
            <div className="w-20 h-20 glass-dark rounded-[24px] flex items-center justify-center mb-10 border border-white/10 shadow-3xl">
              <Church className="text-brand-400 w-10 h-10" />
            </div>
            <h1 className="text-8xl font-black tracking-[-0.04em] leading-[0.85] mb-8">
              THE <br />
              <span className="serif-display italic font-light text-brand-400 lowercase drop-shadow-3xl">Sanctuary</span>
            </h1>
            <p className="text-2xl text-stone-400 font-light max-w-lg leading-relaxed italic serif-display">
              "A digital assembly for the Zetech University Catholic community—fostering spiritual nourishment, collective wisdom, and authentic fellowship."
            </p>
          </motion.div>

          {/* Dynamic Footer Info */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="relative z-10 flex items-center justify-between border-t border-white/5 pt-10"
          >
             <div className="flex gap-12">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">Established</p>
                   <p className="text-xs font-bold tracking-widest text-stone-300">MMXXIV</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500">Community</p>
                   <p className="text-xs font-bold tracking-widest text-brand-400 animate-pulse">ACTIVE</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4 px-6 py-3 rounded-full glass-dark border border-white/5">
                <div className="flex -space-x-3">
                   {[1,2,3].map(i => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-brand-950 bg-stone-800 flex items-center justify-center overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 423}`} alt="" />
                     </div>
                   ))}
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Join the Collective</p>
             </div>
          </motion.div>
        </div>

        {/* Right Panel: Auth Flow */}
        <div className="w-full lg:w-2/5 flex flex-col justify-center p-8 md:p-20 lg:p-24 relative bg-stone-950 border-l border-white/5">
          {/* Mobile Background */}
          <div className="lg:hidden absolute inset-0 z-0">
             <img src="https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=2671&auto=format&fit=crop" className="w-full h-full object-cover opacity-10" alt="" />
             <div className="absolute inset-0 bg-gradient-to-b from-brand-950 via-brand-950/80 to-brand-950" />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="max-w-md mx-auto w-full relative z-10"
          >
            <div className="mb-12 md:mb-16">
              <AnimatePresence mode="wait">
                <motion.div
                  key={authMode}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
                    {authMode === 'login' ? 'WELCOME' : 'SIGN UP'} <br />
                    <span className="text-brand-400 serif-display italic font-light lowercase">
                      {authMode === 'login' ? 'Peace be with you' : 'Join the Sanctuary'}
                    </span>
                  </h2>
                  <p className="text-stone-500 font-medium text-lg leading-snug">
                    {authMode === 'login' 
                      ? "Enter your credentials to re-enter our digital sanctuary." 
                      : "Begin your spiritual journey with ZUCA. Join a community that grows together."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-5 md:space-y-6">
              {authMode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-500/80 ml-4">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 group-focus-within:text-brand-400 transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Blessed Member"
                      className="w-full pl-16 pr-8 py-6 rounded-[24px] bg-stone-900 border border-white/5 focus:border-brand-500/30 transition-all text-white font-bold tracking-tight outline-none"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-500/80 ml-4">Sanctuary Email</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-600 group-focus-within:text-brand-400 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="name@university.com"
                    className="w-full pl-16 pr-8 py-6 rounded-[24px] bg-stone-900 border border-white/5 focus:border-brand-500/30 transition-all text-white font-bold tracking-tight outline-none"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-500/80 ml-4">Secret Covenant</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-stone-800 text-brand-400 border border-white/5">
                    <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-16 pr-8 py-6 rounded-[24px] bg-stone-900 border border-white/5 focus:border-brand-500/30 transition-all text-white font-bold tracking-widest outline-none"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  />
                </div>
              </div>

              {authError && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-xs font-bold"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {authError}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                disabled={authLoading}
                type="submit"
                className="w-full bg-white text-brand-950 py-6 rounded-[24px] font-black uppercase tracking-[0.4em] shadow-3xl shadow-white/10 mt-6 text-sm flex items-center justify-center gap-4 transition-all hover:bg-brand-50"
              >
                {authLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    ENTER SANCTUARY <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-12 space-y-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                <div className="relative flex justify-center text-xs uppercase font-black tracking-[0.4em]"><span className="bg-stone-950 px-6 text-stone-600">OR</span></div>
              </div>

              <button
                onClick={handleLogin}
                disabled={authLoading}
                className="w-full py-6 rounded-[24px] border border-white/10 hover:bg-white/5 transition-all text-sm font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 text-stone-300"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/node_modules/firebaseui/dist/google.ico" className="w-5 h-5" alt="" />
                Sync with Google Account
              </button>

              <button 
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="w-full text-center text-stone-500 font-medium tracking-tight mt-6 block text-sm hover:text-brand-400 transition-colors"
              >
                {authMode === 'login' ? "New member? Sign up for the Sanctuary" : "Already part of our faith? Login here"}
              </button>
            </div>
          </motion.div>
          
          {/* Subtle branding for mobile */}
          <div className="lg:hidden mt-20 text-center flex flex-col items-center opacity-50">
             <Church className="w-8 h-8 text-brand-400 mb-4" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">ZUCA SANCTUARY</p>
          </div>
        </div>
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
      <aside className={`fixed inset-y-0 left-0 z-50 glass border-r border-brand-500/10 dark:border-white/5 transition-all duration-500 ease-in-out overflow-hidden shadow-2xl ${
        isSidebarOpen ? 'translate-x-0 w-72 md:w-80' : '-translate-x-full w-72 md:w-80'
      }`}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-8 flex items-center gap-4 px-2 group cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <div className="w-12 h-12 bg-indigo-600 shrink-0 rounded-[18px] flex items-center justify-center shadow-2xl shadow-indigo-500/30 group-hover:rotate-3 transition-all duration-500 border border-white/10 overflow-hidden">
               <Church className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
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
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-full transition-all duration-500 relative group ${
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
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full text-[9px] font-black leading-none text-white shadow-lg border-2 border-white dark:border-stone-900 transition-colors duration-500 ${
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
        className={`flex-1 transition-all duration-500 ease-in-out pt-16 md:pt-12 px-3 md:px-12 relative z-10 ${isSidebarOpen ? 'ml-0 md:ml-80' : 'ml-0'}`}
      >
        {/* Scroll Progress Bar */}
        <motion.div 
          className="fixed top-0 left-0 right-0 h-1 bg-brand-600 z-[60] origin-left"
          style={{ scaleX: scrollProgress }}
        />
        <div className="max-w-6xl mx-auto pt-2 md:pt-16">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Dashboard 
                  userName={profile?.displayName?.split(' ')[0] || 'Member'} 
                  onTabChange={(tab) => handleTabChange(tab)}
                />
              </motion.div>
            )}
            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
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
              <motion.div key="guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
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
                
                <h3 className="text-3xl font-bold mb-8">Spiritual Profile</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="flex flex-col items-center gap-6 mb-10 text-center">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl relative group">
                      {editForm.photoURL ? (
                        <img src={editForm.photoURL} alt="Preview" className="w-full h-full object-cover" />
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
                              } catch (error) {
                                console.error("Compression failed:", error);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Display Name</label>
                    <input 
                      type="text" 
                      value={editForm.displayName} 
                      onChange={e => setEditForm({...editForm, displayName: e.target.value})} 
                      className="w-full px-6 py-4 rounded-2xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Contact Number</label>
                    <input 
                        type="tel" 
                        value={editForm.contactNumber} 
                        onChange={e => setEditForm({...editForm, contactNumber: e.target.value})} 
                        placeholder="+254..." 
                        className="w-full px-6 py-4 rounded-2xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Admission Number</label>
                    <input 
                        type="text" 
                        value={editForm.admissionNumber} 
                        onChange={e => setEditForm({...editForm, admissionNumber: e.target.value})} 
                        placeholder="e.g. BSCIT..." 
                        className="w-full px-6 py-4 rounded-2xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Spiritual Bio</label>
                    <textarea 
                      value={editForm.bio} 
                      onChange={e => setEditForm({...editForm, bio: e.target.value})} 
                      placeholder="My journey in faith..." 
                      className="w-full px-6 py-4 rounded-3xl h-24 resize-none bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10" 
                    />
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
      <div className={`w-5 h-5 shrink-0 flex items-center justify-center transition-all duration-500 ${active ? 'scale-105' : 'group-hover:scale-105'}`}>
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
