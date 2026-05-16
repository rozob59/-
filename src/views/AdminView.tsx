import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Member, Book, BorrowRecord } from '../types';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Users, BookOpen, Send, UserPlus, CheckCircle, Clock, XCircle, Plus, Trash2, Edit2 } from 'lucide-react';

export function AdminView() {
  const { profile, loading: authLoading } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [showIssue, setShowIssue] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showEditBook, setShowEditBook] = useState(false);
  const [selectedBookForEdit, setSelectedBookForEdit] = useState<Book | null>(null);
  const [resetting, setResetting] = useState(false);

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

  const handleSystemReset = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি সব বই এবং লেন্ডিং হিস্ট্রি মুছে ফেলতে চান? শুধু ইউজার একাউন্টগুলো থাকবে।')) return;
    
    setResetting(true);
    try {
      // 1. Delete all borrows
      const borrowsSnap = await getDocs(collection(db, 'borrows'));
      const borrowDeletes = borrowsSnap.docs.map(d => deleteDoc(doc(db, 'borrows', d.id)));
      
      // 2. Delete all books
      const booksSnap = await getDocs(collection(db, 'books'));
      const bookDeletes = booksSnap.docs.map(d => deleteDoc(doc(db, 'books', d.id)));

      await Promise.all([...borrowDeletes, ...bookDeletes]);
      toast.success("সব হিস্ট্রি সফলভাবে ক্লিন করা হয়েছে!");
    } catch (e) {
      console.error(e);
      toast.error("ডাটা ক্লিনিং করতে সমস্যা হয়েছে।");
    } finally {
      setResetting(false);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে সব নোটিফিকেশন মুছে ফেলতে চান? এটা আবার ফিরিয়ে আনা সম্ভব নয়।')) return;
    
    setResetting(true);
    try {
      const snap = await getDocs(collection(db, 'notifications'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      toast.success("সব নোটিফিকেশন সফলভাবে মোছা হয়েছে!");
    } catch (e) {
      console.error(e);
      toast.error("নোটিফিকেশনগুলো মুছতে সমস্যা হয়েছে।");
      handleFirestoreError(e, OperationType.WRITE, 'notifications');
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAllUsers = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে সব সদস্য (আপনার নিজের অ্যাকাউন্ট বাদে) ডাটাবেজ থেকে মুছে ফেলতে চান?')) return;
    
    setResetting(true);
    try {
      const snap = await getDocs(collection(db, 'members'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => {
        if (d.data().email !== profile?.email && d.data().role !== 'admin') {
          batch.delete(d.ref);
        }
      });
      await batch.commit();
      toast.success("সব সদস্য ডাটাবেজ থেকে মুছে ফেলা হয়েছে!");
      alert("সদস্যদের মুছে ফেলা হয়েছে। তবে তাদের গুগল এক্সেস রিমুভ করতে আপনার ফায়ারবেস কনসোলের 'Authentication' সেকশন থেকেও ইউজারগুলো ডিলিট করতে হবে।");
    } catch (e) {
      console.error(e);
      toast.error("সদস্য মুছতে সমস্যা হয়েছে।");
      handleFirestoreError(e, OperationType.WRITE, 'members');
    } finally {
      setResetting(false);
    }
  };

  if (authLoading) return <div className="p-20 text-center text-white">অপেক্ষা করুন...</div>;
  if (!profile || profile.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-slate-100 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight italic border-l-8 border-teal-500 pl-6 uppercase">এডমিন প্যানেল</h1>
          <p className="text-slate-400 mt-2 uppercase text-xs tracking-widest font-bold">লাইব্রেরী ম্যানেজমেন্ট কন্ট্রোল সেন্টার</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <button 
            disabled={resetting}
            onClick={handleSystemReset}
            className="flex-1 md:flex-none bg-[rgba(244,63,94,0.1)] border border-rose-500/30 text-rose-400 px-6 py-4 rounded-[2rem] font-bold hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            রিসেট ডাটা
          </button>
          <button 
            disabled={resetting}
            onClick={handleDeleteAllUsers}
            className="flex-1 md:flex-none border bg-[rgba(249,115,22,0.1)] border-orange-500/30 text-orange-400 px-6 py-4 rounded-[2rem] font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Users className="w-5 h-5" />
            সব সদস্য মুছুন
          </button>
          <button 
            disabled={resetting}
            onClick={handleClearAllNotifications}
            className="flex-1 md:flex-none border border-orange-500/30 text-orange-400 px-6 py-4 rounded-[2rem] font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            নোটিফিকেশন ক্লিয়ার
          </button>
          <button 
            onClick={() => setShowAddBook(true)}
            className="flex-1 md:flex-none bg-white/5 border border-white/10 text-white px-8 py-4 rounded-[2rem] font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <Plus className="w-6 h-6 text-teal-400" />
            বই যোগ করুন
          </button>
          <button 
            onClick={() => setShowIssue(true)}
            className="flex-1 md:flex-none bg-teal-500 text-slate-900 px-8 py-4 rounded-[2rem] font-bold hover:bg-teal-400 transition-all flex items-center justify-center gap-3 shadow-xl shadow-teal-500/30"
          >
            <BookOpen className="w-6 h-6" />
            বই ইস্যু করুন
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard icon={<Users className="text-teal-400" />} label="মোট সদস্য" value={members.length} />
        <StatCard icon={<BookOpen className="text-emerald-400" />} label="মোট বই" value={books.length} />
        <StatCard icon={<Clock className="text-amber-400" />} label="চলমান লেন্ডিং" value={borrows.filter(b => b.status === 'active').length} />
        <StatCard icon={<CheckCircle className="text-blue-400" />} label="ফেরত হয়েছে" value={borrows.filter(b => b.status === 'returned').length} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Members List */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-4 uppercase tracking-tight italic">
                <Users className="w-6 h-6 text-teal-400" />
                সদস্যদের তালিকা
              </h2>
              <button 
                onClick={() => setShowAddMember(true)}
                className="text-xs font-bold text-teal-400 hover:bg-teal-500/10 px-5 py-2.5 rounded-2xl transition-all border border-teal-500/30 flex items-center gap-2 shadow-lg"
              >
                <UserPlus className="w-4 h-4" />
                সদস্য যোগ
              </button>
            </div>
            <div className="overflow-x-auto">
              {members.length === 0 ? (
                <div className="p-10 text-center text-slate-500 italic">এখনো কোনো সদস্য নেই</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/2 text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em]">
                      <th className="px-8 py-5">সদস্য</th>
                      <th className="px-8 py-5">ইমেইল</th>
                      <th className="px-8 py-5">রোল</th>
                      <th className="px-8 py-5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {members.map(member => (
                      <tr key={member.id} className="hover:bg-white/5 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-teal-400 text-lg font-bold shadow-inner overflow-hidden group-hover:scale-110 transition-transform">
                              {member.photoURL ? <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" /> : member.name[0]}
                            </div>
                            <span className="text-sm font-bold text-white">{member.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-slate-400">{member.email}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${member.role === 'admin' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/20' : 'bg-slate-500/20 text-slate-400 border border-slate-500/20'}`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right flex justify-end gap-2">
                          <button 
                            onClick={() => { setSelectedUser(member); setShowNotify(true); }}
                            className="w-10 h-10 rounded-xl bg-white/5 inline-flex items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-slate-900 transition-all hover:scale-110 active:scale-95 shadow-lg"
                            title="বার্তা পাঠান"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm('আপনি কি নিশ্চিত যে এই সদস্যকে মুছে ফেলতে চান?')) {
                                try {
                                  await deleteDoc(doc(db, 'members', member.id));
                                  toast.success("সদস্যকে ডাটাবেজ থেকে মুছে ফেলা হয়েছে!");
                                } catch(e) {
                                  console.error(e);
                                  toast.error("সদস্য মুছতে সমস্যা হয়েছে!");
                                  handleFirestoreError(e, OperationType.DELETE, `members/${member.id}`);
                                }
                              }
                            }}
                            className="w-10 h-10 rounded-xl bg-white/5 inline-flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
                            title="সদস্য মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Recent History */}
        <div>
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl h-full flex flex-col">
            <div className="px-8 py-6 border-b border-white/10 bg-white/5">
              <h2 className="text-xl font-bold text-white flex items-center gap-4 uppercase tracking-tight italic">
                <Clock className="w-6 h-6 text-amber-400" />
                সাম্প্রতিক লেন্ডিং
              </h2>
            </div>
            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              {borrows.length === 0 ? (
                <div className="text-center text-slate-500 italic py-10">এখনো কোনো বই ধার নেওয়া হয়নি</div>
              ) : (
                borrows.slice(0, 8).map(borrow => {
                  const book = books.find(b => b.id === borrow.bookId);
                  const member = members.find(m => m.id === borrow.memberId);
                  return (
                    <div key={borrow.id} className="flex gap-4 p-4 rounded-3xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/10">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-105 transition-all">
                        <BookOpen className="w-7 h-7 text-slate-500 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{book?.title || 'Unknown Book'}</p>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-1 truncate">গৃহীতা: {member?.name || 'Unknown'}</p>
                        <div className="flex items-center justify-between gap-2 mt-4">
                          <p className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${borrow.status === 'active' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {borrow.status === 'active' ? 'চলমান' : 'ফেরত হয়েছে'}
                          </p>
                          {borrow.status === 'active' && (
                            <button 
                              onClick={async () => {
                                try {
                                  const bookObj = books.find(b => b.id === borrow.bookId);
                                  const newBorrowed = Math.max(0, (bookObj?.borrowedCount || (bookObj?.available === false ? 1 : 0)) - 1);
                                  const total = bookObj?.totalQuantity || 1;
                                  
                                  await updateDoc(doc(db, 'borrows', borrow.id), { status: 'returned', returnDate: serverTimestamp() });
                                  await updateDoc(doc(db, 'books', borrow.bookId), { 
                                    borrowedCount: newBorrowed,
                                    available: (total - newBorrowed) > 0 
                                  });
                                  toast.success("বইটি ফেরত নেওয়া হয়েছে!");
                                } catch (e) {
                                  toast.error("বই ফেরত নিতে সমস্যা হয়েছে!");
                                  handleFirestoreError(e, OperationType.UPDATE, `borrows/${borrow.id}`);
                                }
                              }}
                              className="text-[11px] font-black text-teal-400 hover:text-white transition-colors underline underline-offset-4 decoration-2"
                            >
                              ফেরত নিন
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Books Management Section */}
      <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl mt-8">
        <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-4 uppercase tracking-tight italic">
            <BookOpen className="w-6 h-6 text-teal-400" />
            বইসমূহ ম্যানেজ করুন
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{books.length} টি বই আছে</span>
        </div>
        <div className="overflow-x-auto">
          {books.length === 0 ? (
            <div className="p-10 text-center text-slate-500 italic">এখনো কোনো বই নেই</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/2 text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">বই</th>
                  <th className="px-8 py-5">লেখক</th>
                  <th className="px-8 py-5">স্ট্যাটাস</th>
                  <th className="px-8 py-5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {books.map(book => (
                  <tr key={book.id} className="hover:bg-white/5 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-14 rounded-lg bg-white/5 border border-white/10 flex-shrink-0 overflow-hidden shadow-lg group-hover:scale-105 transition-all">
                          {book.coverURL ? (
                            <img src={book.coverURL} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-slate-700 m-auto" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-white line-clamp-1">{book.title}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-400">{book.author}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${book.available ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border border-amber-500/20'}`}>
                        {book.available ? 'এভেইলেবল' : 'ধার হয়েছে'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          setSelectedBookForEdit(book);
                          setShowEditBook(true);
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 inline-flex items-center justify-center text-slate-400 hover:bg-teal-500 hover:text-slate-900 transition-all hover:scale-110 active:scale-95 shadow-lg"
                        title="Edit Book"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          console.log("Delete button clicked for book:", book.id);
                          if (window.confirm('আপনি কি নিশ্চিত যে আপনি এই বইটি ডিলিট করতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) {
                            try {
                              console.log("Proceeding with deletion of:", book.id);
                              await deleteDoc(doc(db, 'books', book.id));
                              console.log("Deletion successful");
                              toast.success("বইটি সফলভাবে মুছে ফেলা হয়েছে!");
                            } catch (e) {
                              console.error("Deletion failed:", e);
                              toast.error("বই মুছতে সমস্যা হয়েছে!");
                              handleFirestoreError(e, OperationType.DELETE, `books/${book.id}`);
                            }
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-white/5 inline-flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
                        title="Delete Book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddMember && <AddMemberModal onClose={() => setShowAddMember(false)} />}
      {showNotify && selectedUser && <NotifyUserModal user={selectedUser} onClose={() => setShowNotify(false)} />}
      {showIssue && <IssueBookModal books={books} members={members} onClose={() => setShowIssue(false)} />}
      {showAddBook && <AddBookModal onClose={() => setShowAddBook(false)} />}
      {showEditBook && selectedBookForEdit && <EditBookModal book={selectedBookForEdit} onClose={() => setShowEditBook(false)} />}
    </div>
  );
}

function AddBookModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '', author: '', editor: '', isbn: '', category: '', description: '', coverURL: '', quantity: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 700 * 1024) { // Safer 700KB limit for Base64
        alert("ফাইল সাইজ ৭০০ কেবি এর কম হতে হবে।");
        return;
      }
      const reader = new FileReader();
      reader.onloadstart = () => setLoading(true);
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, coverURL: base64String });
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author) {
      setError("বইয়ের নাম এবং লেখকের নাম আবশ্যিক।");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bookRef = await addDoc(collection(db, 'books'), {
        ...formData,
        totalQuantity: formData.quantity,
        borrowedCount: 0,
        available: true,
        createdAt: serverTimestamp()
      });
      
      // Create global notification
      await addDoc(collection(db, 'notifications'), {
        userId: 'all',
        title: 'নতুন বই যুক্ত করা হয়েছে!',
        message: `"${formData.title}" বইটি এখন লাইব্রেরিতে পাওয়া যাচ্ছে। পড়ার জন্য সংগ্রহ করুন!`,
        createdAt: serverTimestamp(),
        read: false
      });

      toast.success("নতুন বইটি সফলভাবে যোগ করা হয়েছে!");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("বই সেভ করতে সমস্যা হয়েছে!");
      setError("বই সেভ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">নতুন বই যোগ করুন</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><XCircle className="w-8 h-8" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs text-center">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 text-center">
               <label className="cursor-pointer group">
                  <div className="w-32 h-44 mx-auto rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-teal-500/50 transition-all overflow-hidden bg-white/5 relative">
                    {imagePreview || formData.coverURL ? (
                      <img src={imagePreview || formData.coverURL} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Plus className="w-8 h-8 text-slate-500 group-hover:text-teal-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">কভার আপলোড</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
               </label>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">বইয়ের নাম *</label>
              <input 
                required
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">লেখক *</label>
              <input 
                required
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">ক্যাটাগরি</label>
              <input 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">সম্পাদক</label>
              <input 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.editor}
                onChange={(e) => setFormData({...formData, editor: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">মোট কপি *</label>
              <input 
                required type="number" min="1"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">অথবা কভার ইমেজ URL</label>
            <input 
              className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
              value={formData.coverURL}
              onChange={(e) => {
                setFormData({...formData, coverURL: e.target.value});
                setImagePreview(null);
              }}
              placeholder="https://..."
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-500 text-slate-900 py-4 rounded-2xl font-black hover:bg-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-teal-500/40 uppercase tracking-widest"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent" /> : 'বই সেভ করুন'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function EditBookModal({ book, onClose }: { book: Book, onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: book.title || '', author: book.author || '', editor: book.editor || '', isbn: book.isbn || '', category: book.category || '', description: book.description || '', coverURL: book.coverURL || '', quantity: book.totalQuantity || 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(book.coverURL || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 700 * 1024) { // Safer 700KB limit for Base64
        alert("ফাইল সাইজ ৭০০ কেবি এর কম হতে হবে।");
        return;
      }
      const reader = new FileReader();
      reader.onloadstart = () => setLoading(true);
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, coverURL: base64String });
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author || formData.quantity < 1) {
      setError("বইয়ের নাম, লেখকের নাম এবং মোট কপি আবশ্যিক।");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const borrowed = book.borrowedCount || (book.available === false ? 1 : 0);
      const isAvailable = (formData.quantity - borrowed) > 0;
      await updateDoc(doc(db, 'books', book.id!), {
        ...formData,
        totalQuantity: formData.quantity,
        available: isAvailable
      });
      
      toast.success("বইটি সফলভাবে আপডেট করা হয়েছে!");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error("বই আপডেট করতে সমস্যা হয়েছে!");
      setError("বই আপডেট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/10"
      >
        <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">বই আপডেট করুন</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><XCircle className="w-8 h-8" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs text-center">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 text-center">
               <label className="cursor-pointer group">
                  <div className="w-32 h-44 mx-auto rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 hover:border-teal-500/50 transition-all overflow-hidden bg-white/5 relative">
                    {imagePreview || formData.coverURL ? (
                      <img src={imagePreview || formData.coverURL} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Plus className="w-8 h-8 text-slate-500 group-hover:text-teal-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">কভার আপলোড</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
               </label>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">বইয়ের নাম *</label>
              <input 
                required
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">লেখক *</label>
              <input 
                required
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">ক্যাটাগরি</label>
              <input 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">সম্পাদক</label>
              <input 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.editor}
                onChange={(e) => setFormData({...formData, editor: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">মোট কপি *</label>
              <input 
                required type="number" min="1"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-teal-400 uppercase mb-2 tracking-widest">অথবা কভার ইমেজ URL</label>
            <input 
              className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-white transition-all shadow-inner"
              value={formData.coverURL}
              onChange={(e) => {
                setFormData({...formData, coverURL: e.target.value});
                setImagePreview(null);
              }}
              placeholder="https://..."
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-teal-500 text-slate-900 py-4 rounded-2xl font-black hover:bg-teal-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-teal-500/40 uppercase tracking-widest"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-900 border-t-transparent" /> : 'আপডেট করুন'}
          </button>
        </form>
      </motion.div>
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
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Default 7 days

      const bookObj = books.find(b => b.id === selectedBook);
      const newBorrowed = (bookObj?.borrowedCount || (bookObj?.available === false ? 1 : 0)) + 1;
      const total = bookObj?.totalQuantity || 1;
      const isStillAvailable = (total - newBorrowed) > 0;

      await addDoc(collection(db, 'borrows'), {
        bookId: selectedBook,
        memberId: selectedMember,
        borrowDate: serverTimestamp(),
        dueDate: dueDate,
        status: 'active'
      });
      await updateDoc(doc(db, 'books', selectedBook), {
        borrowedCount: newBorrowed,
        available: isStillAvailable
      });
      toast.success("বইটি সফলভাবে ইস্যু করা হয়েছে!");
      onClose();
    } catch (error) {
      toast.error("বই ইস্যু করতে সমস্যা হয়েছে!");
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
      toast.success("নতুন সদস্য সফলভাবে যোগ করা হয়েছে!");
      onClose();
    } catch (error) {
      toast.error("সদস্য যোগ করতে সমস্যা হয়েছে!");
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
      toast.success("নোটিফিকেশন সফলভাবে পাঠানো হয়েছে!");
      onClose();
    } catch (error) {
      toast.error("নোটিফিকেশন পাঠাতে সমস্যা হয়েছে!");
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
