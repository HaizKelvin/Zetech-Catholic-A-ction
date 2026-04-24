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
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-stone-900 dark:text-stone-100">Religious <span className="serif-display text-brand-600 dark:text-brand-400">Trivia</span>.</h1>
        {isAdmin && (
           <button onClick={() => setShowAdd(true)} className="w-full sm:w-auto bg-brand-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/20 text-sm">
             <Plus className="w-4 h-4 md:w-5 md:h-5" /> Add Question
           </button>
        )}
      </div>

      {!showResult && currentIndex < questions.length ? (
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20, rotateY: -10 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          className="glass-card p-8 md:p-16 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_100px_-15px_rgba(0,0,0,0.5)] border-white/10"
        >
          <div className="flex justify-between items-center mb-12">
            <div className="px-5 py-2 rounded-full bg-brand-900/5 dark:bg-white/5 border border-brand-500/10 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 dark:text-brand-400">
                Faith Tier: {currentIndex + 1} / {questions.length}
              </span>
            </div>
             {isAdmin && (
              <button 
                onClick={() => handleDelete(questions[currentIndex].id)} 
                className="p-3 bg-stone-50 dark:bg-white/5 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="space-y-6 mb-12">
            <div className="h-px w-16 bg-brand-500/50" />
            <h2 className="text-3xl md:text-5xl font-bold text-stone-900 dark:text-stone-100 leading-tight tracking-tighter serif-display">
              {questions[currentIndex].question}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {questions[currentIndex].options.map((opt, i) => (
              <motion.button
                key={i}
                whileHover={!isAnswered ? { x: 10, scale: 1.02 } : {}}
                whileTap={!isAnswered ? { scale: 0.98 } : {}}
                onClick={() => handleAnswer(i)}
                className={`p-6 md:p-8 rounded-[28px] text-left font-bold transition-all flex items-center justify-between group overflow-hidden relative ${
                  isAnswered 
                    ? (i === questions[currentIndex].correctAnswer 
                        ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-500/20' 
                        : (selectedOption === i 
                            ? 'bg-red-500 text-white shadow-lg' 
                            : 'bg-stone-50 dark:bg-stone-900/40 text-stone-300 dark:text-stone-700 opacity-60'))
                    : 'glass border-white/5 hover:border-brand-500/30 hover:bg-stone-100/30 dark:hover:bg-white/5 shadow-sm'
                }`}
              >
                <span className="text-sm md:text-lg tracking-tight relative z-10">{opt}</span>
                <div className="relative z-10">
                  {isAnswered && i === questions[currentIndex].correctAnswer && <CheckCircle className="w-6 h-6 animate-float" />}
                  {isAnswered && selectedOption === i && i !== questions[currentIndex].correctAnswer && <XCircle className="w-6 h-6" />}
                  {!isAnswered && <div className="w-8 h-8 rounded-full border border-stone-100 dark:border-white/5 flex items-center justify-center text-[10px] opacity-20 group-hover:opacity-100 transition-opacity">{String.fromCharCode(65 + i)}</div>}
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
              <Trophy className="w-24 h-24 md:w-40 md:h-40 text-brand-500 mx-auto animate-float drop-shadow-[0_0_20px_#de6044]" />
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
