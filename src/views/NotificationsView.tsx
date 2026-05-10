import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AppNotification } from '../types';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { Bell as BellIcon, CheckCircle2, Clock, Check } from 'lucide-react';

export function NotificationsView() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-slate-100">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight italic border-l-4 border-teal-400 pl-4 uppercase flex items-center gap-4">
            <BellIcon className="w-8 h-8 text-teal-400" />
            নোটিফিকেশন
          </h1>
          <p className="text-slate-400 mt-2 uppercase text-xs tracking-widest font-bold">লাইব্রেরি থেকে আসা বার্তা সমূহ</p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-teal-500/20 text-teal-400 border border-teal-500/20 px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-teal-500/10">
            {unreadCount} টি নতুন
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 italic text-slate-500 shadow-2xl">
          কোন নোটিফিকেশন নেই।
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {notifications.map((n) => (
              <motion.div 
                key={n.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-6 rounded-3xl border backdrop-blur-xl transition-all shadow-2xl group ${
                  n.read 
                    ? 'bg-white/2 border-white/5 opacity-60' 
                    : 'bg-white/5 border-teal-500/30 border-l-4 border-l-teal-500 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-bold tracking-tight ${n.read ? 'text-slate-300' : 'text-white'}`}>
                        {n.title}
                      </h3>
                      {!n.read && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse shadow-lg shadow-teal-400/50" />
                          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">নতুন</span>
                        </div>
                      )}
                    </div>
                      <p className={`text-sm leading-relaxed mb-4 ${n.read ? 'text-slate-500' : 'text-slate-400'}`}>
                      {n.message}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5" />
                      {n.createdAt instanceof Date ? n.createdAt.toLocaleDateString() : (n.createdAt as any)?.toDate?.().toLocaleDateString()}
                    </div>
                  </div>
                  {!n.read && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="p-3 bg-white/5 text-teal-400 rounded-2xl hover:bg-teal-500 hover:text-slate-900 transition-all shadow-lg shadow-black/20 group-hover:scale-110"
                      title="পঠিত হিসেবে চিহ্নিত করুন"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
