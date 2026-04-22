import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc,
  where
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Payment, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { CreditCard, ShieldCheck, Clock, Download, Plus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Payments({ isAdmin }: { isAdmin: boolean }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ amount: '', purpose: '', transactionId: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If admin, show all. If user, show only theirs.
    const q = isAdmin 
      ? query(collection(db, 'payments'), orderBy('timestamp', 'desc'))
      : query(collection(db, 'payments'), where('userId', '==', auth.currentUser?.uid), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payment[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'payments'), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'User',
        userEmail: auth.currentUser.email || '',
        amount: Number(form.amount),
        purpose: form.purpose,
        transactionId: form.transactionId,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      setShowAdd(false);
      setForm({ amount: '', purpose: '', transactionId: '' });
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'payments');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'payments', id), { status: 'verified' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `payments/${id}`);
    }
  };

  const downloadRecords = () => {
    if (!isAdmin) return;
    const headers = ['Date', 'Name', 'Email', 'Amount', 'Purpose', 'Transaction ID', 'Status'];
    const rows = payments.map(p => [
      p.timestamp?.toDate().toLocaleString(),
      p.userName,
      p.userEmail,
      p.amount,
      p.purpose,
      p.transactionId || 'N/A',
      p.status
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-5xl font-bold tracking-tighter">Treasury <span className="serif-display text-brand-600 dark:text-brand-400">& Payments</span>.</h1>
           <p className="text-stone-500 dark:text-stone-400 mt-2">Dues, contributions, and project support.</p>
        </div>
        <div className="flex gap-4">
           {isAdmin && payments.length > 0 && (
             <button 
              onClick={downloadRecords}
              className="flex items-center gap-2 glass px-6 py-3 rounded-2xl font-bold hover:bg-stone-50 dark:hover:bg-white/5 transition-all shadow-sm"
             >
                <Download className="w-5 h-5 text-stone-400" />
                Download CSV
             </button>
           )}
           <button 
            onClick={() => setShowAdd(true)}
            className="bg-brand-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/20"
           >
              <Plus className="w-5 h-5" />
              Upload Payment Record
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {payments.length === 0 ? (
          <div className="text-center py-24 glass rounded-[40px]">
             <CreditCard className="w-16 h-16 text-stone-100 dark:text-stone-800 mx-auto mb-4" />
             <p className="text-stone-400 font-medium italic">No payment records found.</p>
          </div>
        ) : (
          <div className="overflow-hidden glass shadow-xl rounded-[40px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 dark:bg-stone-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                  <th className="px-8 py-6">Status</th>
                  <th className="px-8 py-6">Contributor</th>
                  <th className="px-8 py-6">Purpose</th>
                  <th className="px-8 py-6">Amount</th>
                  <th className="px-8 py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {p.status === 'verified' ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-[10px] font-bold">
                             <CheckCircle2 className="w-3 h-3" />
                             VERIFIED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full text-[10px] font-bold">
                             <Clock className="w-3 h-3 animate-pulse" />
                             PENDING
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">{p.userName}</p>
                        <p className="text-xs text-stone-400 uppercase font-bold tracking-wider">{p.timestamp?.toDate().toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-medium text-stone-600 dark:text-stone-400">{p.purpose}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-lg font-bold text-stone-900 dark:text-stone-100">KES {p.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       {isAdmin && p.status === 'pending' ? (
                         <button 
                          onClick={() => handleVerify(p.id)}
                          className="bg-brand-900 text-white p-2 rounded-xl hover:bg-brand-800 transition-all"
                          title="Verify Payment"
                         >
                            <ShieldCheck className="w-5 h-5" />
                         </button>
                       ) : (
                         <CheckCircle2 className={`w-5 h-5 ml-auto ${p.status === 'verified' ? 'text-emerald-500' : 'text-stone-100 dark:text-stone-800'}`} />
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass p-10 w-full max-w-lg shadow-2xl rounded-[40px]"
            >
               <h3 className="text-3xl font-bold mb-8 tracking-tight text-stone-900 dark:text-stone-100">Report Payment</h3>
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Purpose</label>
                    <select required value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} className="w-full px-6 py-4 rounded-2xl font-bold">
                       <option value="">Select Purpose</option>
                       <option value="Monthly Dues">Monthly Dues</option>
                       <option value="Choir contribution">Choir Contribution</option>
                       <option value="Welfare">Welfare</option>
                       <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Amount (KES)</label>
                    <input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-6 py-4 rounded-2xl" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Transaction Code</label>
                    <input type="text" value={form.transactionId} onChange={e => setForm({...form, transactionId: e.target.value})} className="w-full px-6 py-4 rounded-2xl" />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 border border-stone-100 dark:border-stone-800 rounded-2xl font-bold transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-brand-900 text-white rounded-2xl font-bold shadow-xl shadow-brand-900/20">Submit</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
