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
  where,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Payment, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { CreditCard, ShieldCheck, Clock, Download, Plus, CheckCircle2, AlertCircle, Loader2, Smartphone, DollarSign, Wallet, Trash2, Receipt, Printer, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type PaymentMethod = 'mpesa' | 'paypal' | 'manual';

export default function Payments({ isAdmin }: { isAdmin: boolean }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('manual');
  const [form, setForm] = useState({ amount: '', purpose: '', transactionId: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [stkStatus, setStkStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [receipt, setReceipt] = useState<Payment | null>(null);

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

  const formatDate = (ts: any) => {
    if (!ts) return '';
    if (ts.toDate) return ts.toDate().toLocaleDateString();
    if (ts instanceof Date) return ts.toLocaleDateString();
    return '';
  };

  const handleMpesaPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !form.phone || !form.amount || !form.purpose) return;

    setLoading(true);
    setStkStatus('pending');
    
    // Simulating STK Push
    setTimeout(async () => {
      try {
        const transId = 'MP' + Math.random().toString(36).substring(2, 10).toUpperCase();
        const paymentData = {
          userId: auth.currentUser?.uid,
          userName: auth.currentUser?.displayName || 'User',
          userEmail: auth.currentUser?.email || '',
          amount: Number(form.amount),
          purpose: form.purpose,
          transactionId: transId,
          method: 'mpesa' as const,
          phone: form.phone,
          status: 'verified' as const,
          timestamp: new Date() // Temporary for receipt
        };

        const docRef = await addDoc(collection(db, 'payments'), {
          ...paymentData,
          timestamp: serverTimestamp()
        });

        setStkStatus('success');
        setTimeout(() => {
          setReceipt({ id: docRef.id, ...paymentData } as any);
          setShowAdd(false);
          setStkStatus('idle');
          setLoading(false);
          setForm({ amount: '', purpose: '', transactionId: '', phone: '' });
        }, 2000);
      } catch (error) {
        setStkStatus('failed');
        setLoading(false);
      }
    }, 4000); // Simulate waiting for PIN
  };

  const handlePaypalPay = async () => {
    if (!auth.currentUser || !form.amount || !form.purpose) {
       alert("Please enter an amount and purpose");
       return;
    }
    setLoading(true);
    // Simulate PayPal Redirect/Flow
    setTimeout(async () => {
      const transId = 'PAYPAL-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const paymentData = {
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || 'User',
        userEmail: auth.currentUser?.email || '',
        amount: Number(form.amount),
        purpose: form.purpose,
        transactionId: transId,
        method: 'paypal' as const,
        status: 'verified' as const,
        timestamp: new Date()
      };

      const docRef = await addDoc(collection(db, 'payments'), {
        ...paymentData,
        timestamp: serverTimestamp()
      });

      setLoading(false);
      setShowAdd(false);
      setReceipt({ id: docRef.id, ...paymentData } as any);
      setForm({ amount: '', purpose: '', transactionId: '', phone: '' });
    }, 2000);
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const paymentData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'User',
        userEmail: auth.currentUser.email || '',
        amount: Number(form.amount),
        purpose: form.purpose,
        transactionId: form.transactionId,
        method: 'manual' as const,
        status: 'pending' as const,
        timestamp: new Date()
      };

      const docRef = await addDoc(collection(db, 'payments'), {
        ...paymentData,
        timestamp: serverTimestamp()
      });

      setShowAdd(false);
      setReceipt({ id: docRef.id, ...paymentData } as any);
      setForm({ amount: '', purpose: '', transactionId: '', phone: '' });
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment record from your history?')) return;
    try {
      await deleteDoc(doc(db, 'payments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `payments/${id}`);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">Treasury <span className="serif-display text-brand-600 dark:text-brand-400">& Payments</span>.</h1>
           <p className="text-stone-500 dark:text-stone-400 mt-2 text-sm md:text-base">Dues, contributions, and project support.</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full sm:w-auto">
           {isAdmin && payments.length > 0 && (
             <button 
              onClick={downloadRecords}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 glass px-4 py-2.5 md:px-6 md:py-3 rounded-2xl font-bold hover:bg-stone-50 dark:hover:bg-white/5 transition-all shadow-sm text-xs md:text-sm"
             >
                <Download className="w-4 h-4 md:w-5 md:h-5 text-stone-400" />
                Download CSV
             </button>
           )}
           <button 
            onClick={() => setShowAdd(true)}
            className="flex-1 sm:flex-none bg-brand-900 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-brand-800 transition-all shadow-xl shadow-brand-900/20 text-xs md:text-sm"
           >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              Upload Record
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {payments.length === 0 ? (
          <div className="text-center py-16 md:py-24 glass rounded-[40px]">
             <CreditCard className="w-12 h-12 md:w-16 md:h-16 text-stone-100 dark:text-stone-800 mx-auto mb-4" />
             <p className="text-stone-400 font-medium italic text-sm md:text-base">No payment records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto glass shadow-xl rounded-[32px] md:rounded-[40px]">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-stone-50/50 dark:bg-stone-900/50 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                  <th className="px-6 md:px-8 py-4 md:py-6">Status</th>
                  <th className="px-6 md:px-8 py-4 md:py-6">Contributor</th>
                  <th className="px-6 md:px-8 py-4 md:py-6">Purpose</th>
                  <th className="px-6 md:px-8 py-4 md:py-6">Amount</th>
                  <th className="px-6 md:px-8 py-4 md:py-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50 dark:divide-stone-800">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-colors group">
                    <td className="px-6 md:px-8 py-4 md:py-6">
                      <div className="flex items-center gap-2">
                        {p.status === 'verified' ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold">
                             <CheckCircle2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
                             VERIFIED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-bold">
                             <Clock className="w-2.5 h-2.5 md:w-3 md:h-3 animate-pulse" />
                             PENDING
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4 md:py-6">
                      <div>
                        <p className="font-bold text-stone-900 dark:text-stone-100 text-xs md:text-sm">{p.userName}</p>
                        <p className="text-[9px] md:text-xs text-stone-400 uppercase font-bold tracking-wider">{p.timestamp?.toDate().toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-6 md:px-8 py-4 md:py-6">
                      <span className="text-xs md:text-sm font-medium text-stone-600 dark:text-stone-400">{p.purpose}</span>
                    </td>
                    <td className="px-6 md:px-8 py-4 md:py-6">
                      <span className="text-base md:text-lg font-bold text-stone-900 dark:text-stone-100">KES {p.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 md:px-8 py-4 md:py-6 text-right">
                       <div className="flex items-center justify-end gap-2 md:gap-3">
                         {isAdmin && p.status === 'pending' ? (
                           <button 
                            onClick={() => handleVerify(p.id)}
                            className="bg-brand-900 text-white p-1.5 md:p-2 rounded-xl hover:bg-brand-800 transition-all shadow-sm"
                            title="Verify Payment"
                           >
                              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                           </button>
                         ) : (
                           <CheckCircle2 className={`w-4 h-4 md:w-5 md:h-5 ${p.status === 'verified' ? 'text-emerald-500' : 'text-stone-200 dark:text-stone-700'}`} />
                         )}
                         
                         {(isAdmin || p.userId === auth.currentUser?.uid) && (
                           <button 
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 md:p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                            title="Delete Record"
                           >
                              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                           </button>
                         )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {receipt && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-md bg-white dark:bg-stone-900 overflow-hidden rounded-[32px] md:rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-stone-100 dark:border-stone-800 relative"
            >
              {/* Receipt Header Decor */}
              <div className="h-4 bg-brand-900 w-full" />
              <div className="p-8 md:p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shadow-inner">
                    <Receipt className="w-8 h-8 text-brand-900 dark:text-brand-400" />
                  </div>
                  <button onClick={() => setReceipt(null)} className="p-2 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-full transition-colors">
                    <X className="w-6 h-6 text-stone-400" />
                  </button>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-100">Official Receipt</h3>
                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest leading-none">ZUCA Sanctuary Fellowship</p>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex justify-between items-end border-b-2 border-dashed border-stone-100 dark:border-stone-800 pb-6 uppercase">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-stone-400">Total Amount</p>
                      <p className="text-4xl font-black text-brand-900 dark:text-brand-400 tracking-tighter">
                         {receipt.method === 'paypal' ? '$' : 'KES '} {receipt.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 pt-2 capitalize">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Transaction ID</p>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 font-mono">{receipt.transactionId}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Date</p>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{formatDate(receipt.timestamp)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Purpose</p>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{receipt.purpose}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Status</p>
                      <div className={`text-[10px] font-black inline-flex items-center gap-1.5 px-3 py-1 rounded-full uppercase ${receipt.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {receipt.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    onClick={() => window.print()}
                    className="flex-1 flex items-center justify-center gap-3 py-4 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-2xl font-bold hover:bg-stone-100 transition-all shadow-sm group"
                  >
                    <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Print
                  </button>
                  <button 
                    onClick={() => setReceipt(null)}
                    className="flex-[2] py-4 bg-brand-900 text-white rounded-2xl font-bold shadow-xl shadow-brand-900/20 hover:bg-brand-800 transition-all"
                  >
                    Close
                  </button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest opacity-50 italic">"Blessings in the light of the truth"</p>
                </div>
              </div>
              
              {/* Receipt Bottom Decor */}
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-brand-900 opacity-10" />
            </motion.div>
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="glass p-10 w-full max-w-lg shadow-2xl rounded-[40px] relative"
            >
               <button onClick={() => setShowAdd(false)} className="absolute top-6 right-6 p-2 hover:bg-stone-100 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-5 h-5 text-stone-400" />
               </button>

               <h3 className="text-3xl font-bold mb-8 tracking-tight text-stone-900 dark:text-stone-100 italic">Divine <span className="text-brand-600">Treasury</span></h3>
               
               <div className="flex gap-4 mb-8">
                  <button 
                    onClick={() => setMethod('mpesa')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === 'mpesa' ? 'border-brand-900 bg-brand-50 dark:bg-brand-900/20' : 'border-stone-100 dark:border-stone-800'}`}
                  >
                    <Smartphone className={`w-6 h-6 ${method === 'mpesa' ? 'text-brand-900 dark:text-brand-400' : 'text-stone-400'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">M-Pesa</span>
                  </button>
                  <button 
                    onClick={() => setMethod('paypal')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === 'paypal' ? 'border-brand-900 bg-brand-50 dark:bg-brand-900/20' : 'border-stone-100 dark:border-stone-800'}`}
                  >
                    <DollarSign className={`w-6 h-6 ${method === 'paypal' ? 'text-brand-900 dark:text-brand-400' : 'text-stone-400'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">PayPal</span>
                  </button>
                  <button 
                    onClick={() => setMethod('manual')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === 'manual' ? 'border-brand-900 bg-brand-50 dark:bg-brand-900/20' : 'border-stone-100 dark:border-stone-800'}`}
                  >
                    <Wallet className={`w-6 h-6 ${method === 'manual' ? 'text-brand-900 dark:text-brand-400' : 'text-stone-400'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Manual</span>
                  </button>
               </div>

               {method === 'mpesa' && (
                 <form onSubmit={handleMpesaPay} className="space-y-6">
                    {stkStatus === 'pending' ? (
                      <div className="py-12 text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-brand-900 animate-spin mx-auto" />
                        <p className="font-bold text-stone-900 dark:text-stone-100 italic">Request sent to your phone...</p>
                        <p className="text-xs text-stone-400 uppercase tracking-widest">Please enter your M-Pesa PIN</p>
                      </div>
                    ) : stkStatus === 'success' ? (
                      <div className="py-12 text-center space-y-4">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <p className="font-bold text-emerald-600">Payment Successful!</p>
                        <p className="text-xs text-stone-400 uppercase tracking-widest">Transaction recorded</p>
                      </div>
                    ) : (
                       <>
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Phone Number</label>
                          <input required type="tel" placeholder="0712345678" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-6 py-4 rounded-2xl" />
                        </div>
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
                          <input required type="number" placeholder="Enter amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-6 py-4 rounded-2xl" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-5 bg-brand-900 text-white rounded-3xl font-bold shadow-xl shadow-brand-900/20 flex items-center justify-center gap-2">
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Pay via M-Pesa'}
                        </button>
                      </>
                    )}
                 </form>
               )}

               {method === 'paypal' && (
                 <div className="space-y-6">
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
                      <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2 block">Amount (USD)</label>
                      <input required type="number" placeholder="Enter amount in USD" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full px-6 py-4 rounded-2xl" />
                    </div>
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[32px] text-center border border-blue-100 dark:border-blue-900 text-blue-600">
                      <p className="text-sm font-bold mb-4 italic">You will be redirected to PayPal's secure checkout.</p>
                      <button 
                        onClick={handlePaypalPay}
                        disabled={loading}
                        className="w-full py-4 bg-[#0070ba] text-white rounded-2xl font-black italic tracking-tight hover:bg-[#003087] transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'PayPal Checkout'}
                      </button>
                    </div>
                 </div>
               )}

               {method === 'manual' && (
                 <form onSubmit={handleSubmitManual} className="space-y-6">
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
                      <input required type="text" value={form.transactionId} onChange={e => setForm({...form, transactionId: e.target.value})} className="w-full px-6 py-4 rounded-2xl" placeholder="e.g. QWE123RTY" />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 border border-stone-100 dark:border-stone-800 rounded-2xl font-bold transition-colors">Cancel</button>
                      <button type="submit" disabled={loading} className="flex-1 py-4 bg-brand-900 text-white rounded-2xl font-bold shadow-xl shadow-brand-900/20">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Record'}
                      </button>
                    </div>
                 </form>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
