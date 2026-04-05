import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Zap, Trophy, Star } from 'lucide-react';
import { generatePlacementTest } from '../lib/gemini';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { useFirebase } from '../contexts/FirebaseContext';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
}

export function PlacementTest() {
  const navigate = useNavigate();
  const { user } = useFirebase();
  const [language, setLanguage] = React.useState('French');
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, number>>({});
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState<'select' | 'test' | 'result'>('select');
  const [result, setResult] = React.useState<string>('');

  const startTest = async () => {
    setLoading(true);
    try {
      const data = await generatePlacementTest(language);
      if (data && data.questions) {
        setQuestions(data.questions);
        setStep('test');
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la génération du test.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    let score = 0;
    let beginnerCorrect = 0;
    let intermediateCorrect = 0;
    let advancedCorrect = 0;

    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        score++;
        if (q.difficulty === 'beginner') beginnerCorrect++;
        if (q.difficulty === 'intermediate') intermediateCorrect++;
        if (q.difficulty === 'advanced') advancedCorrect++;
      }
    });

    let level = 'Beginner';
    if (score >= 8) level = 'Advanced';
    else if (score >= 5) level = 'Intermediate';

    setResult(level);
    setStep('result');
    
    // Save level to profile if user exists
    if (user) {
      localStorage.setItem(`level-${language}-${user.uid}`, level);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-8"
          >
            <div className="bg-rdc-blue p-6 rounded-3xl text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rdc-yellow/20 rounded-full -mr-16 -mt-16 blur-2xl" />
              <Zap className="w-12 h-12 text-rdc-yellow mx-auto mb-4 animate-pulse" />
              <h1 className="text-4xl font-black mb-2">Évaluation de Niveau</h1>
              <p className="text-blue-100 font-medium">Découvrez votre niveau actuel pour des leçons personnalisées.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {['French', 'English', 'Lingala', 'Swahili', 'Kikongo', 'Tshiluba'].map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    "p-6 rounded-2xl font-black transition-all border-2",
                    language === lang 
                      ? "bg-rdc-blue text-white border-rdc-blue shadow-lg scale-105" 
                      : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              onClick={startTest}
              disabled={loading}
              className="w-full py-4 bg-rdc-yellow text-rdc-blue rounded-2xl font-black text-lg shadow-xl shadow-yellow-100 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Commencer le Test"}
            </button>
          </motion.div>
        )}

        {step === 'test' && (
          <motion.div
            key="test"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden mr-4">
                <motion.div 
                  className="h-full bg-rdc-blue"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Question {currentIdx + 1}/{questions.length}
              </span>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
              <h2 className="text-2xl font-black text-slate-900 mb-8">{questions[currentIdx].question}</h2>
              <div className="grid grid-cols-1 gap-4">
                {questions[currentIdx].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="w-full p-6 text-left bg-slate-50 hover:bg-blue-50 border-2 border-transparent hover:border-rdc-blue rounded-2xl font-bold text-slate-700 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      <div className="w-6 h-6 rounded-full border-2 border-slate-200 group-hover:border-rdc-blue flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-rdc-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8"
          >
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-rdc-yellow" />
              <div className="bg-rdc-blue/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-12 h-12 text-rdc-blue" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Test Terminé !</h2>
              <p className="text-slate-500 font-medium mb-8">Votre niveau estimé en {language} est :</p>
              
              <div className="inline-block px-12 py-6 bg-rdc-blue text-white rounded-3xl shadow-xl shadow-blue-100 mb-8">
                <span className="text-5xl font-black tracking-tighter">{result}</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => navigate(`/lessons?lang=${language}`)}
                  className="w-full py-4 bg-rdc-yellow text-rdc-blue rounded-2xl font-black shadow-lg hover:scale-105 transition-all"
                >
                  Commencer mes leçons
                </button>
                <button
                  onClick={() => setStep('select')}
                  className="w-full py-4 text-slate-500 font-black hover:text-rdc-blue transition-all"
                >
                  Repasser le test
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
