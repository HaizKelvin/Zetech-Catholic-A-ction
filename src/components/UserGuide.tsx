import React from 'react';
import { 
  BookOpen, 
  Download, 
  Users, 
  MessageCircle, 
  Heart, 
  Settings, 
  Shield, 
  Star,
  ChevronRight,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';

const UserGuide: React.FC = () => {
  const downloadGuide = () => {
    const guideContent = `
SANCTUARY FELLOWSHIP - USER GUIDE
==================================

Welcome to Sanctuary Fellowship, your digital companion for spiritual growth and community connection.

1. GETTING STARTED
------------------
- Sign Up/Login: Securely access your account using Google Authentication.
- Profile Setup: Customize your profile with a name and spiritual avatar to be recognized in the fellowship.

2. DAILY DEVOTIONALS (DASHBOARD)
--------------------------------
- Daily Word: Every day, a new biblically-inspired verse is presented at the center of your dashboard.
- Meditation: Spend time reflecting on the daily scripture to start your day with grace.

3. PETITIONS & PRAYERS
----------------------
- Submit Petitions: Share your heart with the community. You can choose to post "Publicly" for the Sanctuary or keep it as a "Private Communion".
- Fellowship of Hearts: View and reflect on petitions shared by other members (if public).

4. COMMUNITY CHAT HUB
---------------------
- Real-time Fellowship: Connect with other members in our secure, real-time sanctuary chat.
- Shared Grace: Share images, thoughts, and spiritual encouragement.
- Stickers: Use our expressive hand-drawn stickers to convey emotions without words.

5. SPIRITUAL RESOURCES
----------------------
- Faith Snapshots: Explore curated snippets of wisdom, hymns, and spiritual readings.
- Study Assistant: Use the integrated search and study tool to find specific references or interpretations.

6. PERSONAL SANCTUARY (SETTINGS)
--------------------------------
- Dark Mode: Toggle between Light and Dark modes to suit your environment (found at the top right).
- Privacy: Your data is protected. All private petitions are encrypted and only visible to you.

7. COMMUNITY GUIDELINES
-----------------------
- Be respectful and kind.
- Use the sanctuary for spiritual growth and upliftment.
- Moderators (Admins) help maintain the sanctity of the fellowship.

Need Help?
Contact: support@sanctuaryfellowship.org
Version: 1.0.0
    `;
    
    const blob = new Blob([guideContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Sanctuary_Fellowship_User_Guide.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sections = [
    {
      title: "Navigation & Basics",
      icon: <ChevronRight className="w-5 h-5 text-brand-600" />,
      content: "Access all features through the sidebar. Your profile and theme preferences are located at the top right of every page."
    },
    {
      title: "Daily Word",
      icon: <Star className="w-5 h-5 text-amber-500" />,
      content: "Your main dashboard displays a daily verse. Tap the reference to meditate on its deeper meaning."
    },
    {
      title: "Prayer Petitions",
      icon: <Heart className="w-5 h-5 text-red-500" />,
      content: "Submit your prayers. 'Public' prayers are seen by all, while 'Private' ones are your personal dialogue with the Divine."
    },
    {
      title: "Fellowship Hub",
      icon: <Users className="w-5 h-5 text-blue-500" />,
      content: "Join the community chat to share encouragement. Use stickers and media to express your spiritual journey."
    },
    {
      title: "Resources & Study",
      icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
      content: "Browse our collection of faith snapshots and use the study tool for deeper scriptural exploration."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 md:px-6">
      <div className="text-center mb-10 md:mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 md:gap-3 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-500/20 mb-4 md:mb-6"
        >
          <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-brand-600" />
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-brand-700 dark:text-brand-300">Sanctuary Manual</span>
        </motion.div>
        <h1 className="text-3xl md:text-6xl font-serif italic text-stone-900 dark:text-white mb-4 md:mb-6">Fellowship User Guide</h1>
        <p className="text-stone-700 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed text-sm md:text-base px-2">
          Explore everything you need to know about the Sanctuary Fellowship application. Learn how to connect, pray, and grow in your daily faith journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
        {sections.map((section, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-6 md:p-8 group hover:border-brand-500/30 transition-all rounded-[24px] md:rounded-[32px]"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-stone-200/50 dark:bg-white/5 border border-stone-300/30 dark:border-transparent flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                {section.icon}
              </div>
              <h3 className="font-bold text-base md:text-lg text-stone-900 dark:text-stone-100">{section.title}</h3>
            </div>
            <p className="text-stone-600 dark:text-stone-400 text-xs md:text-sm leading-relaxed">
              {section.content}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="glass-card p-8 md:p-10 bg-brand-900 text-white relative overflow-hidden rounded-[24px] md:rounded-[32px]">
        <div className="absolute inset-0 faith-bg opacity-[0.05] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-serif italic mb-1 md:mb-2">Ready to share the guide?</h2>
            <p className="text-brand-200 text-xs md:text-sm">Download a text version you can send via email or message.</p>
          </div>
          <button 
            onClick={downloadGuide}
            className="flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white text-brand-900 rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl w-full md:w-auto justify-center"
          >
            <Download className="w-4 h-4" />
            Download Guide (.txt)
          </button>
        </div>
      </div>

      <div className="mt-12 md:mt-16 pt-12 md:pt-16 border-t border-stone-200 dark:border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center md:text-left">
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-brand-600" />
            <h4 className="font-bold text-stone-900 dark:text-stone-100 uppercase text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em]">Safe Sanctuary</h4>
          </div>
          <p className="text-[10px] md:text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic">
            "Your data and spiritual reflections are treated with the utmost respect and privacy."
          </p>
        </div>
        <div className="space-y-3 md:space-y-4">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <Settings className="w-4 h-4 md:w-5 md:h-5 text-brand-600" />
            <h4 className="font-bold text-stone-900 dark:text-stone-100 uppercase text-[9px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em]">Custom Experience</h4>
          </div>
          <p className="text-[10px] md:text-xs text-stone-600 dark:text-stone-400 leading-relaxed italic">
            "Adjust your sanctuary with theme toggles and personalized notification settings."
          </p>
        </div>
        <div className="space-y-4 flex flex-col items-center md:items-start">
           <button onClick={() => window.print()} className="flex items-center gap-2 text-stone-600 hover:text-brand-600 transition-colors text-[10px] md:text-xs font-bold">
              <Printer className="w-3 h-3 md:w-4 md:h-4" />
              Print this page
           </button>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
