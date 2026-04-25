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
    <div className="max-w-4xl mx-auto space-y-20">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10"
      >
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-stone-900 dark:text-stone-100 italic serif-display">Sacred <span className="text-brand-600 dark:text-brand-500 not-italic">Trivia</span>.</h1>
          <p className="text-[10px] md:text-sm font-bold text-stone-400 uppercase tracking-[0.5em]">Liturgy of Knowledge</p>
        </div>
        {isAdmin && (
           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setShowAdd(true)} 
             className="w-full sm:w-auto bg-brand-900 text-white px-10 py-5 rounded-[28px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-800 transition-all shadow-3xl shadow-brand-900/40 text-[10px]"
           >
             <Plus className="w-4 h-4" /> Add Revelation
           </motion.button>
        )}
      </motion.div>

      {!showResult && currentIndex < questions.length ? (
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="glass-card p-12 md:p-24 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.3)] dark:shadow-[0_80px_160px_-20px_rgba(0,0,0,0.6)] border-white/10 group bg-white/40 dark:bg-black/20"
        >
          <div className="absolute inset-0 sacred-grid opacity-[0.03] pointer-events-none" />
          
          <div className="flex justify-between items-center mb-16 md:mb-24">
            <div className="px-8 py-3 rounded-full bg-brand-900/5 dark:bg-white/5 border border-brand-500/20 flex items-center gap-4 backdrop-blur-3xl">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-brand-500 animate-ping opacity-40 absolute" />
                <div className="w-3 h-3 rounded-full bg-brand-500 animate-pulse relative" />
              </div>
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-brand-600 dark:text-brand-400">
                Faith Journey: {currentIndex + 1} of {questions.length}
              </span>
            </div>
             {isAdmin && (
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 12 }}
                onClick={() => handleDelete(questions[currentIndex].id)} 
                className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-[20px] backdrop-blur-xl border border-red-500/20"
              >
                <Trash2 className="w-5 h-5" />
              </motion.button>
            )}
          </div>
          
          <div className="space-y-8 mb-20 md:mb-32">
            <div className="h-[2px] w-32 bg-gradient-to-r from-brand-600 to-transparent" />
            <h2 className="text-4xl md:text-8xl font-bold text-stone-900 dark:text-white leading-[0.95] tracking-tighter serif-display">
              {questions[currentIndex].question}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {questions[currentIndex].options.map((opt, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.5 }}
                whileHover={!isAnswered ? { x: 16, scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                onClick={() => handleAnswer(i)}
                className={`p-8 md:p-12 rounded-[40px] md:rounded-[56px] text-left font-black transition-all duration-700 flex items-center justify-between group overflow-hidden relative border-2 ${
                  isAnswered 
                    ? (i === questions[currentIndex].correctAnswer 
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_30px_60px_-10px_rgba(16,185,129,0.4)] ring-8 ring-emerald-500/10' 
                        : (selectedOption === i 
                            ? 'bg-red-500 border-red-400 text-white shadow-xl translate-x-2' 
                            : 'bg-stone-50/50 dark:bg-stone-900/30 border-transparent text-stone-300 dark:text-stone-700 opacity-40 filter blur-[1px]'))
                    : 'bg-white/60 dark:bg-white/5 border-stone-200/50 dark:border-white/5 hover:border-brand-500/40 hover:bg-white dark:hover:bg-white/10 shadow-sm'
                }`}
              >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-brand-500/0 group-hover:bg-brand-500/40 transition-all duration-700" />
                <span className="text-sm md:text-2xl tracking-tighter relative z-10 leading-snug max-w-[85%]">{opt}</span>
                <div className="relative z-10">
                  {isAnswered && i === questions[currentIndex].correctAnswer && <CheckCircle className="w-8 h-8 animate-float text-white" />}
                  {isAnswered && selectedOption === i && i !== questions[currentIndex].correctAnswer && <XCircle className="w-8 h-8 text-white" />}
                  {!isAnswered && <div className="w-12 h-12 rounded-full border border-stone-200 dark:border-white/10 flex items-center justify-center text-[11px] font-black opacity-20 group-hover:opacity-100 group-hover:border-brand-500 group-hover:text-brand-500 transition-all duration-500 uppercase tracking-widest">{String.fromCharCode(65 + i)}</div>}
                </div>
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {isAnswered && (
              <motion.button 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={nextQuestion}
                className="mt-12 w-full py-6 bg-stone-950 text-white dark:bg-white dark:text-stone-950 rounded-[28px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-3xl text-xs flex items-center justify-center gap-3"
              >
                {currentIndex === questions.length - 1 ? 'Ascend to Results' : 'Next Meditation'}
                <div className="w-5 h-5 bg-white/10 dark:bg-black/10 rounded-full flex items-center justify-center">→</div>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      ) : showResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          className="glass-card p-16 md:p-32 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.4)] text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-brand-900/10 via-transparent to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="mb-12 relative inline-block">
              <div className="absolute inset-0 bg-brand-500/20 blur-[60px] rounded-full animate-pulse" />
              <Trophy className="w-24 h-24 md:w-40 md:h-40 text-brand-500 mx-auto animate-float drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
            </div>
            <h2 className="text-5xl md:text-8xl font-bold text-stone-950 dark:text-white mb-6 tracking-tighter serif-display italic">Sacred <span className="text-brand-500 not-italic uppercase font-black text-2xl md:text-4xl tracking-[0.2em] block mt-2">Commendation</span></h2>
            <div className="flex items-end justify-center gap-4 mb-16">
               <p className="text-stone-400 font-black uppercase tracking-widest text-xs">Divine Score</p>
               <span className="text-7xl md:text-9xl font-black tracking-tighter text-stone-900 dark:text-white leading-none">{score}</span>
               <span className="text-3xl md:text-5xl font-serif italic text-stone-300">/ {questions.length}</span>
            </div>
            
            <button 
              onClick={() => { setCurrentIndex(0); setScore(0); setShowResult(false); setIsAnswered(false); setSelectedOption(null); }}
              className="bg-brand-900 text-white px-16 py-6 rounded-full font-black uppercase tracking-[0.4em] text-[10px] md:text-xs shadow-2xl hover:bg-brand-800 transition-all hover:-translate-y-2 active:translate-y-0"
            >
              Begin New Cycle
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="glass rounded-[40px] p-10 w-full max-w-xl shadow-2xl"
            >
               <h3 className="text-2xl font-bold mb-6 text-stone-900 dark:text-stone-100">Add Trivia Question</h3>
               <form onSubmit={handleAdd} className="space-y-4">
                  <textarea required placeholder="Question" value={newQ.question} onChange={e => setNewQ({...newQ, question: e.target.value})} className="w-full p-4 rounded-2xl outline-none min-h-[100px] font-medium" />
                  {newQ.options.map((o, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                       <input required placeholder={`Option ${idx + 1}`} value={o} onChange={e => {
                         const opts = [...newQ.options];
                         opts[idx] = e.target.value;
                         setNewQ({...newQ, options: opts});
                       }} className="flex-1 p-3 rounded-xl outline-none" />
                       <input type="radio" checked={newQ.correctAnswer === idx} onChange={() => setNewQ({...newQ, correctAnswer: idx})} />
                    </div>
                  ))}
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 border border-stone-100 dark:border-stone-800 rounded-2xl font-bold">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-brand-900 text-white rounded-2xl font-bold shadow-xl shadow-brand-900/20">Save Question</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
