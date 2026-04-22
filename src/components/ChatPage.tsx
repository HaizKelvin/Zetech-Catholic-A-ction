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
import { UserProfile } from '../types';
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
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  timestamp: any;
}

export default function ChatPage({ currentUser }: { currentUser: UserProfile | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, 'community_chat'), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        senderPhoto: currentUser.photoURL || '',
        timestamp: serverTimestamp()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[75vh] md:h-[calc(100vh-200px)] flex glass rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl border border-white/20 relative">
      {/* Sidebar - Contacts */}
      <div className={`${showMembers ? 'flex translate-x-0' : 'hidden md:flex -translate-x-full md:translate-x-0'} absolute md:relative inset-0 md:inset-auto z-40 w-full md:w-80 border-r border-stone-100 dark:border-stone-800 flex-col bg-white dark:bg-stone-900 md:bg-white/40 md:dark:bg-stone-900/40 backdrop-blur-md transition-transform duration-300`}>
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
              <p className="text-[9px] md:text-[10px] text-green-500 font-bold uppercase tracking-widest truncate">Active Members</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-5 text-stone-400">
            <button className="hidden sm:block hover:text-brand-600 transition-colors"><Video className="w-5 h-5" /></button>
            <button className="hidden sm:block hover:text-brand-600 transition-colors"><Phone className="w-5 h-5" /></button>
            <div className="hidden sm:block h-4 w-[1px] bg-stone-200 dark:bg-stone-800" />
            <button className="hover:text-brand-600 transition-colors"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Messages Layout */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar z-0 flex flex-col">
          <div className="flex justify-center mb-2 md:mb-4">
            <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-[9px] md:text-[10px] font-bold text-stone-400 uppercase tracking-widest">Today</span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isMine = msg.senderId === currentUser?.uid;

              return (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex items-end gap-2 md:gap-3 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg overflow-hidden shrink-0 shadow-sm border border-stone-100 dark:border-stone-800">
                      {msg.senderPhoto ? (
                        <img src={msg.senderPhoto} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-stone-400" />
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] md:max-w-[70%] group relative px-4 md:px-6 py-2.5 md:py-3.5 rounded-2xl md:rounded-3xl shadow-sm ${
                    isMine 
                      ? 'bg-brand-900 text-white rounded-br-none' 
                      : 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-none border border-stone-100 dark:border-stone-700'
                  }`}>
                    {!isMine && (
                      <span className="block text-[9px] md:text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-tight mb-0.5 md:mb-1">
                        {msg.senderName}
                      </span>
                    )}
                    <p className="text-xs md:text-sm leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end opacity-60' : 'justify-start opacity-40'}`}>
                      <span className="text-[8px] md:text-[9px] font-medium uppercase tracking-tighter">
                        {msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sending...'}
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
            <div className="flex items-center">
              <button type="button" className="p-2 md:p-3 text-stone-400 hover:text-brand-600 transition-colors"><Smile className="w-5 h-5 md:w-6 md:h-6" /></button>
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
              disabled={!newMessage.trim()}
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
