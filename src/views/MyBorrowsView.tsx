import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { BorrowRecord, Book } from '../types';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { History, Book as BookIcon, Clock, CheckCircle2, Calendar } from 'lucide-react';

export function MyBorrowsView() {
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'borrows'), where('memberId', '==', user.uid));
    const unsubscribeBorrows = onSnapshot(q, (snapshot) => {
      setBorrows(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BorrowRecord)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'borrows');
    });

    const unsubscribeBooks = onSnapshot(collection(db, 'books'), (snapshot) => {
      setBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'books'));

    return () => { unsubscribeBorrows(); unsubscribeBooks(); };
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-slate-100">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-white tracking-tight italic border-l-4 border-teal-400 pl-4 uppercase">
          আমার বইয়ের ইতিহাস
        </h1>
        <p className="text-slate-400 mt-2 uppercase text-xs tracking-widest font-bold">আপনার নেয়া বইগুলোর তালিকা</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
        </div>
      ) : borrows.length === 0 ? (
        <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
          <BookIcon className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <p className="text-slate-400 italic">আপনি এখনো কোনো বই নেননি।</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {borrows.map((borrow) => {
              const book = books.find(b => b.id === borrow.bookId);
              return (
                <motion.div 
                  key={borrow.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300">
                      <BookIcon className="w-8 h-8 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{book?.title || 'Unknown Book'}</h3>
                      <p className="text-slate-400 text-sm">{book?.author}</p>
                    </div>
                  </div>
                  
                    <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-3">
                      <div className="flex flex-col sm:items-end gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                          <Calendar className="w-3.5 h-3.5" />
                          শুরু: {borrow.borrowDate instanceof Date ? borrow.borrowDate.toLocaleDateString() : (borrow.borrowDate as any)?.toDate?.().toLocaleDateString()}
                        </div>
                        {borrow.status === 'active' && borrow.dueDate && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-rose-400 uppercase tracking-widest">
                            ফেরত: {borrow.dueDate instanceof Date ? borrow.dueDate.toLocaleDateString() : (borrow.dueDate as any)?.toDate?.().toLocaleDateString()}
                          </div>
                        )}
                        {borrow.status === 'returned' && borrow.returnDate && (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                            ফেরত: {borrow.returnDate instanceof Date ? borrow.returnDate.toLocaleDateString() : (borrow.returnDate as any)?.toDate?.().toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border shadow-lg ${
                        borrow.status === 'active' 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/20 shadow-amber-500/10' 
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10'}`}>
                        {borrow.status === 'active' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {borrow.status === 'active' ? 'চলমান' : 'ফেরত হয়েছে'}
                      </div>
                    </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return <Calendar className={className} />;
}
