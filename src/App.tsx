/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { Member } from './types';

interface AuthContextType {
  user: User | null;
  profile: Member | null;
  loading: boolean;
  signIn: () => Promise<void>;
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
            handleFirestoreError(e, OperationType.GET, `members/${user.uid}`);
            return;
          }

          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = (user.email === 'rozobali01321786059@gmail.com') ? 'admin' : data.role;
            setProfile({ id: docSnap.id, ...data, role } as Member);
          } else {
            // Check if this is the first user
            const setupRef = doc(db, 'system', 'setup');
            let setupSnap;
            try {
              setupSnap = await getDoc(setupRef);
            } catch (e) {
              handleFirestoreError(e, OperationType.GET, 'system/setup');
              return;
            }
            const isFirstUser = !setupSnap.exists();
            
            const newProfile = {
              name: user.displayName || 'Anonymous',
              email: user.email || '',
              role: isFirstUser ? 'admin' : 'member',
              photoURL: user.photoURL || '',
              joinedAt: serverTimestamp(),
            };

            // If first user, create profile as admin FIRST to satisfy rules
            try {
              await setDoc(docRef, newProfile);
            } catch (e) {
              handleFirestoreError(e, OperationType.CREATE, `members/${user.uid}`);
              return;
            }

            if (isFirstUser) {
              try {
                await setDoc(setupRef, { initialized: true });
              } catch (e) {
                handleFirestoreError(e, OperationType.CREATE, 'system/setup');
              }
            }

            setProfile({ id: user.uid, ...newProfile } as any);
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          // Only use handleFirestoreError if it's a Permission Denied error
          // handleFirestoreError(error, OperationType.GET, 'auth_init');
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout }}>
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
  const { profile, logout, signIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
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
                {profile.photoURL && (
                  <img src={profile.photoURL} alt={profile.name} className="w-8 h-8 rounded-full border border-white/10" />
                )}
                <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={signIn} className="flex items-center gap-2 bg-teal-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20">
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
                <button onClick={() => { signIn(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-base font-medium text-teal-400">লগইন</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
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

// Main App Component
export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-transparent font-sans text-slate-100 selection:bg-teal-500/30">
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

