import React from 'react';
import { motion } from 'motion/react';
import { Shield, Book, Heart, Users, CheckCircle2, Church, Music, Flame, Sparkles } from 'lucide-react';

export default function AboutPage() {
  const pillars = [
    {
      title: "Faith & Sacraments",
      description: "We celebrate Holy Mass every Sunday at 9:00 AM, participate in Holy Rosary devotions, and grow together in Catholic truth and prayer.",
      icon: <Church className="w-6 h-6 text-blue-600 dark:text-sky-400" />,
      image: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Active Student Fellowship",
      description: "Our Small Christian Communities (Jumuiyas) meet every Wednesday at 4:20 PM in PG 6 Room for Bible sharing, encouragement, and friendship.",
      icon: <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Choir & Music Ministry",
      description: "St. Jude Choir leads liturgical praise and hymns during campus Masses, diocesan youth festivals, and Sunday services.",
      icon: <Music className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Charity & Community Service",
      description: "Putting faith into action through visits to children's homes, campus cleanliness drives, and supporting fellow students in need.",
      icon: <Heart className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      image: "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const standards = [
    "Treat every student with Christian love and respect.",
    "Active participation in weekly Jumuiya and Sunday Holy Mass.",
    "Open arms and warm welcome to all first years and new students.",
    "Strict privacy and prayerful care for all shared petitions.",
    "Honesty, academic integrity, and positive campus leadership."
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10 md:space-y-16 pb-24 px-3 sm:px-6">
      {/* Hero Section */}
      <motion.header 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-12 md:py-24 px-6 md:px-16 rounded-[32px] md:rounded-[48px] overflow-hidden bg-stone-950 text-white shadow-2xl border border-white/10 group mb-6"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1600&q=80" 
            className="w-full h-full object-cover mix-blend-overlay scale-105 opacity-40 transition-transform duration-[15s] group-hover:scale-100"
            alt="Cathedral stained glass and Holy Cross"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-stone-950 via-stone-950/80 to-transparent" />
        </div>
        
        <div className="relative z-10 space-y-4 md:space-y-6 max-w-3xl text-left">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-950/80 border border-blue-400/30 text-[10px] md:text-xs font-bold uppercase tracking-wider text-sky-300 shadow-lg backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            About Our Community
          </motion.div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white font-sans leading-tight">
            Zetech Catholic Action <br />
            <span className="text-sky-400 font-serif italic text-2xl sm:text-4xl md:text-5xl font-normal">Faith, Unity & Action</span>
          </h1>
          
          <p className="text-stone-300 text-sm md:text-lg font-normal leading-relaxed">
            ZUCA brings together Catholic students, lecturers, and staff across all Zetech University campuses (Mang'u Technology Park, Ruiru, and Town campuses) to worship, serve, and support one another throughout university life.
          </p>
        </div>
      </motion.header>

      {/* 4 Pillars Grid */}
      <section className="space-y-6 text-left">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">Our Pillars</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-white">How We Live Our Faith</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-stone-900/60 rounded-[28px] border border-stone-200/80 dark:border-white/5 overflow-hidden shadow-lg hover:shadow-xl transition-all group flex flex-col justify-between"
            >
              <div className="h-44 w-full overflow-hidden relative">
                <img 
                  src={pillar.image} 
                  alt={pillar.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/90 dark:bg-stone-900/90 shadow-md backdrop-blur-sm">
                    {pillar.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{pillar.title}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Code of Conduct & Standards */}
      <section className="bg-white dark:bg-stone-900/60 p-6 md:p-10 rounded-[32px] border border-stone-200/80 dark:border-white/5 shadow-xl text-left">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          <div className="space-y-3 max-w-md">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">Community Values</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-white">Our Member Promise</h2>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Every student in ZUCA commits to building a welcoming, Christ-centered campus environment where everyone can grow in faith and excel in academics.
            </p>
          </div>
          
          <div className="flex-1 grid grid-cols-1 gap-3 w-full">
            {standards.map((std, i) => (
              <motion.div 
                key={i} 
                whileHover={{ x: 4 }}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-100 dark:border-white/5"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs md:text-sm font-semibold text-stone-800 dark:text-stone-200">{std}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Motto Quote */}
      <section className="text-center py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="h-1 w-12 bg-blue-600 mx-auto rounded-full" />
          <p className="text-xl md:text-3xl font-serif italic text-stone-900 dark:text-white">
            "To restore all things in Christ."
          </p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-400">
            Instaurare Omnia in Christo — Motto of Catholic Action
          </p>
        </div>
      </section>
    </div>
  );
}
