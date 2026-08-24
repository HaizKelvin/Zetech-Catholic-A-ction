import React, { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  TwitterAuthProvider,
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
  getDocs,
  setDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  collection,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, OperationType, AppNotification } from './types';
import { 
  handleFirestoreError, 
  compressImage, 
  formatAuthError, 
  checkFirebaseConnection, 
  FormattedAuthError, 
  validateEmailPattern, 
  isValidEmail,
  getPasswordStrength
} from './utils';
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
  CheckCircle2,
  Lock,
  Unlock,
  ScanLine,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  Camera,
  Upload
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

  // Update URL and state instantaneously when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Toggle About dropdown if clicking about
    if (tab === 'about') {
      setIsAboutOpen(prev => !prev);
    }

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      if (window.history.state?.tab !== tab) {
        window.history.replaceState({ tab }, '', url.toString());
      }
    } catch (_) {}
    
    // Instant scroll to top with zero delay
    window.scrollTo(0, 0);
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;

    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [authView, setAuthView] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authActionLoading, setAuthActionLoading] = useState<'signin' | 'signup' | 'google' | 'twitter' | 'reset' | 'instant-admin' | 'instant-demo' | null>(null);
  const [signInForm, setSignInForm] = useState({ identifier: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    admissionNumber: '', 
    password: ''
  });
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [formattedError, setFormattedError] = useState<FormattedAuthError | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    ok: boolean;
    checking: boolean;
    message: string;
    details?: string;
  }>({
    ok: true,
    checking: false,
    message: 'Connected'
  });

  const runConnectionCheck = async () => {
    setConnectionStatus(prev => ({ ...prev, checking: true, message: 'Testing Firebase...' }));
    const res = await checkFirebaseConnection();
    setConnectionStatus({
      ok: res.ok,
      checking: false,
      message: res.ok ? 'Firebase Connected' : 'Cannot Connect to Firebase',
      details: res.message
    });
  };

  useEffect(() => {
    runConnectionCheck();
  }, []);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
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
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

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
        // Immediate fallback profile to prevent blank screens or logout loops
        const fallbackProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Blessed Member',
          photoURL: firebaseUser.photoURL || '',
          role: firebaseUser.email === 'wachirakevin65@gmail.com' ? 'admin' : 'member',
          createdAt: Timestamp.now(),
          online: true,
          isSubscribed: true
        };
        // Set profile optimistically and unblock UI immediately
        setProfile(fallbackProfile);
        setLoading(false);

        // Update presence in background
        const presenceDocRef = doc(db, 'users', firebaseUser.uid);
        updateDoc(presenceDocRef, { online: true, lastSeen: serverTimestamp() }).catch(() => {});

        // Set offline on disconnect/visibility change
        const setOffline = () => {
          updateDoc(presenceDocRef, { online: false, lastSeen: serverTimestamp() }).catch(() => {});
        };
        
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            setOffline();
          } else {
            updateDoc(presenceDocRef, { online: true, lastSeen: serverTimestamp() }).catch(() => {});
          }
        };

        window.addEventListener('beforeunload', setOffline);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Check/create initial profile non-blockingly
        fetchOrCreateProfile(firebaseUser).catch(() => {});
        
        // Listen for live profile updates
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        profileUnsubscribe = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
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
          console.warn('Profile listener notice:', error);
        });
      } else {
        setProfile(null);
        profileUnsubscribe();
        setLoading(false);
      }
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
        profileData.displayName = firebaseUser.displayName || signUpForm.name || 'Blessed Member';
        profileData.photoURL = firebaseUser.photoURL || '';
        if (signUpForm.phone) {
          profileData.contactNumber = signUpForm.phone.trim();
          profileData.phone = signUpForm.phone.trim();
          const pCheck = normalizePhoneNumber(signUpForm.phone);
          if (pCheck.isValid) profileData.phoneNumber = pCheck.cleanDigits;
        }
        if (signUpForm.admissionNumber) {
          profileData.admissionNumber = signUpForm.admissionNumber.trim().toUpperCase();
        }
        profileData.role = firebaseUser.email === 'wachirakevin65@gmail.com' ? 'admin' : 'member';
        profileData.createdAt = serverTimestamp();
        profileData.bio = 'Walking in faith with ZUCA.';
        profileData.isSubscribed = true;
      } else {
        const existingData = userDoc.data();
        if (!existingData?.photoURL && firebaseUser.photoURL) {
          profileData.photoURL = firebaseUser.photoURL;
        }
        if (!existingData?.displayName && firebaseUser.displayName) {
          profileData.displayName = firebaseUser.displayName;
        }
      }

      await setDoc(userDocRef, profileData, { merge: true });
      
      setProfile((prev) => ({
        ...(prev || {}),
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: profileData.displayName || firebaseUser.displayName || prev?.displayName || 'Blessed Member',
        photoURL: profileData.photoURL || firebaseUser.photoURL || prev?.photoURL || '',
        contactNumber: profileData.contactNumber || prev?.contactNumber || '',
        phoneNumber: profileData.phoneNumber || prev?.phoneNumber || '',
        phone: profileData.phone || prev?.phone || '',
        admissionNumber: profileData.admissionNumber || prev?.admissionNumber || '',
        role: (firebaseUser.email === 'wachirakevin65@gmail.com' ? 'admin' : (userDoc.exists() ? userDoc.data()?.role : 'member')) || 'member',
        bio: profileData.bio || prev?.bio || 'Walking in faith with ZUCA.',
        createdAt: prev?.createdAt || Timestamp.now(),
        online: true
      } as UserProfile));

      if (isNewUser) {
        try {
          const welcomeDocRef = doc(collection(db, 'notifications'));
          await setDoc(welcomeDocRef, {
            userId: firebaseUser.uid,
            title: 'Welcome Home',
            message: `Peace be with you, ${(profileData.displayName || 'Pilgrim').split(' ')[0]}. Welcome to our digital sanctuary. Your journey with ZUCA starts here.`,
            type: 'announcement',
            isRead: false,
            timestamp: serverTimestamp()
          });
        } catch (notifErr) {
          console.warn("Welcome notification creation notice:", notifErr);
        }
      }
    } catch (error) {
       console.warn("Profile sync error handled:", error);
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

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoUploadError('Please select a valid image (PNG, JPG, WEBP).');
      return;
    }

    setPhotoUploadError(null);
    setIsUploadingPhoto(true);
    setSavingState('saving');

    try {
      const compressed = await compressImage(file, 360, 360, 0.72);
      
      // Update local form and state immediately
      setEditForm(prev => ({ ...prev, photoURL: compressed }));
      setProfile(prev => prev ? ({ ...prev, photoURL: compressed }) : null);

      // Persist in Firestore
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { photoURL: compressed });
      }

      // Update Auth Profile if available
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: compressed }).catch(() => {});
      }

      setSavingState('saved');
      setTimeout(() => setSavingState('idle'), 2500);
    } catch (error: any) {
      console.error("Profile picture upload failed:", error);
      setPhotoUploadError('Failed to process image. Please try another photo.');
      setSavingState('error');
      if (user) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      }
    } finally {
      setIsUploadingPhoto(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveProfilePhoto = async () => {
    setPhotoUploadError(null);
    setIsUploadingPhoto(true);
    setSavingState('saving');
    try {
      setEditForm(prev => ({ ...prev, photoURL: '' }));
      setProfile(prev => prev ? ({ ...prev, photoURL: '' }) : null);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { photoURL: '' });
      }
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: '' }).catch(() => {});
      }

      setSavingState('saved');
      setTimeout(() => setSavingState('idle'), 2000);
    } catch (error) {
      console.error("Remove photo failed:", error);
      setSavingState('error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleInstantAdminLogin = async () => {
    setAuthLoading(true);
    setAuthActionLoading('instant-admin');
    setAuthError('');
    setFormattedError(null);
    const adminEmail = 'wachirakevin65@gmail.com';
    const defaultPass = 'ZucaAdmin2026!';
    try {
      try {
        await signInWithEmailAndPassword(auth, adminEmail, defaultPass);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
          const { user: newUser } = await createUserWithEmailAndPassword(auth, adminEmail, defaultPass);
          await updateProfile(newUser, { displayName: 'Kelvin Wachira' });
          const userDocRef = doc(db, 'users', newUser.uid);
          await setDoc(userDocRef, {
            uid: newUser.uid,
            email: adminEmail,
            displayName: 'Kelvin Wachira',
            role: 'admin',
            createdAt: serverTimestamp(),
            online: true,
            bio: 'ZUCA Administrator & Tech Leader'
          }, { merge: true });
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.error('Instant Admin Login Notice:', error);
      setSignInForm({ identifier: adminEmail, password: defaultPass });
      const formatted = formatAuthError(error);
      setFormattedError(formatted);
      setAuthError(formatted.message);
    } finally {
      setAuthLoading(false);
      setAuthActionLoading(null);
    }
  };

  const handleInstantDemoLogin = async () => {
    setAuthLoading(true);
    setAuthActionLoading('instant-demo');
    setAuthError('');
    setFormattedError(null);
    const demoEmail = 'guest.pilgrim@zetech.ac.ke';
    const demoPass = 'GuestPilgrim2026!';
    try {
      try {
        await signInWithEmailAndPassword(auth, demoEmail, demoPass);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
          const { user: newUser } = await createUserWithEmailAndPassword(auth, demoEmail, demoPass);
          await updateProfile(newUser, { displayName: 'Guest Pilgrim' });
          const userDocRef = doc(db, 'users', newUser.uid);
          await setDoc(userDocRef, {
            uid: newUser.uid,
            email: demoEmail,
            displayName: 'Guest Pilgrim',
            role: 'member',
            createdAt: serverTimestamp(),
            online: true,
            bio: 'Visiting ZUCA Sanctuary'
          }, { merge: true });
        } else if (err.code === 'auth/email-already-in-use') {
          await signInWithEmailAndPassword(auth, demoEmail, demoPass);
        } else {
          throw err;
        }
      }
    } catch (error: any) {
      console.error('Demo Login Notice:', error);
      setSignInForm({ identifier: demoEmail, password: demoPass });
      const formatted = formatAuthError(error);
      setFormattedError(formatted);
      setAuthError(formatted.message);
    } finally {
      setAuthLoading(false);
      setAuthActionLoading(null);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });
    setAuthLoading(true);
    setAuthActionLoading('google');
    setAuthError('');
    setFormattedError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setUser(result.user);
      }
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      const formatted = formatAuthError(error);
      setFormattedError(formatted);
      setAuthError(formatted.message);
      if (formatted.isConnectionError) {
        runConnectionCheck();
      }
    } finally {
      setAuthLoading(false);
      setAuthActionLoading(null);
    }
  };

  const handleTwitterLogin = async () => {
    const provider = new TwitterAuthProvider();
    setAuthLoading(true);
    setAuthActionLoading('twitter');
    setAuthError('');
    setFormattedError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Twitter/X Sign-In Error:', error);
      const formatted = formatAuthError(error);
      setFormattedError(formatted);
      setAuthError(formatted.message);
      if (formatted.isConnectionError) {
        runConnectionCheck();
      }
    } finally {
      setAuthLoading(false);
      setAuthActionLoading(null);
    }
  };

  const normalizePhoneNumber = (phone: string): { raw: string; cleanDigits: string; authEmail: string; isValid: boolean } => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (!digits || digits.length < 8) {
      return { raw: phone, cleanDigits: digits, authEmail: '', isValid: false };
    }
    let normalized = digits;
    if (digits.startsWith('0') && digits.length === 10) {
      normalized = '254' + digits.substring(1);
    }
    const authEmail = `phone.${normalized}@zuca.zetech.ac.ke`;
    return { raw: phone, cleanDigits: normalized, authEmail, isValid: true };
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawIdentifier = signInForm.identifier.trim();
    if (!rawIdentifier) {
      const err: FormattedAuthError = {
        title: 'Email or Phone Required',
        message: 'Please enter your email address or phone number.',
        isConnectionError: false,
        canRetry: true
      };
      setFormattedError(err);
      setAuthError(err.message);
      return;
    }

    if (!signInForm.password) {
      const err: FormattedAuthError = {
        title: 'Password Required',
        message: 'Please enter your account password.',
        isConnectionError: false,
        canRetry: true
      };
      setFormattedError(err);
      setAuthError(err.message);
      return;
    }

    setAuthLoading(true);
    setAuthActionLoading('signin');
    setAuthError('');
    setFormattedError(null);
    
    try {
      let authTarget = rawIdentifier;
      
      // If identifier doesn't contain '@', it's a phone number
      if (!rawIdentifier.includes('@')) {
        const phoneCheck = normalizePhoneNumber(rawIdentifier);
        if (phoneCheck.isValid) {
          try {
            const usersRef = collection(db, 'users');
            const q1 = query(usersRef, where('contactNumber', '==', rawIdentifier), limit(1));
            const snap1 = await getDocs(q1);
            if (!snap1.empty && snap1.docs[0].data()?.email) {
              authTarget = snap1.docs[0].data().email;
            } else {
              const q2 = query(usersRef, where('phoneNumber', '==', phoneCheck.cleanDigits), limit(1));
              const snap2 = await getDocs(q2);
              if (!snap2.empty && snap2.docs[0].data()?.email) {
                authTarget = snap2.docs[0].data().email;
              } else {
                authTarget = phoneCheck.authEmail;
              }
            }
          } catch (queryErr) {
            authTarget = phoneCheck.authEmail;
          }
        }
      } else {
        const emailValidation = validateEmailPattern(rawIdentifier);
        if (emailValidation.isValid) {
          authTarget = emailValidation.sanitized;
        }
      }

      try {
        await signInWithEmailAndPassword(auth, authTarget, signInForm.password);
      } catch (primaryErr: any) {
        // Fallback for phone login if primary email failed
        if (!rawIdentifier.includes('@')) {
          const phoneCheck = normalizePhoneNumber(rawIdentifier);
          if (phoneCheck.isValid && authTarget !== phoneCheck.authEmail) {
            await signInWithEmailAndPassword(auth, phoneCheck.authEmail, signInForm.password);
            return;
          }
        }
        throw primaryErr;
      }
    } catch (error: any) {
      console.error('Sign In Error:', error);
      const formatted = formatAuthError(error);
      setFormattedError(formatted);
      setAuthError(formatted.message);
      if (formatted.isConnectionError) {
        runConnectionCheck();
      }
    } finally {
      setAuthLoading(false);
      setAuthActionLoading(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Phone number is ESSENTIAL in sign up
    const phoneCheck = normalizePhoneNumber(signUpForm.phone);
    if (!phoneCheck.isValid) {
      const err: FormattedAuthError = {
        title: 'Phone Number Required',
        message: 'A valid mobile phone number (e.g. 0712345678 or 254712345678) is essential for ZUCA membership and instant ID card generation.',
        isConnectionError: false,
        canRetry: true
      };
      setFormattedError(err);
      setAuthError(err.message);
      return;
    }

    // 2. Full Name
    if (!signUpForm.name.trim() || signUpForm.name.trim().length < 2) {
      const err: FormattedAuthError = {
        title: 'Full Name Required',
        message: 'Please enter your full name.',
        isConnectionError: false,
        canRetry: true
      };
      setFormattedError(err);
      setAuthError(err.message);
      return;
    }

    // 3. Email validation (or fallback to phone-based auth email)
    let primaryEmail = signUpForm.email.trim();
    if (primaryEmail) {
      const emailValidation = validateEmailPattern(primaryEmail);
      if (!emailValidation.isValid) {
        const err: FormattedAuthError = {
          title: 'Invalid Email Pattern',
          message: emailValidation.error || 'Please enter a valid email address format.',
          isConnectionError: false,
          canRetry: true
        };
        setFormattedError(err);
        setAuthError(err.message);
        return;
      }
      primaryEmail = emailValidation.sanitized;
    } else {
      primaryEmail = phoneCheck.authEmail;
    }

    // 4. Terms agreement
    if (!acceptedTerms) {
      const err: FormattedAuthError = {
        title: 'Terms Agreement Required',
        message: 'Please agree to the Terms & Conditions of ZUCA to create your account.',
        isConnectionError: false,
        canRetry: true
      };
      setFormattedError(err);
      setAuthError(err.message);
      return;
    }

    // 5. Password
    if (!signUpForm.password || signUpForm.password.length < 6) {
      const err: FormattedAuthError = {
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters.',
        isConnectionError: false,
        canRetry: true
      };
      setFormattedError(err);
      setAuthError(err.message);
      return;
    }

    setAuthLoading(true);
    setAuthActionLoading('signup');
    setAuthError('');
    setFormattedError(null);
    
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, primaryEmail, signUpForm.password);
      if (signUpForm.name.trim()) {
        await updateProfile(newUser, { displayName: signUpForm.name.trim() }).catch(() => {});
      }

      // Persist full profile to Firestore immediately
      const userDocRef = doc(db, 'users', newUser.uid);
      await setDoc(userDocRef, {
        uid: newUser.uid,
        email: primaryEmail,
        displayName: signUpForm.name.trim() || 'Blessed Member',
        photoURL: '',
        contactNumber: signUpForm.phone.trim(),
        phoneNumber: phoneCheck.cleanDigits,
        phone: signUpForm.phone.trim(),
        admissionNumber: signUpForm.admissionNumber.trim().toUpperCase(),
        role: primaryEmail === 'wachirakevin65@gmail.com' ? 'admin' : 'member',
        createdAt: serverTimestamp(),
        online: true,
        bio: 'Walking in faith with ZUCA.',
        isSubscribed: true
      }, { merge: true });

      setProfile(prev => ({
        ...(prev || {}),
        uid: newUser.uid,
        email: primaryEmail,
        displayName: signUpForm.name.trim() || 'Blessed Member',
        photoURL: '',
        contactNumber: signUpForm.phone.trim(),
        phoneNumber: phoneCheck.cleanDigits,
        phone: signUpForm.phone.trim(),
        admissionNumber: signUpForm.admissionNumber.trim().toUpperCase(),
        role: primaryEmail === 'wachirakevin65@gmail.com' ? 'admin' : 'member',
        bio: 'Walking in faith with ZUCA.',
        createdAt: Timestamp.now(),
        online: true,
        isSubscribed: true
      } as UserProfile));

    } catch (error: any) {
      console.error('Sign Up Error:', error);
      const formatted = formatAuthError(error);
      setFormattedError(formatted);
      setAuthError(formatted.message);
      if (formatted.isConnectionError) {
        runConnectionCheck();
      }
    } finally {
      setAuthLoading(false);
      setAuthActionLoading(null);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailTarget = forgotEmail.trim() || (signInForm.identifier.includes('@') ? signInForm.identifier.trim() : '');
    const emailValidation = validateEmailPattern(emailTarget);
    if (!emailValidation.isValid) {
      const err: FormattedAuthError = {
        title: 'Invalid Email Pattern',
        message: emailValidation.error || 'Please enter a valid email address format to receive your reset link.',
        isConnectionError: false,
        canRetry: true
      };
      setFormattedError(err);
      setAuthError(err.message);
      return;
    }
    setAuthLoading(true);
    setAuthActionLoading('reset');
    setAuthError('');
    setFormattedError(null);
    try {
      await sendPasswordResetEmail(auth, emailValidation.sanitized);
      setForgotSent(true);
    } catch (error: any) {
      console.error('Password Reset Error:', error);
      const formatted = formatAuthError(error);
      setFormattedError(formatted);
      setAuthError(formatted.message);
      if (formatted.isConnectionError) {
        runConnectionCheck();
      }
    } finally {
      setAuthLoading(false);
      setAuthActionLoading(null);
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
      { text: "Seek first the kingdom of God and his righteousness, and all these things will be added to you.", source: "Matthew 6:33" }
    ];
    const verseIndex = typeof window !== 'undefined' ? (new Date().getMinutes() % SACRED_VERSES.length) : 0;
    const dailyVerse = SACRED_VERSES[verseIndex];

    return (
      <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-3 sm:p-6 bg-[#040813] font-sans selection:bg-blue-600/30 overflow-y-auto">
        {/* Ambient Aura Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.15, 1],
              opacity: [0.18, 0.28, 0.18],
              x: [-50, 50, -50],
              y: [-30, 30, -30]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-[#003366] rounded-full blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.12, 0.22, 0.12],
              x: [50, -50, 50],
              y: [40, -40, 40]
            }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px]"
          />
          <div className="absolute inset-0 divine-pattern opacity-[0.03] mix-blend-overlay" />
        </div>

        {/* Centered Single Authentication Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-[440px] my-6 bg-white dark:bg-stone-900 rounded-[28px] overflow-hidden border border-stone-200/60 dark:border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.85)] flex flex-col"
        >
          {/* Header Banner */}
          <div className="h-40 sm:h-44 w-full relative overflow-hidden shrink-0 bg-stone-950">
            <img 
              src="https://i.ibb.co/tMNKfnYM/Technology-Park-Mangu-Campus.png" 
              alt="Technology Park Mangu Campus" 
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
            <div className="absolute bottom-3 left-5 right-5 z-10 text-white font-sans">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 block">Zetech University</span>
              <p className="text-sm font-semibold tracking-tight text-stone-100">Catholic Action Association</p>
            </div>
          </div>

          {/* Loading Progress Bar */}
          {authLoading && (
            <div className="h-1 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden relative z-20">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-600 via-[#003366] to-sky-400 w-1/2 absolute" 
                animate={{ x: ['-100%', '250%'] }} 
                transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }} 
              />
            </div>
          )}

          {/* Overlapping Church Badge */}
          <div className="absolute top-[128px] sm:top-[144px] left-1/2 -translate-x-1/2 w-14 h-14 bg-white dark:bg-stone-950 rounded-2xl flex items-center justify-center shadow-xl border-2 border-blue-600 z-30 group transition-transform duration-300 hover:scale-105 select-none">
            <Church className="text-[#002244] dark:text-sky-400 w-7 h-7 shrink-0" />
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-7 pt-9 flex-1 flex flex-col justify-between">
            <div>
              {/* Portal Title */}
              <div className="text-center mb-4">
                <h1 className="text-xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                  Welcome to ZUCA
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Zetech University Catholic Action Community
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/50 rounded-full text-[11px] font-medium text-blue-700 dark:text-sky-300">
                  <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>New student? Join our fellowship in 1 minute</span>
                </div>
              </div>

              {/* Segmented Tab Switcher (Sign In vs Sign Up) */}
              {authView !== 'forgot' && (
                <div className="mb-5">
                  <div className="flex p-1 bg-stone-100 dark:bg-stone-950/80 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 relative">
                    <button
                      type="button"
                      onClick={() => { setAuthView('signin'); setAuthError(''); setFormattedError(null); }}
                      disabled={authLoading}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer relative z-10 flex items-center justify-center gap-1.5 ${
                        authView === 'signin' 
                          ? 'text-blue-600 dark:text-sky-400' 
                          : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                      }`}
                    >
                      {authView === 'signin' && (
                        <motion.div
                          layoutId="auth-tab-pill"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          className="absolute inset-0 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-blue-200/60 dark:border-blue-900/50"
                        />
                      )}
                      <LogIn className="w-3.5 h-3.5 relative z-10" />
                      <span className="relative z-10">Sign In</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setAuthView('signup'); setAuthError(''); setFormattedError(null); }}
                      disabled={authLoading}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer relative z-10 flex items-center justify-center gap-1.5 ${
                        authView === 'signup' 
                          ? 'text-blue-600 dark:text-sky-400' 
                          : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
                      }`}
                    >
                      {authView === 'signup' && (
                        <motion.div
                          layoutId="auth-tab-pill"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          className="absolute inset-0 bg-white dark:bg-stone-800 rounded-xl shadow-sm border border-blue-200/60 dark:border-blue-900/50"
                        />
                      )}
                      <UserPlus className="w-3.5 h-3.5 relative z-10" />
                      <span className="relative z-10">Create Account</span>
                    </button>
                  </div>
                </div>
              )}

              {/* View Form Router: Sign In, Sign Up, or Forgot Password with Framer Motion directional slide */}
              <AnimatePresence mode="wait">
                {authView === 'signin' && (
                  <motion.div
                    key="view-signin"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleSignIn} className="space-y-3">
                      {/* Email or Phone Number Input */}
                      <div className={`relative transition-all duration-200 ${authLoading ? 'opacity-65 pointer-events-none' : ''}`}>
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                          {signInForm.identifier.includes('@') ? (
                            <Mail className="w-4 h-4 text-blue-600 dark:text-sky-400 transition-colors" />
                          ) : (
                            <Phone className={`w-4 h-4 transition-colors ${
                              signInForm.identifier ? 'text-blue-600 dark:text-sky-400' : 'text-stone-400'
                            }`} />
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          disabled={authLoading}
                          placeholder="Phone Number or Email Address"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white outline-none placeholder:text-stone-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-stone-900 transition-all disabled:opacity-60"
                          value={signInForm.identifier}
                          onChange={(e) => setSignInForm({ ...signInForm, identifier: e.target.value })}
                        />
                      </div>

                      {/* Password Input */}
                      <div className="space-y-1">
                        <div className={`relative transition-all duration-200 ${authLoading ? 'opacity-65 pointer-events-none' : ''}`}>
                          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                            signInForm.password ? 'text-blue-600 dark:text-sky-400' : 'text-stone-400'
                          }`} />
                          <input
                            type={showSignInPassword ? 'text' : 'password'}
                            required
                            disabled={authLoading}
                            placeholder="Password"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white outline-none placeholder:text-stone-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-stone-900 transition-all disabled:opacity-60"
                            value={signInForm.password}
                            onChange={(e) => setSignInForm({ ...signInForm, password: e.target.value })}
                          />
                          <button
                            type="button"
                            disabled={authLoading}
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                          >
                            {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <div className="flex items-center justify-between pt-0.5 text-xs">
                          <button
                            type="button"
                            disabled={authLoading}
                            onClick={() => setSignInForm({ identifier: 'wachirakevin65@gmail.com', password: 'ZucaAdmin2026!' })}
                            className="text-stone-400 hover:text-blue-600 dark:hover:text-sky-400 font-medium cursor-pointer transition-colors"
                          >
                            Fill admin credentials
                          </button>
                          <button 
                            type="button" 
                            disabled={authLoading}
                            onClick={() => { setAuthView('forgot'); setForgotEmail(signInForm.identifier.includes('@') ? signInForm.identifier : ''); setAuthError(''); setFormattedError(null); }}
                            className="text-blue-600 dark:text-sky-400 hover:underline font-medium cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                      </div>

                      {/* Error Banner */}
                      {(formattedError || authError) && (
                        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 space-y-2.5 text-left relative">
                          <button 
                            type="button"
                            onClick={() => { setFormattedError(null); setAuthError(''); }}
                            className="absolute top-2.5 right-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-0.5"
                            title="Dismiss message"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-start gap-2 text-red-600 dark:text-red-400 pr-5">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                              <span className="font-bold block">
                                {formattedError?.title || 'Sign In Notice'}
                              </span>
                              <p className="text-stone-700 dark:text-stone-300 leading-normal">
                                {formattedError?.message || authError}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sign In Button */}
                      <button
                        disabled={authLoading}
                        type="submit"
                        className={`w-full bg-[#002244] hover:bg-[#003366] active:bg-[#001a33] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          authLoading ? 'opacity-80 cursor-wait' : 'active:scale-[0.99]'
                        }`}
                      >
                        {authActionLoading === 'signin' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-current" />
                            <span>Signing In...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In to ZUCA</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Social & Guest Authentication */}
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleLogin}
                          disabled={authLoading}
                          title="Sign in with Google"
                          className={`w-full py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white hover:bg-stone-50 dark:bg-stone-950 dark:hover:bg-stone-900 transition-all text-xs font-semibold flex items-center justify-center gap-2 text-stone-700 dark:text-stone-200 shadow-sm cursor-pointer ${
                            authLoading ? 'opacity-70 cursor-wait' : 'hover:border-blue-500/40 active:scale-[0.98]'
                          }`}
                        >
                          {authActionLoading === 'google' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" className="w-4 h-4 shrink-0" alt="Google" />
                              <span>Google</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleInstantDemoLogin}
                          disabled={authLoading}
                          title="Explore as Guest or New Student"
                          className={`w-full py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 hover:bg-stone-100 dark:bg-stone-950 dark:hover:bg-stone-800 transition-all text-xs font-semibold flex items-center justify-center gap-2 text-stone-700 dark:text-stone-300 shadow-sm cursor-pointer ${
                            authLoading ? 'opacity-70 cursor-wait' : 'hover:border-blue-500/40 active:scale-[0.98]'
                          }`}
                        >
                          {authActionLoading === 'instant-demo' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span>Entering...</span>
                            </>
                          ) : (
                            <>
                              <Church className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                              <span>Guest / Explore</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {authView === 'signup' && (
                  <motion.div
                    key="view-signup"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <form onSubmit={handleSignUp} className="space-y-3">
                      {/* Full Name */}
                      <div className={`relative transition-all duration-200 ${authLoading ? 'opacity-65 pointer-events-none' : ''}`}>
                        <UserIcon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                          signUpForm.name ? 'text-blue-600 dark:text-sky-400' : 'text-stone-400'
                        }`} />
                        <input
                          type="text"
                          required
                          disabled={authLoading}
                          placeholder="Full Name *"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white outline-none placeholder:text-stone-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-stone-900 transition-all disabled:opacity-60"
                          value={signUpForm.name}
                          onChange={(e) => setSignUpForm({ ...signUpForm, name: e.target.value })}
                        />
                      </div>

                      {/* Phone Number */}
                      <div className={`relative transition-all duration-200 ${authLoading ? 'opacity-65 pointer-events-none' : ''}`}>
                        <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                          signUpForm.phone ? 'text-blue-600 dark:text-sky-400' : 'text-stone-400'
                        }`} />
                        <input
                          type="tel"
                          required
                          disabled={authLoading}
                          placeholder="Phone Number (e.g. 0712 345 678) *"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white outline-none placeholder:text-stone-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-stone-900 transition-all disabled:opacity-60"
                          value={signUpForm.phone}
                          onChange={(e) => setSignUpForm({ ...signUpForm, phone: e.target.value })}
                        />
                      </div>

                      {/* Email Address */}
                      <div className={`relative transition-all duration-200 ${authLoading ? 'opacity-65 pointer-events-none' : ''}`}>
                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                          signUpForm.email ? 'text-blue-600 dark:text-sky-400' : 'text-stone-400'
                        }`} />
                        <input
                          type="email"
                          disabled={authLoading}
                          placeholder="Email Address (Optional)"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white outline-none placeholder:text-stone-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-stone-900 transition-all disabled:opacity-60"
                          value={signUpForm.email}
                          onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                        />
                      </div>

                      {/* Admission Number */}
                      <div className={`relative transition-all duration-200 ${authLoading ? 'opacity-65 pointer-events-none' : ''}`}>
                        <Shield className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                          signUpForm.admissionNumber ? 'text-blue-600 dark:text-sky-400' : 'text-stone-400'
                        }`} />
                        <input
                          type="text"
                          disabled={authLoading}
                          placeholder="Admission Number (Optional)"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white outline-none placeholder:text-stone-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-stone-900 transition-all disabled:opacity-60 uppercase"
                          value={signUpForm.admissionNumber}
                          onChange={(e) => setSignUpForm({ ...signUpForm, admissionNumber: e.target.value })}
                        />
                      </div>

                      {/* Password Input & Strength Meter */}
                      <div className={`space-y-1.5 transition-all duration-200 ${authLoading ? 'opacity-65 pointer-events-none' : ''}`}>
                        <div className="relative">
                          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
                            signUpForm.password ? 'text-blue-600 dark:text-sky-400' : 'text-stone-400'
                          }`} />
                          <input
                            type={showSignUpPassword ? 'text' : 'password'}
                            required
                            disabled={authLoading}
                            placeholder="Password (min 6 characters) *"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white outline-none placeholder:text-stone-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-stone-900 transition-all disabled:opacity-60"
                            value={signUpForm.password}
                            onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                          />
                          <button
                            type="button"
                            disabled={authLoading}
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                          >
                            {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {signUpForm.password && (
                          <div className="px-1 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-stone-400 font-medium">Security Strength:</span>
                              <span className={`font-bold ${
                                getPasswordStrength(signUpForm.password).score === 3 
                                  ? 'text-emerald-500' 
                                  : getPasswordStrength(signUpForm.password).score === 2 
                                    ? 'text-amber-500' 
                                    : 'text-red-500'
                              }`}>
                                {getPasswordStrength(signUpForm.password).label}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${
                                  getPasswordStrength(signUpForm.password).score === 3 
                                    ? 'bg-emerald-500' 
                                    : getPasswordStrength(signUpForm.password).score === 2 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${getPasswordStrength(signUpForm.password).percent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Terms checkbox */}
                      <div className="p-2.5 bg-stone-50 dark:bg-stone-950/60 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-start gap-2 select-none">
                        <input 
                          type="checkbox" 
                          id="signup-page-terms"
                          disabled={authLoading}
                          className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-stone-300 dark:border-stone-700 bg-transparent cursor-pointer"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                        />
                        <label htmlFor="signup-page-terms" className="text-xs text-stone-600 dark:text-stone-400 leading-tight cursor-pointer">
                          I agree to the {' '}
                          <button 
                            type="button" 
                            onClick={() => setShowPolicyModal(true)}
                            className="text-blue-600 dark:text-sky-400 underline font-semibold"
                          >
                            Terms & Conditions
                          </button> of ZUCA.
                        </label>
                      </div>

                      {/* Error Banner */}
                      {(formattedError || authError) && (
                        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 space-y-2.5 text-left relative">
                          <button 
                            type="button"
                            onClick={() => { setFormattedError(null); setAuthError(''); }}
                            className="absolute top-2.5 right-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-0.5"
                            title="Dismiss message"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex items-start gap-2 text-red-600 dark:text-red-400 pr-5">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                              <span className="font-bold block">
                                {formattedError?.title || 'Sign Up Notice'}
                              </span>
                              <p className="text-stone-700 dark:text-stone-300 leading-normal">
                                {formattedError?.message || authError}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Create Account Button */}
                      <button
                        disabled={authLoading}
                        type="submit"
                        className={`w-full bg-[#002244] hover:bg-[#003366] active:bg-[#001a33] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          authLoading ? 'opacity-80 cursor-wait' : 'active:scale-[0.99]'
                        }`}
                      >
                        {authActionLoading === 'signup' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-current" />
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <span>Create Account & Join</span>
                            <UserPlus className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Social Options */}
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={handleLogin}
                          disabled={authLoading}
                          title="Sign up with Google"
                          className={`w-full py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white hover:bg-stone-50 dark:bg-stone-950 dark:hover:bg-stone-900 transition-all text-xs font-semibold flex items-center justify-center gap-2 text-stone-700 dark:text-stone-200 shadow-sm cursor-pointer ${
                            authLoading ? 'opacity-70 cursor-wait' : 'hover:border-blue-500/40 active:scale-[0.98]'
                          }`}
                        >
                          {authActionLoading === 'google' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" className="w-4 h-4 shrink-0" alt="Google" />
                              <span>Google</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleInstantDemoLogin}
                          disabled={authLoading}
                          title="Explore as Guest or New Student"
                          className={`w-full py-2.5 px-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 hover:bg-stone-100 dark:bg-stone-950 dark:hover:bg-stone-800 transition-all text-xs font-semibold flex items-center justify-center gap-2 text-stone-700 dark:text-stone-300 shadow-sm cursor-pointer ${
                            authLoading ? 'opacity-70 cursor-wait' : 'hover:border-blue-500/40 active:scale-[0.98]'
                          }`}
                        >
                          {authActionLoading === 'instant-demo' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span>Entering...</span>
                            </>
                          ) : (
                            <>
                              <Church className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400 shrink-0" />
                              <span>Guest / Explore</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {authView === 'forgot' && (
                  <motion.div
                    key="view-forgot"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {!forgotSent ? (
                      <>
                        <div className="text-left">
                          <h2 className="text-sm font-bold text-stone-900 dark:text-white">Reset Password</h2>
                          <p className="text-xs text-stone-500">We will email you instructions to reset your password</p>
                        </div>

                        <form onSubmit={handlePasswordReset} className="space-y-3">
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input
                              type="email"
                              required
                              placeholder="Your Registered Email"
                              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 text-sm text-stone-900 dark:text-white outline-none focus:border-blue-600 transition-all"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                            />
                          </div>

                          {(formattedError || authError) && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-left text-xs text-red-600 dark:text-red-400">
                              {formattedError?.message || authError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full bg-[#002244] hover:bg-[#003366] active:bg-[#001a33] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="space-y-4 text-center py-4">
                        <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-stone-900 dark:text-white text-sm">Reset Link Sent</h3>
                          <p className="text-xs text-stone-500 px-3">We have sent password reset instructions to your email.</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 text-center">
                      <button
                        type="button"
                        onClick={() => { setAuthView('signin'); setForgotSent(false); setAuthError(''); setFormattedError(null); }}
                        className="w-full py-2 text-stone-500 hover:text-blue-600 dark:hover:text-sky-400 text-xs font-semibold block cursor-pointer transition-colors"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Daily verse */}
            <div className="mt-5 p-3 bg-stone-50 dark:bg-stone-950/40 rounded-xl border border-stone-100 dark:border-stone-800 text-left text-xs text-stone-600 dark:text-stone-300 space-y-1 border-l-2 border-l-[#003366] dark:border-l-sky-500 select-none">
              <span className="text-[9px] font-bold text-[#002244] dark:text-sky-400 uppercase tracking-wider block">Daily Verse</span>
              <p className="italic leading-snug">"{dailyVerse.text}"</p>
              <p className="text-[10px] font-bold text-stone-500 dark:text-stone-400 text-right">— {dailyVerse.source}</p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-stone-400 text-xs z-10 mt-3 select-none">
          Faith • Unity • Action • Zetech Catholic Action
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
              {isSidebarOpen && <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500 ml-4 mb-2">Main Fellowship</p>}
              <NavItem active={activeTab === 'home'} onClick={() => handleTabChange('home')} icon={<Home className="w-4 h-4" />} label="Home & Gospel" isOpen={isSidebarOpen} />
              <NavItem active={activeTab === 'chat'} onClick={() => handleTabChange('chat')} icon={<Hash className="w-4 h-4" />} label="Fellowship Chat" isOpen={isSidebarOpen} />
              <NavItem active={activeTab === 'materials'} onClick={() => handleTabChange('materials')} icon={<BookOpen className="w-4 h-4" />} label="Songbook & Prayers" isOpen={isSidebarOpen} />
              <NavItem active={activeTab === 'schedule'} onClick={() => handleTabChange('schedule')} icon={<Calendar className="w-4 h-4" />} label="Mass & Schedules" isOpen={isSidebarOpen} />
              <NavItem active={activeTab === 'gallery'} onClick={() => handleTabChange('gallery')} icon={<ImageIcon className="w-4 h-4" />} label="Photo Gallery" isOpen={isSidebarOpen} />
            </div>

            <div className="space-y-1">
              {isSidebarOpen && <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500 ml-4 mb-3">Community & Faith</p>}
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
                      {isSidebarOpen && <span className="text-[13px] font-medium whitespace-nowrap leading-none">About ZUCA</span>}
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
                          <SubNavItem active={activeTab === 'about'} onClick={() => handleTabChange('about')} label="Who We Are" />
                          <SubNavItem active={activeTab === 'join'} onClick={() => handleTabChange('join')} label="Student Enrollment" />
                          <SubNavItem active={activeTab === 'payments'} onClick={() => handleTabChange('payments')} label="Offerings & Support" />
                          <SubNavItem active={activeTab === 'guide'} onClick={() => handleTabChange('guide')} label="Student Guide & FAQ" />
                          <SubNavItem active={activeTab === 'contact'} onClick={() => handleTabChange('contact')} label="Contact Chaplaincy" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <NavItem active={activeTab === 'petitions'} onClick={() => handleTabChange('petitions')} icon={<Heart className="w-4 h-4" />} label="Prayer Requests" isOpen={isSidebarOpen} />
                <NavItem active={activeTab === 'trivia'} onClick={() => handleTabChange('trivia')} icon={<Trophy className="w-4 h-4" />} label="Faith Trivia" isOpen={isSidebarOpen} />
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
          {activeTab === 'home' && (
            <div key="home">
              <Dashboard 
                userName={profile?.displayName || user?.displayName || 'Member'} 
                currentUser={profile}
                onTabChange={(tab) => handleTabChange(tab)}
              />
            </div>
          )}
          {activeTab === 'chat' && (
            <div key="chat">
              <ChatPage currentUser={profile} />
            </div>
          )}
          {activeTab === 'gallery' && (
            <div key="gallery">
              <Gallery profile={profile} />
            </div>
          )}
          {activeTab === 'materials' && (
            <div key="materials">
              <GroupLibrary user={profile} isAdmin={isAdmin} onStudy={handleStudyResource} />
            </div>
          )}
          {activeTab === 'schedule' && (
            <div key="schedule">
              <SchedulePage user={profile} isAdmin={isAdmin} />
            </div>
          )}
          {activeTab === 'petitions' && (
            <div key="petitions">
              <Petitions />
            </div>
          )}
          {activeTab === 'join' && (
            <div key="join">
              <JoinUs currentUser={profile} />
            </div>
          )}
          {activeTab === 'payments' && (
            <div key="payments">
              <Payments isAdmin={isAdmin} />
            </div>
          )}
          {activeTab === 'trivia' && (
            <div key="trivia">
              <TriviaComponent isAdmin={isAdmin} />
            </div>
          )}
          {activeTab === 'contact' && (
            <div key="contact">
              <ContactUs />
            </div>
          )}
          {activeTab === 'about' && (
            <div key="about">
              <AboutPage />
            </div>
          )}
          {activeTab === 'guide' && (
            <div key="guide">
              <UserGuide />
            </div>
          )}
          {activeTab === 'admin' && isAdmin && (
            <div key="admin">
              <AdminPanel />
            </div>
          )}
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
                  {/* Modern Profile Picture Upload Section - No Stickers */}
                  <div className="flex flex-col items-center gap-5 text-center bg-stone-50 dark:bg-stone-900/60 p-6 rounded-3xl border border-stone-200/60 dark:border-stone-800">
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-lg border-2 border-brand-500/30 bg-white dark:bg-stone-800 flex items-center justify-center">
                        {editForm.photoURL ? (
                          <img 
                            src={editForm.photoURL} 
                            alt="Profile portrait" 
                            className="w-full h-full object-cover animate-fade-in" 
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-50 dark:bg-brand-950/40 flex flex-col items-center justify-center text-brand-600 dark:text-brand-400">
                            {editForm.displayName ? (
                              <span className="text-3xl font-black uppercase">
                                {editForm.displayName.charAt(0)}
                              </span>
                            ) : (
                              <UserIcon className="w-10 h-10 text-brand-400" />
                            )}
                          </div>
                        )}

                        {isUploadingPhoto && (
                          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-1.5 z-10">
                            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Optimizing...</span>
                          </div>
                        )}
                      </div>

                      {/* Quick upload overlay on hover */}
                      <label 
                        className="absolute inset-0 rounded-2xl bg-stone-950/60 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white z-10"
                        title="Upload new portrait photo"
                      >
                        <Camera className="w-6 h-6 text-white drop-shadow-md" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Change</span>
                        <input 
                          type="file" 
                          accept="image/png,image/jpeg,image/jpg,image/webp" 
                          className="hidden" 
                          disabled={isUploadingPhoto}
                          onChange={handleProfileImageUpload}
                        />
                      </label>
                    </div>

                    <div className="flex flex-col items-center gap-2 w-full">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <label 
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all shadow-sm ${
                            isUploadingPhoto 
                              ? 'bg-stone-200 text-stone-400 dark:bg-stone-800 cursor-not-allowed'
                              : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95 shadow-brand-500/20'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{editForm.photoURL ? 'Change Photo' : 'Upload Photo'}</span>
                          <input 
                            type="file" 
                            accept="image/png,image/jpeg,image/jpg,image/webp" 
                            className="hidden" 
                            disabled={isUploadingPhoto}
                            onChange={handleProfileImageUpload}
                          />
                        </label>

                        {editForm.photoURL && (
                          <button
                            type="button"
                            onClick={handleRemoveProfilePhoto}
                            disabled={isUploadingPhoto}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-stone-200 dark:border-stone-800 transition-all active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[10px] text-stone-400 font-medium">
                        JPG, PNG, or WEBP portrait (saved to your profile)
                      </p>

                      {photoUploadError && (
                        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg font-medium mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{photoUploadError}</span>
                        </div>
                      )}
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
