import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, BookOpen, MessageSquare, Trophy, Star, Languages, LogIn, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { NotificationBell } from './NotificationBell';
import { NotificationService } from '../lib/notifications';

export function Navbar() {
  const location = useLocation();
  const { user, login, logout } = useFirebase();

  React.useEffect(() => {
    NotificationService.checkReminders();
    const interval = setInterval(() => {
      NotificationService.checkReminders();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Globe },
    { name: 'Lessons', path: '/lessons', icon: BookOpen },
    { name: 'AI Tutor', path: '/tutor', icon: MessageSquare },
    { name: 'Social', path: '/social', icon: Star },
    { name: 'Outils', path: '/tools', icon: Languages },
    { name: 'Progress', path: '/progress', icon: Trophy },
  ];

  const isAdmin = user?.email === 'swalehexauce280@gmail.com';
  if (isAdmin && !navItems.find(i => i.path === '/admin')) {
    navItems.push({ name: 'Admin', path: '/admin', icon: UserIcon });
  }

  return (
    <>
      {/* Top Bar - Consistent across all devices */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="rdc-flag-gradient p-2 rounded-xl relative overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                  <Globe className="w-6 h-6 text-white relative z-10" />
                  <div className="absolute top-1 left-1">
                    <Star className="w-3 h-3 rdc-star animate-pulse" />
                  </div>
                </div>
                <span className="text-xl font-black tracking-tight flex items-center">
                  <span className="text-rdc-blue">Lota</span>
                  <span className="text-rdc-red">Speak</span>
                  <div className="ml-1 flex gap-0.5">
                    <div className="w-1 h-4 bg-rdc-blue rounded-full" />
                    <div className="w-1 h-4 bg-rdc-yellow rounded-full" />
                    <div className="w-1 h-4 bg-rdc-red rounded-full" />
                  </div>
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <Link 
                    to="/settings"
                    className="p-2 text-slate-400 hover:text-rdc-blue transition-all"
                    title="Paramètres"
                  >
                    <SettingsIcon className="w-5 h-5" />
                  </Link>
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-none">{user.displayName}</span>
                    <button 
                      onClick={logout}
                      className="text-[10px] font-black text-rdc-red uppercase tracking-widest hover:underline"
                    >
                      Déconnexion
                    </button>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border-2 border-rdc-yellow shadow-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rdc-blue flex items-center justify-center text-white">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-2 px-6 py-2 bg-rdc-yellow text-rdc-blue rounded-xl text-sm font-black transition-all hover:scale-105 shadow-lg shadow-yellow-100"
                >
                  <LogIn className="w-4 h-4" />
                  Connexion
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Unified Bottom Navigation - Identical on PC, Mobile, Tablet */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 px-2 py-2 flex justify-around items-center rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 relative group",
                  isActive ? "text-rdc-blue" : "text-slate-400 dark:text-slate-500 hover:text-rdc-blue dark:hover:text-rdc-blue"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-2xl -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn("w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-110", isActive && "animate-pulse")} />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
