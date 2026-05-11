/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { Member, BorrowRecord } from './types';
import { Toaster, toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: Member | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(db, 'members', user.uid);
          let docSnap;
          try {
            docSnap = await getDoc(docRef);
          } catch (e) {
            console.error("Profile fetch error:", e);
            setLoading(false);
            return;
          }

          const isAdminEmail = user.email?.toLowerCase() === 'rozobali01321786059@gmail.com';
          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = isAdminEmail ? 'admin' : data.role;
            setProfile({ id: docSnap.id, ...data, role } as Member);
          } else if (isAdminEmail) {
            // Pre-defined admin gets access even if profile doc is missing
            setProfile({ 
              id: user.uid, 
              name: user.displayName || 'Admin', 
              email: user.email || '', 
              role: 'admin',
              joinedAt: serverTimestamp() 
            } as any);
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Library, 
  Users, 
  History, 
  Bell, 
  LogOut, 
  LogIn, 
  Menu, 
  X,
  Book as BookIcon,
  Search,
  Plus,
  ArrowRight
} from 'lucide-react';

// Components (Inlined for simplicity in this turn, can be moved to files if they grow)
function Navbar() {
  const { profile, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <nav className="bg-white/5 backdrop-blur-2xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl">
                <div className="w-8 h-8 bg-teal-400 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
                  <Library className="w-5 h-5 text-slate-900" />
                </div>
                <span className="hidden lg:inline text-lg">দক্ষিণ গোবধা <span className="text-teal-400">পাবলিক লাইব্রেরী</span></span>
                <span className="lg:hidden text-lg">DG <span className="text-teal-400">Library</span></span>
              </Link>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <Link to="/books" className="text-slate-400 hover:text-teal-400 px-3 py-2 text-sm font-medium transition-colors">বইসমূহ</Link>
                {profile && (
                  <>
                    <Link to="/my-borrows" className="text-slate-400 hover:text-teal-400 px-3 py-2 text-sm font-medium transition-colors">আমার বই</Link>
                    <Link to="/notifications" className="text-slate-400 hover:text-teal-400 px-3 py-2 text-sm font-medium transition-colors">নোটিফিকেশন</Link>
                    {profile.role === 'admin' && (
                      <Link to="/admin" className="text-teal-400 font-semibold px-3 py-2 text-sm font-medium decoration-2 underline-offset-4 underline">এডমিন প্যানেল</Link>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="hidden sm:flex sm:items-center sm:ml-6 gap-4">
              {profile ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-medium text-white">{profile.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize">{profile.role}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 text-teal-400 font-bold text-xs">
                    {profile.name?.charAt(0) || 'U'}
                  </div>
                  <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)} 
                  className="flex items-center gap-2 bg-teal-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  লগইন করুন
                </button>
              )}
            </div>
            <div className="flex items-center sm:hidden">
              <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400">
                {isOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden bg-slate-900/95 backdrop-blur-xl border-b border-white/10"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <Link to="/books" className="block px-3 py-2 text-base font-medium text-slate-300" onClick={() => setIsOpen(false)}>বইসমূহ</Link>
                {profile && (
                  <>
                    <Link to="/my-borrows" className="block px-3 py-2 text-base font-medium text-slate-300" onClick={() => setIsOpen(false)}>আমার বই</Link>
                    <Link to="/notifications" className="block px-3 py-2 text-base font-medium text-slate-300" onClick={() => setIsOpen(false)}>নোটিফিকেশন</Link>
                    {profile.role === 'admin' && (
                      <Link to="/admin" className="block px-3 py-2 text-base font-medium text-teal-400" onClick={() => setIsOpen(false)}>এডমিন প্যানেল</Link>
                    )}
                    <button onClick={logout} className="w-full text-left px-3 py-2 text-base font-medium text-red-400">লগআউট</button>
                  </>
                )}
                {!profile && (
                  <button onClick={() => { setIsAuthModalOpen(true); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-base font-medium text-teal-400">লগইন</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}

function AuthModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        if (!name) throw new Error('আপনার নাম দিন');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        // Create profile
        const setupRef = doc(db, 'system', 'setup');
        const setupSnap = await getDoc(setupRef);
        const isFirstUser = !setupSnap.exists();

        const newProfile = {
          name,
          email,
          role: isFirstUser ? 'admin' : 'member',
          photoURL: '',
          joinedAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'members', userCredential.user.uid), newProfile);
        if (isFirstUser) await setDoc(setupRef, { initialized: true });
        
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      const errorCode = err.code || '';
      const errorMessage = err.message || '';
      
      if (errorCode === 'auth/invalid-login-credentials' || 
          errorCode === 'auth/invalid-credential' || 
          errorMessage.includes('invalid-credential') ||
          errorMessage.includes('invalid-login-credentials')) {
        setError('ইমেইল বা পাসওয়ার্ড ভুল। সঠিক তথ্য দিন।');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('এই ইমেইলটি ইতিপূর্বে ব্যবহার করা হয়েছে। অন্য ইমেইল ব্যবহার করুন।');
      } else if (errorCode === 'auth/weak-password') {
        setError('পাসওয়ার্ড অত্যন্ত দুর্বল। অন্তত ৬ অক্ষরের বা আরও কঠিন পাসওয়ার্ড দিন।');
      } else if (errorCode === 'auth/user-not-found') {
        setError('এই ইমেইল দিয়ে কোনো একাউন্ট পাওয়া যায়নি। অনুগ্রহ করে নতুন একাউন্ট খুলুন।');
      } else if (errorCode === 'auth/wrong-password') {
        setError('ভুল পাসওয়ার্ড দিয়েছেন। সঠিক পাসওয়ার্ড দিয়ে চেষ্টা করুন।');
      } else if (errorCode === 'auth/invalid-email') {
        setError('ইমেইল ফরম্যাট সঠিক নয়। সঠিক ইমেইল এড্রেস দিন।');
      } else if (errorCode === 'auth/too-many-requests') {
        setError('অনেকবার ভুল চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।');
      } else {
        setError('একটি সমস্যা হয়েছে। দয়া করে আপনার ইন্টারনেট কানেকশন চেক করুন এবং আবার চেষ্টা করুন।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 w-full max-w-md rounded-[2.5rem] border border-white/20 relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isRegister ? 'নতুন একাউন্ট খুলুন' : 'লগইন করুন'}
          </h2>
          <p className="text-sm text-slate-400">
            দক্ষিণ গোবধা পাবলিক লাইব্রেরী ফ্যামিলিতে স্বাগতম
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">আপনার নাম</label>
              <input
                type="text" required
                value={name} onChange={e => setName(e.target.value)}
                placeholder="যেমন: আবরার রহমান"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">ইমেইল এড্রেস</label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">পাসওয়ার্ড</label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50 mt-4"
          >
            {loading ? 'অপেক্ষা করুন...' : (isRegister ? 'একাউন্ট তৈরী করুন' : 'লগইন করুন')}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          {isRegister ? 'ইতিপূর্বে একাউন্ট আছে?' : 'লাইব্রেরীতে নতুন?'}{' '}
          <button 
            type="button" onClick={() => setIsRegister(!isRegister)}
            className="text-teal-400 font-bold hover:underline"
          >
            {isRegister ? 'লগইন করুন' : 'নতুন একাউন্ট খুলুন'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-white mb-6 tracking-tight"
        >
          বইয়ের জগতে <span className="text-teal-400">আপনাকে স্বাগতম</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          আপনার প্রিয় বই খুঁজে নিন এবং জ্ঞানচর্চায় মেতে উঠুন। দক্ষিণ গোবধা পাবলিক লাইব্রেরী এখন আরও সহজ এবং আধুনিক।
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 flex justify-center gap-4"
        >
          <Link to="/books" className="bg-teal-500 text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-teal-400 transition-all flex items-center gap-2 group shadow-xl shadow-teal-500/20">
            বই দেখুন
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard 
          icon={<BookIcon className="w-6 h-6 text-teal-400" />}
          title="বিশাল সংগ্রহ"
          description="আমাদের সংগ্রহে রয়েছে কয়েক হাজার বই যা আপনি যেকোনো সময় নিতে পারবেন।"
        />
        <FeatureCard 
          icon={<Bell className="w-6 h-6 text-rose-400" />}
          title="স্মার্ট নোটিফিকেশন"
          description="বইয়ের ফেরত দেওয়ার সময় হলে বা নতুন নতুন বই আসলে অটোমেটিক আপডেট পান।"
        />
        <FeatureCard 
          icon={<History className="w-6 h-6 text-emerald-400" />}
          title="সহজ ট্র্যাকিং"
          description="আপনি কবে কোন বই নিয়েছিলেন তার সব রেকর্ড আপনার হাতের মুঠোয়।"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-sm hover:shadow-2xl hover:bg-white/10 transition-all"
    >
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

import { BooksView } from './views/BooksView';
import { AdminView } from './views/AdminView';
import { NotificationsView } from './views/NotificationsView';
import { MyBorrowsView } from './views/MyBorrowsView';

function ReminderManager() {
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;

    const checkReminders = async () => {
      try {
        const q = query(
          collection(db, 'borrows'), 
          where('memberId', '==', profile.id), 
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        snap.docs.forEach(async (d) => {
          const data = d.data() as BorrowRecord;
          if (!data.dueDate) return;

          const dueDate = data.dueDate instanceof Date ? data.dueDate : (data.dueDate as any).toDate();
          
          // If due date is tomorrow
          if (dueDate.toDateString() === tomorrow.toDateString()) {
            const bookSnap = await getDoc(doc(db, 'books', data.bookId));
            const bookTitle = bookSnap.exists() ? bookSnap.data().title : 'বইটি';
            toast.info(`রিমাইন্ডার: "${bookTitle}" ফেরত দেওয়ার সময় আগামীকাল!`, {
              duration: 10000,
            });
          } else if (dueDate <= now) {
             const bookSnap = await getDoc(doc(db, 'books', data.bookId));
             const bookTitle = bookSnap.exists() ? bookSnap.data().title : 'বইটি';
             toast.error(`এলার্ট: "${bookTitle}" ফেরত দেওয়ার সময় পার হয়ে গেছে!`, {
               duration: 15000,
             });
          }
        });
      } catch (e) {
        console.error("Reminder check failed:", e);
      }
    };

    checkReminders();
  }, [profile]);

  return null;
}

// Main App Component
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-transparent font-sans text-slate-100 selection:bg-teal-500/30">
          <Toaster position="bottom-center" richColors theme="dark" />
          <ReminderManager />
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/books" element={<BooksView />} />
              <Route path="/my-borrows" element={<MyBorrowsView />} />
              <Route path="/notifications" element={<NotificationsView />} />
              <Route path="/admin" element={<AdminView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

