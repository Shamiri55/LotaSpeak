import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, Star, LogIn, ArrowLeft, Volume2, Mic, Square, Download, Trash2, CloudOff, Save, Filter, Search, Settings as SettingsIcon, User, Music } from 'lucide-react';
import { generateLesson, generateSpeech, getPronunciationFeedback, generateCompositionLesson } from '../lib/gemini';
import { Lesson, Language } from '../types';
import { cn, handleAppError } from '../lib/utils';
import { useFirebase } from '../contexts/FirebaseContext';
import { addXP } from '../lib/firebase';
import { NotificationService } from '../lib/notifications';
import { toast } from 'react-hot-toast';

export function Lessons() {
  const { user, login } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();
  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState<Language>('French');
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [quizAnswers, setQuizAnswers] = React.useState<Record<number, number>>({});
  const [showResults, setShowResults] = React.useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const [audioFeedback, setAudioFeedback] = React.useState<any>(null);
  const [writingInput, setWritingInput] = React.useState('');
  const [showWritingFeedback, setShowWritingFeedback] = React.useState(false);
  const [downloadedLessons, setDownloadedLessons] = React.useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = React.useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>(() => 
    (localStorage.getItem('preferred-voice') as any) || 'Kore'
  );
  const [useUserVoice, setUseUserVoice] = React.useState(false);
  const [userRecordings, setUserRecordings] = React.useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('user-recordings');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeTab, setActiveTab] = React.useState<'generate' | 'offline'>('generate');
  const [showVoiceSettings, setShowVoiceSettings] = React.useState(false);
  const [topicSearch, setTopicSearch] = React.useState('');
  const [topicFilter, setTopicFilter] = React.useState<'all' | 'basics' | 'advanced' | 'composition'>('all');
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [offlineProgress, setOfflineProgress] = React.useState<any[]>(() => {
    const saved = localStorage.getItem('offline-progress');
    return saved ? JSON.parse(saved) : [];
  });
  const audioContextRef = React.useRef<AudioContext | null>(null);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineProgress();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineProgress]);

  const [lastSync, setLastSync] = React.useState<string>(() => localStorage.getItem('last-sync') || '');

  const syncOfflineProgress = async () => {
    if (offlineProgress.length === 0 || !user) return;

    toast.loading('Synchronisation de votre progression hors ligne...', { id: 'sync' });
    try {
      for (const progress of offlineProgress) {
        await addXP(user.uid, progress.language, progress.xp);
        const completedCount = (Number(localStorage.getItem(`completed-${progress.language}`) || 0)) + 1;
        localStorage.setItem(`completed-${progress.language}`, completedCount.toString());
      }
      setOfflineProgress([]);
      localStorage.removeItem('offline-progress');
      const now = new Date().toLocaleString();
      setLastSync(now);
      localStorage.setItem('last-sync', now);
      toast.success('Progression synchronisée avec succès !', { id: 'sync' });
    } catch (error) {
      console.error('Sync failed', error);
      toast.error('Échec de la synchronisation. Réessai plus tard.', { id: 'sync' });
    }
  };

  const removeAllLessonsOffline = () => {
    if (window.confirm('Voulez-vous vraiment supprimer toutes vos leçons hors ligne ?')) {
      setDownloadedLessons([]);
      localStorage.removeItem('downloaded-lessons');
      toast.success('Toutes les leçons ont été supprimées.');
    }
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('downloaded-lessons');
    if (saved) {
      try {
        setDownloadedLessons(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse downloaded lessons", e);
      }
    }
  }, []);

  const saveLessonOffline = (lessonToSave: Lesson) => {
    const isAlreadySaved = downloadedLessons.some(l => l.title === lessonToSave.title && l.language === selectedLanguage);
    if (isAlreadySaved) {
      toast.error('Cette leçon est déjà enregistrée hors ligne.');
      return;
    }

    const lessonWithMeta = {
      ...lessonToSave,
      id: `${Date.now()}-${lessonToSave.title.replace(/\s+/g, '-').toLowerCase()}`,
      language: selectedLanguage,
      difficulty: selectedDifficulty,
      timestamp: Date.now()
    };
    const updated = [...downloadedLessons, lessonWithMeta];
    setDownloadedLessons(updated);
    localStorage.setItem('downloaded-lessons', JSON.stringify(updated));
    toast.success('Leçon téléchargée pour une utilisation hors ligne !');
  };

  const removeLessonOffline = (id: string) => {
    const updated = downloadedLessons.filter(l => l.id !== id);
    setDownloadedLessons(updated);
    localStorage.setItem('downloaded-lessons', JSON.stringify(updated));
    toast.success('Leçon supprimée du stockage local.');
  };

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const langParam = params.get('lang');
    const topicParam = params.get('topic');

    if (langParam === 'English') setSelectedLanguage('English');
    if (langParam === 'Français') setSelectedLanguage('French');
    if (langParam === 'Lingala') setSelectedLanguage('Lingala');
    if (langParam === 'Swahili') setSelectedLanguage('Swahili');
    if (langParam === 'Kikongo') setSelectedLanguage('Kikongo');
    if (langParam === 'Tshiluba') setSelectedLanguage('Tshiluba');

    if (topicParam === 'basics') {
      startLesson('Leçons de Base');
    }
  }, [location]);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  React.useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const speak = async (text: string, customVoice?: string) => {
    if (isAudioPlaying || !text) return;

    // Check if we should use user's own recording for this specific text
    if (useUserVoice && userRecordings[text]) {
      setIsAudioPlaying(true);
      const audio = new Audio(userRecordings[text]);
      audio.onended = () => setIsAudioPlaying(false);
      audio.play();
      return;
    }

    setIsAudioPlaying(true);
    try {
      const base64Audio = await generateSpeech(text, (customVoice as any) || selectedVoice);
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioContext = getAudioContext();
        const numSamples = Math.floor(bytes.length / 2);
        const audioBuffer = audioContext.createBuffer(1, numSamples, 24000);
        const nowBuffering = audioBuffer.getChannelData(0);
        const view = new DataView(bytes.buffer);
        for (let i = 0; i < numSamples; i++) {
          nowBuffering[i] = view.getInt16(i * 2, true) / 32768;
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.onended = () => {
          setIsAudioPlaying(false);
        };
        source.start();
      } else {
        setIsAudioPlaying(false);
      }
    } catch (error) {
      handleAppError(error, "Synthèse Vocale");
      setIsAudioPlaying(false);
    }
  };

  const handleFinishLesson = async () => {
    setShowResults(true);
    const xpEarned = 20;

    if (user && isOnline) {
      await addXP(user.uid, selectedLanguage, xpEarned);
      
      // Badge logic
      const completedCount = (Number(localStorage.getItem(`completed-${selectedLanguage}`) || 0)) + 1;
      localStorage.setItem(`completed-${selectedLanguage}`, completedCount.toString());
      
      if (completedCount === 1) unlockBadge('Premier Pas');
      if (completedCount === 10) unlockBadge('Étudiant Assidu');
      
      const correctCount = Object.values(quizAnswers).filter((ans, idx) => ans === lesson?.quiz[idx].correctAnswer).length;
      if (correctCount === lesson?.quiz.length) unlockBadge('Sans Faute');
    } else {
      // Offline progress tracking
      const newProgress = {
        language: selectedLanguage,
        xp: xpEarned,
        timestamp: Date.now(),
        lessonTitle: lesson?.title
      };
      const updatedProgress = [...offlineProgress, newProgress];
      setOfflineProgress(updatedProgress);
      localStorage.setItem('offline-progress', JSON.stringify(updatedProgress));
      toast.success('Progression enregistrée localement. Elle sera synchronisée une fois en ligne.');
    }

    NotificationService.sendNotification('Leçon Terminée !', {
      body: `Félicitations ! Vous avez terminé la leçon "${lesson?.title}" et gagné +${xpEarned} XP.`,
      tag: 'lesson-complete'
    });
  };

  const unlockBadge = (badgeName: string) => {
    const badges = JSON.parse(localStorage.getItem('badges') || '[]');
    if (!badges.includes(badgeName)) {
      badges.push(badgeName);
      localStorage.setItem('badges', JSON.stringify(badges));
      toast.success(`Nouveau badge débloqué : ${badgeName} ! 🏆`, {
        icon: '🎉',
        duration: 5000
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setLoading(true);
          try {
            const feedback = await getPronunciationFeedback(base64Audio, 'audio/webm', selectedLanguage);
            setAudioFeedback(feedback);
          } catch (error) {
            handleAppError(error, "Analyse Vocale");
          } finally {
            setLoading(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioFeedback(null);
    } catch (error) {
      handleAppError(error, "Microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const saveUserVoice = async (text: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      toast.loading("Enregistrement de votre voix...", { id: 'voice-rec' });
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const updated = { ...userRecordings, [text]: base64 };
          setUserRecordings(updated);
          localStorage.setItem('user-recordings', JSON.stringify(updated));
          toast.success("Votre voix a été enregistrée pour ce mot !", { id: 'voice-rec' });
        };
      };

      recorder.start();
      setTimeout(() => recorder.stop(), 3000); // Record for 3 seconds
    } catch (error) {
      handleAppError(error, "Microphone");
    }
  };

  const startLesson = async (topic: string, isComposition = false) => {
    setLoading(true);
    setLesson(null);
    setShowResults(false);
    setQuizAnswers({});
    setWritingInput('');
    setShowWritingFeedback(false);
    setAudioFeedback(null);
    try {
      let data;
      if (isComposition) {
        const compositionData = await generateCompositionLesson(selectedLanguage, topic);
        data = {
          title: compositionData.title || `Comment écrire : ${topic}`,
          vocabulary: [],
          phrases: [],
          grammarTip: "La structure est la clé d'une bonne rédaction.",
          writingExercise: {
            prompt: compositionData.exercise || "Rédigez un court texte en suivant la structure proposée.",
            suggestedAnswer: "Votre texte sera analysé par l'IA une fois soumis."
          },
          speakingPrompt: "Lisez votre composition à haute voix pour pratiquer la fluidité.",
          quiz: [],
          composition: compositionData
        };
      } else {
        data = await generateLesson(selectedLanguage, selectedDifficulty, topic);
      }
      setLesson(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const topics = [
    { id: 'basics', title: 'Leçons de Base', icon: '🔰' },
    { id: 'grammar', title: 'Grammaire', icon: '📝' },
    { id: 'alphabet', title: 'Alphabet & Sons', icon: '🔤' },
    { id: 'numbers', title: 'Nombres & Temps', icon: '🔢' },
    { id: 'greetings', title: 'Salutations', icon: '👋' },
    { id: 'travel', title: 'Voyage', icon: '✈️' },
    { id: 'food', title: 'Nourriture', icon: '🍕' },
    { id: 'work', title: 'Travail', icon: '💼' },
    { id: 'culture', title: 'Culture', icon: '🎭' },
    { id: 'real-life', title: 'Situations Réelles', icon: '🌍' },
    { id: 'composition-letter', title: 'Lettre Formelle', icon: '✉️', isComposition: true },
    { id: 'composition-report', title: 'Rapport', icon: '📊', isComposition: true },
    { id: 'composition-essay', title: 'Dissertation', icon: '✍️', isComposition: true },
    { id: 'composition-cv', title: 'CV & Motivation', icon: '📄', isComposition: true },
  ];

  const filteredTopics = topics.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(topicSearch.toLowerCase());
    if (topicFilter === 'all') return matchesSearch;
    const basicIds = ['basics', 'alphabet', 'numbers', 'greetings'];
    if (topicFilter === 'basics') return matchesSearch && basicIds.includes(t.id);
    if (topicFilter === 'advanced') return matchesSearch && !basicIds.includes(t.id) && !t.isComposition;
    if (topicFilter === 'composition') return matchesSearch && t.isComposition;
    return matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-rdc-blue font-black uppercase tracking-widest text-xs transition-all group"
        >
          <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Retour au Tableau de Bord
        </button>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-400 hover:text-rdc-blue"
              title="Paramètres de voix"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showVoiceSettings && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50"
                >
                  <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-4">Voix du Lecteur</h4>
                  
                  <div className="space-y-2 mb-6">
                    {['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].map((voice) => (
                      <button
                        key={voice}
                        onClick={() => {
                          setSelectedVoice(voice as any);
                          localStorage.setItem('preferred-voice', voice);
                          speak("Bonjour, voici ma nouvelle voix.", voice);
                        }}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between",
                          selectedVoice === voice ? "bg-rdc-blue text-white" : "hover:bg-slate-50 text-slate-600"
                        )}
                      >
                        {voice}
                        {selectedVoice === voice && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setUseUserVoice(!useUserVoice)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3",
                        useUserVoice ? "bg-rdc-yellow text-rdc-blue" : "bg-slate-50 text-slate-500"
                      )}
                    >
                      <User className="w-4 h-4" />
                      {useUserVoice ? "Ma voix activée" : "Utiliser ma voix"}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2 italic px-2">
                      Enregistrez votre propre voix pour chaque mot pour une personnalisation totale.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('generate')}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'generate' ? "bg-white text-rdc-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <RefreshCw className={cn("w-3 h-3", !isOnline && "opacity-50")} /> 
            {isOnline ? "Nouveau" : "Hors Ligne Uniquement"}
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={cn(
              "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'offline' ? "bg-white text-rdc-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <CloudOff className="w-3 h-3" /> Espace de Travail ({downloadedLessons.length})
          </button>
        </div>
      </div>
    </div>

    {!isOnline && activeTab === 'generate' && (
        <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-100 rounded-3xl flex items-center gap-4 text-amber-800">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <p className="font-black text-sm uppercase tracking-widest mb-1">Mode Hors Ligne Activé</p>
            <p className="text-xs font-medium">Vous n'êtes pas connecté à Internet. Utilisez votre espace de travail pour accéder aux leçons téléchargées.</p>
          </div>
          <button 
            onClick={() => setActiveTab('offline')}
            className="ml-auto px-4 py-2 bg-amber-200 hover:bg-amber-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Aller à l'espace
          </button>
        </div>
      )}

      {activeTab === 'offline' && !lesson && (
        <div className="space-y-8">
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CloudOff className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Mode Hors Ligne</h3>
            <p className="text-slate-500 font-medium max-w-md mx-auto mb-6">
              Accédez à vos leçons téléchargées même sans connexion internet.
            </p>
            {lastSync && (
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Dernière synchronisation : {lastSync}
              </p>
            )}
            {offlineProgress.length > 0 && (
              <div className="flex flex-col items-center gap-4">
                <div className="px-4 py-2 bg-blue-50 text-rdc-blue rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100">
                  {offlineProgress.length} leçon(s) en attente de synchronisation
                </div>
                <button
                  onClick={syncOfflineProgress}
                  disabled={!isOnline}
                  className={cn(
                    "px-8 py-3 bg-rdc-blue text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center gap-2",
                    !isOnline && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <RefreshCw className={cn("w-4 h-4", !isOnline && "animate-spin")} />
                  Synchroniser maintenant
                </button>
              </div>
            )}
          </div>

          <div className="w-full flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher dans vos leçons..."
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-rdc-blue transition-all shadow-sm"
              />
            </div>
            {downloadedLessons.length > 0 && (
              <button
                onClick={removeAllLessonsOffline}
                className="px-6 py-4 bg-red-50 text-rdc-red rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rdc-red hover:text-white transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Tout supprimer
              </button>
            )}
          </div>

          {downloadedLessons.filter(l => l.title.toLowerCase().includes(topicSearch.toLowerCase())).length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 font-bold italic">Aucune leçon ne correspond à votre recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {downloadedLessons
                .filter(l => l.title.toLowerCase().includes(topicSearch.toLowerCase()))
                .map((savedLesson) => (
                <motion.div
                  key={savedLesson.id}
                  whileHover={{ y: -5 }}
                  className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all relative group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-rdc-blue/10 text-rdc-blue rounded-md text-[8px] font-black uppercase tracking-widest">
                          {savedLesson.difficulty}
                        </span>
                        <span className="px-2 py-0.5 bg-rdc-yellow/10 text-rdc-yellow-dark rounded-md text-[8px] font-black uppercase tracking-widest">
                          {savedLesson.language}
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 leading-tight">{savedLesson.title}</h4>
                    </div>
                    <button
                      onClick={() => removeLessonOffline(savedLesson.id)}
                      className="p-2 text-slate-300 hover:text-rdc-red transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(savedLesson.timestamp).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedLanguage(savedLesson.language);
                        setSelectedDifficulty(savedLesson.difficulty);
                        setLesson(savedLesson);
                      }}
                      className="flex items-center gap-2 text-rdc-blue font-black text-xs uppercase tracking-widest hover:gap-3 transition-all"
                    >
                      Étudier <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'generate' && !lesson && !loading && (
        <div className="text-center py-6">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-12 tracking-tighter">
            Prêt pour une nouvelle <span className="text-rdc-blue">aventure ?</span>
          </h2>
          
          <div className="space-y-10">
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Étape 1 : Choisissez votre langue</p>
              <div className="flex flex-wrap justify-center gap-4">
                {(['French', 'English', 'Lingala', 'Swahili', 'Kikongo', 'Tshiluba'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSelectedLanguage(lang)}
                    className={cn(
                      "px-8 py-4 rounded-2xl font-black transition-all shadow-lg border-2",
                      selectedLanguage === lang 
                        ? "bg-rdc-blue text-white border-rdc-blue shadow-blue-200 scale-105" 
                        : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    {lang === 'French' ? '🇫🇷 Français' : 
                     lang === 'English' ? '🇬🇧 English' : 
                     lang === 'Lingala' ? '🇨🇩 Lingala' : 
                     lang === 'Swahili' ? '🇹🇿 Swahili' : 
                     lang === 'Kikongo' ? '🇨🇩 Kikongo' : '🇨🇩 Tshiluba'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Étape 2 : Niveau de difficulté</p>
              <div className="flex justify-center gap-2 p-1 bg-slate-100 rounded-2xl">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={cn(
                      "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      selectedDifficulty === diff 
                        ? "bg-white text-rdc-blue shadow-sm" 
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {diff === 'Beginner' ? 'Débutant' : diff === 'Intermediate' ? 'Intermédiaire' : 'Avancé'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Étape 3 : Sélectionnez un sujet</p>
              
              <div className="w-full flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un sujet..."
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-rdc-blue transition-all shadow-sm"
                  />
                </div>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  {(['all', 'basics', 'advanced', 'composition'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setTopicFilter(f)}
                      className={cn(
                        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        topicFilter === f ? "bg-white text-rdc-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {f === 'all' ? 'Tous' : f === 'basics' ? 'Bases' : f === 'advanced' ? 'Avancé' : 'Rédaction'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
                {filteredTopics.map((topic) => (
                  <motion.button
                    key={topic.id}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startLesson(topic.title, topic.isComposition)}
                    className="bg-white p-6 rounded-3xl border-b-4 border-slate-100 hover:border-rdc-yellow shadow-sm hover:shadow-xl transition-all flex flex-col items-center gap-4"
                  >
                    <span className="text-4xl drop-shadow-sm">{topic.icon}</span>
                    <span className="font-black text-sm text-slate-900 tracking-tight">{topic.title}</span>
                  </motion.button>
                ))}
              </div>
              {filteredTopics.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-slate-400 font-bold italic">Aucun sujet ne correspond à votre recherche.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-8">
          <div className="relative">
            <div className="w-24 h-24 border-8 border-rdc-blue/10 rounded-full" />
            <div className="w-24 h-24 border-8 border-t-rdc-blue border-r-rdc-yellow border-b-rdc-red rounded-full animate-spin absolute top-0" />
          </div>
          <p className="text-xl font-black text-slate-700 animate-pulse tracking-tight">
            Génération de votre leçon {selectedDifficulty.toLowerCase()}...
          </p>
        </div>
      )}

      {lesson && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div className="h-2 w-full rdc-flag-gradient rounded-full mb-8 shadow-sm" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-rdc-blue/10 text-rdc-blue rounded-full text-[10px] font-black uppercase tracking-widest">
                  {selectedDifficulty}
                </span>
                <span className="px-3 py-1 bg-rdc-yellow/10 text-rdc-yellow-dark text-[10px] font-black uppercase tracking-widest">
                  {selectedLanguage}
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">
                {lesson.title} <span className="text-rdc-yellow">★</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {!downloadedLessons.some(l => l.title === lesson.title && l.language === selectedLanguage) && (
                <button 
                  onClick={() => saveLessonOffline(lesson)}
                  className="bg-rdc-blue text-white px-6 py-3 rounded-2xl hover:bg-blue-600 flex items-center gap-2 font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-100"
                >
                  <Download className="w-4 h-4" /> Télécharger
                </button>
              )}
              <button 
                onClick={() => {
                  setLesson(null);
                  setActiveTab('generate');
                }}
                className="bg-slate-100 text-slate-600 px-6 py-3 rounded-2xl hover:bg-slate-200 flex items-center gap-2 font-black text-sm uppercase tracking-widest transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Changer de sujet
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">
              {/* Composition Content */}
              {lesson.composition && (
                <section className="bg-white dark:bg-slate-900 p-10 rounded-3xl border-l-8 border-rdc-yellow shadow-xl space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-rdc-yellow p-3 rounded-2xl shadow-lg shadow-yellow-100 dark:shadow-none">
                      <Star className="w-8 h-8 text-rdc-blue" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Guide de Rédaction</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-rdc-blue mb-3">Structure recommandée</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {lesson.composition.structure.map((step, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div className="w-6 h-6 bg-rdc-blue text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-rdc-blue mb-3">Expressions Clés</h4>
                      <div className="flex flex-wrap gap-2">
                        {lesson.composition.keyPhrases.map((phrase, i) => (
                          <span key={i} className="px-4 py-2 bg-blue-50 text-rdc-blue rounded-xl text-xs font-bold border border-blue-100">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30">
                      <h4 className="text-sm font-black uppercase tracking-widest text-rdc-red mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Erreurs à éviter
                      </h4>
                      <ul className="space-y-2">
                        {lesson.composition.commonMistakes.map((mistake, i) => (
                          <li key={i} className="text-sm font-medium text-red-700 dark:text-red-400 flex items-start gap-2">
                            <span className="text-rdc-red mt-1">•</span> {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-rdc-blue mb-3">Exemple de Référence</h4>
                      <div className="p-6 bg-slate-900 dark:bg-slate-950 text-slate-300 rounded-3xl font-mono text-sm leading-relaxed whitespace-pre-wrap border-4 border-slate-800 dark:border-slate-800 shadow-inner">
                        {lesson.composition.sample}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Vocabulary */}
              {lesson.vocabulary && lesson.vocabulary.length > 0 && (
                <section className="bg-white dark:bg-slate-900 p-10 rounded-3xl border-l-8 border-rdc-blue shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="bg-rdc-blue p-3 rounded-2xl shadow-lg shadow-blue-100 dark:shadow-none">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Vocabulaire Clé</h3>
                  </div>
                  <button
                    onClick={() => speak(lesson.vocabulary?.map(v => v.word).join('. '))}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-all"
                  >
                    <Volume2 className="w-4 h-4" /> Écouter tout
                  </button>
                </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {lesson.vocabulary?.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[32px] border border-slate-100 dark:border-slate-700/50 hover:border-rdc-blue/30 transition-all group flex flex-col gap-4">
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg">
                          {item.imageKeyword ? (
                            <img 
                              src={`https://picsum.photos/seed/${item.imageKeyword}/600/400`} 
                              alt={item.word} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-slate-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                            <p className="text-white text-xs font-medium italic">"{item.example}"</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{item.word}</h4>
                            <p className="text-sm font-bold text-rdc-blue uppercase tracking-widest">{item.translation}</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => speak(item.word)}
                              className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rdc-blue shadow-sm hover:shadow-md transition-all"
                            >
                              <Volume2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => saveUserVoice(item.word)}
                              className={cn(
                                "p-3 rounded-2xl shadow-sm hover:shadow-md transition-all",
                                userRecordings[item.word] ? "bg-rdc-yellow/20 text-rdc-yellow-dark" : "bg-white dark:bg-slate-800 text-slate-400 hover:text-rdc-red"
                              )}
                              title="Enregistrer ma voix"
                            >
                              <Mic className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              </section>
            )}

              {/* Grammar */}
              <section className="bg-rdc-red p-10 rounded-3xl text-white shadow-2xl shadow-red-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertCircle className="w-32 h-32" />
                </div>
                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <AlertCircle className="w-8 h-8" />
                  <h3 className="text-3xl font-black tracking-tight">Conseil de Grammaire</h3>
                </div>
                <p className="text-xl leading-relaxed font-medium relative z-10">
                  {lesson.grammarTip}
                </p>
              </section>

              {/* Writing Exercise */}
              <section className="bg-white dark:bg-slate-900 p-10 rounded-3xl border-l-8 border-rdc-yellow shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-rdc-yellow p-3 rounded-2xl shadow-lg shadow-yellow-100 dark:shadow-none">
                    <Star className="w-8 h-8 text-white fill-current" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Pratique de l'Écrit</h3>
                </div>
                <div className="space-y-6">
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                    {lesson?.writingExercise?.prompt}
                  </p>
                  <textarea
                    value={writingInput}
                    onChange={(e) => setWritingInput(e.target.value)}
                    placeholder="Écrivez votre réponse ici..."
                    className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-rdc-yellow transition-all resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowWritingFeedback(!showWritingFeedback)}
                      className="px-6 py-3 bg-rdc-yellow text-rdc-blue rounded-xl font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-100"
                    >
                      {showWritingFeedback ? "Masquer la correction" : "Voir la correction suggérée"}
                    </button>
                  </div>
                  <AnimatePresence>
                    {showWritingFeedback && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 bg-green-50 border-2 border-green-100 rounded-2xl">
                          <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">Correction suggérée :</p>
                          <p className="text-lg font-bold text-green-800 italic">
                            {lesson?.writingExercise?.suggestedAnswer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>

              {/* Speaking Practice */}
              <section className="bg-rdc-blue p-10 rounded-3xl text-white shadow-2xl shadow-blue-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-white p-3 rounded-2xl shadow-lg">
                    <Mic className="w-8 h-8 text-rdc-blue" />
                  </div>
                  <h3 className="text-3xl font-black tracking-tight">Pratique de l'Oral</h3>
                </div>
                <div className="space-y-8">
                  <div className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                    <p className="text-sm font-black text-blue-100 uppercase tracking-widest mb-2">Consigne :</p>
                    <p className="text-xl font-bold leading-relaxed">
                      {lesson?.speakingPrompt}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-6">
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={cn(
                        "p-8 rounded-full transition-all shadow-2xl relative group",
                        isRecording 
                          ? "bg-rdc-red animate-pulse" 
                          : "bg-white hover:scale-110"
                      )}
                    >
                      {isRecording ? (
                        <Square className="w-10 h-10 text-white" />
                      ) : (
                        <Mic className="w-10 h-10 text-rdc-blue" />
                      )}
                      {!isRecording && (
                        <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-20 group-hover:opacity-0" />
                      )}
                    </button>
                    <p className="text-sm font-black uppercase tracking-widest text-blue-100">
                      {isRecording ? "Enregistrement en cours..." : "Cliquez pour enregistrer votre voix"}
                    </p>
                  </div>

                  <AnimatePresence>
                    {audioFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 bg-white rounded-3xl text-slate-900 shadow-xl border-t-8 border-rdc-yellow"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-rdc-yellow p-2 rounded-xl">
                            <Star className="w-5 h-5 text-white fill-current" />
                          </div>
                          <h4 className="text-xl font-black tracking-tight">Analyse de votre prononciation</h4>
                        </div>
                        <div className="prose prose-slate max-w-none font-medium text-slate-600 leading-relaxed">
                          {typeof audioFeedback === 'string' ? (
                            audioFeedback
                          ) : (
                            <div className="space-y-6">
                              <p className="text-lg text-slate-800 font-bold italic">"{audioFeedback.summary}"</p>
                              
                              {audioFeedback.transcription && (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Transcription</p>
                                  <p className="text-slate-900 font-bold">"{audioFeedback.transcription}"</p>
                                </div>
                              )}

                              {audioFeedback.score !== undefined && (
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${audioFeedback.score}%` }}
                                      className={cn(
                                        "h-full rounded-full",
                                        audioFeedback.score >= 80 ? "bg-green-500" : audioFeedback.score >= 50 ? "bg-rdc-yellow" : "bg-rdc-red"
                                      )}
                                    />
                                  </div>
                                  <span className="font-black text-slate-900">{audioFeedback.score}%</span>
                                </div>
                              )}

                              {audioFeedback.detailedFeedback && audioFeedback.detailedFeedback.length > 0 && (
                                <div className="space-y-4">
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Analyse détaillée</p>
                                  <div className="grid grid-cols-1 gap-3">
                                    {audioFeedback.detailedFeedback.map((item: any, i: number) => (
                                      <div key={i} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-black text-rdc-blue">{item.word || item.phoneme}</span>
                                          <span className="text-xs font-bold text-slate-400">({item.issue})</span>
                                        </div>
                                        <p className="text-sm text-slate-600 italic">{item.tip}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            </div>

            <div className="space-y-10">
              {/* Phrases */}
              <section className="bg-white p-10 rounded-3xl border-t-8 border-rdc-yellow shadow-xl">
                <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Phrases Essentielles</h3>
                <div className="space-y-6">
                  {lesson.phrases?.map((item, idx) => (
                    <div key={idx} className="border-l-4 border-rdc-blue pl-6 py-3 bg-slate-50 rounded-r-2xl flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-slate-900 text-lg">{item.phrase}</p>
                        <p className="text-sm font-bold text-rdc-blue uppercase tracking-widest mt-1">{item.translation}</p>
                      </div>
                      <button 
                        onClick={() => speak(item.phrase)}
                        className="p-2 text-slate-400 hover:text-rdc-blue transition-all"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quiz */}
              <section className="bg-white p-10 rounded-3xl border border-slate-100 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="bg-rdc-yellow p-2 rounded-xl">
                      <Star className="w-6 h-6 text-white fill-current" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Petit Quiz</h3>
                  </div>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {Object.keys(quizAnswers).length} / {lesson.quiz?.length}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full mb-10 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(Object.keys(quizAnswers).length / (lesson.quiz?.length || 1)) * 100}%` }}
                    className="h-full bg-rdc-yellow"
                  />
                </div>

                <div className="space-y-10">
                  {lesson.quiz?.map((q, qIdx) => (
                    <div key={qIdx} className="space-y-5">
                      <p className="font-bold text-slate-800 text-lg leading-snug">{q.question}</p>
                      <div className="space-y-3">
                        {q.options?.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            disabled={showResults}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }))}
                            className={cn(
                              "w-full text-left p-4 rounded-2xl text-sm font-bold transition-all border-2",
                              quizAnswers[qIdx] === oIdx 
                                ? "bg-rdc-blue text-white border-rdc-blue shadow-lg shadow-blue-100" 
                                : "bg-slate-50 text-slate-600 border-transparent hover:border-slate-200",
                              showResults && oIdx === q.correctAnswer && "bg-green-500 text-white border-green-500",
                              showResults && quizAnswers[qIdx] === oIdx && oIdx !== q.correctAnswer && "bg-rdc-red text-white border-rdc-red"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {!showResults ? (
                    <div className="space-y-4">
                      <button
                        onClick={handleFinishLesson}
                        disabled={Object.keys(quizAnswers).length < (lesson.quiz?.length || 0)}
                        className="w-full py-5 bg-rdc-blue text-white rounded-2xl font-black text-lg hover:bg-blue-600 disabled:opacity-50 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest"
                      >
                        Vérifier
                      </button>
                      {!user && (
                        <div className="p-4 bg-yellow-50 border border-rdc-yellow/20 rounded-2xl flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-rdc-yellow" />
                          <p className="text-xs font-bold text-slate-600">
                            <button onClick={login} className="text-rdc-blue underline">Connectez-vous</button> pour sauvegarder votre progression !
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-green-50 rounded-3xl border-2 border-green-100">
                      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <p className="text-2xl font-black text-green-800 tracking-tight">Leçon terminée !</p>
                      <p className="text-lg font-bold text-green-600 mt-1">Félicitations ! +20 XP ★</p>
                      <button
                        onClick={() => setLesson(null)}
                        className="mt-6 w-full py-4 bg-white border-2 border-green-200 text-green-700 rounded-2xl font-black hover:bg-green-100 transition-all"
                      >
                        Continuer l'apprentissage
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
