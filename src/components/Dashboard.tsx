import React from 'react';
import { motion } from 'motion/react';
import { Book, Zap, Star, ArrowRight, Languages, Trophy, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useFirebase } from '../contexts/FirebaseContext';
import { NotificationService } from '../lib/notifications';

export function Dashboard() {
  const { user, userProfile } = useFirebase();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && userProfile) {
      // Simulate a "New Lesson" notification if they haven't practiced today
      const lastPractice = localStorage.getItem('last-practice-date');
      const today = new Date().toDateString();
      
      if (lastPractice !== today) {
        NotificationService.sendNotification('Nouvelle Leçon Disponible !', {
          body: 'Une nouvelle leçon personnalisée vous attend. Pratiquez maintenant pour maintenir votre série !',
          tag: 'new-lesson'
        });
        localStorage.setItem('last-practice-date', today);
      }
    }
  }, [user, userProfile]);
  const languages = [
    {
      name: 'Français',
      level: 'Débutant',
      progress: 35,
      color: 'bg-rdc-blue',
      icon: '🇫🇷',
      topics: ['Salutations', 'Famille', 'Voyage']
    },
    {
      name: 'English',
      level: 'Intermediate',
      progress: 62,
      color: 'bg-rdc-red',
      icon: '🇬🇧',
      topics: ['Business', 'Daily Life', 'Culture']
    },
    {
      name: 'Lingala',
      level: 'Débutant',
      progress: 15,
      color: 'bg-rdc-yellow',
      icon: '🇨🇩',
      topics: ['Mbote', 'Libota', 'Nzela']
    },
    {
      name: 'Swahili',
      level: 'Débutant',
      progress: 10,
      color: 'bg-rdc-blue',
      icon: '🇹🇿',
      topics: ['Habari', 'Chakula', 'Safari']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-12 relative overflow-hidden bg-rdc-blue rounded-3xl p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rdc-yellow/20 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rdc-red/20 rounded-full -ml-32 -mb-32 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 mb-4"
              >
                <div className="bg-rdc-yellow p-3 rounded-2xl shadow-lg">
                  <Star className="w-8 h-8 text-rdc-blue fill-rdc-blue animate-pulse" />
                </div>
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-4xl md:text-5xl font-black tracking-tight"
                >
                  Mbote, {user?.displayName?.split(' ')[0] || 'Apprenant'} ! 🇨🇩
                </motion.h1>
              </motion.div>
              <p className="text-xl text-blue-50 font-medium max-w-2xl">
                Bienvenue sur LotaSpeak. Accélérez votre apprentissage des langues nationales et internationales avec l'énergie de la RDC !
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                to="/placement-test"
                className="bg-rdc-yellow text-rdc-blue px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-yellow-900/20 flex items-center gap-2"
              >
                <Zap className="w-5 h-5 fill-rdc-blue" />
                Évaluer mon niveau
              </Link>
            </div>

            {user && userProfile && (
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 flex items-center gap-4 shadow-xl">
                  <div className="bg-rdc-red p-3 rounded-2xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Série</p>
                    <p className="text-2xl font-black">{userProfile.streak} Jours</p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20 flex items-center gap-4 shadow-xl">
                  <div className="bg-rdc-yellow p-3 rounded-2xl">
                    <Trophy className="w-6 h-6 text-rdc-blue" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Total XP</p>
                    <p className="text-2xl font-black">{(userProfile?.totalXP || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {languages.map((lang, idx) => (
          <motion.div
            key={lang.name}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800 hover:border-rdc-yellow dark:hover:border-rdc-yellow hover:shadow-2xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <span className="text-5xl drop-shadow-md">{lang.icon}</span>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{lang.name}</h2>
                  <span className="text-xs font-black text-rdc-blue uppercase tracking-widest">
                    {lang.level}
                  </span>
                </div>
              </div>
              <div className="bg-rdc-yellow/10 p-3 rounded-2xl">
                <Star className="w-6 h-6 text-rdc-yellow fill-rdc-yellow" />
              </div>
            </div>

            <div className="mb-8">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-3">
                <span className="text-slate-400">Progression</span>
                <span className="text-rdc-blue">{lang.progress}%</span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${lang.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={cn("h-full rounded-full shadow-lg", lang.color)}
                />
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sujets récents</p>
              <div className="flex flex-wrap gap-2">
                {lang.topics.map(topic => (
                  <span key={topic} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs border border-slate-100 dark:border-slate-700 transition-colors">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <Link
              to={`/lessons?lang=${lang.name}`}
              className="flex items-center justify-center gap-2 w-full py-5 bg-rdc-blue text-white rounded-[24px] font-black uppercase tracking-widest text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 dark:shadow-none group"
            >
              Continuer
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>

      <section className="pb-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Activités Rapides</h3>
          <div className="bg-rdc-yellow/10 p-2 rounded-xl">
            <Zap className="w-6 h-6 text-rdc-yellow fill-rdc-yellow animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            { title: 'Bases', icon: Book, color: 'text-rdc-blue', bg: 'bg-blue-50 dark:bg-blue-900/20', path: '/lessons?topic=basics' },
            { title: 'Vocabulaire', icon: Zap, color: 'text-rdc-red', bg: 'bg-red-50 dark:bg-red-900/20', path: '/lessons' },
            { title: 'Défi', icon: Trophy, color: 'text-rdc-yellow', bg: 'bg-yellow-50 dark:bg-yellow-900/20', path: '/lessons' },
            { title: 'Tuteur IA', icon: Star, color: 'text-rdc-yellow', bg: 'bg-yellow-50 dark:bg-yellow-900/20', path: '/tutor' },
            { title: 'Outils', icon: Languages, color: 'text-rdc-blue', bg: 'bg-blue-50 dark:bg-blue-900/20', path: '/tools' },
          ].map((item, idx) => (
            <motion.button
              key={item.title}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:border-rdc-yellow dark:hover:border-rdc-yellow transition-all group"
            >
              <div className={cn("p-6 rounded-2xl shadow-sm transition-transform group-hover:scale-110", item.bg)}>
                <item.icon className={cn("w-10 h-10", item.color)} />
              </div>
              <span className="font-black text-slate-900 dark:text-white tracking-tight text-xs uppercase tracking-widest">{item.title}</span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
