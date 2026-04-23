import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserRole, OperationType } from './types';
import { handleFirestoreError, compressImage } from './utils';

// Components
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
  Youtube,
  User as UserIcon,
  Image as ImageIcon,
  Home,
  Hash,
  CreditCard,
  Trophy,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'home' | 'choir' | 'petitions' | 'events' | 'payments' | 'trivia' | 'chat' | 'admin' | 'gallery' | 'contact';

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
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', photoURL: '', bio: '' });
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchOrCreateProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchOrCreateProfile = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setProfile(data);
        setEditForm({ 
          displayName: data.displayName || firebaseUser.displayName || '', 
          photoURL: data.photoURL || firebaseUser.photoURL || '', 
          bio: data.bio || '' 
        });
      } else {
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
        setEditForm({
          displayName: newProfile.displayName || '',
          photoURL: newProfile.photoURL || '',
          bio: ''
        });
      }
    } catch (error) {
       console.error("Profile fetch error:", error);
       // Attempt to set a fallback profile to allow entry
       const fallback: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Faithful Member',
          photoURL: firebaseUser.photoURL || '',
          bio: '',
          role: 'member',
          createdAt: Timestamp.now()
       };
       setProfile(fallback);
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
        bio: editForm.bio
      });
      
      setProfile(prev => prev ? { 
        ...prev, 
        displayName: editForm.displayName,
        photoURL: editForm.photoURL,
        bio: editForm.bio
      } : null);
      setIsProfileModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

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
        {/* Full screen background with Zetech image integrated - ensuring responsive siting */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://newspro.co.ke/wp-content/uploads/2024/02/slide1.png" 
            alt="Zetech UI" 
            className="w-full h-full object-cover object-center opacity-60 contrast-125 scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-stone-950/80 via-stone-950/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[70vh] bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-12 rounded-[48px] overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)]"
        >
          {/* Brand Motto - Large and Bold over the image */}
          <div className="lg:col-span-7 p-10 md:p-16 lg:p-28 flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-5 mb-16"
              >
                <div className="w-20 h-20 bg-brand-900 rounded-[28px] flex items-center justify-center shadow-3xl shadow-brand-900/50 rotate-3 border border-white/20">
                  <Church className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-black tracking-widest text-white drop-shadow-xl">ZUCA</h1>
              </motion.div>

              <div className="space-y-4">
                <motion.h2 
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-7xl md:text-[11rem] font-bold text-white tracking-tighter leading-[0.75] mt-[-0.05em]"
                >
                  Seek. <br />
                  Serve. <br />
                  <span className="serif-display italic font-light text-brand-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">Sanctify.</span>
                </motion.h2>
              </div>
            </div>

            <div className="mt-16 flex items-center gap-6">
               <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Official Sanctuary Hub</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Login Side - Simplified Glass */}
          <div className="lg:col-span-5 bg-white/10 dark:bg-black/20 backdrop-blur-2xl p-10 md:p-16 lg:p-24 flex flex-col justify-center relative border-l border-white/10">
            <div className="mb-16 space-y-4">
              <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tighter italic serif-display">
                Welcome Home.
              </h3>
              <p className="text-white/60 text-sm md:text-base leading-relaxed max-w-xs font-medium">
                Connect with the Zetech University Catholic community in a digital space dedicated to faith and growth.
              </p>
            </div>

            <div className="space-y-8">
              <button
                onClick={handleLogin}
                className="group relative w-full flex items-center justify-center gap-4 bg-white text-stone-950 py-4 rounded-[22px] hover:bg-stone-50 hover:scale-[1.02] active:scale-[0.98] transition-all font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-black/50 overflow-hidden"
              >
                <div className="absolute inset-0 bg-brand-500/5 group-hover:bg-transparent transition-colors" />
                <div className="w-8 h-8 bg-stone-100 rounded-lg p-2 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform relative z-10">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-full h-full" />
                </div>
                <span className="relative z-10">Enter Sanctuary</span>
              </button>

              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 w-full">
                  <div className="h-[1px] flex-1 bg-white/10" />
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em]">Fellowship</span>
                  <div className="h-[1px] flex-1 bg-white/10" />
                </div>
                
                <div className="flex justify-center gap-6">
                  <SocialLink href="#" icon={<MessageSquare className="w-4 h-4" />} /> 
                  <SocialLink href="#" icon={<Twitter className="w-4 h-4" />} />
                  <SocialLink href="#" icon={<Instagram className="w-4 h-4" />} />
                  <SocialLink href="#" icon={<Youtube className="w-4 h-4" />} />
                </div>
              </div>
            </div>
            
            <p className="mt-24 text-[9px] text-center text-white/20 font-black uppercase tracking-[0.5em]">
              ZUCA • Excellentia Pro Deo • 2026
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <div className={`min-h-screen transition-colors duration-500 flex ${darkMode ? 'dark text-stone-100' : 'text-stone-900'}`}>
      <div className="faith-bg" />
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 glass border-r transition-all duration-700 ease-in-out overflow-hidden shadow-2xl ${
        isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'
      }`}>
        <div className="h-full flex flex-col p-4">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-4 px-2">
            <div className="w-12 h-12 bg-brand-900 shrink-0 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-900/20 cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Church className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                <h1 className="text-xl font-black tracking-tighter text-brand-900 dark:text-brand-400">ZUCA</h1>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Catholic Action Hub</p>
              </motion.div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home className="w-5 h-5" />} label="Overview" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<Hash className="w-5 h-5" />} label="Community Hub" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} icon={<ImageIcon className="w-5 h-5" />} label="Activities" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'choir'} onClick={() => setActiveTab('choir')} icon={<Music className="w-5 h-5" />} label="Choir Library" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'petitions'} onClick={() => setActiveTab('petitions')} icon={<Heart className="w-5 h-5" />} label="Prayer Petitions" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={<Calendar className="w-5 h-5" />} label="Events" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<CreditCard className="w-5 h-5" />} label="Payments" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'trivia'} onClick={() => setActiveTab('trivia')} icon={<Trophy className="w-5 h-5" />} label="Daily Trivia" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'contact'} onClick={() => setActiveTab('contact')} icon={<Mail className="w-5 h-5" />} label="Contact Us" isOpen={isSidebarOpen} />
            
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800">
                {isSidebarOpen && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 ml-4 mb-4">Admin Only</p>}
                <NavItem active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Shield className="w-5 h-5" />} label="Admin Panel" isOpen={isSidebarOpen} admin />
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

            <div className={`flex items-center gap-4 px-2 py-3 ${isSidebarOpen ? 'bg-stone-50 dark:bg-white/5 rounded-2xl' : ''}`}>
              <div 
                className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center shrink-0 cursor-pointer overflow-hidden"
                onClick={() => setIsProfileModalOpen(true)}
              >
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-brand-900 font-black text-xs">{profile?.displayName?.charAt(0)}</span>
                )}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{profile?.displayName}</p>
                  <button onClick={() => setIsProfileModalOpen(true)} className="text-[8px] font-medium text-brand-600 dark:text-brand-400 uppercase tracking-widest text-left">Edit Profile</button>
                </div>
              )}
            <button onClick={handleLogout} className="p-2 text-stone-300 dark:text-stone-600 hover:text-red-500 transition-colors">
                 <LogOut className="w-5 h-5" />
            </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile & Desktop Menu Trigger */}
      <AnimatePresence>
        {!isSidebarOpen && isMenuVisible && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-3 left-3 md:top-4 md:left-4 z-40 p-2.5 glass rounded-xl shadow-lg border border-white/10 group hover:bg-brand-900 transition-colors"
          >
            <Menu className="w-4 h-4 md:w-5 md:h-5 text-brand-900 dark:text-brand-400 group-hover:text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Profile Widget - Fixed Top Right */}
      <AnimatePresence>
        {isMenuVisible && user && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-3 right-3 md:top-4 md:right-4 z-40"
          >
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setIsProfileModalOpen(true)}
               className="flex items-center gap-2.5 glass p-1 rounded-xl shadow-lg border border-white/10 group transition-all"
             >
               <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg overflow-hidden bg-brand-50 flex items-center justify-center border-2 border-white shadow-sm">
                 {profile?.photoURL ? (
                   <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <UserIcon className="w-3 h-3 md:w-4 md:text-brand-300" />
                 )}
               </div>
               <div className="text-left hidden sm:block pr-3">
                  <p className="text-[9px] font-bold text-stone-900 dark:text-stone-100 truncate max-w-[60px] md:max-w-[80px]">
                    {profile?.displayName?.split(' ')[0] || 'Member'}
                  </p>
               </div>
             </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main 
        onMouseDown={() => {
          if (isSidebarOpen) setIsSidebarOpen(false);
        }}
        className={`flex-1 transition-all duration-700 ease-in-out pt-20 md:pt-12 p-4 md:p-12 relative z-10 ml-0`}
      >
        <div className="max-w-6xl mx-auto pt-4 md:pt-16">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Dashboard 
                  userName={profile?.displayName?.split(' ')[0] || 'Member'} 
                  onTabChange={(tab) => setActiveTab(tab)}
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
            {activeTab === 'choir' && (
              <motion.div key="choir" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <Resources role={profile?.role || 'member'} />
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
              className="glass p-10 rounded-[48px] w-full max-w-lg shadow-2xl relative"
            >
              <button 
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-8 right-8 p-2 hover:bg-stone-50 dark:hover:bg-white/5 rounded-full"
              >
                <X className="w-6 h-6 text-stone-400" />
              </button>
              
              <h3 className="text-3xl font-bold mb-8">Spiritual Profile</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="flex flex-col items-center gap-6 mb-10">
                   <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-stone-800 shadow-2xl relative">
                        {editForm.photoURL ? (
                          <img src={editForm.photoURL} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                            <UserIcon className="w-12 h-12 text-stone-300" />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-2 left-1/2 -translate-x-1/2 cursor-pointer bg-brand-900 text-white p-2.5 rounded-full shadow-xl hover:bg-brand-800 transition-all border-4 border-white dark:border-stone-900 z-10 scale-110 active:scale-95">
                        <ImageIcon className="w-4 h-4" />
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
                   <div className="text-center">
                      <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">{profile?.displayName || 'Faithful Soul'}</h2>
                      <p className="text-xs font-bold text-brand-600 dark:text-brand-400 tracking-widest uppercase">{profile?.role}</p>
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Profile Picture URL</label>
                    <input 
                        type="url" 
                        value={editForm.photoURL} 
                        onChange={e => setEditForm({...editForm, photoURL: e.target.value})} 
                        placeholder="Image URL..." 
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

                <div className="flex flex-col gap-3 pt-4">
                  <button type="submit" className="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold shadow-xl">Save Profile</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setIsProfileModalOpen(false)} className="flex-1 py-4 border border-stone-100 dark:border-stone-800 rounded-2xl font-bold text-stone-400">Cancel</button>
                    <button type="button" onClick={() => { handleLogout(); setIsProfileModalOpen(false); }} className="flex-1 py-4 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-all">Logout</button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Chat */}
      <Chatbot />
      <NotificationTicker />
    </div>
  );
}

function NavItem({ active, onClick, icon, label, isOpen, admin }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isOpen: boolean, admin?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 relative group font-bold text-sm ${
        active 
          ? 'bg-brand-900 text-white shadow-xl shadow-brand-900/20 translate-x-1' 
          : 'text-stone-400 hover:bg-stone-50 hover:text-stone-900'
      }`}
    >
      <div className={`w-6 h-6 shrink-0 flex items-center justify-center transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
        {icon}
      </div>
      {isOpen && (
        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          {label}
        </motion.span>
      )}
      {active && isOpen && (
        <motion.div layoutId="active-indicator" className="absolute right-4">
          <ChevronRight className="w-4 h-4 text-white/50" />
        </motion.div>
      )}
    </button>
  );
}
