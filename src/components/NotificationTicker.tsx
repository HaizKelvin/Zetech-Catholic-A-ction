import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Zap, Star, Info, User } from 'lucide-react';

interface AlertItem {
  id: string;
  type: 'member' | 'activity' | 'event' | 'resource';
  text: string;
  timestamp: any;
}

export default function NotificationTicker() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Listen for new users
    const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(1));
    unsubscribers.push(onSnapshot(usersQ, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const newAlert: AlertItem = {
            id: 'user-' + change.doc.id,
            type: 'member',
            text: `${data.displayName || 'A new member'} joined our community`,
            timestamp: data.createdAt
          };
          addAlertIfNotExpired(newAlert);
        }
      });
    }, (err) => console.error("Ticker users error:", err)));

    // Listen for new gallery items (activities)
    const galleryQ = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(1));
    unsubscribers.push(onSnapshot(galleryQ, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const newAlert: AlertItem = {
            id: 'gallery-' + change.doc.id,
            type: 'activity',
            text: `New activity: ${data.title}`,
            timestamp: data.timestamp
          };
          addAlertIfNotExpired(newAlert);
        }
      });
    }, (err) => console.error("Ticker gallery error:", err)));

    // Listen for new events
    const eventsQ = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(1));
    unsubscribers.push(onSnapshot(eventsQ, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const newAlert: AlertItem = {
            id: 'event-' + change.doc.id,
            type: 'event',
            text: `Upcoming Event: ${data.title}`,
            timestamp: data.createdAt
          };
          addAlertIfNotExpired(newAlert);
        }
      });
    }, (err) => console.error("Ticker events error:", err)));

    // Listen for new resources
    const resourcesQ = query(collection(db, 'resources'), orderBy('createdAt', 'desc'), limit(1));
    unsubscribers.push(onSnapshot(resourcesQ, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const newAlert: AlertItem = {
            id: 'resource-' + change.doc.id,
            type: 'resource',
            text: `New Resource added: ${data.title}`,
            timestamp: data.createdAt
          };
          addAlertIfNotExpired(newAlert);
        }
      });
    }, (err) => console.error("Ticker resources error:", err)));

    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const addAlertIfNotExpired = (alert: AlertItem) => {
    // Only show alerts created in the last 24 hours to avoid historic spam on load
    const now = new Date().getTime();
    const alertTime = alert.timestamp instanceof Timestamp ? alert.timestamp.toMillis() : now;
    
    if (now - alertTime < 24 * 60 * 60 * 1000) {
      setAlerts(prev => {
        const filtered = prev.filter(a => a.id !== alert.id);
        return [alert, ...filtered].slice(0, 5); // Keep last 5
      });
    }
  };

  useEffect(() => {
    if (alerts.length === 0) return;
    
    // Auto-remove the current alert after 6 seconds to make it "once not repetitive"
    const timer = setTimeout(() => {
      setAlerts(prev => prev.slice(1));
      setCurrentIndex(0);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, [alerts]);

  if (alerts.length === 0) return null;

  const currentAlert = alerts[0];

  const getIcon = (type: string) => {
    switch (type) {
      case 'member': return <User className="w-3 h-3 text-emerald-500" />;
      case 'activity': return <Zap className="w-3 h-3 text-amber-500" />;
      case 'event': return <Star className="w-3 h-3 text-indigo-500" />;
      case 'resource': return <Bell className="w-3 h-3 text-brand-500" />;
      default: return <Info className="w-3 h-3 text-stone-400" />;
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center pointer-events-none pt-4">
      <div className="w-full max-w-lg mx-4 pointer-events-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentAlert.id}
            initial={{ y: -50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            className="flex items-center gap-3 px-6 py-3 rounded-[24px] glass-dark border border-white/10 shadow-2xl backdrop-blur-2xl"
          >
            <div className="shrink-0 w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shadow-inner">
              {getIcon(currentAlert.type)}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-1">Sanctuary Alert</p>
               <p className="text-xs font-bold text-white truncate">{currentAlert.text}</p>
            </div>
            <div className="shrink-0 flex gap-1">
              {alerts.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-brand-500 w-3' : 'bg-white/20'}`} 
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
