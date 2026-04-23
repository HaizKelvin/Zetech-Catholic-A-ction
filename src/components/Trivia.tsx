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
      <div className="flex justify-between items-center">
        <h1 className="text-5xl font-bold tracking-tighter text-stone-900 dark:text-stone-100">Religious <span className="serif-display text-brand-600 dark:text-brand-400">Trivia</span>.</h1>
        {isAdmin && (
           <button onClick={() => setShowAdd(true)} className="bg-brand-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/20">
             <Plus className="w-5 h-5" /> Add Question
           </button>
        )}
      </div>

      {!showResult && currentIndex < questions.length ? (
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-6 md:p-12 rounded-[32px] md:rounded-[40px] shadow-2xl"
        >
          <div className="flex justify-between items-center mb-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-full">
              Question {currentIndex + 1} of {questions.length}
            </span>
             {isAdmin && (
              <button onClick={() => handleDelete(questions[currentIndex].id)} className="text-stone-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
          <h2 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-10 leading-tight">
            {questions[currentIndex].question}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {questions[currentIndex].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`p-6 rounded-2xl text-left font-medium transition-all flex items-center justify-between group ${
                  isAnswered 
                    ? (i === questions[currentIndex].correctAnswer ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : (selectedOption === i ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-stone-50 dark:bg-stone-900/50 text-stone-400 dark:text-stone-500'))
                    : 'glass hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-900/20'
                }`}
              >
                {opt}
                {isAnswered && i === questions[currentIndex].correctAnswer && <CheckCircle className="w-5 h-5" />}
                {isAnswered && selectedOption === i && i !== questions[currentIndex].correctAnswer && <XCircle className="w-5 h-5" />}
              </button>
            ))}
          </div>
          {isAnswered && (
            <button 
              onClick={nextQuestion}
              className="mt-12 w-full py-5 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800 transition-all shadow-xl active:scale-[0.98]"
            >
              {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          )}
        </motion.div>
      ) : showResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass p-16 rounded-[48px] shadow-2xl text-center"
        >
          <Trophy className="w-20 h-20 text-brand-600 mx-auto mb-8" />
          <h2 className="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-4 tracking-tight">Well done!</h2>
          <p className="text-stone-500 dark:text-stone-400 mb-10 text-lg">You scored <span className="text-brand-600 dark:text-brand-400 font-black text-4xl mx-2">{score}</span> out of {questions.length}</p>
          <button 
            onClick={() => { setCurrentIndex(0); setScore(0); setShowResult(false); setIsAnswered(false); setSelectedOption(null); }}
            className="bg-brand-900 text-white px-10 py-5 rounded-2xl font-bold shadow-xl hover:bg-brand-800"
          >
            Try Again
          </button>
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
