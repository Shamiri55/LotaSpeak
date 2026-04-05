import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, Phone, Video, Search, UserPlus, Share2, ArrowLeft, Star, Send, Mic, Image as ImageIcon, Smile } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';
import { useFirebase } from '../contexts/FirebaseContext';

interface Friend {
  id: string;
  name: string;
  status: 'online' | 'offline';
  avatar: string;
  lastMessage?: string;
  unread?: number;
}

export function Social() {
  const navigate = useNavigate();
  const { user } = useFirebase();
  const [activeFriend, setActiveFriend] = React.useState<Friend | null>(null);
  const [message, setMessage] = React.useState('');
  const [isCalling, setIsCalling] = React.useState(false);
  const [callType, setCallType] = React.useState<'audio' | 'video'>('audio');

  const friends: Friend[] = [
    { id: '1', name: 'Jean Dupont', status: 'online', avatar: 'https://picsum.photos/seed/jean/200/200', lastMessage: 'Mbote! Comment ça va?', unread: 2 },
    { id: '2', name: 'Marie Kabila', status: 'offline', avatar: 'https://picsum.photos/seed/marie/200/200', lastMessage: 'À demain pour la leçon.' },
    { id: '3', name: 'Exaucé Swalehe', status: 'online', avatar: 'https://picsum.photos/seed/exauce/200/200', lastMessage: 'LotaSpeak est génial!' },
  ];

  const handleInvite = () => {
    const inviteLink = `${window.location.origin}/join?ref=${user?.uid || 'guest'}`;
    navigator.clipboard.writeText(inviteLink);
    toast.success('Lien d\'invitation copié ! Partagez-le avec vos amis.');
  };

  const startCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setIsCalling(true);
    toast.success(`Appel ${type === 'audio' ? 'vocal' : 'vidéo'} en cours...`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="bg-rdc-yellow p-4 rounded-3xl shadow-xl shadow-yellow-100">
            <Users className="w-10 h-10 text-rdc-blue" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Espace Social</h1>
            <p className="text-slate-500 font-medium">Pratiquez avec vos amis et progressez ensemble.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleInvite}
            className="flex items-center gap-2 px-6 py-3 bg-rdc-blue text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-blue-100"
          >
            <UserPlus className="w-4 h-4" />
            Inviter des Amis
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden flex">
        {/* Sidebar */}
        <div className="w-full md:w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
          <div className="p-6 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un ami..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-rdc-blue transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {friends.map(friend => (
              <button
                key={friend.id}
                onClick={() => setActiveFriend(friend)}
                className={cn(
                  "w-full p-4 rounded-2xl flex items-center gap-4 transition-all group relative",
                  activeFriend?.id === friend.id ? "bg-white shadow-lg border border-slate-100" : "hover:bg-white/50"
                )}
              >
                <div className="relative">
                  <img src={friend.avatar} alt={friend.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white shadow-sm",
                    friend.status === 'online' ? "bg-green-500" : "bg-slate-300"
                  )} />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-black text-slate-900 text-sm">{friend.name}</p>
                    {friend.unread && (
                      <span className="bg-rdc-red text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {friend.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium truncate">{friend.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white relative">
          {activeFriend ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <img src={activeFriend.avatar} alt={activeFriend.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                  <div>
                    <h2 className="font-black text-slate-900">{activeFriend.name}</h2>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">En ligne</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startCall('audio')} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-rdc-blue hover:text-white transition-all shadow-sm">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button onClick={() => startCall('video')} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-rdc-blue hover:text-white transition-all shadow-sm">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all shadow-sm">
                    <Star className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                <div className="flex justify-center">
                  <span className="px-4 py-1 bg-white rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm border border-slate-100">
                    Aujourd'hui
                  </span>
                </div>
                
                <div className="flex gap-4 max-w-[80%]">
                  <img src={activeFriend.avatar} alt={activeFriend.name} className="w-8 h-8 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">
                      Mbote! Comment ça va aujourd'hui? Prêt pour notre session de Lingala? 🇨🇩
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 mt-2 block">10:45</span>
                  </div>
                </div>

                <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
                  <div className="bg-rdc-blue p-4 rounded-2xl rounded-tr-none shadow-lg shadow-blue-100 text-white">
                    <p className="text-sm font-medium leading-relaxed">
                      Mbote na yo! Oui, je suis prêt. J'ai hâte de pratiquer les salutations.
                    </p>
                    <span className="text-[10px] font-bold text-blue-100 mt-2 block text-right">10:46</span>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <button className="p-3 text-slate-400 hover:text-rdc-blue transition-all">
                    <ImageIcon className="w-6 h-6" />
                  </button>
                  <button className="p-3 text-slate-400 hover:text-rdc-blue transition-all">
                    <Mic className="w-6 h-6" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="w-full pl-6 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-rdc-blue rounded-2xl font-bold outline-none transition-all"
                    />
                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rdc-blue transition-all">
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                  <button className="p-4 bg-rdc-blue text-white rounded-2xl shadow-lg shadow-blue-100 hover:scale-105 transition-all">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
              <div className="bg-slate-50 w-32 h-32 rounded-full flex items-center justify-center shadow-inner">
                <MessageSquare className="w-16 h-16 text-slate-200" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Sélectionnez une conversation</h3>
                <p className="text-slate-500 font-medium max-w-sm">
                  Choisissez un ami dans la liste pour commencer à discuter et pratiquer ensemble.
                </p>
              </div>
              <button
                onClick={handleInvite}
                className="px-8 py-3 bg-rdc-yellow text-rdc-blue rounded-2xl font-black text-sm shadow-xl shadow-yellow-100 hover:scale-105 transition-all"
              >
                Trouver de nouveaux amis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Call Overlay */}
      <AnimatePresence>
        {isCalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-rdc-blue/95 backdrop-blur-xl flex flex-col items-center justify-center text-white"
          >
            <div className="relative mb-12">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-white/20 rounded-full blur-2xl"
              />
              <img src={activeFriend?.avatar} alt="Calling" className="w-48 h-48 rounded-[3rem] object-cover shadow-2xl relative z-10 border-4 border-white/20" referrerPolicy="no-referrer" />
            </div>
            
            <h2 className="text-4xl font-black mb-2">{activeFriend?.name}</h2>
            <p className="text-blue-100 font-bold uppercase tracking-[0.3em] mb-12 animate-pulse">
              Appel {callType === 'audio' ? 'vocal' : 'vidéo'}...
            </p>

            <div className="flex items-center gap-8">
              <button className="p-6 bg-white/10 hover:bg-white/20 rounded-3xl transition-all">
                <Mic className="w-8 h-8" />
              </button>
              <button 
                onClick={() => setIsCalling(false)}
                className="p-8 bg-rdc-red rounded-full shadow-2xl shadow-red-500/40 hover:scale-110 transition-all"
              >
                <Phone className="w-10 h-10 rotate-[135deg] fill-current" />
              </button>
              <button className="p-6 bg-white/10 hover:bg-white/20 rounded-3xl transition-all">
                <Video className="w-8 h-8" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
