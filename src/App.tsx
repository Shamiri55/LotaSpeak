import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Lessons } from './components/Lessons';
import { AITutor } from './components/AITutor';
import { Progress } from './components/Progress';
import { Tools } from './components/Tools';
import { PlacementTest } from './components/PlacementTest';
import { Admin } from './components/Admin';
import { Social } from './components/Social';
import { Settings } from './components/Settings';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import { Toaster, toast } from 'react-hot-toast';

function AppContent() {
  const { user, login } = useFirebase();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  // System Theme Adaptation
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Initial check
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  React.useEffect(() => {
    // Check for first use date
    const firstUse = localStorage.getItem('first-use-date');
    if (!firstUse) {
      localStorage.setItem('first-use-date', new Date().toISOString());
    } else if (!user) {
      const threshold = parseInt(localStorage.getItem('admin-account-threshold') || '2');
      const firstDate = new Date(firstUse);
      const now = new Date();
      const diffDays = Math.ceil((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > threshold) {
        setShowAuthModal(true);
      }
    }
  }, [user]);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-300">
        <Navbar />
        <main className="pb-20">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/lessons" element={<Lessons />} />
            <Route path="/tutor" element={<AITutor />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/placement-test" element={<PlacementTest />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/social" element={<Social />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <AnimatePresence>
          {showAuthModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-white dark:bg-slate-900 rounded-[40px] p-10 max-w-md w-full shadow-2xl text-center border border-slate-100 dark:border-slate-800"
              >
                <div className="w-20 h-20 bg-rdc-blue rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100 dark:shadow-none">
                  <LogIn className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Inscription Obligatoire</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
                  Vous utilisez LotaSpeak depuis plus de 2 jours. Pour continuer à progresser et sauvegarder vos leçons, veuillez créer un compte.
                </p>
                <button
                  onClick={() => {
                    login();
                    setShowAuthModal(false);
                  }}
                  className="w-full py-5 bg-rdc-blue text-white rounded-2xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest"
                >
                  Créer mon compte
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <Toaster />
      <AppContent />
    </FirebaseProvider>
  );
}

