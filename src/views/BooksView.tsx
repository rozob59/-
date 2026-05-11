import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Book } from '../types';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Search, Plus, BookOpen, User, Calendar, CheckCircle, XCircle } from 'lucide-react';

export function BooksView() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookToBorrow, setBookToBorrow] = useState<Book | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'books'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book));
      setBooks(booksData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'books');
    });
    return () => unsubscribe();
  }, []);

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(search.toLowerCase()) || 
    book.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight italic border-l-4 border-teal-400 pl-4 uppercase">Books Collection</h1>
          <p className="text-slate-400 mt-1 uppercase text-xs tracking-widest font-bold">আমাদের লাইব্রেরিতে বর্তমানে {books.length} টি বই আছে।</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="বই অথবা লেখকের নাম..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-600 text-white"
            />
          </div>
          {profile?.role === 'admin' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-teal-500 text-slate-900 px-6 py-2 rounded-xl flex items-center gap-2 hover:bg-teal-400 transition-all font-bold whitespace-nowrap shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              নতুন বই
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredBooks.map((book) => (
              <motion.div 
                key={book.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col group hover:border-white/20 hover:bg-white/10 transition-all"
              >
                <div className="h-56 bg-slate-900/50 flex items-center justify-center relative overflow-hidden">
                  {book.coverURL ? (
                    <img src={book.coverURL} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <BookOpen className="w-12 h-12 text-slate-700" />
                  )}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg ${book.available ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                    {book.available ? 'AVAILABLE' : 'BORROWED'}
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-white group-hover:text-teal-400 transition-colors line-clamp-1">{book.title}</h3>
                  <p className="text-sm text-slate-400 mb-4">{book.author}</p>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{book.category || 'General'}</span>
                    {profile?.role === 'admin' ? (
                      <button className="text-xs text-teal-400 font-bold hover:underline">এডিট করুন</button>
                    ) : (
                      profile && book.available && (
                        <button 
                          onClick={() => setBookToBorrow(book)}
                          className="text-xs bg-teal-500 text-slate-900 px-4 py-1.5 rounded-lg font-bold hover:bg-teal-400 transition-all shadow-lg"
                        >
                          ধার নিন
                        </button>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} />}
      {bookToBorrow && <BorrowBookModal book={bookToBorrow} onClose={() => setBookToBorrow(null)} />}
    </div>
  );
}

function BorrowBookModal({ book, onClose }: { book: Book, onClose: () => void }) {
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !dueDate) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'borrows'), {
        bookId: book.id,
        memberId: profile.id,
        borrowDate: serverTimestamp(),
        dueDate: new Date(dueDate),
        status: 'active'
      });
      await updateDoc(doc(db, 'books', book.id), {
        available: false
      });
      toast.success("বইটি সফলভাবে ধার নিয়েছেন!");
      onClose();
    } catch (error) {
      toast.error("বই ধার নিতে সমস্যা হয়েছে!");
      handleFirestoreError(error, OperationType.WRITE, 'borrows/books');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/40 backdrop-blur-3xl rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-bold uppercase tracking-tight italic">বইটি ধার নিন: {book.title}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">ফেরত দেওয়ার তারিখ</label>
            <input 
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 text-slate-900 py-4 rounded-2xl font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            {loading ? 'প্রক্রিয়াধীন...' : 'নিশ্চিত করুন'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AddBookModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', category: '', description: '', coverURL: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'books'), {
        ...formData,
        available: true,
      });
      toast.success("নতুন বইটি সফলভাবে যোগ করা হয়েছে!");
      onClose();
    } catch (error) {
      toast.error("বই যোগ করতে সমস্যা হয়েছে!");
      handleFirestoreError(error, OperationType.CREATE, 'books');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/40 backdrop-blur-3xl rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight italic">নতুন বই যোগ করুন</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><XCircle /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">বইয়ের নাম *</label>
              <input 
                required
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">লেখক *</label>
              <input 
                required
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">ক্যাটাগরি</label>
              <input 
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">বইয়ের কভার URL</label>
            <input 
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all"
              value={formData.coverURL}
              onChange={(e) => setFormData({...formData, coverURL: e.target.value})}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">বিবরণ</label>
            <textarea 
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none text-white transition-all"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-500 text-slate-900 py-3 rounded-2xl font-bold hover:bg-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-500/20"
          >
            {loading ? 'সংরক্ষণ করা হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
