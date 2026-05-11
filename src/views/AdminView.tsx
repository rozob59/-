import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Member, Book, BorrowRecord } from '../types';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import { Users, BookOpen, Send, UserPlus, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

export function AdminView() {
  const { profile, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;

    const unsubMembers = onSnapshot(collection(db, 'members'), (snap) => {
      setMembers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'members'));

    const unsubBooks = onSnapshot(collection(db, 'books'), (snap) => {
      setBooks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Book)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'books'));

    const unsubBorrows = onSnapshot(collection(db, 'borrows'), (snap) => {
      setBorrows(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BorrowRecord)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'borrows'));

    return () => { unsubMembers(); unsubBooks(); unsubBorrows(); };
  }, [profile]);

  if (authLoading) return <div className="p-20 text-center">Loading...</div>;
  if (!profile || profile.role !== 'admin') return <Navigate to="/" />;


  const [showIssue, setShowIssue] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-100">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight italic border-l-4 border-teal-400 pl-4 uppercase">Admin Control</h1>
          <p className="text-slate-400 mt-1 uppercase text-xs tracking-widest font-bold">লাইব্রেরী ম্যানেজমেন্ট প্যানেল</p>
        </div>
        <button 
          onClick={() => setShowIssue(true)}
          className="bg-teal-500 text-slate-900 px-6 py-3 rounded-2xl font-bold hover:bg-teal-400 transition-all flex items-center gap-2 shadow-xl shadow-teal-500/20"
        >
          <BookOpen className="w-5 h-5" />
          বই ইস্যু করুন
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <StatCard icon={<Users className="text-teal-400" />} label="মোট সদস্য" value={members.length} />
        <StatCard icon={<BookOpen className="text-emerald-400" />} label="মোট বই" value={books.length} />
        <StatCard icon={<Clock className="text-amber-400" />} label="চলমান লেন্ডিং" value={borrows.filter(b => b.status === 'active').length} />
        <StatCard icon={<CheckCircle className="text-blue-400" />} label="ফেরত বই" value={borrows.filter(b => b.status === 'returned').length} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-tight italic">
                <Users className="w-5 h-5 text-teal-400" />
                সদস্যদের তালিকা
              </h2>
              <button 
                onClick={() => setShowAddMember(true)}
                className="text-xs font-bold text-teal-400 hover:bg-white/10 px-4 py-2 rounded-xl transition-all border border-teal-500/30 flex items-center gap-2"
              >
                <UserPlus className="w-3.5 h-3.5" />
                সদস্য যোগ করুন
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4">সদস্য</th>
                    <th className="px-6 py-4">ইমেইল</th>
                    <th className="px-6 py-4">রোল</th>
                    <th className="px-6 py-4">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {members.map(member => (
                    <tr key={member.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 text-sm font-bold shadow-lg shadow-black/20 overflow-hidden">
                            {member.photoURL ? <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" /> : member.name[0]}
                          </div>
                          <span className="text-sm font-bold text-white">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${member.role === 'admin' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/20' : 'bg-slate-500/20 text-slate-400 border border-slate-500/20'}`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => { setSelectedUser(member); setShowNotify(true); }}
                          className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-slate-900 transition-all shadow-sm shadow-black/20"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent History or something else */}
        <div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl h-full flex flex-col">
            <div className="px-6 py-5 border-b border-white/10 bg-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-tight italic">
                <Clock className="w-5 h-5 text-amber-400" />
                সাম্প্রতিক লেন্ডিং
              </h2>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {borrows.slice(0, 8).map(borrow => {
                const book = books.find(b => b.id === borrow.bookId);
                const member = members.find(m => m.id === borrow.memberId);
                return (
                  <div key={borrow.id} className="flex gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg shadow-black/20 group-hover:scale-105 transition-transform duration-300">
                      <BookOpen className="w-6 h-6 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{book?.title || 'Unknown Book'}</p>
                      <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-0.5 truncate">গৃহীতা: {member?.name || 'Unknown'}</p>
                      <div className="flex items-center justify-between gap-2 mt-2">
                        <p className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${borrow.status === 'active' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {borrow.status === 'active' ? 'চলমান' : 'ফেরত হয়েছে'}
                        </p>
                        {borrow.status === 'active' && (
                          <button 
                            onClick={async () => {
                              try {
                                await updateDoc(doc(db, 'borrows', borrow.id), { status: 'returned', returnDate: serverTimestamp() });
                                await updateDoc(doc(db, 'books', borrow.bookId), { available: true });
                              } catch (e) {
                                handleFirestoreError(e, OperationType.UPDATE, `borrows/${borrow.id}`);
                              }
                            }}
                            className="text-[10px] font-bold text-teal-400 hover:text-white transition-colors"
                          >
                            ফেরত নিন
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAddMember && <AddMemberModal onClose={() => setShowAddMember(false)} />}
      {showNotify && selectedUser && <NotifyUserModal user={selectedUser} onClose={() => setShowNotify(false)} />}
      {showIssue && <IssueBookModal books={books} members={members} onClose={() => setShowIssue(false)} />}
    </div>
  );
}

function IssueBookModal({ books, members, onClose }: { books: Book[], members: Member[], onClose: () => void }) {
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [loading, setLoading] = useState(false);

  const availableBooks = books.filter(b => b.available);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !selectedMember) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'borrows'), {
        bookId: selectedBook,
        memberId: selectedMember,
        borrowDate: serverTimestamp(),
        status: 'active'
      });
      await updateDoc(doc(db, 'books', selectedBook), {
        available: false
      });
      onClose();
    } catch (error) {
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
        className="bg-slate-900/40 backdrop-blur-3xl rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold uppercase tracking-tight italic">বই ইস্যু করুন</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">সদস্য নির্বাচন করুন</label>
            <select 
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 transition-all appearance-none"
              value={selectedMember}
              onChange={e => setSelectedMember(e.target.value)}
            >
              <option value="" className="bg-slate-900">সদস্য সিলেক্ট করুন</option>
              {members.map(m => <option key={m.id} value={m.id} className="bg-slate-900">{m.name} ({m.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">বই নির্বাচন করুন (শুধুমাত্র এভেইলেবল)</label>
            <select 
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 transition-all appearance-none"
              value={selectedBook}
              onChange={e => setSelectedBook(e.target.value)}
            >
              <option value="" className="bg-slate-900">বই সিলেক্ট করুন</option>
              {availableBooks.map(b => <option key={b.id} value={b.id} className="bg-slate-900">{b.title} - {b.author}</option>)}
            </select>
          </div>
          <button 
            type="submit"
            disabled={loading || !selectedBook || !selectedMember}
            className="w-full bg-teal-500 text-slate-900 py-4 rounded-2xl font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            {loading ? 'ইস্যু করা হচ্ছে...' : 'ইস্যু নিশ্চিত করুন'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg p-6 rounded-3xl border border-white/10 shadow-sm flex items-center gap-4 group hover:bg-white/10 transition-all">
      <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-black/20 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function AddMemberModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({ name: '', email: '', role: 'member' as const });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'members'), {
        ...formData,
        joinedAt: serverTimestamp(),
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/40 backdrop-blur-3xl rounded-3xl w-full max-md overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold uppercase tracking-tight italic">নতুন সদস্য যোগ করুন</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><XCircle className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">নাম</label>
            <input 
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">ইমেইল</label>
            <input 
              required type="email"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">রোল</label>
            <select 
              className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all appearance-none"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as any})}
            >
              <option value="member" className="bg-slate-900">সদস্য</option>
              <option value="admin" className="bg-slate-900">এডমিন</option>
            </select>
          </div>
          <button 
            disabled={loading}
            className="w-full bg-teal-500 text-slate-900 py-3 rounded-2xl font-bold hover:bg-teal-400 transition-all disabled:opacity-50 shadow-lg shadow-teal-500/20"
          >
            {loading ? 'সংরক্ষণ করা হচ্ছে...' : 'সদস্য যোগ করুন'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function NotifyUserModal({ user, onClose }: { user: Member, onClose: () => void }) {
  const [formData, setFormData] = useState({ title: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: user.id,
        ...formData,
        createdAt: serverTimestamp(),
        read: false
      });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/40 backdrop-blur-3xl rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold text-white truncate uppercase tracking-tight italic">নোটিফিকেশন পাঠান: {user.name}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><XCircle className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">শিরোনাম</label>
            <input 
              required
              className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">বার্তা</label>
            <textarea 
              required rows={4}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl outline-none resize-none focus:ring-2 focus:ring-teal-500 transition-all"
              value={formData.message}
              onChange={e => setFormData({...formData, message: e.target.value})}
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-teal-500 text-slate-900 py-3 rounded-2xl font-bold hover:bg-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-500/20"
          >
            <Send className="w-4 h-4" />
            {loading ? 'পাঠানো হচ্ছে...' : 'নোটিফিকেশন পাঠান'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

