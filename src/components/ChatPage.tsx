import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  getDocs
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
  Loader2
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
}

const STICKERS = [
  '🙏', '🙌', '✨', '🕊️', '⛪', '📖', '🕯️', '🛡️', '✝️', '🫂', '🔥', '❤️', '🌟', '🌈', '☀️', '🌸'
];

export default function ChatPage({ currentUser }: { currentUser: UserProfile | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
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
      console.error("Error clearing history:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const q = query(
      collection(db, 'community_chat'),
      orderBy('timestamp', 'asc'),
      limit(100)
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
      const q = query(collection(db, 'users'), limit(50));
      const snapshot = await getDocs(q);
      const u: UserProfile[] = [];
      snapshot.forEach(doc => u.push(doc.data() as UserProfile));
      setUsers(u);
    };
    fetchUsers();
  }, []);

  const handleSendMessage = async (e?: React.FormEvent, media?: { url: string, type: Message['mediaType'] }) => {
    e?.preventDefault();
    if (!newMessage.trim() && !media && !currentUser) return;
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'community_chat'), {
        text: newMessage,
        mediaUrl: media?.url || null,
        mediaType: media?.type || null,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL || '',
        timestamp: serverTimestamp()
      });
      setNewMessage('');
      setShowStickers(false);
    } catch (error) {
      console.error("Error sending message:", error);
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
        // Video storage usually requires a bucket, but we'll try a small check or just notify
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
      console.error("Upload error:", error);
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
    try {
      await deleteDoc(doc(db, 'community_chat', messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[60vh] md:h-[600px] flex glass rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl border border-white/20 relative mx-auto max-w-5xl">
      {/* Sidebar - Contacts */}
      <div className={`${showMembers ? 'flex translate-x-0' : 'hidden md:flex -translate-x-full md:translate-x-0'} absolute md:relative inset-0 md:inset-auto z-40 w-full md:w-72 border-r border-stone-100 dark:border-stone-800 flex-col bg-white dark:bg-stone-900 md:bg-white/40 md:dark:bg-stone-900/40 backdrop-blur-md transition-transform duration-300`}>
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
          <div className="p-2 space-y-1">
            <button 
              onClick={() => setShowMembers(false)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-brand-900 text-white shadow-lg shadow-brand-900/20 text-left transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20">
                <Church className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <div className="font-bold truncate">CA Community Hub</div>
                <div className="text-[10px] opacity-80 truncate">You: Share your thoughts here...</div>
              </div>
            </button>

            {filteredUsers.map((u) => (
              <button key={u.uid} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all text-left">
                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-stone-100 dark:border-stone-800 shadow-sm relative">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-stone-300" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-stone-900 rounded-full" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-sm truncate">{u.displayName}</div>
                  <div className="text-[10px] text-stone-400 truncate tracking-tight">{u.bio || 'Faithful Soul'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <div className="absolute inset-0 faith-bg opacity-5 pointer-events-none" />
        
        {/* Chat Header */}
        <div className="px-4 md:px-8 py-4 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md z-10">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
            <button 
              onClick={() => setShowMembers(true)}
              className="md:hidden p-2 -ml-2 text-stone-400 hover:text-brand-600 transition-colors"
            >
              <UsersIcon className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-brand-900 flex items-center justify-center shadow-lg shadow-brand-900/20 text-white shrink-0">
              <Church className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold tracking-tight truncate">CA Community Hub</h3>
              <p className="text-[9px] md:text-[10px] text-green-500 font-bold uppercase tracking-widest truncate">Live Community</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 text-stone-400">
            <a 
              href="https://meet.google.com/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden sm:flex p-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 rounded-xl transition-all"
              title="Start Google Meet"
            >
              <Video className="w-5 h-5" />
            </a>
            <button className="hidden sm:flex p-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 rounded-xl transition-all"><Phone className="w-5 h-5" /></button>
            <div className="hidden sm:block h-4 w-[1px] bg-stone-200 dark:bg-stone-800" />
            
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`p-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-600 rounded-xl transition-all ${showMoreMenu ? 'bg-brand-50 text-brand-600' : ''}`}
              >
                <MoreVertical className="w-5 h-5" />
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
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-100 dark:border-stone-800 p-2 z-20"
                    >
                      <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Hub Settings</p>
                      </div>
                      <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left text-xs font-bold transition-all text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Hub Information
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left text-xs font-bold transition-all text-stone-600 dark:text-stone-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        Notifications
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left text-xs font-bold transition-all text-stone-600 dark:text-stone-300">
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
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar z-0 flex flex-col bg-stone-50/30 dark:bg-black/10">
          <div className="flex justify-center mb-2 md:mb-4">
            <span className="px-4 py-1.5 rounded-full glass border border-white/10 text-[9px] md:text-[10px] font-black text-stone-400 uppercase tracking-widest shadow-sm">Sanctuary Fellowship</span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isMine = msg.senderId === currentUser?.uid;

              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex items-end gap-3 md:gap-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-9 h-9 md:w-10 md:h-10 shrink-0 transform transition-transform group-hover:scale-110`}>
                    <div className={`w-full h-full rounded-[14px] md:rounded-[18px] p-[2px] transition-all bg-gradient-to-br ${
                      isMine ? 'from-brand-400 to-brand-600 shadow-lg shadow-brand-500/20' : 'from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-600 shadow-md'
                    }`}>
                      <div className="w-full h-full rounded-[12px] md:rounded-[16px] overflow-hidden bg-white dark:bg-stone-900 border border-white/50 dark:border-stone-800">
                        {msg.senderPhoto ? (
                          <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-stone-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`max-w-[85%] md:max-w-[70%] group relative px-4 md:px-6 py-3 md:py-4 rounded-[28px] md:rounded-[36px] transition-all ${
                    isMine 
                      ? 'bg-brand-900 text-white rounded-br-none shadow-xl shadow-brand-900/10' 
                      : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-none border border-stone-100 dark:border-stone-700 shadow-sm'
                  }`}>
                    {(isMine || currentUser?.role === 'admin') && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className={`absolute -top-3 ${isMine ? 'right-0' : 'left-0'} p-2 bg-white dark:bg-stone-900 rounded-full shadow-2xl border border-stone-100 dark:border-stone-800 md:opacity-0 group-hover:opacity-100 transition-all z-20 hover:text-red-500 text-stone-400 hover:scale-110 active:scale-95`}
                        title="Delete Message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 md:p-6 bg-white/60 dark:bg-stone-900/60 backdrop-blur-md z-10 border-t border-stone-100 dark:border-stone-800">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-1 relative">
              <button 
                type="button" 
                onClick={() => setShowStickers(!showStickers)}
                className={`p-2 md:p-3 hover:text-brand-600 transition-colors ${showStickers ? 'text-brand-600' : 'text-stone-400'}`}
              >
                <Smile className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              
              <AnimatePresence>
                {showStickers && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className="absolute bottom-full left-0 mb-4 p-4 bg-white dark:bg-stone-900 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-stone-100 dark:border-stone-800 grid grid-cols-4 gap-3 w-48 z-50 overflow-hidden"
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
                className="p-2 md:p-3 text-stone-400 hover:text-brand-600 transition-colors disabled:opacity-50"
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

function Church({ className }: { className?: string }) {
   return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2" />
      <path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4" />
      <path d="M18 22V5l-6-3-6 3v17" />
      <path d="M12 7v5" />
      <path d="M10 9h4" />
    </svg>
   );
}
