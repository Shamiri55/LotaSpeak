import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Languages, Book, Search, ArrowRightLeft, Loader2, Volume2, Star, Copy, Check, ArrowLeft, FileText, AlertCircle, Zap } from 'lucide-react';
import { translateText, getDictionaryEntry, generateSpeech, analyzeText } from '../lib/gemini';
import { cn, handleAppError } from '../lib/utils';
import { toast } from 'react-hot-toast';

export function Tools() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'translator' | 'dictionary' | 'grammar'>('translator');
  const [inputText, setInputText] = React.useState('');
  const [translatedText, setTranslatedText] = React.useState('');
  const [fromLang, setFromLang] = React.useState('French');
  const [toLang, setToLang] = React.useState('English');
  const [isLoading, setIsLoading] = React.useState(false);
  const [dictionaryEntry, setDictionaryEntry] = React.useState<any>(null);
  const [grammarResult, setGrammarResult] = React.useState<any>(null);
  const [searchType, setSearchType] = React.useState<'word' | 'semantic'>('word');
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const audioContextRef = React.useRef<AudioContext | null>(null);

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

  const handleTranslate = async () => {
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await translateText(inputText, fromLang, toLang);
      setTranslatedText(result || '');
    } catch (error) {
      handleAppError(error, "Traducteur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setIsCopied(true);
      toast.success('Texte copié !');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      handleAppError(error, "Copie");
    }
  };

  const handleDictionarySearch = async () => {
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await getDictionaryEntry(inputText, fromLang, searchType);
      setDictionaryEntry(result);
    } catch (error) {
      handleAppError(error, "Dictionnaire");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrammarCheck = async () => {
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await analyzeText(inputText, fromLang);
      setGrammarResult(result);
    } catch (error) {
      handleAppError(error, "Analyse de texte");
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const speak = async (text: string) => {
    if (isAudioPlaying || !text) return;
    setIsAudioPlaying(true);
    try {
      const base64Audio = await generateSpeech(text);
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
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
      <header className="mb-12 relative overflow-hidden bg-rdc-blue rounded-3xl p-6 md:p-10 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rdc-yellow/20 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rdc-red/20 rounded-full -ml-32 -mb-32 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-rdc-yellow p-3 rounded-2xl shadow-lg">
              <Languages className="w-8 h-8 text-rdc-blue" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Outils Linguistiques</h1>
          </div>
          <p className="text-xl text-blue-50 font-medium max-w-2xl">
            Traduisez vos textes et explorez le dictionnaire pour enrichir votre vocabulaire.
          </p>
        </div>
      </header>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('translator')}
          className={cn(
            "flex-1 py-4 px-6 rounded-2xl font-black transition-all flex items-center justify-center gap-2",
            activeTab === 'translator' 
              ? "bg-rdc-blue text-white shadow-lg shadow-blue-100" 
              : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
          )}
        >
          <Languages className="w-5 h-5" />
          Traducteur
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={cn(
            "flex-1 py-4 px-6 rounded-2xl font-black transition-all flex items-center justify-center gap-2",
            activeTab === 'dictionary' 
              ? "bg-rdc-blue text-white shadow-lg shadow-blue-100" 
              : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
          )}
        >
          <Book className="w-5 h-5" />
          Dictionnaire
        </button>
        <button
          onClick={() => setActiveTab('grammar')}
          className={cn(
            "flex-1 py-4 px-6 rounded-2xl font-black transition-all flex items-center justify-center gap-2",
            activeTab === 'grammar' 
              ? "bg-rdc-blue text-white shadow-lg shadow-blue-100" 
              : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
          )}
        >
          <FileText className="w-5 h-5" />
          Grammaire
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'translator' ? (
          <motion.div
            key="translator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-4">
              <select
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
                className="bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-rdc-blue transition-all"
              >
                <option value="French">Français 🇫🇷</option>
                <option value="English">Anglais 🇬🇧</option>
              </select>
              
              <button 
                onClick={swapLanguages}
                className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-all text-slate-600"
              >
                <ArrowRightLeft className="w-6 h-6" />
              </button>

              <select
                value={toLang}
                onChange={(e) => setToLang(e.target.value)}
                className="bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-rdc-blue transition-all"
              >
                <option value="English">Anglais 🇬🇧</option>
                <option value="French">Français 🇫🇷</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Entrez le texte à traduire..."
                  className="w-full h-64 bg-white border-2 border-slate-100 rounded-3xl p-8 font-medium text-slate-800 outline-none focus:border-rdc-blue transition-all resize-none shadow-sm"
                />
                <div className="absolute bottom-6 right-6 flex gap-2">
                  <button 
                    onClick={() => speak(inputText)}
                    className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-rdc-blue transition-all"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="w-full h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 font-medium text-slate-800 overflow-y-auto shadow-inner">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-8 h-8 animate-spin text-rdc-blue" />
                    </div>
                  ) : (
                    translatedText || <span className="text-slate-400 italic">La traduction apparaîtra ici...</span>
                  )}
                </div>
                <div className="absolute bottom-6 right-6 flex gap-2">
                  <button 
                    onClick={handleCopy}
                    disabled={!translatedText || isLoading}
                    className={cn(
                      "p-3 rounded-xl transition-all shadow-sm disabled:opacity-30",
                      isCopied ? "bg-green-50 text-green-600" : "bg-white text-slate-400 hover:text-rdc-blue"
                    )}
                    title="Copier le texte"
                  >
                    {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => speak(translatedText)}
                    disabled={!translatedText || isLoading}
                    className="p-3 bg-white rounded-xl text-slate-400 hover:text-rdc-blue transition-all shadow-sm disabled:opacity-30"
                    title="Écouter la traduction"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleTranslate}
              disabled={!inputText.trim() || isLoading}
              className="w-full py-5 bg-rdc-blue text-white rounded-2xl font-black text-xl hover:bg-blue-600 disabled:opacity-50 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest"
            >
              Traduire
            </button>
          </motion.div>
        ) : activeTab === 'grammar' ? (
          <motion.div
            key="grammar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col gap-6">
              <select
                value={fromLang}
                onChange={(e) => setFromLang(e.target.value)}
                className="bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-rdc-blue transition-all w-fit"
              >
                <option value="French">Français 🇫🇷</option>
                <option value="English">Anglais 🇬🇧</option>
              </select>

              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Entrez votre texte pour vérifier la grammaire..."
                  className="w-full h-48 bg-white border-2 border-slate-100 rounded-3xl p-8 font-medium text-slate-800 outline-none focus:border-rdc-blue transition-all resize-none shadow-sm"
                />
              </div>

              <button
                onClick={handleGrammarCheck}
                disabled={!inputText.trim() || isLoading}
                className="w-full py-5 bg-rdc-blue text-white rounded-2xl font-black text-xl hover:bg-blue-600 disabled:opacity-50 transition-all shadow-xl shadow-blue-100 uppercase tracking-widest"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Analyser le Texte"}
              </button>
            </div>

            {grammarResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-slate-900">Texte Corrigé</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Score :</span>
                      <span className={cn(
                        "text-2xl font-black",
                        grammarResult.score >= 80 ? "text-green-500" : grammarResult.score >= 50 ? "text-rdc-yellow" : "text-rdc-red"
                      )}>
                        {grammarResult.score}%
                      </span>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 text-lg font-medium text-slate-800 leading-relaxed">
                    {grammarResult.correctedText}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => speak(grammarResult.correctedText)}
                      className="p-3 bg-rdc-blue text-white rounded-xl shadow-lg shadow-blue-100 hover:scale-110 transition-all"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {grammarResult.logicalAnalysis && (
                    <div className="bg-white p-8 rounded-3xl border-t-8 border-rdc-blue shadow-xl">
                      <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                        <Zap className="w-6 h-6 text-rdc-blue" />
                        Analyse Logique
                      </h3>
                      <p className="text-slate-600 font-medium leading-relaxed">
                        {grammarResult.logicalAnalysis}
                      </p>
                    </div>
                  )}

                  {grammarResult.grammaticalAnalysis && (
                    <div className="bg-white p-8 rounded-3xl border-t-8 border-rdc-red shadow-xl">
                      <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                        <Book className="w-6 h-6 text-rdc-red" />
                        Analyse Grammaticale
                      </h3>
                      <p className="text-slate-600 font-medium leading-relaxed">
                        {grammarResult.grammaticalAnalysis}
                      </p>
                    </div>
                  )}
                </div>

                {grammarResult.errors && grammarResult.errors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-rdc-red" />
                      Détails des Erreurs
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {grammarResult.errors.map((err: any, i: number) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-3">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                              err.type === 'spelling' ? "bg-orange-100 text-orange-600" : 
                              err.type === 'grammar' ? "bg-red-100 text-rdc-red" : "bg-blue-100 text-rdc-blue"
                            )}>
                              {err.type || 'Erreur'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 mb-3">
                            <div className="px-3 py-1 bg-red-50 text-rdc-red rounded-lg text-xs font-bold line-through">
                              {err.original}
                            </div>
                            <div className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold">
                              {err.correction}
                            </div>
                          </div>
                          <p className="text-slate-600 font-medium text-sm">
                            {err.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dictionary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="flex flex-col gap-6">
              <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                <button
                  onClick={() => setSearchType('word')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    searchType === 'word' ? "bg-white text-rdc-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Mot
                </button>
                <button
                  onClick={() => setSearchType('semantic')}
                  className={cn(
                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    searchType === 'semantic' ? "bg-white text-rdc-blue shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Définition / Exemple
                </button>
              </div>

              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleDictionarySearch()}
                    placeholder={searchType === 'word' ? "Rechercher un mot..." : "Décrivez un mot ou donnez un exemple..."}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl py-5 pl-16 pr-6 font-bold text-slate-800 outline-none focus:border-rdc-blue transition-all shadow-sm"
                  />
                </div>
                <select
                  value={fromLang}
                  onChange={(e) => setFromLang(e.target.value)}
                  className="bg-white border-2 border-slate-100 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:border-rdc-blue transition-all"
                >
                  <option value="French">Français 🇫🇷</option>
                  <option value="English">Anglais 🇬🇧</option>
                </select>
                <button
                  onClick={handleDictionarySearch}
                  disabled={!inputText.trim() || isLoading}
                  className="bg-rdc-blue text-white px-10 rounded-2xl font-black hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Chercher"}
                </button>
              </div>
            </div>

            {dictionaryEntry && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">{dictionaryEntry.word}</h2>
                    <span className="px-4 py-1.5 bg-blue-50 text-rdc-blue rounded-full text-sm font-black uppercase tracking-widest border border-blue-100">
                      {dictionaryEntry.partOfSpeech}
                    </span>
                  </div>
                  <button 
                    onClick={() => speak(dictionaryEntry.word)}
                    className="p-5 bg-rdc-blue text-white rounded-2xl shadow-lg shadow-blue-100 hover:scale-110 transition-all"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <div className="w-2 h-6 bg-rdc-yellow rounded-full" />
                    Définition
                  </h3>
                  <p className="text-lg text-slate-600 font-medium leading-relaxed">
                    {dictionaryEntry.definition}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                      <div className="w-2 h-6 bg-rdc-blue rounded-full" />
                      Exemples
                    </h3>
                    <div className="space-y-3">
                      {dictionaryEntry.examples.map((ex: string, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border-l-4 border-rdc-blue italic font-medium text-slate-700">
                          "{ex}"
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    {dictionaryEntry.synonyms?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Synonymes</h3>
                        <div className="flex flex-wrap gap-2">
                          {dictionaryEntry.synonyms.map((s: string) => (
                            <span key={s} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {dictionaryEntry.antonyms?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Antonymes</h3>
                        <div className="flex flex-wrap gap-2">
                          {dictionaryEntry.antonyms.map((a: string) => (
                            <span key={a} className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
