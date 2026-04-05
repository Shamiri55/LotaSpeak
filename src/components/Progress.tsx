import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Star, Calendar, Target, Award, TrendingUp, LogIn, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { useFirebase } from '../contexts/FirebaseContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc } from 'firebase/firestore';

export function Progress() {
  const navigate = useNavigate();
  const { user, userProfile, login } = useFirebase();
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);

  useEffect(() => {
    const savedBadges = JSON.parse(localStorage.getItem('badges') || '[]');
    setUnlockedBadges(savedBadges);
  }, []);

  useEffect(() => {
    if (!user) {
      setDailyStats([]);
      setLoadingStats(false);
      return;
    }

    const statsQuery = query(
      collection(db, 'users', user.uid, 'daily_stats'),
      orderBy('date', 'desc'),
      limit(7)
    );

    const unsubscribe = onSnapshot(statsQuery, (snapshot) => {
      const stats = snapshot.docs.map(doc => doc.data());
      
      // Create a map of existing stats by date
      const statsMap = new Map(stats.map(s => [s.date, s]));
      
      // Generate last 7 days
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        last7Days.push(statsMap.get(dateStr) || {
          date: dateStr,
          xpFrench: 0,
          xpEnglish: 0,
          lessonsCompleted: 0
        });
      }

      setDailyStats(last7Days);
      setLoadingStats(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/daily_stats`);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = [
    { label: 'Série Actuelle', value: userProfile ? `${userProfile.streak || 0} Jours` : '0 Jours', icon: Calendar, color: 'text-rdc-red', bg: 'bg-red-50' },
    { label: 'XP Total', value: userProfile ? (userProfile.totalXP || 0).toLocaleString() : '0', icon: Star, color: 'text-rdc-yellow', bg: 'bg-yellow-50' },
    { label: 'Leçons Finies', value: userProfile?.totalLessonsCompleted?.toString() || '0', icon: Target, color: 'text-rdc-blue', bg: 'bg-blue-50' },
    { label: 'Badges', value: unlockedBadges.length.toString(), icon: Award, color: 'text-rdc-blue', bg: 'bg-blue-50' },
  ];

  const milestones = [
    { title: 'Premiers Pas', date: 'Complété', completed: (userProfile?.totalXP || 0) >= 100 },
    { title: 'Conversation de Base', date: (userProfile?.totalXP || 0) >= 500 ? 'Complété' : '500 XP requis', completed: (userProfile?.totalXP || 0) >= 500 },
    { title: 'Maîtrise Intermédiaire', date: (userProfile?.totalXP || 0) >= 2000 ? 'Complété' : '2000 XP requis', completed: (userProfile?.totalXP || 0) >= 2000 },
    { title: 'Polyglotte Expert', date: (userProfile?.totalXP || 0) >= 5000 ? 'Complété' : '5000 XP requis', completed: (userProfile?.totalXP || 0) >= 5000 },
  ];

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 inline-block max-w-md">
          <Trophy className="w-16 h-16 text-rdc-yellow mx-auto mb-6" />
          <h2 className="text-3xl font-black text-slate-900 mb-4">Suivez vos progrès !</h2>
          <p className="text-slate-600 mb-8 font-medium">
            Connectez-vous pour voir vos statistiques d'apprentissage, vos séries et vos badges.
          </p>
          <button
            onClick={login}
            className="w-full py-4 bg-rdc-blue text-white rounded-2xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
          >
            <LogIn className="w-6 h-6" />
            Se Connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-rdc-blue font-black uppercase tracking-widest text-xs transition-all group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Retour au Tableau de Bord
        </button>
      </div>
      <header className="mb-12 relative overflow-hidden bg-rdc-blue rounded-3xl p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rdc-yellow/20 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rdc-red/20 rounded-full -ml-32 -mb-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-rdc-yellow p-2 rounded-xl shadow-lg">
                <Trophy className="w-6 h-6 text-rdc-blue fill-rdc-blue" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">Votre Progression 📈</h1>
            </div>
            <p className="text-xl text-blue-50 font-medium max-w-xl">
              Regardez jusqu'où vous êtes allé avec LotaSpeak ! Chaque étape vous rapproche de la maîtrise.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 flex items-center gap-4 shadow-xl">
            <div className="bg-rdc-yellow p-3 rounded-2xl">
              <Star className="w-8 h-8 text-rdc-blue fill-rdc-blue animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Statut Actuel</p>
              <p className="text-2xl font-black">Apprenant Étoilé</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border-b-4 border-slate-100 hover:border-rdc-blue shadow-sm flex items-center gap-4 transition-all"
          >
            <div className={cn("p-4 rounded-2xl shadow-sm", stat.bg)}>
              <stat.icon className={cn("w-7 h-7", stat.color)} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        <div className="lg:col-span-2 bg-white p-10 rounded-3xl border border-slate-100 shadow-xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Activité Hebdomadaire</h2>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex items-end justify-between h-56 gap-3">
            {dailyStats.length > 0 ? dailyStats.map((stat, idx) => {
              const totalXP = (stat.xpFrench || 0) + (stat.xpEnglish || 0);
              const maxXP = Math.max(...dailyStats.map(s => (s.xpFrench || 0) + (s.xpEnglish || 0)), 100);
              const height = (totalXP / maxXP) * 100;
              
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group relative">
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    {totalXP} XP
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 5)}%` }}
                    transition={{ duration: 1, delay: idx * 0.1 }}
                    className={cn(
                      "w-full rounded-t-2xl transition-all shadow-sm",
                      idx === dailyStats.length - 1 ? "bg-rdc-blue" : "bg-blue-50 hover:bg-blue-100"
                    )}
                  />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                    {new Date(stat.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </span>
                </div>
              );
            }) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold italic">
                Aucune activité enregistrée cette semaine.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border-t-8 border-rdc-yellow shadow-xl">
          <h2 className="text-2xl font-black text-slate-900 mb-10 tracking-tight">Jalons</h2>
          <div className="space-y-8">
            {milestones.map((m, idx) => (
              <div key={idx} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all",
                    m.completed ? "bg-rdc-blue text-white rotate-12" : "bg-slate-100 text-slate-400"
                  )}>
                    {m.completed ? <Trophy className="w-4 h-4" /> : <div className="w-2 h-2 bg-slate-300 rounded-full" />}
                  </div>
                  {idx !== milestones.length - 1 && (
                    <div className="w-1 h-full bg-slate-50 my-2 rounded-full" />
                  )}
                </div>
                <div className="pb-8">
                  <p className={cn("text-lg font-black tracking-tight", m.completed ? "text-slate-900" : "text-slate-400")}>
                    {m.title}
                  </p>
                  <p className="text-sm font-bold text-slate-500 mt-1">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Vos Badges Débloqués</h2>
          <Award className="w-8 h-8 text-rdc-blue" />
        </div>
        
        {unlockedBadges.length === 0 ? (
          <div className="bg-white p-12 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-bold italic">Continuez à apprendre pour débloquer vos premiers badges !</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {unlockedBadges.map((badge, idx) => (
              <motion.div
                key={badge}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-3xl border-b-4 border-rdc-yellow shadow-xl flex flex-col items-center gap-4 text-center group hover:scale-105 transition-all"
              >
                <div className="w-16 h-16 bg-rdc-blue/10 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                  <Trophy className="w-8 h-8 text-rdc-blue" />
                </div>
                <span className="font-black text-xs text-slate-900 uppercase tracking-widest">{badge}</span>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
