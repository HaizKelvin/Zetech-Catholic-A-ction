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
    <div className="space-y-20 pb-24 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="relative py-20 px-8 md:px-16 rounded-[48px] overflow-hidden bg-stone-950 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-stone-950 to-stone-950 pointer-events-none" />
        <div className="relative z-10 space-y-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.4em] text-brand-400"
          >
            <Shield className="w-4 h-4" />
            Our Sacred Mission
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight"
          >
            Catholic Action <br />
            <span className="serif-display italic font-light text-brand-400">Policies & Values</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-stone-400 text-lg md:text-xl font-serif italic max-w-2xl leading-relaxed"
          >
            "Catholic Action consists in the participation of the laity in the apostolate of the hierarchy." — Pope Pius XI.
          </motion.p>
        </div>
      </section>

      {/* Policies Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {policies.map((policy, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-10 md:p-14 group border-white/5"
          >
            <div className="w-16 h-16 rounded-3xl bg-stone-100 dark:bg-white/5 text-brand-900 dark:text-brand-400 flex items-center justify-center shadow-inner group-hover:bg-brand-900 group-hover:text-white transition-all duration-500 mb-8">
              {policy.icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 tracking-tight serif-display">{policy.title}</h3>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed italic">
              {policy.description}
            </p>
          </motion.div>
        ))}
      </section>

      {/* Code of Conduct */}
      <section className="glass-card p-12 md:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Scale className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-12">
            <div className="space-y-6 max-w-xl">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-500">Legal & Conduct</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter serif-display">Standards of the <br /> <span className="not-italic text-stone-900 dark:text-white">Sanctuary</span></h2>
              <p className="text-stone-500 dark:text-stone-400 leading-relaxed italic">
                By joining our community, members commit to a standard of behavior that honors God and respects our neighbors. These policies ensure a safe, contemplative, and productive space for all.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 gap-4">
              {standards.map((std, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-stone-50/50 dark:bg-white/5 border border-stone-100 dark:border-white/5 group hover:border-brand-500/20 transition-all">
                  <div className="w-8 h-8 rounded-full bg-brand-900/10 text-brand-900 flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-all">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{std}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Quote */}
      <section className="text-center py-20 px-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="h-px w-20 bg-brand-500 mx-auto" />
          <p className="text-3xl md:text-5xl font-serif italic text-stone-900 dark:text-white leading-[1.2]">
            "To restore all things in Christ."
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-stone-400">Instaurare Omnia in Christo — Moto of St. Pius X</p>
        </div>
      </section>
    </div>
  );
}
