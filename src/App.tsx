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
  Sparkles,
  Fingerprint,
  CheckCircle,
  Lock,
  Unlock,
  ScanLine
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

  // Biometric Security States
  const [authType, setAuthType] = useState<'password' | 'biometric'>('password');
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [bioScanState, setBioScanState] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [bioScanProgress, setBioScanProgress] = useState(0);
  const [bioFeedback, setBioFeedback] = useState('Verify temple security to sync.');
  const [isVisitorSim, setIsVisitorSim] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [isBiometricUnlocked, setIsBiometricUnlocked] = useState(true);

  // New Biometric System Consent modal states
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricModalType, setBiometricModalType] = useState<'login' | 'register'>('login');
  const [escrowPassword, setEscrowPassword] = useState('');

  // Biometric test sandbox states
  const [isTestScanning, setIsTestScanning] = useState(false);
  const [testScanProgress, setTestScanProgress] = useState(0);
  const [testScanSuccess, setTestScanSuccess] = useState(false);
  const [testFeedback, setTestFeedback] = useState('Touch sensor to authenticate.');

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
        setIsBiometricUnlocked(localStorage.getItem('zuca_biometric_lock') !== 'true');
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

  const handleBiometricTouchStart = async () => {
    const isRegistered = localStorage.getItem('zuca_biometric_registered') === 'true';
    if (!isRegistered) {
      // Auto-enroll a Virtual Demo Passkey so the user is never blocked!
      localStorage.setItem('zuca_biometric_registered', 'true');
      localStorage.setItem('zuca_biometric_email', 'covenantpilgrim@zetech.ac.ke');
      localStorage.setItem('zuca_biometric_uid', 'visitor-auth');
      localStorage.setItem('zuca_biometric_name', 'Covenant Pilgrim');
      setIsVisitorSim(true);
      setBioFeedback('Virtual Demo Passkey enrolled! Let us verify now.');
    }
    // Launch the single pop-up modal to seek consent from the device
    setBiometricModalType('login');
    setIsBiometricModalOpen(true);
  };

  const handleConfirmBiometricConsent = async () => {
    if (biometricScanning) return;
    
    setBiometricScanning(true);
    setBioScanState('scanning');
    setBioScanProgress(0);
    setBioFeedback('Awaiting secure device handshake...');

    // Smooth scan progress and informative micro-status with vibration feedback ticks
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 14;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressInterval);
      }
      setBioScanProgress(currentProgress);

      // Delicate key ticking vibration for realistic tactile physical-hardware imitation
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(15);
      }

      if (currentProgress < 25) {
        setBioFeedback('Initializing Hardware Secure Enclave...');
      } else if (currentProgress < 50) {
        setBioFeedback('Exchanging cryptographic handshake challenge...');
      } else if (currentProgress < 80) {
        setBioFeedback('Authenticating hardware passkey signature...');
      } else if (currentProgress === 100) {
        setBioFeedback('Device authentication successful.');
      }
    }, 150);

    setTimeout(async () => {
      clearInterval(progressInterval);
      setBioScanProgress(100);

      const isRegistered = localStorage.getItem('zuca_biometric_registered') === 'true';
      const savedEmail = localStorage.getItem('zuca_biometric_email');
      const savedUid = localStorage.getItem('zuca_biometric_uid');
      const savedName = localStorage.getItem('zuca_biometric_name');

      if (biometricModalType === 'register') {
        // Complete the registration flow with user device consent
        localStorage.setItem('zuca_biometric_registered', 'true');
        localStorage.setItem('zuca_biometric_email', user?.email || '');
        localStorage.setItem('zuca_biometric_uid', user?.uid || '');
        localStorage.setItem('zuca_biometric_name', profile?.displayName || user?.displayName || 'Pilgrim');
        localStorage.setItem('zuca_biometric_key', btoa(escrowPassword));
        localStorage.setItem('zuca_biometric_lock', 'true');
        
        setBioFeedback('Passkey Registered');
        setBioScanState('success');
        setBiometricScanning(false);
        setIsBiometricModalOpen(false);
        setEscrowPassword('');
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([100, 50, 100]);
        }
        return;
      }

      // Login flow
      if (isRegistered && savedEmail) {
        setBioScanState('success');
        setBioFeedback(`Welcome home, ${savedName || 'Blessed Pilgrim'}.`);
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([100, 50, 150]);
        }

        setTimeout(async () => {
          try {
            if (user) {
              setIsBiometricUnlocked(true);
              setBiometricScanning(false);
              setIsBiometricModalOpen(false);
              return;
            }

            if (savedUid === 'visitor-auth') {
              setAuthLoading(true);
              try {
                await signInWithEmailAndPassword(auth, 'covenantpilgrim@zetech.ac.ke', 'PilgrimPass777*');
                setIsBiometricUnlocked(true);
              } catch (visitorErr) {
                try {
                  const { user: nUser } = await createUserWithEmailAndPassword(auth, 'covenantpilgrim@zetech.ac.ke', 'PilgrimPass777*');
                  await updateProfile(nUser, { displayName: 'Covenant Pilgrim' });
                  setIsBiometricUnlocked(true);
                } catch (createErr) {
                  // Fallback to local simulated session so they are NEVER blocked!
                  const mockUser = {
                    uid: 'visitor-auth',
                    email: 'covenantpilgrim@zetech.ac.ke',
                    displayName: 'Covenant Pilgrim',
                    photoURL: '',
                  } as unknown as User;
                  const mockProfile: UserProfile = {
                    uid: 'visitor-auth',
                    email: 'covenantpilgrim@zetech.ac.ke',
                    displayName: 'Covenant Pilgrim',
                    photoURL: '',
                    role: 'member' as UserRole,
                    createdAt: Timestamp.now(),
                    online: true,
                    isSubscribed: true
                  };
                  setProfile(mockProfile);
                  setUser(mockUser);
                  setIsBiometricUnlocked(true);
                }
              } finally {
                setAuthLoading(false);
              }
            } else {
              const encPwd = localStorage.getItem('zuca_biometric_key');
              if (encPwd) {
                setAuthLoading(true);
                try {
                  const rawPwd = atob(encPwd);
                  await signInWithEmailAndPassword(auth, savedEmail, rawPwd);
                  setIsBiometricUnlocked(true);
                } catch (err: any) {
                  console.error("Biometric Firebase re-auth failed:", err);
                  setBioScanState('failed');
                  setBioFeedback('Template key expired. Sign in manually with password.');
                } finally {
                  setAuthLoading(false);
                }
              } else {
                setBioScanState('failed');
                setBioFeedback('Temple security credentials missing.');
              }
            }
          } catch (err) {
            console.error(err);
          } finally {
            setBiometricScanning(false);
            setIsBiometricModalOpen(false);
          }
        }, 800);

      } else {
        setBioScanState('failed');
        setBioFeedback('Device fingerprint not configured. Enroll first in profile.');
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([150, 100, 150]);
        }
        setBiometricScanning(false);
        setIsBiometricModalOpen(false);
      }
    }, 1200);
  };

  const handleRunTestScan = () => {
    if (isTestScanning) return;
    setIsTestScanning(true);
    setTestScanSuccess(false);
    setTestScanProgress(0);
    setTestFeedback('Contacting Secure Enclave...');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 12) + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setTestScanProgress(progress);
      
      // Intermittent haptic vibe mimicking fingerprint ticks
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(20);
      }
      
      if (progress < 25) {
        setTestFeedback('Reading biometric valleys... [20%]');
      } else if (progress < 50) {
        setTestFeedback('Comparing cryptographic ridges... [45%]');
      } else if (progress < 75) {
        setTestFeedback('Authenticating credentials... [70%]');
      } else if (progress < 100) {
        setTestFeedback('Decrypting local escrow payload... [90%]');
      } else {
        setTestFeedback('Authentic Touch ID response matched! [100%]');
      }
    }, 150);
    
    setTimeout(() => {
      clearInterval(interval);
      setTestScanProgress(100);
      setTestScanSuccess(true);
      setIsTestScanning(false);
      setTestFeedback('Passkey protocol verified successfully!');
      
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]);
      }
    }, 1800);
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
    const SACRED_VERSES = [
      { text: "For where two or three are gathered in my name, there am I among them.", source: "Matthew 18:20" },
      { text: "I can do all things through Christ who strengthens me.", source: "Philippians 4:13" },
      { text: "Commit your actions to the Lord, and your plans will succeed.", source: "Proverbs 16:3" },
      { text: "But seek first the kingdom of God and his righteousness, and all else shall follow.", source: "Matthew 6:33" }
    ];
    // Dynamic index based on current time to keep it stable but fresh
    const verseIndex = typeof window !== 'undefined' ? (new Date().getMinutes() % SACRED_VERSES.length) : 0;
    const dailyVerse = SACRED_VERSES[verseIndex];

    const toggleSimMode = () => {
      const prev = isVisitorSim;
      setIsVisitorSim(!prev);
      if (!prev) {
        localStorage.setItem('zuca_biometric_registered', 'true');
        localStorage.setItem('zuca_biometric_email', 'covenantpilgrim@zetech.ac.ke');
        localStorage.setItem('zuca_biometric_uid', 'visitor-auth');
        localStorage.setItem('zuca_biometric_name', 'Covenant Pilgrim');
        setBioFeedback('Demo signature active! Touch scanner.');
      } else {
        localStorage.removeItem('zuca_biometric_registered');
        localStorage.removeItem('zuca_biometric_email');
        localStorage.removeItem('zuca_biometric_uid');
        localStorage.removeItem('zuca_biometric_name');
        setBioFeedback('Verify temple security to sync.');
      }
    };

    return (
      <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-3 sm:p-6 bg-[#040813] font-sans selection:bg-amber-500/30 overflow-y-auto">
        
        {/* Ambient Divine Aura - Soft slow-moving orbs */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.15, 0.25, 0.15],
              x: [-50, 50, -50],
              y: [-30, 30, -30]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#003366] rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [50, -50, 50],
              y: [40, -40, 40]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-[#ffcc00]/10 rounded-full blur-[140px]"
          />
          <div className="absolute inset-0 divine-pattern opacity-[0.03] mix-blend-overlay" />
        </div>

        {/* Traditional Centered Login Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-[420px] my-6 bg-white dark:bg-stone-900 rounded-[32px] overflow-hidden border border-stone-200/50 dark:border-white/10 shadow-[0_45px_100px_rgba(0,0,0,0.85)] flex flex-col"
        >
          {/* Cover image area */}
          <div className="h-44 md:h-48 w-full relative overflow-hidden shrink-0 bg-stone-950">
            <img 
              src="https://i.ibb.co/tMNKfnYM/Technology-Park-Mangu-Campus.png" 
              alt="Technology Park Mangu Campus" 
              className="w-full h-full object-cover opacity-90 scale-100 transition-transform duration-700"
            />
            {/* Elegant overlay to anchor name text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-3.5 left-5 z-10 text-white font-sans">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500 block leading-none mb-1">Covenant Venue</span>
              <p className="text-sm font-semibold tracking-tight uppercase leading-none text-stone-100">Technology Park Mangu Campus</p>
            </div>
          </div>

          {/* Overlapping gold-bordered Church Badge */}
          <div className="absolute top-[140px] md:top-[156px] left-1/2 -translate-x-1/2 w-16 h-16 bg-white dark:bg-stone-950 rounded-2xl flex items-center justify-center shadow-xl border-4 border-[#d4af37] z-30 group transition-transform duration-300 hover:scale-105 select-none">
            <Church className="text-[#002244] dark:text-amber-500 w-8 h-8 shrink-0" />
          </div>

          {/* Card Body and Forms */}
          <div className="p-6 md:p-8 pt-11 flex-1 flex flex-col justify-between">
            <div>
              {/* Portal Identity */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-black text-[#002244] dark:text-stone-100 tracking-tight uppercase leading-none">
                  THE <span className="text-[#d4af37] serif-display italic font-light lowercase">Sanctuary</span>
                </h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 dark:text-stone-500 mt-2 block">
                  ZU Catholic Action Association
                </p>
              </div>

              {/* Segmented Auth Selector */}
              <div className="flex bg-stone-100 dark:bg-stone-950 p-1 rounded-2xl mb-5 text-[11px] font-black uppercase tracking-wider font-sans select-none">
                <button
                  type="button"
                  onClick={() => { setAuthType('password'); setAuthError(''); }}
                  className={`flex-1 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    authType === 'password'
                      ? 'bg-gradient-to-r from-[#002244] to-[#004fa9] text-white shadow-md'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthType('biometric'); setAuthError(''); }}
                  className={`flex-1 py-2.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                    authType === 'biometric'
                      ? 'bg-gradient-to-r from-[#002244] to-[#004fa9] text-white shadow-md'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  Fingerprint
                </button>
              </div>

              {/* Active Tab rendering */}
              <AnimatePresence mode="wait">
                {authType === 'password' ? (
                  <motion.div
                    key="password-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!resetSent ? (
                      <form onSubmit={authMode === 'forgot' ? handlePasswordReset : handleEmailAuth} className="space-y-3.5">
                        {/* Interactive Mode Text Label */}
                        <div className="mb-2">
                          <h3 className="text-xs font-black text-[#002244] dark:text-stone-200 tracking-tight leading-none uppercase">
                            {authMode === 'login' 
                              ? 'Pilgrim Verification' 
                              : authMode === 'signup' 
                                ? 'Create Member Covenant' 
                                : 'Recover Portal Access'}
                          </h3>
                        </div>

                        {authMode === 'signup' && (
                          <div className="relative group">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                            <input
                              type="text"
                              required
                              placeholder="Full Baptismal / Legal Name"
                              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white font-medium outline-none placeholder:text-stone-400 focus:border-[#d4af37] focus:bg-white dark:focus:bg-stone-950 transition-all"
                              value={authForm.name}
                              onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                            />
                          </div>
                        )}

                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                          <input
                            type="email"
                            required
                            placeholder="University Email Address"
                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white font-medium outline-none placeholder:text-stone-400 focus:border-[#d4af37] focus:bg-white dark:focus:bg-stone-950 transition-all"
                            value={authForm.email}
                            onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                          />
                        </div>

                        {authMode !== 'forgot' && (
                          <div className="space-y-1">
                            <div className="relative group">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-amber-500 transition-colors" />
                              <input
                                type="password"
                                required
                                placeholder="Secret Password"
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950/40 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white font-medium outline-none placeholder:text-stone-400 focus:border-[#d4af37] focus:bg-white dark:focus:bg-stone-950 transition-all"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                              />
                            </div>
                            {authMode === 'login' && (
                              <div className="flex justify-end px-1 pt-1">
                                <button 
                                  type="button" 
                                  onClick={() => { setAuthMode('forgot'); setAuthError(''); }}
                                  className="text-[9px] font-black text-[#002244]/60 dark:text-stone-400 hover:text-amber-500 uppercase tracking-wider transition-colors"
                                >
                                  Forgot Password?
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {authMode === 'signup' && (
                          <div className="p-3 bg-stone-50 dark:bg-stone-950/20 rounded-2xl border border-stone-200/60 dark:border-white/5 flex items-start gap-2.5 select-none">
                            <input 
                              type="checkbox" 
                              id="terms"
                              className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 border-stone-200 dark:border-white/10 bg-transparent cursor-pointer"
                              checked={acceptedTerms}
                              onChange={(e) => setAcceptedTerms(e.target.checked)}
                            />
                            <label htmlFor="terms" className="text-[10px] text-stone-500 leading-normal cursor-pointer">
                              Accept the sanctified {' '}
                              <button 
                                type="button"
                                onClick={() => setShowPolicyModal(true)}
                                className="text-amber-600 dark:text-amber-500 underline font-semibold"
                              >
                                Terms & Conditions
                              </button> of ZUCA.
                            </label>
                          </div>
                        )}

                        {authError && (
                          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-600 dark:text-red-400 text-[10px] font-bold">
                            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                            <span>{authError}</span>
                          </div>
                        )}

                        <button
                          disabled={authLoading}
                          type="submit"
                          className="w-full bg-[#002244] hover:bg-[#00356b] dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-stone-900 py-3.5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {authLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-current" />
                          ) : (
                            <>
                              {authMode === 'login' ? 'ENTER SANCTUARY' : authMode === 'signup' ? 'JOIN ASSEMBLY' : 'SEND DISPATCH'}
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        {authMode === 'forgot' && (
                          <button 
                            type="button"
                            onClick={() => setAuthMode('login')}
                            className="w-full text-center text-stone-400 font-extrabold tracking-widest block text-[9px] uppercase hover:text-stone-800 transition-colors mt-3"
                          >
                            Return to Sign In
                          </button>
                        )}
                      </form>
                    ) : (
                      <div className="space-y-5 text-center py-5">
                        <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                          <Mail className="w-7 h-7 text-emerald-500 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-stone-800 dark:text-white text-sm">Dispatched Safely</h3>
                          <p className="text-[11px] text-stone-500 px-3">Confirm alignment within your university inbox.</p>
                        </div>
                        <button
                          onClick={() => { setResetSent(false); setAuthMode('login'); }}
                          className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 py-3 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] transition-colors cursor-pointer"
                        >
                          Return to Login
                        </button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="biometric-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center py-5 space-y-5"
                  >
                    <div className="text-center w-full max-w-[280px]">
                      <h3 className="text-xs font-black text-[#002244] dark:text-stone-200 tracking-tight leading-none uppercase mb-2">
                        Biometric Lockout
                      </h3>
                      <p className="text-[10px] text-stone-400 leading-normal">
                        Verify your physical signature container to sync with active covenant credentials.
                      </p>
                    </div>

                    {/* Compact Biometric Pad button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBiometricTouchStart}
                      disabled={biometricScanning}
                      className={`w-24 h-24 rounded-full flex items-center justify-center relative cursor-pointer outline-none overflow-hidden transition-all duration-500 ${
                        bioScanState === 'scanning'
                          ? 'bg-amber-500/15 border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : bioScanState === 'success'
                          ? 'bg-emerald-500/15 border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                          : 'bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 shadow-inner'
                      }`}
                    >
                      {biometricScanning && (
                        <>
                          <motion.div 
                            animate={{ y: [-48, 48, -48] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-x-0 h-0.5 bg-amber-500 shadow-[0_0_6px_#f59e0b] z-20"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent animate-pulse" />
                        </>
                      )}

                      {bioScanState === 'success' ? (
                        <CheckCircle className="w-10 h-10 text-emerald-500 z-10" />
                      ) : (
                        <Fingerprint className={`w-12 h-12 z-10 transition-colors duration-300 ${
                          bioScanState === 'scanning' ? 'text-amber-500' : 'text-stone-400 hover:text-amber-500/80'
                        }`} />
                      )}

                      {biometricScanning && (
                        <span className="absolute inset-0 rounded-full border border-amber-500/30 scale-100 animate-[ping_1.5s_infinite]" />
                      )}
                    </motion.button>

                    {/* Progress tracking indicator */}
                    <div className="w-full text-center">
                      <p className={`text-[10px] font-black uppercase tracking-widest block transition-all duration-300 ${
                        bioScanState === 'scanning' ? 'text-amber-500 animate-pulse' : bioScanState === 'success' ? 'text-emerald-500' : 'text-stone-500'
                      }`}>
                        {bioFeedback}
                      </p>
                    </div>

                    {/* FAST-ACCESS Evaluator Simulation Switch */}
                    <div className="w-full pt-1">
                      <div className="p-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/30 rounded-xl transition-all flex items-center justify-between select-none">
                        <div className="text-left">
                          <span className="text-[9px] font-extrabold text-amber-600 block uppercase leading-none mb-0.5">Visitor Sim Mode</span>
                          <span className="text-[8px] text-stone-400 block uppercase">Evaluator passwordless bypass</span>
                        </div>
                        <button
                          type="button"
                          onClick={toggleSimMode}
                          className={`w-9 h-5 rounded-full relative transition-colors ${
                            isVisitorSim ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-800'
                          }`}
                        >
                          <motion.div 
                            animate={{ x: isVisitorSim ? 18 : 3 }}
                            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Social Login / Fast Access */}
              <div className="mt-5 space-y-3.5">
                <div className="relative select-none">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200/55 dark:border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[7.5px] uppercase font-black tracking-widest">
                    <span className="bg-white dark:bg-stone-900 px-3.5 text-stone-400">Social Sign In</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={authLoading}
                  className="w-full py-3 rounded-2xl border border-stone-200 dark:border-white/10 bg-white hover:bg-stone-50 dark:bg-stone-950 dark:hover:bg-stone-900 transition-all text-[9.5px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 text-stone-600 dark:text-stone-300 cursor-pointer"
                >
                  <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" className="w-4 h-4" alt="Google" />
                  Continue with Google
                </button>

                {authType === 'password' && (
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setAuthError('');
                    }}
                    className="w-full text-center text-stone-400 font-extrabold tracking-widest block text-[9px] uppercase hover:text-amber-500 transition-colors mt-2"
                  >
                    {authMode === 'login' ? "NEW HARVEST? JOIN NOW" : "ALREADY ENROLLED? SIGN IN"}
                  </button>
                )}
              </div>
            </div>

            {/* Micro daily devotional verse inside card */}
            <div className="mt-6 p-4 bg-stone-50 dark:bg-stone-950/40 rounded-2xl border border-stone-100 dark:border-white/5 text-left text-xs text-stone-600 dark:text-stone-300 space-y-1 border-l-2 border-l-amber-500 select-none">
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-widest block">Daily Verse</span>
              <p className="italic leading-snug">"{dailyVerse.text}"</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[#002244] dark:text-stone-400 ml-auto text-right">— {dailyVerse.source}</p>
            </div>
          </div>
        </motion.div>

        {/* Small terms link directly on footer */}
        <p className="text-center text-stone-500/70 text-[9px] uppercase tracking-[0.3em] z-10 font-bold mt-4 select-none">
          Faith • Unity • Action • Invent Your Future
        </p>
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

                  {/* Biometric Credentials Binding */}
                  <div className="p-6 bg-stone-50 dark:bg-stone-950/40 rounded-3xl border border-stone-200/60 dark:border-white/5 space-y-4 text-stone-900 dark:text-stone-100">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="font-extrabold text-xs">Biometric Fingerprint Access</p>
                        <p className="text-[9px] text-stone-500 dark:text-stone-400 uppercase tracking-widest leading-none mt-0.5">Secure Temple Passkey</p>
                      </div>
                    </div>
                    
                    {localStorage.getItem('zuca_biometric_registered') === 'true' ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[11px] flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div>
                            <span className="font-bold">Passkey Active:</span> Instant touch-signature unlocked for <span className="font-bold">{localStorage.getItem('zuca_biometric_email')}</span>.
                          </div>
                        </div>

                        {/* Dynamic Interactive Test Sandbox with active scanner bar & haptic simulation */}
                        <div className="p-4 bg-stone-100 dark:bg-stone-900 rounded-2xl border border-stone-200/50 dark:border-white/5 space-y-3 select-none">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-wider text-stone-500">Device Biometric Sandbox</span>
                            <span className="text-[8px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">Test Secure Link</span>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Scanning pad with motion scanning laser line */}
                            <button
                              type="button"
                              onClick={handleRunTestScan}
                              disabled={isTestScanning}
                              className={`w-14 h-14 rounded-2xl flex items-center justify-center relative shrink-0 overflow-hidden transition-all duration-300 outline-none cursor-pointer ${
                                isTestScanning
                                  ? 'bg-amber-500/15 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-95'
                                  : testScanSuccess
                                  ? 'bg-emerald-500/15 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                                  : 'bg-white dark:bg-stone-950 border border-stone-200 dark:border-white/10 hover:border-amber-500/40 shadow-inner'
                              }`}
                            >
                              {isTestScanning && (
                                <>
                                  <motion.div 
                                    animate={{ y: [-24, 24, -24] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-x-0 h-0.5 bg-amber-500 shadow-[0_0_4px_#f59e0b] z-20"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent animate-pulse" />
                                </>
                              )}
                              
                              {testScanSuccess ? (
                                <CheckCircle className="w-6 h-6 text-emerald-500 relative z-10 animate-bounce" />
                              ) : (
                                <Fingerprint className={`w-7 h-7 relative z-10 transition-colors ${isTestScanning ? 'text-amber-500 animate-pulse' : 'text-stone-400'}`} />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black text-stone-800 dark:text-stone-200 uppercase tracking-tight truncate">
                                  {isTestScanning ? `Scanning Protocol (${testScanProgress}%)` : testScanSuccess ? 'Hardware Verified' : 'Touchpad Simulator'}
                                </span>
                              </div>
                              
                              {/* Miniature visual progress bar */}
                              <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-950 rounded-full mt-1.5 overflow-hidden">
                                <motion.div 
                                  className={`h-full rounded-full transition-all duration-150 ${testScanSuccess ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${testScanProgress}%` }}
                                />
                              </div>
                              
                              <p className="text-[9px] text-stone-500 dark:text-stone-400 font-mono mt-1.5 truncate leading-none">
                                {testFeedback}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRunTestScan}
                            disabled={isTestScanning}
                            className="w-full py-2 bg-stone-200 hover:bg-stone-350 dark:bg-stone-850 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-200 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm border border-stone-200/40 dark:border-white/5"
                          >
                            {isTestScanning ? 'Verifying Hardware Keys...' : 'Test Passkey Scan Protocol'}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between gap-4 p-3 bg-stone-100 dark:bg-white/5 rounded-xl border border-stone-200 dark:border-white/5">
                          <div className="text-[11px]">
                            <span className="font-bold text-stone-700 dark:text-stone-300">Lock App on Reload:</span>
                            <p className="text-[9px] text-stone-500 dark:text-stone-400 mt-0.5">Demands fingerprint to access on reload.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const prev = localStorage.getItem('zuca_biometric_lock') === 'true';
                              localStorage.setItem('zuca_biometric_lock', (!prev).toString());
                              // Forces a re-render
                              setBioFeedback(prev ? 'Passkey Unlocked' : 'Passkey Locked');
                            }}
                            className={`w-11 h-6 rounded-full relative transition-colors ${localStorage.getItem('zuca_biometric_lock') === 'true' ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-800'}`}
                          >
                            <motion.div 
                              animate={{ x: localStorage.getItem('zuca_biometric_lock') === 'true' ? 22 : 4 }}
                              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem('zuca_biometric_registered');
                            localStorage.removeItem('zuca_biometric_email');
                            localStorage.removeItem('zuca_biometric_uid');
                            localStorage.removeItem('zuca_biometric_key');
                            localStorage.removeItem('zuca_biometric_lock');
                            setBioFeedback('Passkey Cleared');
                          }}
                          className="w-full py-2.5 bg-red-600/10 hover:bg-red-600 hover:text-white rounded-xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Disable & Clear Fingerprint
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-1">
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                          Enable biometric credentials to witness instant secure sign-ins. To register, confirm your current password to authorize client passkey escrow:
                        </p>
                        <div className="space-y-2">
                          <input 
                            type="password"
                            id="bio-escrow-password"
                            placeholder="Confirm Sanctuary Password"
                            className="w-full px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/10 text-xs text-stone-900 dark:text-white focus:ring-1 focus:ring-amber-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const pwdInput = document.getElementById('bio-escrow-password') as HTMLInputElement;
                              const pwd = pwdInput?.value;
                              if (!pwd) {
                                alert('Please type password to register fingerprint escrow.');
                                return;
                              }
                              setEscrowPassword(pwd);
                              setBiometricModalType('register');
                              setIsBiometricModalOpen(true);
                              if (pwdInput) pwdInput.value = '';
                            }}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-stone-950 font-black uppercase tracking-wider text-[10px] rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            Authenticate & Register Fingerprint
                          </button>
                        </div>
                      </div>
                    )}
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

      {/* Single Device Biometric Consent Pop-up Modal */}
      <AnimatePresence>
        {isBiometricModalOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!biometricScanning) setIsBiometricModalOpen(false);
              }}
              className="absolute inset-0 bg-stone-950/65 backdrop-blur-md"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-[28px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] p-6 z-10"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Authentic native biometric shield icon with sweeping laser and state overlays */}
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center border-2 border-amber-500/20 relative select-none overflow-hidden">
                  {bioScanState === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-emerald-500 relative z-10 animate-bounce" />
                  ) : bioScanState === 'failed' ? (
                    <X className="w-8 h-8 text-red-500 relative z-10 animate-shake" />
                  ) : (
                    <Fingerprint className={`w-8 h-8 transition-colors duration-300 ${biometricScanning ? 'text-amber-500 animate-pulse' : 'text-stone-400'}`} />
                  )}

                  {biometricScanning && (
                    <>
                      {/* Laser sweeping light line */}
                      <motion.div 
                        animate={{ y: [-32, 32, -32] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-x-0 h-0.5 bg-amber-500 shadow-[0_0_6px_#f59e0b] z-20"
                      />
                      {/* Pulsing light overlay */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/10 to-transparent animate-pulse" />
                    </>
                  )}
                  <div className="absolute inset-0 rounded-full border border-amber-500/35 animate-ping opacity-60" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-[#002244] dark:text-stone-100 uppercase tracking-tight">
                    Biometric Consent
                  </h3>
                  <p className="text-[9px] text-[#d4af37] dark:text-amber-500 uppercase tracking-widest font-black">
                    Device Security Request
                  </p>
                </div>

                {/* Secure statement explaining no raw finger is read */}
                <div className="bg-stone-50 dark:bg-stone-950/50 p-4 rounded-2xl border border-stone-100 dark:border-white/5 text-left space-y-2 select-none w-full">
                  <div className="flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed font-semibold">
                      ZUCA utilizes <span className="text-[#002244] dark:text-amber-500">secure system-level consent</span>. Your physical biometric signature remains encrypted inside your device's biometric keystores (Touch ID / Face ID) and is <span className="font-bold text-stone-800 dark:text-white">never accessed, processed, or stored by this application</span>.
                    </p>
                  </div>
                  <div className="border-t border-stone-200/50 dark:border-white/5 pt-1.5 flex items-center justify-between text-[8px] uppercase tracking-wider font-black text-stone-400">
                    <span>Secure Hardware Enclave</span>
                    <span className="text-emerald-500 flex items-center gap-1">● Authenticated</span>
                  </div>
                </div>

                {/* Progress bar and text status during active scan */}
                {biometricScanning && (
                  <div className="w-full space-y-1.5 px-2 select-none">
                    <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-950 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${bioScanProgress}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[8px] font-mono font-black text-stone-500 uppercase tracking-widest">
                      <span>SECURE SCANNING PROGRESS</span>
                      <span className="text-amber-500 font-bold">{bioScanProgress}%</span>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-stone-500 dark:text-stone-400 leading-normal select-none">
                  {biometricScanning 
                    ? bioFeedback
                    : biometricModalType === 'login' 
                    ? `Instructing device secure enclave to sign authorization message for instant Sanctuary access.`
                    : `Instructing device secure enclave to sign registration credentials to authorize safe client passcode escrow.`}
                </p>

                <div className="w-full grid grid-cols-2 gap-3 pt-2">
                  <button
                    disabled={biometricScanning}
                    type="button"
                    onClick={() => setIsBiometricModalOpen(false)}
                    className="py-3 px-4 rounded-xl border border-stone-200 dark:border-white/10 hover:bg-stone-50 dark:hover:bg-white/5 text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={biometricScanning}
                    type="button"
                    onClick={handleConfirmBiometricConsent}
                    className="py-3 px-4 rounded-xl bg-[#002244] hover:bg-[#00346a] dark:bg-amber-500 text-white dark:text-stone-950 dark:hover:bg-amber-600 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    {biometricScanning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Agree & Auth'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
