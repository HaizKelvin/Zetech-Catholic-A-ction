import React, { useState, useEffect } from 'react';
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
import Resources from './components/Resources';
import Dashboard from './components/Dashboard';
import Petitions from './components/Petitions';
import Events from './components/Events';
import Payments from './components/Payments';
import Gallery from './components/Gallery';
import TriviaComponent from './components/Trivia';
import AdminPanel from './components/AdminPanel';
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
  Youtube,
  Image as ImageIcon,
  Library,
  Home,
  Hash,
  CreditCard,
  Trophy,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'home' | 'resources' | 'petitions' | 'events' | 'join' | 'payments' | 'trivia' | 'chat' | 'admin' | 'gallery' | 'contact' | 'about' | 'guide';

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
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    
    // Only push state if the tab is different from the current one in history
    if (window.history.state?.tab !== tab) {
      window.history.pushState({ tab }, '', url.toString());
    }
    
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
  const [editForm, setEditForm] = useState({ displayName: '', photoURL: '', contactNumber: '', bio: '' });
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [aiContext, setAiContext] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = winScroll / height;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStudyResource = (title: string, content: string) => {
    setAiContext(`I am studying the resource titled "${title}". 

Summary Content: 
${content}

Can you provide more insight, theological context, or a related meditation for this?`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "¿Matins? Peace be with you this morning.";
    if (hour < 18) return "¿Angelus? Wishing you a blessed afternoon.";
    return "¿Vespers? Peace be with you this evening.";
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsMenuVisible(false);
      } else {
        setIsMenuVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
      if (!userDoc.exists()) {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Faithful Member',
          photoURL: firebaseUser.photoURL || '',
          bio: '',
          role: firebaseUser.email === 'wachirakevin65@gmail.com' ? 'admin' : 'member',
          createdAt: Timestamp.now()
        };
        await setDoc(userDocRef, {
          ...newProfile,
          createdAt: serverTimestamp()
        });
        setProfile(newProfile);
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
        bio: editForm.bio
      });
      
      setProfile(prev => prev ? { 
        ...prev, 
        displayName: editForm.displayName,
        photoURL: editForm.photoURL,
        contactNumber: editForm.contactNumber,
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
      setAuthError(error.message || 'Login failed');
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
      <div className="min-h-screen relative flex items-center justify-center p-4 md:p-6 overflow-hidden bg-stone-950">
        <div className="absolute inset-0 z-0 text-white font-serif italic text-3xl opacity-10 flex items-center justify-center p-20 text-center pointer-events-none select-none uppercase tracking-[1em]">
           Faith • Service • Community • Prayer
        </div>
        <div className="absolute inset-0 z-0">
          <img 
            src="https://newspro.co.ke/wp-content/uploads/2024/02/slide1.png" 
            alt="Background" 
            className="w-full h-full object-cover opacity-25 contrast-125"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-900/20 blur-[150px] rounded-full -mr-96 -mt-96" />
          <div className="absolute bottom-0 left-0 w-[1000px] h-[1000px] bg-amber-900/10 blur-[120px] rounded-full -ml-48 -mb-48" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-12 rounded-[40px] overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] bg-stone-900"
        >
          {/* Brand Side */}
          <div className="lg:col-span-7 p-8 md:p-14 lg:p-24 flex flex-col justify-center relative overflow-hidden min-h-[400px] lg:min-h-[600px]">
             <div className="absolute inset-0 z-0">
               <img 
                src="https://newspro.co.ke/wp-content/uploads/2024/02/slide1.png" 
                alt="Zetech UI" 
                className="w-full h-full object-cover object-center opacity-80 contrast-125 scale-105"
                referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-stone-950/50" />
               <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent" />
             </div>

            <div className="relative z-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4 mb-8"
              >
                <div className="w-14 h-14 bg-brand-900 rounded-[20px] flex items-center justify-center shadow-2xl border border-white/20">
                  <Church className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-black tracking-widest text-white drop-shadow-lg">ZUCA</h1>
              </motion.div>

              <div className="space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-5xl md:text-[7rem] font-bold text-white tracking-tighter leading-[0.8]"
                >
                  Seek. <br />
                  Serve. <br />
                  <span className="serif-display italic font-light text-brand-600 drop-shadow-[0_10px_30px_rgba(59,130,246,0.5)]">Sanctify.</span>
                </motion.h2>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-4 relative z-10">
               <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Official Hub</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Login Side */}
          <div className="lg:col-span-5 bg-white/10 dark:bg-black/20 backdrop-blur-3xl p-8 md:p-12 lg:p-16 flex flex-col justify-center relative border-l border-white/10 overflow-y-auto custom-scrollbar">
            <div className="mb-8 space-y-2 text-left">
              <h3 className="text-3xl md:text-3xl font-bold text-white tracking-tighter italic serif-display">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </h3>
              <p className="text-white/60 text-xs md:text-sm leading-relaxed max-w-xs font-medium">
                {authMode === 'login' 
                  ? 'Sign in to access the Zetech University Catholic community.'
                  : 'Join our vibrant CA fellowship and grow in faith with fellow students.'}
              </p>
            </div>

            <div className="space-y-6">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authMode === 'signup' && (
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Full Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="Enter your full name"
                      value={authForm.name}
                      onChange={e => setAuthForm({...authForm, name: e.target.value})}
                      className="w-full px-6 py-4 bg-stone-100/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-stone-400 dark:placeholder:text-white/20 shadow-sm"
                    />
                  </div>
                )}
                
                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Email Address</label>
                  <input 
                    required
                    type="email"
                    placeholder="name@university.com"
                    value={authForm.email}
                    onChange={e => setAuthForm({...authForm, email: e.target.value})}
                    className="w-full px-6 py-4 bg-stone-100/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-stone-400 dark:placeholder:text-white/20 shadow-sm"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-4">Password</label>
                  <input 
                    required
                    type="password"
                    placeholder="Create a password"
                    value={authForm.password}
                    onChange={e => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full px-6 py-4 bg-stone-100/50 dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-2xl text-stone-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-stone-400 dark:placeholder:text-white/20 shadow-sm"
                  />
                </div>

                {authMode === 'signup' && (
                  <div className="flex items-center gap-3 px-2 py-2">
                    <input 
                      type="checkbox" 
                      id="terms"
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 rounded border-brand-900/50 bg-white/10 text-brand-900 focus:ring-brand-500/20"
                    />
                    <label htmlFor="terms" className="text-[10px] text-white/60 font-medium cursor-pointer">
                      I accept the <button type="button" onClick={() => setShowPolicyModal(true)} className="text-brand-400 hover:underline">Community Policies</button>
                    </label>
                  </div>
                )}

                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-600 border border-red-700 p-5 rounded-[24px] shadow-2xl relative overflow-hidden my-4"
                  >
                    <div className="absolute inset-0 bg-white/5 backdrop-blur-sm pointer-events-none" />
                    <p className="relative z-10 text-[10px] text-white font-black text-center leading-relaxed uppercase tracking-wider">
                      {authError.includes('auth/network-request-failed') 
                        ? "Network error. Please check your connection." 
                        : authError.includes('auth/operation-not-allowed')
                        ? "Email login is disabled. Please use Google Login."
                        : authError}
                    </p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-brand-900 text-white py-4 rounded-[22px] hover:bg-brand-800 hover:-translate-y-0.5 active:translate-y-0 transition-all font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-brand-900/20 flex items-center justify-center gap-2"
                >
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (authMode === 'login' ? 'Login' : 'Sign Up')}
                </button>
              </form>

              <div className="flex items-center gap-4 w-full">
                <div className="h-[1px] flex-1 bg-white/10" />
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">OR</span>
                <div className="h-[1px] flex-1 bg-white/10" />
              </div>

              <button
                onClick={handleLogin}
                disabled={authLoading}
                className="group relative w-full flex items-center justify-center gap-4 bg-white hover:bg-stone-100 text-stone-950 py-4 rounded-[22px] hover:-translate-y-0.5 transition-all font-black uppercase tracking-[0.2em] text-[10px] shadow-lg overflow-hidden disabled:opacity-50"
              >
                <div className="w-6 h-6 bg-white rounded-lg p-1.5 flex items-center justify-center shadow-inner relative z-10">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-full h-full" />
                </div>
                <span className="relative z-10">Sign in with Google</span>
              </button>

              <div className="text-center">
                <button 
                  onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }}
                  className="text-[10px] font-black text-white/30 hover:text-brand-400 uppercase tracking-[0.2em] transition-colors"
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
              </div>

              <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-8">
                <div className="flex justify-center gap-6">
                  <SocialLink href="#" icon={<Twitter className="w-4 h-4" />} />
                  <SocialLink href="#" icon={<Instagram className="w-4 h-4" />} />
                  <SocialLink href="#" icon={<Youtube className="w-4 h-4" />} />
                  <SocialLink 
                    href="https://wa.me/254705000000" 
                    icon={
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    } 
                  />
                </div>
                <p className="text-[9px] text-center text-white/10 font-black uppercase tracking-[0.6em]">
                  Excellentia Pro Deo
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className={`min-h-screen transition-colors duration-700 flex relative overflow-hidden ${darkMode ? 'dark text-indigo-50 bg-[#09090b]' : 'text-stone-900 bg-[#fdfcfb]'}`}>
      {/* Divine Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="bloom-soft w-[600px] h-[600px] bg-brand-200/20 dark:bg-brand-500/5 -top-40 -left-60 animate-float" />
        <div className="bloom-soft w-[400px] h-[400px] bg-sky-200/20 dark:bg-sky-500/5 top-1/2 -right-20 animate-pulse-gentle" />
        <div className="bloom-soft w-[500px] h-[500px] bg-indigo-200/10 dark:bg-indigo-500/5 -bottom-40 left-1/4 animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute inset-0 divine-pattern opacity-10 dark:opacity-5" />
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 glass border-r border-brand-500/10 dark:border-white/5 transition-all duration-500 ease-in-out overflow-hidden shadow-2xl ${
        isSidebarOpen ? 'translate-x-0 w-72 md:w-80' : '-translate-x-full w-72 md:w-80'
      }`}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-12 flex items-center gap-4 px-2 group cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <div className="w-14 h-14 bg-brand-900 shrink-0 rounded-[22px] flex items-center justify-center shadow-2xl shadow-brand-900/40 group-hover:rotate-6 transition-all duration-500 border border-white/10">
              <Church className="w-7 h-7 text-white" />
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="whitespace-nowrap">
                <h1 className="text-2xl font-black tracking-tighter text-stone-900 dark:text-white">ZUCA</h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-brand-600/60 font-mono">Sacred Hub</p>
              </motion.div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <NavItem active={activeTab === 'home'} onClick={() => handleTabChange('home')} icon={<Home className="w-5 h-5" />} label="Overview" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'about'} onClick={() => handleTabChange('about')} icon={<Shield className="w-5 h-5" />} label="About CA" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'events'} onClick={() => handleTabChange('events')} icon={<Calendar className="w-5 h-5" />} label="Events" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'gallery'} onClick={() => handleTabChange('gallery')} icon={<ImageIcon className="w-5 h-5" />} label="Activities" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'chat'} onClick={() => handleTabChange('chat')} icon={<Hash className="w-5 h-5" />} label="Community Hub" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'resources'} onClick={() => handleTabChange('resources')} icon={<Library className="w-5 h-5" />} label="Divine Library" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'petitions'} onClick={() => handleTabChange('petitions')} icon={<Heart className="w-5 h-5" />} label="Prayer Petitions" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'trivia'} onClick={() => handleTabChange('trivia')} icon={<Trophy className="w-5 h-5" />} label="Daily Trivia" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'join'} onClick={() => handleTabChange('join')} icon={<UserPlus className="w-5 h-5" />} label="Join Us" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'payments'} onClick={() => handleTabChange('payments')} icon={<CreditCard className="w-5 h-5" />} label="Payments" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'guide'} onClick={() => handleTabChange('guide')} icon={<HelpCircle className="w-5 h-5" />} label="User Guide" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'contact'} onClick={() => handleTabChange('contact')} icon={<Mail className="w-5 h-5" />} label="Contact Us" isOpen={isSidebarOpen} />
            
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800">
                {isSidebarOpen && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 ml-4 mb-4">Admin Only</p>}
                <NavItem active={activeTab === 'admin'} onClick={() => handleTabChange('admin')} icon={<Shield className="w-5 h-5" />} label="Admin Panel" isOpen={isSidebarOpen} admin />
              </div>
            )}
          </nav>

          {/* Bottom Sidebar */}
          <div className="pt-6 border-t border-stone-100 dark:border-stone-800 space-y-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${darkMode ? 'text-amber-400 hover:bg-white/5' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              {isSidebarOpen && <span className="text-sm font-bold">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>

            <div className={`flex items-center gap-3 p-3 ${isSidebarOpen ? 'bg-stone-50 dark:bg-white/5 rounded-2xl border border-stone-100 dark:border-white/5' : ''}`}>
              <div 
                className="w-10 h-10 bg-white dark:bg-stone-800 rounded-xl flex items-center justify-center shrink-0 cursor-pointer overflow-hidden border border-brand-500/10 shadow-lg"
                onClick={() => setIsProfileModalOpen(true)}
              >
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-brand-600 dark:text-brand-400 font-bold text-xs">{profile?.displayName?.charAt(0)}</span>
                )}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-stone-900 dark:text-white truncate">{profile?.displayName}</p>
                  <button onClick={() => setIsProfileModalOpen(true)} className="text-[9px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest text-left block">Sanctify Profile</button>
                </div>
              )}
              <button onClick={handleLogout} className="p-2 text-stone-300 dark:text-stone-600 hover:text-red-500 transition-all hover:scale-110">
                 <LogOut className="w-5 h-5" />
              </button>
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
              className="fixed top-0 inset-x-0 h-32 pointer-events-none z-30"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-stone-950/20 to-transparent dark:from-brand-900/5" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-brand-400/5 blur-[80px] rounded-full animate-pulse" />
            </motion.div>
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setIsSidebarOpen(true)}
              className="fixed top-3 left-3 md:top-4 md:left-4 z-40 p-2.5 glass rounded-xl shadow-lg border border-white/20 dark:border-white/20 group hover:bg-brand-900 transition-colors"
            >
              <Menu className="w-4 h-4 md:w-5 md:h-5 text-brand-900 dark:text-brand-400 group-hover:text-white" />
            </motion.button>
          </>
        )}
      </AnimatePresence>

      {/* Top Header Widgets - Fixed Top Right */}
      <AnimatePresence>
        {isMenuVisible && user && (
          <div className="fixed top-3 right-3 md:top-4 md:right-4 z-40 flex items-center gap-3">
             {/* Notifications */}
             <div className="relative">
               <motion.button
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setIsNotificationOpen(true)}
                 className="p-1.5 md:p-2 glass rounded-full shadow-xl border border-white/20 dark:border-white/20 text-stone-600 dark:text-brand-300 group transition-all relative"
               >
                 <Bell className="w-4 h-4 md:w-5 md:h-5" />
                 {notifications.some(n => !n.isRead) && (
                   <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-stone-900" />
                 )}
               </motion.button>
             </div>

             {/* Dark Mode Toggle Component */}
             <motion.button
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setDarkMode(!darkMode)}
               className="p-1.5 glass rounded-full shadow-xl border border-white/20 dark:border-white/20 text-stone-600 dark:text-amber-400 group transition-all"
               title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
               {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </motion.button>

             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, y: -20 }}
             >
               <motion.button 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => setIsProfileModalOpen(true)}
                 className="flex items-center gap-2.5 glass p-1 rounded-full shadow-xl border border-white/20 dark:border-white/20 group transition-all"
               >
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-brand-50 flex items-center justify-center border-2 border-stone-100 dark:border-stone-800 shadow-md">
                   {profile?.photoURL ? (
                     <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <UserIcon className="w-4 h-4 md:w-5 text-brand-300" />
                   )}
                 </div>
                 <div className="text-left hidden sm:block pr-3">
                    <p className="text-[9px] font-bold text-stone-900 dark:text-stone-100 truncate max-w-[60px] md:max-w-[80px]">
                      {profile?.displayName?.split(' ')[0] || 'Member'}
                    </p>
                 </div>
               </motion.button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Center Notification Modal */}
      <AnimatePresence>
        {isNotificationOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm bg-stone-950/20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl glass rounded-[40px] shadow-3xl border border-white/10 overflow-hidden relative"
            >
              <div className="p-6 md:p-10 border-b border-brand-500/10 flex items-center justify-between bg-white/5">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
                     <Bell className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <h3 className="font-black text-xl md:text-2xl text-stone-900 dark:text-white tracking-tight">Divine Alerts</h3>
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
              
              <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto custom-scrollbar text-left">
                 {notifications.length > 0 ? (
                   <div className="space-y-4">
                     {notifications.map((n, idx) => (
                       <motion.div
                         key={n.id}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: idx * 0.05 }}
                         className={`p-6 rounded-[28px] border transition-all duration-300 relative group cursor-pointer ${
                           !n.isRead 
                             ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-500/20 shadow-sm' 
                             : 'bg-stone-50/50 dark:bg-white/5 border-stone-100 dark:border-white/5 opacity-80'
                         }`}
                         onClick={async () => {
                           if (!n.isRead) {
                             const docRef = doc(db, 'notifications', n.id);
                             await updateDoc(docRef, { isRead: true });
                           }
                         }}
                       >
                         <div className="flex items-start gap-4">
                           <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!n.isRead ? 'bg-brand-500 animate-pulse' : 'bg-stone-300 dark:bg-stone-700'}`} />
                           <div className="flex-1 text-left">
                             <div className="flex items-center justify-between mb-1">
                               <p className="font-black text-[15px] text-stone-900 dark:text-white tracking-tight">{n.title}</p>
                               <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                                 {n.timestamp?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                               </span>
                             </div>
                             <p className="text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed text-left">{n.message}</p>
                           </div>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                 ) : (
                   <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-stone-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <BellOff className="w-8 h-8 text-stone-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-stone-400 dark:text-stone-500">Divine silence...</p>
                        <p className="text-[11px] text-stone-300 dark:text-stone-600 uppercase tracking-[0.2em]">No alerts in your portal yet.</p>
                      </div>
                   </div>
                 )}
              </div>
              <div className="p-6 md:p-8 border-t border-brand-500/10 bg-stone-50/50 dark:bg-white/5 flex gap-4">
                 <button 
                   onClick={async () => {
                     const promises = notifications.filter(n => !n.isRead).map(n => 
                       updateDoc(doc(db, 'notifications', n.id), { isRead: true })
                     );
                     await Promise.all(promises);
                   }}
                   className="flex-1 py-4 rounded-2xl bg-brand-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                 >
                   Mark All Sanctified
                 </button>
                 <button 
                   onClick={() => setIsNotificationOpen(false)}
                   className="flex-1 py-4 rounded-2xl bg-white dark:bg-white/10 border border-stone-200 dark:border-white/10 text-stone-600 dark:text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-stone-50 dark:hover:bg-white/20 transition-all"
                 >
                   Close Portal
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main 
        onMouseDown={() => {
          if (isSidebarOpen) setIsSidebarOpen(false);
          if (isNotificationOpen) setIsNotificationOpen(false);
        }}
        className={`flex-1 transition-all duration-500 ease-in-out pt-20 md:pt-12 p-4 md:p-12 relative z-10 ${isSidebarOpen ? 'ml-0 md:ml-80' : 'ml-0'}`}
      >
        {/* Scroll Progress Bar */}
        <motion.div 
          className="fixed top-0 left-0 right-0 h-1 bg-brand-600 z-[60] origin-left"
          style={{ scaleX: scrollProgress }}
        />
        <div className="max-w-6xl mx-auto pt-4 md:pt-16">
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
            {activeTab === 'resources' && (
              <motion.div key="resources" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Resources role={profile?.role || 'member'} onStudy={handleStudyResource} />
              </motion.div>
            )}
             {activeTab === 'petitions' && (
              <motion.div key="petitions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Petitions />
              </motion.div>
            )}
            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Events isAdmin={isAdmin} />
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
                      className="w-full px-6 py-4 rounded-2xl" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Contact Number</label>
                    <input 
                        type="tel" 
                        value={editForm.contactNumber} 
                        onChange={e => setEditForm({...editForm, contactNumber: e.target.value})} 
                        placeholder="+254..." 
                        className="w-full px-6 py-4 rounded-2xl" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Spiritual Bio</label>
                    <textarea 
                      value={editForm.bio} 
                      onChange={e => setEditForm({...editForm, bio: e.target.value})} 
                      placeholder="My journey in faith..." 
                      className="w-full px-6 py-4 rounded-3xl h-24 resize-none" 
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
      <NotificationTicker />

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
      className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-[16px] transition-all duration-500 relative group font-medium text-[12px] ${
        active 
          ? 'bg-brand-600 text-white shadow-xl shadow-brand-600/20 -translate-y-0.5' 
          : 'text-stone-500 hover:bg-brand-50/50 dark:hover:bg-white/5 hover:text-brand-700 dark:hover:text-stone-100'
      }`}
    >
      <div className={`w-5 h-5 shrink-0 flex items-center justify-center transition-all duration-700 ${active ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-6'}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-[18px] h-[18px]' })}
      </div>
      {isOpen && (
        <motion.span 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className={`whitespace-nowrap transition-colors duration-500 ${active ? 'text-white' : 'group-hover:text-stone-950 dark:group-hover:text-white'}`}
        >
          {label}
        </motion.span>
      )}

      {active && isOpen && (
        <motion.div 
          layoutId="active-indicator" 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_white]"
        />
      )}
    </button>
  );
});
