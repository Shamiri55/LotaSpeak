import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Users, Settings, Plus, Trash2, Save, ArrowLeft, Shield, BarChart, Bell, MessageSquare, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { useFirebase } from '../contexts/FirebaseContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export function Admin() {
  const navigate = useNavigate();
  const { user } = useFirebase();
  const [activeTab, setActiveTab] = React.useState<'users' | 'announcements' | 'stats'>('users');
  const [announcements, setAnnouncements] = React.useState<Announcement[]>(() => {
    const saved = localStorage.getItem('admin-announcements');
    return saved ? JSON.parse(saved) : [];
  });
  const [newAnnouncement, setNewAnnouncement] = React.useState({ title: '', content: '' });
  const [accountThreshold, setAccountThreshold] = React.useState(() => {
    return parseInt(localStorage.getItem('admin-account-threshold') || '2');
  });

  // Only allow specific email as admin
  const isAdmin = user?.email === 'swalehexauce280@gmail.com';

  const saveSettings = () => {
    localStorage.setItem('admin-account-threshold', accountThreshold.toString());
    toast.success('Paramètres enregistrés !');
  };

  React.useEffect(() => {
    if (!isAdmin) {
      toast.error("Accès refusé. Vous n'êtes pas administrateur.");
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const addAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;
    const announcement: Announcement = {
      id: Date.now().toString(),
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      date: new Date().toLocaleDateString()
    };
    const updated = [announcement, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('admin-announcements', JSON.stringify(updated));
    setNewAnnouncement({ title: '', content: '' });
    toast.success('Annonce publiée !');
  };

  const deleteAnnouncement = (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    localStorage.setItem('admin-announcements', JSON.stringify(updated));
    toast.success('Annonce supprimée.');
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-rdc-blue p-4 rounded-3xl shadow-xl shadow-blue-100">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Espace Administrateur</h1>
            <p className="text-slate-500 font-medium">Gérez LotaSpeak et vos utilisateurs.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Quitter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          {[
            { id: 'users', name: 'Utilisateurs', icon: Users },
            { id: 'announcements', name: 'Annonces', icon: Bell },
            { id: 'stats', name: 'Statistiques', icon: BarChart },
            { id: 'settings', name: 'Paramètres', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all",
                activeTab === tab.id 
                  ? "bg-rdc-blue text-white shadow-lg shadow-blue-100" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'users' && (
              <motion.div
                key="users"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">Liste des Utilisateurs</h2>
                  <div className="bg-blue-50 px-4 py-2 rounded-xl text-rdc-blue font-black text-xs uppercase tracking-widest">
                    12 Apprenants Actifs
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Exaucé Swalehe', email: 'swalehexauce280@gmail.com', level: 'Admin', xp: 5000 },
                    { name: 'Jean Dupont', email: 'jean@example.com', level: 'Intermédiaire', xp: 1250 },
                    { name: 'Marie Kabila', email: 'marie@example.com', level: 'Débutant', xp: 450 },
                  ].map((u, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-rdc-blue transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-rdc-blue shadow-sm">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Niveau</p>
                          <p className="text-sm font-black text-rdc-blue">{u.level}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points XP</p>
                          <p className="text-sm font-black text-slate-900">{u.xp}</p>
                        </div>
                        <button className="p-3 bg-white rounded-xl text-slate-400 hover:text-rdc-red shadow-sm transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'announcements' && (
              <motion.div
                key="announcements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
                  <h2 className="text-2xl font-black text-slate-900 mb-8">Publier une Annonce</h2>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Titre de l'annonce"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-rdc-blue rounded-2xl font-bold outline-none transition-all"
                    />
                    <textarea
                      placeholder="Contenu de l'annonce..."
                      rows={4}
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-rdc-blue rounded-2xl font-bold outline-none transition-all resize-none"
                    />
                    <button
                      onClick={addAnnouncement}
                      className="w-full py-4 bg-rdc-blue text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Publier Maintenant
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {announcements.map(a => (
                    <div key={a.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => deleteAnnouncement(a.id)}
                          className="p-3 bg-red-50 text-rdc-red rounded-xl hover:bg-rdc-red hover:text-white transition-all shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="bg-rdc-yellow p-2 rounded-xl">
                          <Bell className="w-4 h-4 text-rdc-blue" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{a.date}</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-2">{a.title}</h3>
                      <p className="text-slate-600 font-medium leading-relaxed">{a.content}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {[
                  { label: 'Total Apprenants', value: '1,240', icon: Users, color: 'text-rdc-blue', bg: 'bg-blue-50' },
                  { label: 'Leçons Complétées', value: '8,592', icon: Star, color: 'text-rdc-yellow', bg: 'bg-yellow-50' },
                  { label: 'Messages IA', value: '45,201', icon: MessageSquare, color: 'text-rdc-red', bg: 'bg-red-50' },
                  { label: 'Temps de Pratique', value: '124h', icon: BarChart, color: 'text-rdc-blue', bg: 'bg-blue-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center gap-6">
                    <div className={cn("p-6 rounded-3xl shadow-inner", stat.bg)}>
                      <stat.icon className={cn("w-10 h-10", stat.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100"
              >
                <h2 className="text-2xl font-black text-slate-900 mb-8">Paramètres de l'Application</h2>
                <div className="space-y-8">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-black text-slate-900">Obligation de Création de Compte</p>
                        <p className="text-xs text-slate-500 font-medium">Nombre de jours avant que l'inscription ne soit obligatoire.</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <input 
                          type="number" 
                          min="0"
                          value={accountThreshold}
                          onChange={(e) => setAccountThreshold(parseInt(e.target.value))}
                          className="w-20 p-3 bg-white border-2 border-slate-200 rounded-xl font-black text-center outline-none focus:border-rdc-blue"
                        />
                        <span className="text-sm font-bold text-slate-500">jours</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="font-black text-slate-900 mb-2">Maintenance du Site</p>
                    <p className="text-xs text-slate-500 font-medium mb-4">Désactiver temporairement l'accès aux nouvelles leçons.</p>
                    <button className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest hover:border-rdc-red hover:text-rdc-red transition-all">
                      Activer le mode maintenance
                    </button>
                  </div>

                  <button 
                    onClick={saveSettings}
                    className="w-full py-4 bg-rdc-blue text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:scale-105 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Enregistrer les Paramètres
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
