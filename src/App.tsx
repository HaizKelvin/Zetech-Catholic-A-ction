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
import TriviaComponent from './components/Trivia';
import AdminPanel from './components/AdminPanel';
import ChatPage from './components/ChatPage';

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
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'home' | 'choir' | 'petitions' | 'events' | 'payments' | 'trivia' | 'chat' | 'admin';

function SocialLink({ href, icon }: { href: string, icon: React.ReactNode }) {
  return (
    <motion.a 
      whileHover={{ scale: 1.1, y: -2 }}
      whileTap={{ scale: 0.9 }}
      href={href} 
      className="p-3 bg-stone-50 dark:bg-white/5 border border-stone-100 dark:border-white/5 rounded-2xl text-stone-400 hover:text-brand-600 hover:bg-brand-50 transition-all shadow-sm"
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
          displayName: data.displayName || '', 
          photoURL: data.photoURL || '', 
          bio: data.bio || '' 
        });
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
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
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
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
      <div className="min-h-screen bg-[#FBFBFA] dark:bg-stone-950 flex flex-col md:flex-row relative overflow-hidden">
        <div className="faith-bg opacity-30" />
        
        {/* Banner Section */}
        <div className="w-full md:w-[55%] h-[45vh] md:h-screen relative bg-brand-950">
          <img 
            src="https://images.unsplash.com/photo-1549413243-7f28ed020993?auto=format&fit=crop&q=80&w=2000" 
            alt="Sanctuary" 
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
               (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548625342-df751508db83?auto=format&fit=crop&q=80&w=2000';
            }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-900/40 to-transparent" />
          <div className="absolute inset-0 bg-stone-950/30 backdrop-blur-[1px]" />
          
          <div className="absolute bottom-12 md:bottom-24 left-8 md:left-20 right-8 text-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-4xl md:text-7xl font-bold tracking-tighter mb-4 leading-none">
                Seek. Serve. <br />
                <span className="serif-display italic font-light text-brand-300">Sanctify.</span>
              </h1>
              <p className="text-brand-100 font-medium tracking-widest uppercase text-[10px] md:text-xs font-bold tracking-[0.4em]">
                Zetech University Catholic Action
              </p>
            </motion.div>
          </div>
        </div>
        
        {/* Form Section */}
        <div className="w-full md:w-[45%] flex items-center justify-center p-4 md:p-12 lg:p-24 relative z-10 -mt-16 md:mt-0">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-3xl p-8 md:p-12 rounded-[40px] md:rounded-[48px] shadow-2xl relative overflow-hidden border border-white/20"
          >
            <div className="flex items-center gap-4 mb-10 md:mb-12 relative">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-brand-900 rounded-[18px] md:rounded-[20px] flex items-center justify-center shadow-2xl shadow-brand-900/40 rotate-6 group hover:rotate-0 transition-transform duration-500">
                <Church className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tighter text-stone-900 dark:text-stone-100 uppercase">Zetech CA</h1>
                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Divine Wisdom Hub</p>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6 mb-10 md:mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 tracking-tight leading-[1.1]">
                Welcome to our <br className="hidden md:block" />
                <span className="text-brand-600 dark:text-brand-400">Sanctuary.</span>
              </h2>
              <p className="text-stone-500 dark:text-stone-400 text-sm md:text-lg leading-relaxed font-serif italic line-clamp-3">
                "For where two or three are gathered in my name, there am I among them." — <span className="font-bold">Matthew 18:20</span>
              </p>
            </div>
            
            <div className="space-y-8">
              <button
                onClick={handleLogin}
                className="group relative w-full flex items-center justify-center gap-4 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-4 md:py-5 rounded-[20px] md:rounded-[24px] hover:bg-stone-800 dark:hover:bg-white transition-all font-bold shadow-xl shadow-stone-950/20 active:scale-[0.98] overflow-hidden"
              >
                <div className="w-6 h-6 bg-white rounded-full p-1 flex items-center justify-center">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                </div>
                <span className="text-base md:text-lg">Google Sign In</span>
              </button>

              <div className="pt-8 border-t border-stone-100 dark:border-stone-800">
                <p className="text-center text-[9px] md:text-[10px] text-stone-400 uppercase tracking-[0.4em] font-black mb-6">Our Community</p>
                <div className="flex justify-center gap-4 md:gap-6">
                  <SocialLink href="#" icon={<Facebook className="w-4 h-4 md:w-5 md:h-5" />} />
                  <SocialLink href="#" icon={<Twitter className="w-4 h-4 md:w-5 md:h-5" />} />
                  <SocialLink href="#" icon={<Instagram className="w-4 h-4 md:w-5 md:h-5" />} />
                  <SocialLink href="#" icon={<Youtube className="w-4 h-4 md:w-5 md:h-5" />} />
                </div>
              </div>
            </div>
            
            <div className="mt-10 md:mt-16 pt-6 md:pt-8 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black text-stone-300">
              <span>Nairobi Chapter</span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              <span>Est. 2026</span>
            </div>
          </motion.div>
        </div>
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
                <h1 className="text-xl font-black tracking-tighter text-brand-900 dark:text-brand-400">Zetech CA</h1>
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-stone-400">Catholic Action Hub</p>
              </motion.div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <NavItem active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<LayoutDashboard />} label="Overview" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageCircle />} label="Community Hub" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'choir'} onClick={() => setActiveTab('choir')} icon={<Music />} label="Choir Library" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'petitions'} onClick={() => setActiveTab('petitions')} icon={<Heart />} label="Prayer Petitions" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'events'} onClick={() => setActiveTab('events')} icon={<Calendar />} label="Events" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<DollarSign />} label="Payments" isOpen={isSidebarOpen} />
            <NavItem active={activeTab === 'trivia'} onClick={() => setActiveTab('trivia')} icon={<HelpCircle />} label="Daily Trivia" isOpen={isSidebarOpen} />
            
            {isAdmin && (
              <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-800">
                {isSidebarOpen && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-300 ml-4 mb-4">Admin Only</p>}
                <NavItem active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Shield />} label="Admin Panel" isOpen={isSidebarOpen} admin />
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
              <button onClick={handleLogout} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
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
            className="fixed top-4 left-4 md:top-8 md:left-8 z-40 p-3 md:p-4 glass rounded-2xl shadow-xl border border-white/20 group hover:bg-brand-900 transition-colors"
          >
            <Menu className="w-5 h-5 md:w-6 md:h-6 text-brand-900 dark:text-brand-400 group-hover:text-white" />
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
            className="fixed top-4 right-4 md:top-8 md:right-8 z-40"
          >
             <motion.button 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setIsProfileModalOpen(true)}
               className="flex items-center gap-3 glass p-1.5 pr-4 md:pr-6 rounded-2xl shadow-xl border border-white/20 group transition-all"
             >
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl overflow-hidden bg-brand-50 flex items-center justify-center border-2 border-white shadow-sm">
                 {profile?.photoURL ? (
                   <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <UserIcon className="w-4 h-4 md:w-5 md:text-brand-300" />
                 )}
               </div>
               <div className="text-left hidden sm:block">
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-stone-400 leading-none mb-1">Soul Profile</p>
                  <p className="text-[10px] md:text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[80px] md:max-w-[100px]">
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
                <div className="flex justify-center mb-8">
                   <div className="relative group">
                      <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-brand-50 flex items-center justify-center border-4 border-white shadow-xl">
                        {editForm.photoURL ? (
                          <img src={editForm.photoURL} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-10 h-10 text-brand-300" />
                        )}
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
                      className="w-full px-6 py-4 rounded-2xl" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Profile Picture</label>
                    <div className="flex gap-4 items-center">
                       <input 
                        type="url" 
                        value={editForm.photoURL} 
                        onChange={e => setEditForm({...editForm, photoURL: e.target.value})} 
                        placeholder="Image URL..." 
                        className="flex-1 px-4 py-3 rounded-xl bg-stone-50 dark:bg-white/5 border-none outline-none text-sm" 
                      />
                      <label className="cursor-pointer bg-brand-900 text-white px-4 py-3 rounded-xl text-xs font-bold hover:bg-brand-800 transition-all shrink-0">
                        Upload
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
