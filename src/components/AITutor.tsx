import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Send, Bot, User, Loader2, Volume2, VolumeX, Play, Mic, Square, Star, Share2, Palette, ArrowLeft, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import { getAIResponse, generateSpeech, getPronunciationFeedback } from '../lib/gemini';
import { cn, handleAppError } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isAudio?: boolean;
  pronunciationData?: {
    transcription?: string;
    score?: number;
    detailedFeedback?: Array<{
      word?: string;
      phoneme?: string;
      issue?: string;
      tip?: string;
    }>;
    summary?: string;
  };
}

type ThemeColor = 'rdc' | 'ocean' | 'forest' | 'sunset' | 'midnight';

interface Theme {
  id: ThemeColor;
  name: string;
  header: string;
  accent: string;
  userBubble: string;
  botIcon: string;
  userIcon: string;
  star: string;
}

const THEMES: Theme[] = [
  { 
    id: 'rdc', 
    name: 'RDC (Défaut)', 
    header: 'bg-rdc-blue', 
    accent: 'bg-rdc-yellow', 
    userBubble: 'bg-rdc-red',
    botIcon: 'bg-rdc-blue',
    userIcon: 'bg-rdc-red',
    star: 'text-rdc-blue'
  },
  { 
    id: 'ocean', 
    name: 'Océan', 
    header: 'bg-blue-900', 
    accent: 'bg-cyan-400', 
    userBubble: 'bg-teal-600',
    botIcon: 'bg-blue-900',
    userIcon: 'bg-teal-600',
    star: 'text-blue-900'
  },
  { 
    id: 'forest', 
    name: 'Forêt', 
    header: 'bg-emerald-900', 
    accent: 'bg-lime-400', 
    userBubble: 'bg-green-700',
    botIcon: 'bg-emerald-900',
    userIcon: 'bg-green-700',
    star: 'text-emerald-900'
  },
  { 
    id: 'sunset', 
    name: 'Coucher de soleil', 
    header: 'bg-purple-900', 
    accent: 'bg-pink-400', 
    userBubble: 'bg-orange-600',
    botIcon: 'bg-purple-900',
    userIcon: 'bg-orange-600',
    star: 'text-purple-900'
  },
  { 
    id: 'midnight', 
    name: 'Minuit', 
    header: 'bg-slate-950', 
    accent: 'bg-violet-500', 
    userBubble: 'bg-indigo-700',
    botIcon: 'bg-slate-950',
    userIcon: 'bg-indigo-700',
    star: 'text-slate-950'
  }
];

export function AITutor() {
  const navigate = useNavigate();
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'assistant', content: "Bonjour ! Je suis votre tuteur LotaSpeak. Comment puis-je vous aider aujourd'hui ? Je peux pratiquer le français, l'anglais, ou même des langues nationales comme le Lingala et le Swahili avec vous !" }
  ]);
  const [input, setInput] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = React.useState(false);
  const [autoPlay, setAutoPlay] = React.useState(true);
  const [selectedVoice, setSelectedVoice] = React.useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>(() => 
    (localStorage.getItem('preferred-voice') as any) || 'Kore'
  );
  const [showVoiceSettings, setShowVoiceSettings] = React.useState(false);
  const [useUserVoice, setUseUserVoice] = React.useState(false);
  const [userRecordings, setUserRecordings] = React.useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('user-recordings');
    return saved ? JSON.parse(saved) : {};
  });
  const [isRecording, setIsRecording] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState<Theme>(() => {
    const saved = localStorage.getItem('aitutor-theme');
    if (saved) {
      const found = THEMES.find(t => t.id === saved);
      if (found) return found;
    }
    return THEMES[0];
  });
  const [showThemeSelector, setShowThemeSelector] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('aitutor-theme', currentTheme.id);
  }, [currentTheme]);

  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleShare = async (text: string, title: string = "Conversation LinguoSpeed") => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: window.location.href
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleAppError(error, "Partage");
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Copié dans le presse-papiers !');
      } catch (error) {
        handleAppError(error, "Copie");
      }
    }
  };

  const shareFullConversation = () => {
    const summary = messages
      .map(m => `${m.role === 'user' ? 'Moi' : 'Tuteur'}: ${m.content}`)
      .join('\n\n');
    handleShare(summary, "Ma conversation avec le Tuteur LotaSpeak");
  };

  const speak = async (text: string, customVoice?: string) => {
    if (isAudioPlaying) return;

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
      console.error('Speech error:', error);
      setIsAudioPlaying(false);
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
          await handleAudioInput(base64Audio, 'audio/webm');
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
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

  const handleAudioInput = async (base64Audio: string, mimeType: string) => {
    setIsLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: "🎤 Message vocal envoyé...", isAudio: true }]);

    try {
      const feedback = await getPronunciationFeedback(base64Audio, mimeType, "French or English");
      
      let assistantMessage = "";
      let pronunciationData = undefined;

      if (typeof feedback === 'string') {
        assistantMessage = feedback;
      } else if (feedback && typeof feedback === 'object') {
        pronunciationData = feedback;
        const { transcription, score, detailedFeedback, summary } = feedback;
        
        assistantMessage = `${summary || ""}\n\n`;
        if (transcription) assistantMessage += `📝 Transcription : "${transcription}"\n`;
        if (score !== undefined) assistantMessage += `🎯 Score : ${score}/100\n`;
        
        if (detailedFeedback && Array.isArray(detailedFeedback) && detailedFeedback.length > 0) {
          assistantMessage += `\n🔍 Analyse détaillée :\n`;
          detailedFeedback.forEach((item: any) => {
            assistantMessage += `• ${item.word || item.phoneme} : ${item.issue || ""} (${item.tip || ""})\n`;
          });
        }
      } else {
        assistantMessage = "Désolé, j'ai rencontré un problème avec l'analyse audio.";
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: assistantMessage,
        pronunciationData 
      }]);
      
      if (autoPlay) {
        speak(assistantMessage);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur lors de l'analyse de votre prononciation." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const systemPrompt = `You are a friendly and encouraging language tutor for LotaSpeak. 
      You specialize in French, English, and Congolese national languages (Lingala, Swahili, Kikongo, Tshiluba). 
      Help the user practice, correct their mistakes gently, and explain grammar if needed. 
      Adapt your level to the user's proficiency. 
      If the user is practicing a Congolese language, incorporate cultural context from the Democratic Republic of Congo.
      Always respond in the language the user is practicing, or both if they are a beginner.`;
      const response = await getAIResponse(userMessage, systemPrompt);
      const assistantMessage = response || "Désolé, j'ai rencontré un problème.";
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      
      if (autoPlay) {
        speak(assistantMessage);
      }
    } catch (error) {
      handleAppError(error, "AI Tutor");
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion avec l'IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 md:py-8 h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] flex flex-col">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <div className={cn(
          "p-6 border-b-4 flex items-center justify-between text-white relative overflow-hidden transition-colors duration-500",
          currentTheme.header,
          currentTheme.id === 'rdc' ? 'border-rdc-yellow' : 'border-white/20'
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-2xl transition-colors duration-500",
            currentTheme.accent,
            "opacity-20"
          )} />
          <div className="flex items-center gap-4 relative z-10">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-blue-100 hover:text-white"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-xl shadow-lg transition-colors duration-500", currentTheme.accent)}>
                <Star className={cn("w-6 h-6 fill-current animate-pulse transition-colors duration-500", currentTheme.star)} />
              </div>
              <div>
                <h2 className="font-black tracking-tight text-lg">Tuteur IA Personnel</h2>
                <span className="text-[10px] text-blue-100 flex items-center gap-1 font-bold uppercase tracking-widest">
                  <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse transition-colors duration-500", currentTheme.accent)} />
                  {currentTheme.name}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <div className="relative">
              <button 
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-blue-100 hover:text-white"
                title="Changer le thème"
              >
                <Palette className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showThemeSelector && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50"
                  >
                    <div className="grid grid-cols-1 gap-1">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setCurrentTheme(t);
                            setShowThemeSelector(false);
                            toast.success(`Thème ${t.name} activé !`);
                          }}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-xl transition-all text-left",
                            currentTheme.id === t.id ? "bg-slate-50" : "hover:bg-slate-50/50"
                          )}
                        >
                          <div className={cn("w-4 h-4 rounded-full shadow-inner", t.header)} />
                          <span className={cn(
                            "text-xs font-bold",
                            currentTheme.id === t.id ? "text-slate-900" : "text-slate-500"
                          )}>
                            {t.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={shareFullConversation}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-blue-100 hover:text-white"
              title="Partager la conversation"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-blue-100 hover:text-white"
                title="Paramètres de voix"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showVoiceSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50 text-slate-900"
                  >
                    <h4 className="text-sm font-black uppercase tracking-widest mb-4">Voix du Tuteur</h4>
                    
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setAutoPlay(!autoPlay)}
              className={cn(
                "p-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-wider",
                autoPlay ? cn("text-slate-900 shadow-lg", currentTheme.accent) : "text-blue-100 bg-white/10 hover:bg-white/20"
              )}
            >
              {autoPlay ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {autoPlay ? "Audio On" : "Muet"}
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-slate-50/30"
        >
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-colors duration-500",
                msg.role === 'user' ? currentTheme.userIcon : currentTheme.botIcon,
                "text-white"
              )}>
                {msg.role === 'user' ? <User className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
              </div>
              <div className="flex flex-col gap-2">
                <div className={cn(
                  "p-5 rounded-2xl text-sm font-medium leading-relaxed relative group shadow-sm transition-colors duration-500",
                  msg.role === 'user' 
                    ? cn("text-white rounded-tr-none", currentTheme.userBubble) 
                    : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                )}>
                  {msg.pronunciationData ? (
                    <div className="space-y-4">
                      <p className="font-bold text-slate-800 italic">"{msg.pronunciationData.summary}"</p>
                      
                      {msg.pronunciationData.transcription && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transcription</p>
                          <p className="text-slate-900 font-bold">"{msg.pronunciationData.transcription}"</p>
                        </div>
                      )}

                      {msg.pronunciationData.score !== undefined && (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                msg.pronunciationData.score >= 80 ? "bg-green-500" : msg.pronunciationData.score >= 50 ? "bg-rdc-yellow" : "bg-rdc-red"
                              )}
                              style={{ width: `${msg.pronunciationData.score}%` }}
                            />
                          </div>
                          <span className="font-black text-slate-900 text-xs">{msg.pronunciationData.score}%</span>
                        </div>
                      )}

                      {msg.pronunciationData.detailedFeedback && msg.pronunciationData.detailedFeedback.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points à améliorer</p>
                          <div className="grid grid-cols-1 gap-2">
                            {msg.pronunciationData.detailedFeedback.map((item: any, i: number) => (
                              <div key={i} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-black text-rdc-blue text-xs">{item.word || item.phoneme}</span>
                                  <span className="text-[10px] font-bold text-slate-400">({item.issue})</span>
                                </div>
                                <p className="text-[11px] text-slate-600 italic leading-tight">{item.tip}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
                  <div className="absolute -right-10 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {msg.role === 'assistant' && (
                      <button
                        onClick={() => speak(msg.content)}
                        disabled={isAudioPlaying}
                        className={cn("p-2 hover:opacity-80 disabled:opacity-30 transition-colors duration-500", currentTheme.star)}
                        title="Écouter"
                      >
                        <Play className="w-5 h-5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => handleShare(msg.content, "Message de LotaSpeak")}
                      className="p-2 text-slate-400 hover:text-slate-600"
                      title="Partager ce message"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4 mr-auto">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-colors duration-500", currentTheme.botIcon)}>
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div className="bg-white p-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
                <Loader2 className={cn("w-5 h-5 animate-spin transition-colors duration-500", currentTheme.star)} />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              "Apprends-moi les bases",
              "Pratique de l'oral",
              "Corrige mon texte",
              "Traduis en Lingala",
              "Explique la grammaire"
            ].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="relative flex items-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "p-4 rounded-2xl transition-all shadow-lg",
                isRecording 
                  ? cn("text-white animate-pulse", currentTheme.userBubble) 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-slate-100"
              )}
              title={isRecording ? "Arrêter l'enregistrement" : "Pratiquer la prononciation"}
            >
              {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez une question ou pratiquez une phrase..."
              className={cn(
                "flex-1 bg-slate-50 border-2 border-transparent rounded-2xl py-4 px-6 focus:bg-white outline-none transition-all text-sm font-medium",
                currentTheme.id === 'rdc' ? "focus:border-rdc-blue" : "focus:border-slate-300"
              )}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={cn(
                "text-white p-4 rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100",
                currentTheme.botIcon
              )}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {isRecording && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "text-xs mt-3 font-black uppercase tracking-widest flex items-center gap-2",
                currentTheme.id === 'rdc' ? "text-rdc-red" : currentTheme.star
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full animate-ping",
                currentTheme.id === 'rdc' ? "bg-rdc-red" : currentTheme.accent
              )} />
              Enregistrement en cours...
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}


