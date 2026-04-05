import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Volume2, 
  Shield, 
  Globe, 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  LogOut,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Music,
  Zap,
  Trophy,
  Trash2,
  Save,
  Clock,
  Calendar,
  Languages
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { useFirebase } from '../contexts/FirebaseContext';
import { NotificationService } from '../lib/notifications';

export function Settings() {
  const navigate = useNavigate();
  const { user, userProfile, logout } = useFirebase();
  const [activeTab, setActiveTab] = React.useState('profile');
  const [voiceVolume, setVoiceVolume] = React.useState(80);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    'Notification' in window && Notification.permission === 'granted'
  );
  
  const [selectedVoice, setSelectedVoice] = React.useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>(() => 
    (localStorage.getItem('preferred-voice') as any) || 'Kore'
  );
  const [useUserVoice, setUseUserVoice] = React.useState(() => 
    localStorage.getItem('use-user-voice') === 'true'
  );

  const [customTime, setCustomTime] = React.useState('09:00');
  const [customDay, setCustomDay] = React.useState('daily');

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'learning', label: 'Apprentissage', icon: Zap },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'audio', label: 'Audio & Voix', icon: Volume2 },
    { id: 'appearance', label: 'Apparence', icon: Sun },
    { id: 'privacy', label: 'Sécurité', icon: Shield },
  ];

  const handleSaveVoice = (voice: any) => {
    setSelectedVoice(voice);
    localStorage.setItem('preferred-voice', voice);
    toast.success(`Voix ${voice} sélectionnée`);
  };

  const handleToggleUserVoice = () => {
    const newValue = !useUserVoice;
    setUseUserVoice(newValue);
    localStorage.setItem('use-user-voice', newValue.toString());
    toast.success(newValue ? 'Voix utilisateur activée' : 'Voix système activée');
  };

  const handleScheduleReminder = () => {
    const [hours, minutes] = customTime.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    if (target < now) {
      target.setDate(target.getDate() + 1);
    }

    const diffMs = target.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);

    NotificationService.scheduleReminder(diffMin);
    toast.success(`Rappel programmé pour ${customTime} (${customDay})`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-12 pb-32">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl transition-all text-slate-400 hover:text-rdc-blue border border-slate-100 dark:border-slate-800"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Zone Paramètres</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Personnalisez votre expérience LotaSpeak</p>
            </div>
          </div>
          <button 
            onClick={() => {
              logout();
              navigate('/');
              toast.success('Déconnexion réussie');
            }}
            className="px-8 py-4 bg-red-50 dark:bg-red-900/10 text-rdc-red rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rdc-red hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-100 dark:shadow-none"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-3 space-y-1 sticky top-24">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all relative group",
                    activeTab === tab.id 
                      ? "text-white" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabSettings"
                      className="absolute inset-0 bg-rdc-blue rounded-2xl -z-10 shadow-lg shadow-blue-200 dark:shadow-none"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", activeTab === tab.id && "animate-pulse")} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 md:p-12 min-h-[600px] transition-colors"
              >
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row items-center gap-10">
                      <div className="relative group">
                        <div className="w-40 h-40 rounded-[48px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-8 border-white dark:border-slate-900 shadow-2xl transition-transform group-hover:scale-105 duration-500">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        <button className="absolute -bottom-2 -right-2 p-4 bg-rdc-blue text-white rounded-2xl shadow-xl hover:scale-110 transition-all border-4 border-white dark:border-slate-900">
                          <Camera className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                          {user?.displayName || 'Apprenant LotaSpeak'}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center md:justify-start gap-2 mb-6">
                          <Mail className="w-4 h-4" />
                          {user?.email || 'non-connecté'}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-rdc-blue rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
                            <Zap className="w-3 h-3 fill-current" />
                            Niveau {Math.floor((userProfile?.totalXP || 0) / 1000) + 1}
                          </div>
                          <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-rdc-yellow-dark rounded-xl text-[10px] font-black uppercase tracking-widest border border-yellow-100 dark:border-yellow-900/30 flex items-center gap-2">
                            <Trophy className="w-3 h-3 fill-current" />
                            {userProfile?.streak || 0} Jours de Série
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nom d'affichage</label>
                        <input 
                          type="text" 
                          defaultValue={user?.displayName || ''}
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-rdc-blue transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email de contact</label>
                        <input 
                          type="email" 
                          disabled
                          defaultValue={user?.email || ''}
                          className="w-full px-6 py-4 bg-slate-100 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <button className="w-full md:w-auto px-10 py-5 bg-rdc-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 dark:shadow-none flex items-center justify-center gap-2">
                      <Save className="w-5 h-5" />
                      Enregistrer le profil
                    </button>
                  </div>
                )}

                {/* Learning Tab */}
                {activeTab === 'learning' && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-rdc-yellow p-3 rounded-2xl shadow-lg">
                        <Zap className="w-8 h-8 text-rdc-blue fill-current" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Objectifs d'Apprentissage</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Langue Cible Principale</label>
                        <div className="grid grid-cols-1 gap-3">
                          {['Français', 'Lingala', 'Swahili', 'English'].map((lang) => (
                            <button 
                              key={lang}
                              className={cn(
                                "flex items-center justify-between p-5 rounded-2xl border-2 transition-all font-bold",
                                lang === 'Lingala' 
                                  ? "bg-blue-50 dark:bg-blue-900/20 border-rdc-blue text-rdc-blue" 
                                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-200"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5" />
                                {lang}
                              </div>
                              {lang === 'Lingala' && <CheckCircle2 className="w-5 h-5" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Niveau de Difficulté</label>
                        <div className="grid grid-cols-1 gap-3">
                          {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                            <button 
                              key={level}
                              className={cn(
                                "flex items-center justify-between p-5 rounded-2xl border-2 transition-all font-bold",
                                level === 'Beginner' 
                                  ? "bg-yellow-50 dark:bg-yellow-900/20 border-rdc-yellow text-rdc-yellow-dark" 
                                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-200"
                              )}
                            >
                              {level === 'Beginner' ? 'Débutant' : level === 'Intermediate' ? 'Intermédiaire' : 'Avancé'}
                              {level === 'Beginner' && <CheckCircle2 className="w-5 h-5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-rdc-red p-3 rounded-2xl shadow-lg">
                        <Bell className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Rappels & Alertes</h3>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                          <Smartphone className="w-8 h-8 text-rdc-blue" />
                        </div>
                        <div>
                          <p className="text-xl font-black text-slate-900 dark:text-white">Notifications Système</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Autorisez LotaSpeak à vous envoyer des rappels</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                        className={cn(
                          "w-16 h-9 rounded-full transition-all relative shadow-inner",
                          notificationsEnabled ? "bg-rdc-blue" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-7 h-7 bg-white rounded-full transition-all shadow-md",
                          notificationsEnabled ? "left-8" : "left-1"
                        )} />
                      </button>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Programmer un rappel personnalisé</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl">
                          <Calendar className="w-5 h-5 text-rdc-blue" />
                          <select 
                            value={customDay}
                            onChange={(e) => setCustomDay(e.target.value)}
                            className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none flex-1"
                          >
                            <option value="daily">Chaque jour</option>
                            <option value="mon">Lundi</option>
                            <option value="tue">Mardi</option>
                            <option value="wed">Mercredi</option>
                            <option value="thu">Jeudi</option>
                            <option value="fri">Vendredi</option>
                            <option value="sat">Samedi</option>
                            <option value="sun">Dimanche</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl">
                          <Clock className="w-5 h-5 text-rdc-blue" />
                          <input 
                            type="time" 
                            value={customTime}
                            onChange={(e) => setCustomTime(e.target.value)}
                            className="bg-transparent font-bold text-slate-700 dark:text-slate-200 outline-none flex-1"
                          />
                        </div>
                        <button 
                          onClick={handleScheduleReminder}
                          className="px-6 py-4 bg-rdc-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-100 dark:shadow-none"
                        >
                          Programmer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio & Voice Tab */}
                {activeTab === 'audio' && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-rdc-blue p-3 rounded-2xl shadow-lg">
                        <Volume2 className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Audio & Voix</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm">
                            <Music className="w-6 h-6 text-rdc-blue" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white">Utiliser ma propre voix</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Utilise vos enregistrements pour la lecture</p>
                          </div>
                        </div>
                        <button 
                          onClick={handleToggleUserVoice}
                          className={cn(
                            "w-14 h-8 rounded-full transition-all relative",
                            useUserVoice ? "bg-rdc-yellow" : "bg-slate-300 dark:bg-slate-700"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm",
                            useUserVoice ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Sélection de la voix IA</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                          {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map((voice) => (
                            <button
                              key={voice}
                              onClick={() => handleSaveVoice(voice)}
                              className={cn(
                                "p-4 rounded-2xl border-2 font-black text-xs transition-all flex flex-col items-center gap-2",
                                selectedVoice === voice 
                                  ? "bg-blue-50 dark:bg-blue-900/20 border-rdc-blue text-rdc-blue" 
                                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-200"
                              )}
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                selectedVoice === voice ? "bg-rdc-blue text-white" : "bg-slate-100 dark:bg-slate-900"
                              )}>
                                <Volume2 className="w-5 h-5" />
                              </div>
                              {voice}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Volume Général</h4>
                          <span className="text-xs font-black text-rdc-blue">{voiceVolume}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={voiceVolume}
                          onChange={(e) => setVoiceVolume(parseInt(e.target.value))}
                          className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-rdc-blue"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-rdc-blue p-3 rounded-2xl shadow-lg">
                        <Sun className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Apparence & Thème</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { id: 'light', label: 'Clair', icon: Sun, desc: 'Classique et lumineux' },
                        { id: 'dark', label: 'Sombre', icon: Moon, desc: 'Reposant pour les yeux' },
                        { id: 'system', label: 'Système', icon: Smartphone, desc: 'Suit vos réglages système' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          className={cn(
                            "p-8 rounded-[32px] border-2 transition-all flex flex-col items-center text-center gap-4 group",
                            t.id === 'system'
                              ? "bg-blue-50 dark:bg-blue-900/20 border-rdc-blue"
                              : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200"
                          )}
                        >
                          <div className={cn(
                            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                            t.id === 'system' ? "bg-rdc-blue text-white" : "bg-slate-100 dark:bg-slate-900 text-slate-400"
                          )}>
                            <t.icon className="w-8 h-8" />
                          </div>
                          <div>
                            <p className={cn("font-black text-sm uppercase tracking-widest", t.id === 'system' ? "text-rdc-blue" : "text-slate-900 dark:text-white")}>
                              {t.label}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">{t.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-2 bg-rdc-yellow rounded-lg">
                          <Zap className="w-4 h-4 text-rdc-blue fill-current" />
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-widest">Note sur le Thème</h4>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        LotaSpeak s'adapte automatiquement à la luminosité de votre appareil pour vous offrir le meilleur confort visuel possible.
                      </p>
                    </div>
                  </div>
                )}

                {/* Privacy & Security Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
                        <Shield className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Sécurité & Données</h3>
                    </div>

                    <div className="space-y-6">
                      <div className="p-8 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[32px] space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Visibilité du Profil</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Permettre aux autres de voir vos progrès</p>
                          </div>
                          <button className="w-14 h-8 bg-rdc-blue rounded-full relative shadow-inner">
                            <div className="absolute top-1 left-7 w-6 h-6 bg-white rounded-full shadow-md" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-700">
                          <div>
                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Données de Diagnostic</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Aidez-nous à améliorer l'app en partageant des rapports d'erreurs</p>
                          </div>
                          <button className="w-14 h-8 bg-slate-200 dark:bg-slate-700 rounded-full relative shadow-inner">
                            <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md" />
                          </button>
                        </div>
                      </div>

                      <div className="p-8 bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-[32px] space-y-6">
                        <h4 className="text-sm font-black text-rdc-red uppercase tracking-widest flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> Zone de Danger
                        </h4>
                        <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                          Ces actions sont irréversibles. Soyez prudent.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button 
                            onClick={() => {
                              if (window.confirm('Voulez-vous vraiment supprimer toutes vos données de progression ?')) {
                                localStorage.clear();
                                window.location.reload();
                              }
                            }}
                            className="px-6 py-3 bg-white dark:bg-slate-900 text-rdc-red border-2 border-red-100 dark:border-red-900/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rdc-red hover:text-white transition-all"
                          >
                            Réinitialiser mes données
                          </button>
                          <button className="px-6 py-3 bg-rdc-red text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 dark:shadow-none">
                            Supprimer mon compte
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
