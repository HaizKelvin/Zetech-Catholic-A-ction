import React from 'react';
import { motion } from 'motion/react';
import { Shield, Book, Heart, Users, CheckCircle2, ChevronRight, Scale } from 'lucide-react';

export default function AboutPage() {
  const policies = [
    {
      title: "Spiritual Integrity",
      description: "We uphold the teachings of the Catholic Church, ensuring all content and discussions align with the Magisterium and Sacred Tradition.",
      icon: <Shield className="w-6 h-6" />
    },
    {
      title: "Active Participation",
      description: "Members are encouraged to be protagonists in the Church's mission, bringing the light of the Gospel to all spheres of human activity.",
      icon: <Users className="w-6 h-6" />
    },
    {
      title: "Charity & Service",
      description: "Our community prioritize the concrete practice of love for neighbor through organized acts of service and regular prayer petitions.",
      icon: <Heart className="w-6 h-6" />
    },
    {
      title: "Scriptural Foundation",
      description: "We ground our actions in the Word of God, fostering a culture of meditation, study, and liturgical living.",
      icon: <Book className="w-6 h-6" />
    }
  ];

  const standards = [
    "Respect for all members as children of God.",
    "Prohibition of hate speech, discrimination, or profane language.",
    "Data privacy and confidentiality in prayer requests.",
    "Commitment to non-partisan, faith-based advocacy.",
    "Adherence to Liturgical norms in resource sharing.",
    "Promotion of vocations and lay leadership."
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 lg:space-y-32 pb-32">
      {/* Hero Section - Upgraded to Cinematic Style */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-12 md:py-48 px-6 md:px-32 rounded-[32px] md:rounded-[120px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-6 md:mb-20 mx-2 md:mx-0"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1548625361-9878235272a0?auto=format&fit=crop&q=80" 
            className="w-full h-full object-cover mix-blend-overlay scale-110 opacity-30 transition-transform duration-[15s] group-hover:scale-100"
            alt="Sanctuary Pillars"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
        </div>
        
        <div className="relative z-10 space-y-6 md:space-y-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 md:px-8 md:py-3 rounded-full glass-dark border border-white/10 text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-brand-300 shadow-2xl backdrop-blur-xl"
          >
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand-400 animate-pulse shadow-[0_0_12px_rgba(92,133,255,1)]" />
            Our Foundation
          </motion.div>
          
          <h1 className="text-4xl md:text-[9rem] font-black tracking-[-0.05em] leading-tight md:leading-[0.8] text-white serif-display italic">
            Principles & <br className="hidden md:block" />
            <span className="text-brand-400 not-italic uppercase font-black text-2xl md:text-5xl tracking-[0.4em] block mt-2 md:mt-4">Values</span>
          </h1>
          
          <p className="text-stone-400 text-sm md:text-3xl font-light max-w-2xl leading-relaxed italic serif-display opacity-80">
            "Catholic Action consists in the participation of the laity in the apostolate of the hierarchy." — Pope Pius XI.
          </p>
        </div>
      </motion.header>

      {/* Policies Grid - Upgraded Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-16 px-4">
        {policies.map((policy, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="glass p-8 md:p-16 group relative flex flex-col h-full bg-white dark:bg-stone-900/10 border border-stone-100 dark:border-white/5 hover:border-brand-500/30 shadow-2xl rounded-[32px] md:rounded-[70px] transition-all duration-700"
          >
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-[22px] md:rounded-[32px] bg-stone-50 dark:bg-white/5 text-brand-900 dark:text-white flex items-center justify-center shadow-inner group-hover:bg-brand-900 group-hover:text-white transition-all duration-700 group-hover:rotate-6 border border-stone-100 dark:border-white/10 mb-6 md:mb-10">
              {policy.icon}
            </div>
            <h3 className="text-2xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tighter serif-display mb-4 md:mb-6 group-hover:translate-x-2 transition-transform duration-700">{policy.title}</h3>
            <p className="text-sm md:text-lg text-stone-500 dark:text-stone-400 leading-relaxed font-light serif-display italic opacity-80">
              {policy.description}
            </p>
          </motion.div>
        ))}
      </section>

      {/* Code of Conduct - Refined Spacing */}
      <section className="px-4">
        <div className="glass p-8 md:p-24 relative overflow-hidden rounded-[40px] md:rounded-[80px] border border-stone-100 dark:border-white/5 shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
            <Scale className="w-64 h-64 md:w-96 md:h-96 text-brand-500" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-32">
              <div className="space-y-6 md:space-y-8 max-w-xl">
                <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.6em] text-brand-500">Legal & Conduct</span>
                <h2 className="text-3xl md:text-7xl font-bold tracking-tighter serif-display">Standards of the <br className="hidden md:block" /> <span className="not-italic text-stone-900 dark:text-white">Sanctuary</span></h2>
                <p className="text-sm md:text-xl text-stone-500 dark:text-stone-400 leading-relaxed italic serif-display opacity-80">
                  By joining our community, members commit to a standard of behavior that honors God and respects our neighbors. These policies ensure a safe, contemplative, and productive space for all.
                </p>
              </div>
              <div className="flex-1 grid grid-cols-1 gap-4 md:gap-6">
                {standards.map((std, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ x: 10 }}
                    className="flex items-center gap-4 md:gap-6 p-4 md:p-8 rounded-[20px] md:rounded-[32px] bg-stone-50/50 dark:bg-white/5 border border-stone-100 dark:border-white/5 group hover:border-brand-500/20 transition-all shadow-sm"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-brand-900/10 text-brand-900 dark:text-brand-400 flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-all shadow-inner shrink-0">
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <span className="text-xs md:text-lg font-bold text-stone-700 dark:text-stone-200 tracking-tight leading-tight">{std}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Quote */}
      <section className="text-center py-16 md:py-20 px-6 md:px-8">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <div className="h-px w-16 md:w-20 bg-brand-500 mx-auto" />
          <p className="text-2xl md:text-5xl font-serif italic text-stone-900 dark:text-white leading-snug md:leading-[1.2]">
            "To restore all things in Christ."
          </p>
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-stone-600 dark:text-stone-400">Instaurare Omnia in Christo — Moto of St. Pius X</p>
        </div>
      </section>
    </div>
  );
}
