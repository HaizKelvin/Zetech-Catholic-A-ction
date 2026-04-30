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
  X as CloseIcon,
  MoreHorizontal
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
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
    <div className="h-[82vh] md:h-[680px] flex shadow-3xl border border-brand-500/10 relative mx-auto max-w-5xl overflow-hidden rounded-[32px] glass">
      {/* Sidebar - Contacts */}
      <div className={`${showMembers ? 'flex translate-x-0' : 'hidden lg:flex -translate-x-full lg:translate-x-0'} absolute lg:relative inset-0 lg:inset-auto z-40 w-full lg:w-72 border-r border-brand-100 dark:border-stone-800 flex-col bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-2xl transition-transform duration-500`}>
        <div className="p-6 border-b border-brand-100 dark:border-stone-800 flex items-center justify-between bg-brand-50/30 dark:bg-brand-900/10">
          <h2 className="text-xl font-black tracking-tight text-brand-950 dark:text-brand-50 uppercase tracking-[0.2em]">Souls</h2>
          <button 
            onClick={() => setShowMembers(false)}
            className="lg:hidden p-3 bg-white dark:bg-stone-800 rounded-2xl shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-brand-900" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-black/20 border-brand-500/5 text-[13px] outline-none focus:ring-4 focus:ring-brand-500/10 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          <div className="space-y-3">
            <button 
              onClick={() => setShowMembers(false)}
              className="w-full flex items-center gap-4 p-4 rounded-[24px] bg-brand-600 text-white shadow-xl shadow-brand-600/20 text-left transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
            >
              <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
              <div className="w-12 h-12 rounded-[18px] bg-white/20 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                <Church className="w-6 h-6" />
              </div>
              <div className="overflow-hidden relative z-10">
                <div className="font-black tracking-tight text-sm truncate text-white">Community Hub</div>
                <div className="text-[8px] opacity-70 font-black uppercase tracking-[0.2em] truncate text-white">Divine Sync</div>
              </div>
            </button>

            <div className="mt-6 mb-2 px-3">
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400">Divine Members</span>
            </div>

            {filteredUsers.map((u, idx) => (
              <motion.button 
                key={u.uid} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="w-full flex items-center gap-4 p-3 rounded-[20px] hover:bg-white dark:hover:bg-white/5 hover:shadow-xl hover:shadow-brand-500/5 transition-all text-left group"
              >
                <div className="w-11 h-11 rounded-[16px] overflow-hidden shrink-0 border border-brand-500/10 shadow-sm relative group-hover:scale-110 transition-transform duration-500">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-500/5 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-brand-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-stone-900 rounded-full shadow-lg" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-[13px] truncate text-stone-900 dark:text-stone-100 tracking-tight">{u.displayName}</div>
                  <div className="text-[9px] text-stone-500 dark:text-stone-400 truncate tracking-[0.05em] uppercase font-black opacity-60">{u.role}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-white/40 dark:bg-transparent">
        <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
        
        {/* Chat Header */}
        <div className="px-5 md:px-8 py-5 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl z-10">
          <div className="flex items-center gap-4 md:gap-5 overflow-hidden">
            <button 
              onClick={() => setShowMembers(true)}
              className="lg:hidden p-3 bg-brand-500/5 text-brand-600 rounded-[18px] transition-all shadow-sm active:scale-95"
            >
              <UsersIcon className="w-6 h-6" />
            </button>
            <div className="w-12 h-12 rounded-[18px] bg-brand-600 flex items-center justify-center shadow-xl shadow-brand-600/20 text-white shrink-0 group hover:rotate-6 transition-all duration-700">
              <Church className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-lg font-black tracking-tight truncate text-stone-900 dark:text-white">Sanctuary Fellowship</h3>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] truncate">Divine Sync Active</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href="https://meet.google.com/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex p-3 bg-brand-500/5 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"
              title="Start Google Meet"
            >
              <Video className="w-4.5 h-4.5" />
            </a>
            
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`p-3 bg-stone-100 dark:bg-stone-800 hover:bg-brand-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-90 ${showMoreMenu ? 'bg-brand-600 text-white ring-4 ring-brand-600/10' : ''}`}
              >
                <MoreVertical className="w-4.5 h-4.5" />
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
                      className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-[28px] shadow-3xl border border-brand-500/5 p-3 z-20"
                    >
                      <div className="px-3 py-2 border-b border-stone-100 dark:border-stone-800 mb-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Sanctuary Settings</p>
                      </div>
                      <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 p-3 rounded-[16px] hover:bg-brand-500/10 text-left text-[11px] font-bold transition-all group">
                          <MessageCircle className="w-4 h-4 text-brand-500 group-hover:scale-110 transition-transform" />
                          Hub Intel
                        </button>
                        {currentUser?.role === 'admin' && (
                          <>
                            <div className="h-px bg-stone-100 dark:bg-stone-800 my-2 mx-2" />
                            <button 
                              onClick={handleClearHistory}
                              className="w-full flex items-center gap-3 p-3 rounded-[16px] hover:bg-red-500 hover:text-white transition-all text-left text-[11px] font-bold text-red-500 group"
                            >
                              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                              Wipe Sanctum
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Messages Layout */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 md:space-y-8 custom-scrollbar z-0 flex flex-col relative">
          <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
          
          <div className="flex justify-center mb-4">
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-2.5 rounded-full bg-brand-600/10 border border-brand-500/20 text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.4em] shadow-sm backdrop-blur-xl"
            >
              Sanctuary of Fellowship
            </motion.span>
          </div>

          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center opacity-30 text-stone-500 py-20"
              >
                  <div className="w-20 h-20 rounded-[28px] border-4 border-dashed border-brand-500/20 flex items-center justify-center mb-6 animate-pulse">
                    <Church className="w-10 h-10 text-brand-400" />
                  </div>
                  <p className="font-serif italic text-xl text-center px-10 max-w-sm">"Where two or three gather in my name..."</p>
              </motion.div>
            ) : (
              messages.map((msg) => {
              const isMine = msg.senderId === currentUser?.uid;

              return (
                <motion.div 
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex items-end gap-3 md:gap-4 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 md:w-11 md:h-11 shrink-0`}>
                    <div className={`w-full h-full rounded-[14px] md:rounded-[18px] p-0.5 bg-gradient-to-br ${
                      isMine ? 'from-brand-400 to-brand-600 shadow-lg shadow-brand-600/20' : 'from-stone-200 to-stone-400 dark:from-stone-700 dark:to-stone-600'
                    }`}>
                      <div className="w-full h-full rounded-[12px] md:rounded-[16px] overflow-hidden bg-white dark:bg-stone-900">
                        {msg.senderPhoto ? (
                          <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-brand-500/5 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-brand-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`max-w-[85%] lg:max-w-[75%] group relative px-6 py-4 rounded-[24px] md:rounded-[32px] transition-all duration-300 ${
                    isMine 
                      ? 'bg-brand-600 text-white rounded-br-[4px] shadow-xl shadow-brand-600/15' 
                      : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-bl-[4px] border border-brand-500/5 shadow-md'
                  }`}>
                    <div className="absolute inset-0 divine-pattern opacity-[0.05] pointer-events-none" />
                    
                    <div className={`absolute -top-3 ${isMine ? 'right-0' : 'left-0'} z-20`}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                        }}
                        className={`p-2 bg-white dark:bg-stone-900 rounded-full shadow-xl border border-brand-500/10 transition-all text-stone-500 hover:scale-110 active:scale-95 ${activeMenuId === msg.id ? 'ring-4 ring-brand-500/10 text-brand-600 opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      <AnimatePresence>
                        {activeMenuId === msg.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenuId(null)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 5 }}
                              className={`absolute bottom-full mb-2 ${isMine ? 'right-0' : 'left-0'} w-32 bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-[20px] shadow-3xl border border-brand-500/5 p-1.5 z-20 flex flex-col gap-1`}
                            >
                              <button 
                                onClick={() => {
                                  setReplyMessage(msg);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-brand-500/10 text-left text-[9px] font-black uppercase tracking-widest text-brand-600"
                              >
                                <CornerUpLeft className="w-3.5 h-3.5" />
                                Reply
                              </button>
                              {(isMine || currentUser?.role === 'admin') && (
                                <button 
                                  onClick={() => {
                                    handleDeleteMessage(msg.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all text-left text-[9px] font-black uppercase tracking-widest text-red-500"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {msg.replyTo && (
                      <button 
                        onClick={() => {
                          const el = document.getElementById(`msg-${msg.replyTo?.id}`);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          el?.classList.add('ring-4', 'ring-brand-500/30');
                          setTimeout(() => el?.classList.remove('ring-4', 'ring-brand-500/30'), 2000);
                        }}
                        className="w-full mb-3 p-3 rounded-[16px] bg-black/10 dark:bg-white/5 border-l-4 border-white/30 text-left hover:bg-black/20 dark:hover:bg-white/10 transition-all"
                      >
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/60 mb-1">{msg.replyTo.senderName}</p>
                        <p className="text-[11px] opacity-80 truncate italic font-medium">{msg.replyTo.text}</p>
                      </button>
                    )}

                    {!isMine && (
                      <span className="block text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] mb-1.5">
                        {msg.senderName}
                      </span>
                    )}

                    <div className="space-y-3">
                       {msg.mediaUrl && (
                        <div className="rounded-[18px] overflow-hidden mb-2 shadow-inner bg-black/5 dark:bg-white/5 relative group/media">
                          {msg.mediaType === 'image' && (
                            <img src={msg.mediaUrl} alt="Shared" className="w-full h-auto max-h-[300px] object-cover transition-transform duration-700 group-hover/media:scale-105 cursor-pointer" />
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
                        <p className="text-[13px] md:text-base leading-relaxed font-bold tracking-tight">{msg.text}</p>
                      )}
                    </div>

                    <div className={`flex items-center gap-2 mt-3 ${isMine ? 'justify-end opacity-60' : 'justify-start opacity-40'}`}>
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                        {msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'JUST NOW' }
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-5 md:p-8 bg-white/80 dark:bg-stone-950/80 backdrop-blur-3xl z-10 border-t border-brand-500/5 relative">
          <AnimatePresence>
            {replyMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.98 }}
                className="mx-auto max-w-4xl mb-4 p-4 bg-brand-600/5 border-l-4 border-brand-600 rounded-[20px] flex items-center justify-between group shadow-lg"
              >
                <div className="overflow-hidden pl-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-600 mb-1">Replying to {replyMessage.senderName}</p>
                  <p className="text-xs text-stone-600 dark:text-stone-300 truncate italic font-medium">{replyMessage.text || "[Sacred Media]"}</p>
                </div>
                <button 
                  onClick={() => setReplyMessage(null)}
                  className="p-2.5 bg-white dark:bg-stone-900 hover:bg-red-500 hover:text-white rounded-full transition-all shadow-md"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={handleSendMessage} className="flex items-center gap-3 md:gap-4 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 relative">
              <button 
                type="button" 
                onClick={() => setShowStickers(!showStickers)}
                className={`p-3.5 md:p-4 bg-brand-500/5 rounded-full transition-all shadow-lg active:scale-95 group ${showStickers ? 'bg-brand-600 text-white ring-4 ring-brand-600/10' : 'text-brand-600 hover:bg-brand-600 hover:text-white'}`}
              >
                <Smile className="w-5.5 h-5.5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />
              </button>
              
              <AnimatePresence>
                {showStickers && (
                  <motion.div
                    initial={{ opacity: 0, y: -15, scale: 0.9 }}
                    animate={{ opacity: 1, y: -12, scale: 1 }}
                    exit={{ opacity: 0, y: -15, scale: 0.9 }}
                    className="absolute bottom-full left-0 mb-4 p-4 bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-[24px] shadow-3xl border border-brand-500/5 grid grid-cols-4 gap-3 w-56 z-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
                    {STICKERS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendSticker(s)}
                        className="text-2xl hover:scale-130 hover:rotate-12 transition-all active:scale-90 relative z-10"
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
                className="p-3.5 md:p-4 bg-stone-100/50 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-brand-600 hover:text-white rounded-[18px] transition-all shadow-lg active:scale-90 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-5.5 h-5.5 animate-spin" /> : <Paperclip className="w-5.5 h-5.5" />}
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
                placeholder="Share your word..."
                className="w-full pl-6 pr-6 py-4 md:py-5 rounded-[24px] md:rounded-[32px] bg-white/80 dark:bg-white/5 border border-brand-500/5 outline-none focus:ring-4 focus:ring-brand-500/10 text-[13px] md:text-sm font-bold shadow-inner transition-all"
              />
            </div>

            <button 
              type="submit"
              disabled={!newMessage.trim() && !isUploading}
              className={`p-4 md:p-5 rounded-full transition-all flex items-center justify-center shadow-2xl active:scale-90 transform ${
                newMessage.trim() 
                  ? 'bg-brand-600 text-white shadow-brand-600/20 -rotate-6 hover:rotate-0' 
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed opacity-50'
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
