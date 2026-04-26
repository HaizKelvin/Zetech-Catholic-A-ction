import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limitToLast, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, DailyControl, OperationType } from '../types';
import { handleFirestoreError, compressImage } from '../utils';
import { 
  Send, 
  User as UserIcon, 
  Search, 
  MoreVertical, 
  Phone, 
  Video,
  Smile,
  Paperclip,
  Users as UsersIcon,
  ChevronLeft,
  Trash2,
  Loader2,
  Church,
  MessageCircle,
  CornerUpLeft,
  X as CloseIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { deleteDoc, doc } from 'firebase/firestore';

interface Message {
  id: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'sticker';
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  timestamp: any;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
}

const STICKERS = [
  '🙏', '🙌', '✨', '🕊️', '⛪', '📖', '🕯️', '🛡️', '✝️', '🫂', '🔥', '❤️', '🌟', '🌈', '☀️', '🌸'
];

export default function ChatPage({ currentUser }: { currentUser: UserProfile | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearHistory = async () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (!window.confirm('Are you sure you want to clear ALL community chat history? This cannot be undone.')) return;
    
    try {
      const q = query(collection(db, 'community_chat'));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'community_chat', d.id)));
      await Promise.all(deletePromises);
      setShowMoreMenu(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'community_chat');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const q = query(
      collection(db, 'community_chat'),
      orderBy('timestamp', 'asc'),
      limitToLast(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setTimeout(scrollToBottom, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'community_chat');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const path = 'users';
      try {
        const q = query(collection(db, path), limit(50));
        const snapshot = await getDocs(q);
        const u: UserProfile[] = [];
        snapshot.forEach(doc => u.push(doc.data() as UserProfile));
        setUsers(u);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    };
    fetchUsers();
  }, []);

  const handleSendMessage = async (e?: React.FormEvent, media?: { url: string, type: Message['mediaType'] }) => {
    e?.preventDefault();
    if (!newMessage.trim() && !media && !currentUser) return;
    if (!currentUser) return;

    const path = 'community_chat';
    try {
      const messageData: any = {
        text: newMessage,
        mediaUrl: media?.url || null,
        mediaType: media?.type || null,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL || '',
        timestamp: serverTimestamp()
      };

      if (replyMessage) {
        messageData.replyTo = {
          id: replyMessage.id,
          text: replyMessage.text || (replyMessage.mediaType ? `[${replyMessage.mediaType}]` : 'Shared Media'),
          senderName: replyMessage.senderName
        };
      }

      await addDoc(collection(db, path), messageData);
      setNewMessage('');
      setReplyMessage(null);
      setShowStickers(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      if (file.type.startsWith('image/')) {
        const base64 = await compressImage(file, 800, 800, 0.7);
        await handleSendMessage(undefined, { url: base64, type: 'image' });
      } else if (file.type.startsWith('video/')) {
        if (file.size > 1024 * 1024) {
          alert('Video too large. Please share videos smaller than 1MB or use a link.');
          return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async (event) => {
          await handleSendMessage(undefined, { url: event.target?.result as string, type: 'video' });
        };
      }
    } catch (error) {
      // Error handling is inside handleSendMessage but for other issues:
      console.error("Upload preparation error:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const sendSticker = (sticker: string) => {
    handleSendMessage(undefined, { url: sticker, type: 'sticker' });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;
    const path = `community_chat/${messageId}`;
    try {
      await deleteDoc(doc(db, 'community_chat', messageId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[85vh] md:h-[650px] flex glass rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl border border-white/20 relative mx-auto max-w-5xl transition-all duration-500">
      {/* Sidebar - Contacts */}
      <div className={`${showMembers ? 'flex translate-x-0' : 'hidden md:flex -translate-x-full md:translate-x-0'} absolute md:relative inset-0 md:inset-auto z-40 w-full md:w-72 border-r border-stone-100 dark:border-stone-800 flex-col bg-stone-50 dark:bg-stone-900 md:bg-stone-50/40 md:dark:bg-stone-900/40 backdrop-blur-md transition-transform duration-300`}>
        <div className="p-6 bg-brand-900/5 dark:bg-brand-400/5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Conversations</h2>
          <button 
            onClick={() => setShowMembers(false)}
            className="md:hidden p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 border-none text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-3">
            <button 
              onClick={() => setShowMembers(false)}
              className="w-full flex items-center gap-4 p-4 rounded-[24px] bg-brand-900 text-white shadow-2xl shadow-brand-900/40 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
                <Church className="w-7 h-7" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold tracking-tight text-base truncate">Community Hub</div>
                <div className="text-[10px] opacity-70 font-black uppercase tracking-widest truncate">Live Now</div>
              </div>
            </button>

            <div className="pt-4 px-2">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Divine Members</span>
            </div>

            {filteredUsers.map((u, idx) => (
              <motion.button 
                key={u.uid} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="w-full flex items-center gap-4 p-3 rounded-[24px] hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:shadow-black/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-stone-100 dark:border-stone-800 shadow-sm relative group-hover:scale-110 transition-transform">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-stone-300 dark:text-stone-600" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-stone-900 rounded-full shadow-lg" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-sm truncate text-stone-900 dark:text-stone-100">{u.displayName}</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate tracking-tight italic font-serif opacity-80">{u.bio || 'Faithful Soul'}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="absolute inset-0 faith-bg opacity-5 pointer-events-none" />
        
        {/* Chat Header */}
        <div className="px-4 md:px-8 py-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <button 
              onClick={() => setShowMembers(true)}
              className="md:hidden p-2.5 -ml-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-brand-600 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <UsersIcon className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand-900 flex items-center justify-center shadow-lg shadow-brand-900/20 text-white shrink-0">
              <Church className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold tracking-tight truncate">CA Community Hub</h3>
              <p className="text-[9px] md:text-[10px] text-green-500 font-bold uppercase tracking-widest truncate">Live Community</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-4 text-stone-700 dark:text-stone-400">
            <a 
              href="https://meet.google.com/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex p-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 rounded-xl transition-all shadow-sm active:scale-95"
              title="Start Google Meet"
            >
              <Video className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </a>
            <button className="flex p-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 rounded-xl transition-all shadow-sm active:scale-95">
              <Phone className="w-4.5 h-4.5 md:w-5 md:h-5" />
            </button>
            <div className="hidden sm:block h-6 w-[1px] bg-stone-200 dark:bg-stone-800 mx-1" />
            
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`p-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 rounded-xl transition-all shadow-sm active:scale-95 ${showMoreMenu ? 'ring-2 ring-brand-500/20 !bg-brand-50 !text-brand-600' : ''}`}
              >
                <MoreVertical className="w-4.5 h-4.5 md:w-5 md:h-5" />
              </button>

              <AnimatePresence>
                {showMoreMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMoreMenu(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-stone-50 dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-100 dark:border-stone-800 p-2 z-20"
                    >
                      <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-600 dark:text-stone-400">Hub Settings</p>
                      </div>
                      <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs font-bold transition-all text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Hub Information
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs font-bold transition-all text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        Notifications
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-left text-xs font-bold transition-all text-stone-700 dark:text-stone-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        View Guidelines
                      </button>
                      {currentUser?.role === 'admin' && (
                        <>
                          <div className="h-[1px] bg-stone-100 dark:bg-stone-800 my-1 mx-2" />
                          <button 
                            onClick={handleClearHistory}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-xs font-bold transition-all text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                            Clear Hub History
                          </button>
                        </>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Messages Layout */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar z-0 flex flex-col relative">
          {/* Background Image Layer */}
          <div className="absolute inset-0 z-[-1] opacity-[0.05] dark:opacity-[0.02] grayscale pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop" 
              alt="" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex justify-center mb-4">
            <motion.span 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-6 py-2 rounded-full glass border border-white/20 text-[10px] font-black text-brand-700 dark:text-brand-300 uppercase tracking-[0.4em] shadow-xl backdrop-blur-md"
            >
              Sanctuary Fellowship
            </motion.span>
          </div>

          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center opacity-30 text-stone-500 py-20"
              >
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-stone-300 dark:border-white/10 flex items-center justify-center mb-6">
                    <MessageCircle className="w-10 h-10" />
                  </div>
                  <p className="font-serif italic text-lg text-center px-10">Where two or three gather in my name, there am I with them...</p>
              </motion.div>
            ) : (
              messages.map((msg, i) => {
              const isMine = msg.senderId === currentUser?.uid;

              return (
                <motion.div 
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex items-end gap-3 md:gap-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-9 h-9 md:w-11 md:h-11 shrink-0 transform transition-transform group-hover:scale-110`}>
                    <div className={`w-full h-full rounded-full p-[2px] transition-all bg-gradient-to-br ${
                      isMine ? 'from-brand-300 to-brand-500 shadow-lg shadow-brand-500/20' : 'from-stone-200 to-stone-400 dark:from-stone-700 dark:to-stone-600 shadow-md'
                    }`}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-stone-50 dark:bg-stone-900 border border-white/50 dark:border-stone-800">
                        {msg.senderPhoto ? (
                          <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`max-w-[85%] md:max-w-[70%] group relative px-6 md:px-8 py-5 md:py-6 rounded-[24px] md:rounded-[32px] transition-all duration-500 hover:scale-[1.01] ${
                    isMine 
                      ? 'bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-white rounded-br-none shadow-[0_20px_60px_-15px_rgba(222,96,68,0.4)]' 
                      : 'bg-stone-100 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 rounded-bl-none border border-stone-200 dark:border-stone-800 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]'
                  }`}>
                    <div className="absolute inset-0 faith-bg opacity-[0.03] pointer-events-none" />
                    
                    <div className={`absolute -top-3 ${isMine ? 'right-0 flex-row-reverse' : 'left-0'} flex items-center gap-1 z-20`}>
                      {(isMine || currentUser?.role === 'admin') && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-full shadow-xl border border-stone-100 dark:border-stone-800 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:text-red-500 text-stone-500 dark:text-stone-400 hover:scale-110 active:scale-95"
                          title="Delete Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button 
                        onClick={() => setReplyMessage(msg)}
                        className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-full shadow-xl border border-stone-100 dark:border-stone-800 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all hover:text-brand-600 text-stone-500 dark:text-stone-400 hover:scale-110 active:scale-95"
                        title="Reply"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {msg.replyTo && (
                      <button 
                        onClick={() => {
                          const el = document.getElementById(`msg-${msg.replyTo?.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el?.classList.add('ring-4', 'ring-brand-500/50', 'transition-all', 'duration-1000');
                          setTimeout(() => el?.classList.remove('ring-4', 'ring-brand-500/50'), 2000);
                        }}
                        className="w-full mb-3 p-3 rounded-2xl bg-black/10 dark:bg-white/10 border-l-4 border-brand-500 text-left hover:bg-black/15 dark:hover:bg-white/15 transition-all"
                      >
                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-500 mb-1">{msg.replyTo.senderName}</p>
                        <p className="text-[11px] opacity-70 truncate italic">{msg.replyTo.text}</p>
                      </button>
                    )}

                    {!isMine && (
                      <span className="block text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1.5">
                        {msg.senderName}
                      </span>
                    )}

                    <div className="space-y-2">
                       {msg.mediaUrl && (
                        <div className="rounded-2xl overflow-hidden mb-2 shadow-inner bg-black/5 dark:bg-white/5">
                          {msg.mediaType === 'image' && (
                            <img src={msg.mediaUrl} alt="Shared" className="w-full h-auto max-h-[300px] object-cover hover:scale-[1.02] transition-transform cursor-pointer" />
                          )}
                          {msg.mediaType === 'video' && (
                            <video src={msg.mediaUrl} controls className="w-full h-auto max-h-[300px]" />
                          )}
                          {msg.mediaType === 'sticker' && (
                            <div className="text-5xl py-4 flex justify-center animate-bounce-slow">
                              {msg.mediaUrl}
                            </div>
                          )}
                        </div>
                      )}
                      {msg.text && (
                        <p className="text-xs md:text-[15px] leading-relaxed font-medium">{msg.text}</p>
                      )}
                    </div>

                    <div className={`flex items-center gap-1.5 mt-2 ${isMine ? 'justify-end opacity-60' : 'justify-start opacity-40'}`}>
                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em]">
                        {msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...' }
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            }) ) }
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 md:p-8 bg-stone-50/70 dark:bg-stone-950/70 backdrop-blur-2xl z-10 border-t border-stone-100 dark:border-white/5 relative">
          <AnimatePresence>
            {replyMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mx-auto max-w-5xl mb-3 p-4 bg-brand-900/10 dark:bg-brand-400/10 border-l-4 border-brand-500 rounded-2xl flex items-center justify-between group"
              >
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-1">Replying to {replyMessage.senderName}</p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 truncate italic">{replyMessage.text || "[Media Archive]"}</p>
                </div>
                <button 
                  onClick={() => setReplyMessage(null)}
                  className="p-2 hover:bg-white dark:hover:bg-white/5 rounded-full transition-all"
                >
                  <CloseIcon className="w-4 h-4 text-stone-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-5 max-w-5xl mx-auto">
            <div className="flex items-center gap-1 relative">
              <button 
                type="button" 
                onClick={() => setShowStickers(!showStickers)}
                className={`p-3 md:p-4 bg-stone-100 dark:bg-stone-800 rounded-full transition-all shadow-sm active:scale-95 ${showStickers ? 'text-brand-600 ring-4 ring-brand-500/10' : 'text-stone-600 dark:text-stone-400'}`}
              >
                <Smile className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              
              <AnimatePresence>
                {showStickers && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className="absolute bottom-full left-0 mb-4 p-4 bg-stone-50 dark:bg-stone-900 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-stone-100 dark:border-stone-800 grid grid-cols-4 gap-3 w-48 z-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 faith-bg opacity-10 pointer-events-none" />
                    {STICKERS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendSticker(s)}
                        className="text-2xl hover:scale-125 hover:rotate-12 transition-all active:scale-95"
                      >
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2.5 md:p-3 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-brand-600 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5 md:w-6 md:h-6" />}
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,video/*"
                className="hidden"
              />
            </div>
            
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message..."
                className="w-full pl-4 md:pl-6 pr-4 md:pr-6 py-3 md:py-4 rounded-[24px] md:rounded-[32px] bg-stone-100 dark:bg-white/5 border-none outline-none focus:ring-2 focus:ring-brand-500/20 text-xs md:text-sm"
              />
            </div>

            <button 
              type="submit"
              disabled={!newMessage.trim() && !isUploading}
              className={`p-3 md:p-4 rounded-full transition-all flex items-center justify-center shadow-lg active:scale-90 ${
                newMessage.trim() 
                  ? 'bg-brand-900 text-white shadow-brand-900/20' 
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5 md:w-6 md:h-6 translate-x-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
