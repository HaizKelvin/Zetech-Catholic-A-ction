import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp, doc } from 'firebase/firestore';
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

    // Listen for Dashboard updates
    unsubscribers.push(onSnapshot(doc(db, 'control', 'daily_bread'), (d) => {
      if (d.exists()) {
        const data = d.data();
        if (data.updatedAt) {
          const newAlert: AlertItem = {
            id: 'dashboard-update-' + (data.updatedAt.toMillis?.() || Date.now()),
            type: 'activity',
            text: `Daily Inspiration has been updated!`,
            timestamp: data.updatedAt
          };
          addAlertIfNotExpired(newAlert);
        }
      }
    }));

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'member': return <User className="w-3 h-3 text-emerald-500" />;
      case 'activity': return <Zap className="w-3 h-3 text-amber-500" />;
      case 'event': return <Star className="w-3 h-3 text-indigo-500" />;
      case 'resource': return <Bell className="w-3 h-3 text-brand-500" />;
      default: return <Info className="w-3 h-3 text-stone-400" />;
    }
  };

  if (alerts.length === 0) return null;

  const currentAlert = alerts[0];

  return (
    <div className="fixed top-16 left-0 right-0 z-[60] flex justify-center pointer-events-none px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAlert.id}
          initial={{ scale: 0.5, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-full glass-dark border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur-3xl w-fit max-w-[280px] ring-1 ring-white/10"
        >
          <div className="shrink-0 w-6 h-6 rounded-full bg-brand-900/20 flex items-center justify-center shadow-inner">
            {getIcon(currentAlert.type)}
          </div>
          <div className="min-w-0">
             <p className="text-[10px] leading-tight font-black text-white truncate">{currentAlert.text}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
