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
    <div className="h-[70vh] md:h-[550px] flex shadow-xl border border-brand-500/10 relative mx-auto max-w-3xl overflow-hidden rounded-xl md:rounded-[24px] glass">
      {/* Sidebar - Contacts */}
      <div className={`${showMembers ? 'flex translate-x-0' : 'hidden lg:flex -translate-x-full lg:translate-x-0'} absolute lg:relative inset-0 lg:inset-auto z-40 w-full lg:w-56 border-r border-brand-100 dark:border-stone-800 flex-col bg-stone-50/80 dark:bg-stone-900/80 backdrop-blur-2xl transition-transform duration-500`}>
        <div className="p-3 border-b border-brand-100 dark:border-stone-800 flex items-center justify-between bg-brand-50/30 dark:bg-brand-900/10">
          <h2 className="text-base font-black tracking-tight text-brand-950 dark:text-brand-50 uppercase tracking-[0.2em]">Souls</h2>
          <button 
            onClick={() => setShowMembers(false)}
            className="lg:hidden p-2 bg-white dark:bg-stone-800 rounded-lg shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-brand-900" />
          </button>
        </div>
        <div className="p-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 rounded-md bg-white dark:bg-black/20 border-brand-500/5 text-[11px] outline-none focus:ring-2 focus:ring-brand-500/10 transition-all font-medium"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
          <div className="space-y-1.5">
            <button 
              onClick={() => setShowMembers(false)}
              className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-brand-600 text-white shadow-md shadow-brand-600/20 text-left transition-all hover:scale-[1.01] active:scale-[0.98] group relative overflow-hidden"
            >
              <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
              <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
                <Church className="w-4 h-4" />
              </div>
              <div className="overflow-hidden relative z-10">
                <div className="font-black tracking-tight text-[12px] truncate text-white">Hub</div>
                <div className="text-[6px] opacity-70 font-black uppercase tracking-[0.1em] truncate text-white">Online</div>
              </div>
            </button>

            <div className="mt-3 mb-1 px-2">
              <span className="text-[7px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">Members</span>
            </div>

            {filteredUsers.map((u, idx) => (
              <motion.button 
                key={u.uid} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="w-full flex items-center gap-2.5 p-1.5 rounded-md hover:bg-white dark:hover:bg-white/5 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-md overflow-hidden shrink-0 border border-brand-500/10 shadow-sm relative transition-transform duration-500">
                  {u.photoURL ? (
                    <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-500/5 flex items-center justify-center">
                      <UserIcon className="w-3.5 h-3.5 text-brand-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-emerald-500 border border-white dark:border-stone-900 rounded-full shadow-lg" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-[11px] truncate text-stone-900 dark:text-stone-100 tracking-tight">{u.displayName}</div>
                  <div className="text-[7px] text-stone-500 dark:text-stone-400 truncate tracking-[0.05em] uppercase font-black opacity-60">{u.role}</div>
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
        <div className="px-3 md:px-5 py-2 md:py-3 flex items-center justify-between border-b border-stone-100 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 backdrop-blur-2xl z-10">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            <button 
              onClick={() => setShowMembers(true)}
              className="lg:hidden p-2 bg-brand-500/5 text-brand-600 rounded-lg transition-all shadow-sm active:scale-95"
            >
              <UsersIcon className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-md shadow-brand-600/20 text-white shrink-0">
              <Church className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-black tracking-tight truncate text-stone-900 dark:text-white">Fellowship Hub</h3>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[7px] text-emerald-500 font-black uppercase tracking-[0.1em] truncate">Active</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a 
              href="https://meet.google.com/new" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex p-2 bg-brand-500/5 hover:bg-brand-600 hover:text-white rounded-md transition-all shadow-sm active:scale-90"
              title="Start Google Meet"
            >
              <Video className="w-3.5 h-3.5" />
            </a>
            
            <div className="relative">
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`p-2 bg-stone-100 dark:bg-stone-800 hover:bg-brand-600 hover:text-white rounded-md transition-all shadow-sm active:scale-90 ${showMoreMenu ? 'bg-brand-600 text-white' : ''}`}
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {showMoreMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowMoreMenu(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 mt-1 w-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-xl shadow-xl border border-brand-500/5 p-1.5 z-20"
                    >
                      <div className="px-2 py-1 border-b border-stone-100 dark:border-stone-800 mb-1">
                        <p className="text-[7px] font-black uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Settings</p>
                      </div>
                      <div className="space-y-0.5">
                        <button className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-brand-500/10 text-left text-[10px] font-bold transition-all">
                          <MessageCircle className="w-3 h-3 text-brand-500" />
                          Intel
                        </button>
                        {currentUser?.role === 'admin' && (
                          <>
                            <div className="h-px bg-stone-100 dark:bg-stone-800 my-1 mx-1" />
                            <button 
                              onClick={handleClearHistory}
                              className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-red-500 hover:text-white transition-all text-left text-[10px] font-bold text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                              Wipe
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
        <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 md:space-y-4 custom-scrollbar z-0 flex flex-col relative">
          <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
          
          <div className="flex justify-center mb-1">
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1 rounded-full bg-brand-600/10 border border-brand-500/20 text-[7px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] shadow-sm backdrop-blur-xl"
            >
              Fellowship Sanctum
            </motion.span>
          </div>

          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center opacity-30 text-stone-500 py-8"
              >
                  <div className="w-12 h-12 rounded-xl border border-dashed border-brand-500/20 flex items-center justify-center mb-2 animate-pulse">
                    <Church className="w-6 h-6 text-brand-400" />
                  </div>
                  <p className="font-serif italic text-sm text-center px-4 max-w-[200px]">"Where two or three gather..."</p>
              </motion.div>
            ) : (
              messages.map((msg) => {
              const isMine = msg.senderId === currentUser?.uid;

              return (
                <motion.div 
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex items-end gap-1.5 md:gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-6 h-6 md:w-8 md:h-8 shrink-0`}>
                    <div className={`w-full h-full rounded-md md:rounded-lg p-0.5 bg-gradient-to-br ${
                      isMine ? 'from-brand-400 to-brand-600 shadow-sm' : 'from-stone-200 to-stone-400 dark:from-stone-700 dark:to-stone-600'
                    }`}>
                      <div className="w-full h-full rounded-[4px] md:rounded-md overflow-hidden bg-white dark:bg-stone-900">
                        {msg.senderPhoto ? (
                          <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-brand-500/5 flex items-center justify-center">
                            <UserIcon className="w-3.5 h-3.5 text-brand-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`max-w-[85%] lg:max-w-[70%] group relative px-3 py-1.5 rounded-lg md:rounded-xl transition-all duration-300 ${
                    isMine 
                      ? 'bg-brand-600 text-white rounded-br-[2px] shadow-sm' 
                      : 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-bl-[2px] border border-brand-500/5 shadow-sm'
                  }`}>
                    <div className="absolute inset-0 divine-pattern opacity-[0.03] pointer-events-none" />
                    
                    <div className={`absolute -top-1.5 ${isMine ? 'right-0' : 'left-0'} z-20`}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === msg.id ? null : msg.id);
                        }}
                        className={`p-0.5 bg-white dark:bg-stone-900 rounded-full shadow-md border border-brand-500/10 transition-all text-stone-500 hover:scale-110 active:scale-95 ${activeMenuId === msg.id ? 'ring-1 ring-brand-500/10 text-brand-600 opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      >
                        <MoreHorizontal className="w-2.5 h-2.5" />
                      </button>

                      <AnimatePresence>
                        {activeMenuId === msg.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveMenuId(null)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 3 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 3 }}
                              className={`absolute bottom-full mb-1 ${isMine ? 'right-0' : 'left-0'} w-24 bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-lg shadow-lg border border-brand-500/5 p-1 z-20 flex flex-col gap-0.5`}
                            >
                              <button 
                                onClick={() => {
                                  setReplyMessage(msg);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-1.5 p-1 rounded-md hover:bg-brand-500/10 text-left text-[7px] font-black uppercase tracking-wider text-brand-600"
                              >
                                <CornerUpLeft className="w-2.5 h-2.5" />
                                Reply
                              </button>
                              {(isMine || currentUser?.role === 'admin') && (
                                <button 
                                  onClick={() => {
                                    handleDeleteMessage(msg.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-1.5 p-1 rounded-md hover:bg-red-500 hover:text-white transition-all text-left text-[7px] font-black uppercase tracking-wider text-red-500"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
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
                          el?.classList.add('ring-1', 'ring-brand-500/20');
                          setTimeout(() => el?.classList.remove('ring-1', 'ring-brand-500/20'), 2000);
                        }}
                        className="w-full mb-1.5 p-1.5 rounded-md bg-black/10 dark:bg-white/5 border-l-2 border-white/30 text-left hover:bg-black/20 dark:hover:bg-white/10 transition-all font-medium"
                      >
                        <p className="text-[7px] font-black uppercase tracking-widest text-white/60 mb-0.5">{msg.replyTo.senderName}</p>
                        <p className="text-[9px] opacity-80 truncate italic">{msg.replyTo.text}</p>
                      </button>
                    )}

                    {!isMine && (
                      <span className="block text-[7px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em] mb-0.5">
                        {msg.senderName}
                      </span>
                    )}

                    <div className="space-y-1">
                       {msg.mediaUrl && (
                        <div className="rounded-lg overflow-hidden mb-1 shadow-inner bg-black/5 dark:bg-white/5 relative">
                          {msg.mediaType === 'image' && (
                            <img src={msg.mediaUrl} alt="Shared" className="w-full h-auto max-h-[150px] md:max-h-[250px] object-cover transition-transform duration-700 cursor-pointer" />
                          )}
                          {msg.mediaType === 'video' && (
                            <video src={msg.mediaUrl} controls className="w-full h-auto max-h-[150px] md:max-h-[250px]" />
                          )}
                          {msg.mediaType === 'sticker' && (
                            <div className="text-3xl py-1 flex justify-center animate-bounce-slow">
                              {msg.mediaUrl}
                            </div>
                          )}
                        </div>
                      )}
                      {msg.text && (
                        <p className="text-[11px] md:text-[13px] leading-snug font-bold tracking-tight">{msg.text}</p>
                      )}
                    </div>

                    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end opacity-60' : 'justify-start opacity-40'}`}>
                      <span className="text-[6px] font-black uppercase tracking-[0.1em]">
                        {msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...' }
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
        <div className="p-2 md:p-4 bg-white/80 dark:bg-stone-950/80 backdrop-blur-3xl z-10 border-t border-brand-500/5 relative">
          <AnimatePresence>
            {replyMessage && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="mx-auto max-w-2xl mb-2 p-2 bg-brand-600/5 border-l-2 border-brand-600 rounded-lg flex items-center justify-between group shadow-sm"
              >
                <div className="overflow-hidden pl-1">
                  <p className="text-[7px] font-black uppercase tracking-[0.2em] text-brand-600 mb-0.5">Replying to {replyMessage.senderName}</p>
                  <p className="text-[10px] text-stone-600 dark:text-stone-300 truncate italic font-medium">{replyMessage.text || "[Sacred Media]"}</p>
                </div>
                <button 
                  onClick={() => setReplyMessage(null)}
                  className="p-1 bg-white dark:bg-stone-900 hover:bg-red-500 hover:text-white rounded-full transition-all shadow-sm"
                >
                  <CloseIcon className="w-2.5 h-2.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 md:gap-2 max-w-2xl mx-auto">
            <div className="flex items-center gap-1 relative">
              <button 
                type="button" 
                onClick={() => setShowStickers(!showStickers)}
                className={`p-2 md:p-2.5 bg-brand-500/5 rounded-full transition-all shadow-sm active:scale-95 group ${showStickers ? 'bg-brand-600 text-white' : 'text-brand-600 hover:bg-brand-600 hover:text-white'}`}
              >
                <Smile className="w-4 h-4 md:w-4.5 md:h-4.5 group-hover:rotate-12 transition-transform" />
              </button>
              
              <AnimatePresence>
                {showStickers && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.9 }}
                    animate={{ opacity: 1, y: -5, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    className="absolute bottom-full left-0 mb-2 p-2 bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl rounded-lg shadow-xl border border-brand-500/5 grid grid-cols-4 gap-1.5 w-40 z-50 overflow-hidden"
                  >
                    <div className="absolute inset-0 divine-pattern opacity-10 pointer-events-none" />
                    {STICKERS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendSticker(s)}
                        className="text-lg hover:scale-120 transition-all active:scale-90 relative z-10"
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
                className="p-2 md:p-2.5 bg-stone-100/50 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-brand-600 hover:text-white rounded-md transition-all shadow-sm active:scale-90 disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
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
                className="w-full pl-3 pr-3 py-2 md:py-2.5 rounded-full bg-white/80 dark:bg-white/5 border border-brand-500/5 outline-none focus:ring-1 focus:ring-brand-500/10 text-[11px] md:text-xs font-bold shadow-inner transition-all"
              />
            </div>
 
            <button 
              type="submit"
              disabled={!newMessage.trim() && !isUploading}
              className={`p-2.5 md:p-3 rounded-full transition-all flex items-center justify-center shadow-lg active:scale-90 transform ${
                newMessage.trim() 
                  ? 'bg-brand-600 text-white shadow-brand-600/20' 
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed opacity-50'
              }`}
            >
              <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
