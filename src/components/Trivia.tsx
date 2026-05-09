import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Trivia, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { Trophy, CheckCircle, XCircle, Plus, Trash2, HelpCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TriviaComponent({ isAdmin }: { isAdmin: boolean }) {
  const [questions, setQuestions] = useState<Trivia[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  
  const [showAdd, setShowAdd] = useState(false);
  const [newQ, setNewQ] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0 });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'trivia'), (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trivia[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trivia');
    });
    return () => unsubscribe();
  }, []);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (index === questions[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      await addDoc(collection(db, 'trivia'), {
        ...newQ,
        options: newQ.options.filter(o => o.trim() !== '')
      });
      setShowAdd(false);
      setNewQ({ question: '', options: ['', '', '', ''], correctAnswer: 0 });
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'trivia');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete trivia question?')) return;
    try {
      await deleteDoc(doc(db, 'trivia', id));
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `trivia/${id}`);
    }
  };

  if (questions.length === 0 && !isAdmin) {
    return (
      <div className="text-center py-24 glass rounded-[40px] italic">
        <HelpCircle className="w-16 h-16 text-stone-100 dark:text-stone-800 mx-auto mb-4" />
        <p className="text-stone-400 font-medium tracking-wide">Daily trivia is coming soon!</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 pb-24">
      {/* Immersive Header - Matching Dashboard, Gallery & Sacred Materials */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-8 md:py-24 px-6 md:px-12 rounded-[24px] md:rounded-[48px] overflow-hidden bg-brand-950 text-white shadow-3xl shadow-brand-900/10 group mb-6 md:mb-12 mx-2 md:mx-0"
      >
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1463171359979-3284627d3531?q=80&w=2670&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-20 transform group-hover:scale-110 transition-transform duration-[3s]" 
            alt="Sacred Trivia"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-950 via-brand-950/40 to-transparent" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-500/10 blur-[120px] rounded-full -mr-48 -mt-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12 max-w-full">
          <div className="space-y-4 md:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark border border-white/10 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-brand-300 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,1)]" />
              Wisdom Trial
            </motion.div>
            
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-tight text-white serif-display">
              Sacred <br />
              <span className="serif-display italic font-light text-brand-400 lowercase">Trivia</span>
            </h1>
            
            <p className="text-stone-400 text-sm md:text-xl font-light max-w-xl leading-relaxed italic serif-display opacity-80">
              Test your spirit and knowledge through the liturgy of sacred questions.
            </p>
          </div>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdd(true)}
              className="w-full md:w-auto flex items-center justify-center gap-3 bg-brand-600 text-white px-6 py-4 md:px-8 md:py-5 rounded-2xl md:rounded-3xl hover:bg-brand-500 transition-all font-black uppercase tracking-[0.2em] shadow-xl shadow-brand-600/30 text-[9px] md:text-[10px]"
            >
              <Plus className="w-4 h-4" />
              Add Revelation
            </motion.button>
          )}
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto space-y-12 lg:space-y-20 px-4 md:px-0">


      {!showResult && currentIndex < questions.length ? (
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card p-6 md:p-24 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] md:shadow-[0_60px_120px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_80px_160px_-20px_rgba(0,0,0,0.6)] border-white/10 group bg-white/40 dark:bg-black/20 mx-4 md:mx-0 rounded-[32px] md:rounded-[64px]"
        >
          <div className="absolute inset-0 sacred-grid opacity-[0.03] pointer-events-none" />
          
          <div className="flex justify-between items-center mb-10 md:mb-24">
            <div className="px-5 py-1.5 md:px-8 md:py-3 rounded-full bg-brand-900/5 dark:bg-white/5 border border-brand-500/20 flex items-center gap-3 backdrop-blur-3xl shrink-0">
              <div className="relative">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-brand-500 animate-ping opacity-40 absolute" />
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-brand-500 animate-pulse relative" />
              </div>
              <span className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-brand-600 dark:text-brand-400">
                Faith Journey: {currentIndex + 1} / {questions.length}
              </span>
            </div>
             {isAdmin && (
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 12 }}
                onClick={() => handleDelete(questions[currentIndex].id)} 
                className="p-2.5 md:p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-[14px] md:rounded-[20px] backdrop-blur-xl border border-red-500/20"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            )}
          </div>
          
          <div className="space-y-4 md:space-y-8 mb-10 md:mb-32">
            <div className="h-[2px] w-12 md:w-32 bg-gradient-to-r from-brand-600 to-transparent" />
            <h2 className="text-2xl md:text-8xl font-bold text-stone-900 dark:text-white leading-tight tracking-tighter serif-display">
              {questions[currentIndex].question}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:gap-8">
            {questions[currentIndex].options.map((opt, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                whileHover={!isAnswered ? { x: 5, scale: 1.01 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                onClick={() => handleAnswer(i)}
                className={`p-5 md:p-12 rounded-[22px] md:rounded-[56px] text-left font-black transition-all duration-500 flex items-center justify-between group overflow-hidden relative border-2 ${
                  isAnswered 
                    ? (i === questions[currentIndex].correctAnswer 
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_20px_40px_-5px_rgba(16,185,129,0.3)] ring-4 md:ring-8 ring-emerald-500/10' 
                        : (selectedOption === i 
                            ? 'bg-red-500 border-red-400 text-white shadow-xl translate-x-1 md:translate-x-2' 
                            : 'bg-stone-50/50 dark:bg-stone-900/30 border-transparent text-stone-300 dark:text-stone-700 opacity-40 filter blur-[1px] invisible md:visible'))
                    : 'bg-white/60 dark:bg-white/5 border-stone-200/50 dark:border-white/5 hover:border-brand-500/40 hover:bg-white dark:hover:bg-white/10 shadow-sm'
                }`}
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-500/0 group-hover:bg-brand-500/40 transition-all duration-700" />
                <span className="text-sm md:text-2xl tracking-tighter relative z-10 leading-snug max-w-[85%]">{opt}</span>
                <div className="relative z-10 shrink-0">
                  {isAnswered && i === questions[currentIndex].correctAnswer && <CheckCircle className="w-5 h-5 md:w-8 md:h-8 animate-float text-white" />}
                  {isAnswered && selectedOption === i && i !== questions[currentIndex].correctAnswer && <XCircle className="w-5 h-5 md:w-8 md:h-8 text-white" />}
                  {!isAnswered && <div className="w-7 h-7 md:w-12 md:h-12 rounded-full border border-stone-200 dark:border-white/10 flex items-center justify-center text-[9px] md:text-[11px] font-black opacity-20 group-hover:opacity-100 group-hover:border-brand-500 group-hover:text-brand-500 transition-all duration-500 uppercase tracking-widest">{String.fromCharCode(65 + i)}</div>}
                </div>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {isAnswered && (
              <motion.button 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={nextQuestion}
                className="mt-6 md:mt-12 w-full py-4 md:py-6 bg-stone-950 text-white dark:bg-white dark:text-stone-950 rounded-[18px] md:rounded-[28px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-3xl text-[9px] md:text-xs flex items-center justify-center gap-3"
              >
                {currentIndex === questions.length - 1 ? 'Ascend to Results' : 'Next Meditation'}
                <div className="w-3.5 h-3.5 md:w-5 md:h-5 bg-white/10 dark:bg-black/10 rounded-full flex items-center justify-center">→</div>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      ) : showResult ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          className="glass-card p-10 md:p-40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] md:shadow-[0_80px_160px_-40px_rgba(0,0,0,0.5)] text-center relative overflow-hidden bg-white/40 dark:bg-black/40 backdrop-blur-3xl rounded-[40px] md:rounded-[64px] border border-white/20 mx-4 md:mx-0"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/10 via-transparent to-transparent opacity-50" />
          <div className="absolute inset-0 sacred-grid opacity-[0.03] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="mb-10 md:mb-16 relative inline-block">
              <div className="absolute inset-0 bg-brand-500/20 blur-[40px] md:blur-[100px] rounded-full animate-pulse" />
              <div className="relative">
                <Trophy className="w-20 h-20 md:w-56 md:h-56 text-brand-500 mx-auto animate-float drop-shadow-[0_0_20px_rgba(59,130,246,0.6)]" />
              </div>
            </div>
            
            <div className="space-y-3 md:space-y-6 mb-10 md:mb-16">
              <h2 className="text-3xl md:text-9xl font-bold text-stone-950 dark:text-white tracking-tighter serif-display italic">
                Sacred <span className="text-brand-500 not-italic uppercase font-black text-lg md:text-5xl tracking-[0.2em] md:tracking-[0.4em] block mt-2 md:mt-4">Wisdom</span>
              </h2>
              <div className="h-0.5 w-12 md:w-24 bg-brand-500/20 mx-auto rounded-full" />
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-6 mb-12 md:mb-24">
               <div>
                  <p className="text-stone-400 font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[7px] md:text-[10px] mb-2">Divine Score</p>
                  <div className="flex items-baseline justify-center gap-1 md:gap-2">
                    <span className="text-5xl md:text-[12rem] font-black tracking-tighter text-stone-900 dark:text-white leading-none">{score}</span>
                    <span className="text-lg md:text-6xl font-serif italic text-stone-300 dark:text-stone-700">/ {questions.length}</span>
                  </div>
               </div>
            </div>
            
            <button 
              onClick={() => { setCurrentIndex(0); setScore(0); setShowResult(false); setIsAnswered(false); setSelectedOption(null); }}
              className="w-full md:w-auto bg-brand-900 text-white px-8 py-4 md:px-20 md:py-7 rounded-full font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-[9px] md:text-xs shadow-3xl shadow-brand-900/40 hover:bg-brand-800 transition-all hover:-translate-y-2 active:translate-y-0 group"
            >
              Begin New Pilgrimage <span className="inline-block transition-transform group-hover:translate-x-2 ml-2">→</span>
            </button>
          </div>
        </motion.div>
      ) : questions.length === 0 ? (
          <div className="text-center py-24 glass rounded-[40px] italic mx-4 md:mx-0">
            <HelpCircle className="w-16 h-16 text-stone-100 dark:text-stone-800 mx-auto mb-4" />
            <p className="text-stone-400 font-medium tracking-wide">Daily trivia is coming soon!</p>
          </div>
      ) : null}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="glass rounded-[32px] md:rounded-[40px] p-6 md:p-10 w-full max-w-xl shadow-2xl my-8"
            >
               <h3 className="text-xl md:text-2xl font-bold mb-6 text-stone-900 dark:text-stone-100 leading-none">Add Trivia Question</h3>
               <form onSubmit={handleAdd} className="space-y-4">
                  <textarea required placeholder="Question" value={newQ.question} onChange={e => setNewQ({...newQ, question: e.target.value})} className="w-full p-4 rounded-xl md:rounded-2xl outline-none min-h-[100px] font-medium text-sm md:text-base border border-stone-100 dark:border-stone-800 bg-white/50 dark:bg-black/20" />
                  {newQ.options.map((o, idx) => (
                    <div key={idx} className="flex gap-3 md:gap-4 items-center">
                       <input required placeholder={`Option ${idx + 1}`} value={o} onChange={e => {
                         const opts = [...newQ.options];
                         opts[idx] = e.target.value;
                         setNewQ({...newQ, options: opts});
                       }} className="flex-1 p-3 rounded-lg md:rounded-xl outline-none text-sm md:text-base border border-stone-100 dark:border-stone-800 bg-white/50 dark:bg-black/20" />
                       <input type="radio" checked={newQ.correctAnswer === idx} onChange={() => setNewQ({...newQ, correctAnswer: idx})} className="w-4 h-4 accent-brand-600" />
                    </div>
                  ))}
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 border border-stone-100 dark:border-stone-800 rounded-xl md:rounded-2xl font-bold text-xs md:text-base">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-brand-900 text-white rounded-xl md:rounded-2xl font-bold shadow-xl shadow-brand-900/20 text-xs md:text-base">Save Question</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
