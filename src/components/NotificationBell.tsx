import React from 'react';
import { Bell, BellOff, Settings, Clock, Calendar, Save, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationService } from '../lib/notifications';
import { toast } from 'react-hot-toast';
import { cn } from '../lib/utils';

export function NotificationBell() {
  const [hasPermission, setHasPermission] = React.useState<boolean>(
    'Notification' in window && Notification.permission === 'granted'
  );
  const [showMenu, setShowMenu] = React.useState(false);
  const [customTime, setCustomTime] = React.useState('09:00');
  const [customDay, setCustomDay] = React.useState('daily');

  const requestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setHasPermission(granted);
    if (granted) {
      NotificationService.sendNotification('Notifications activées !', {
        body: 'Vous recevrez désormais des rappels de pratique.',
      });
    }
  };

  const scheduleReminder = (minutes: number) => {
    NotificationService.scheduleReminder(minutes);
    toast.success(`Rappel programmé dans ${minutes} minutes`);
    setShowMenu(false);
  };

  const scheduleCustomReminder = () => {
    // In a real app, this would use a background worker or server-side scheduling
    // For this demo, we'll simulate it by calculating the delay in minutes
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
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={cn(
          "p-2 rounded-xl transition-all relative group",
          hasPermission ? "text-rdc-blue bg-blue-50" : "text-slate-400 hover:bg-slate-100"
        )}
        title="Notifications et Rappels"
      >
        {hasPermission ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        {!hasPermission && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rdc-red rounded-full border-2 border-white" />
        )}
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 z-50 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-rdc-blue/10 p-2 rounded-xl">
                  <Settings className="w-5 h-5 text-rdc-blue" />
                </div>
                <h3 className="font-black text-slate-900 tracking-tight">Rappels de Pratique</h3>
              </div>

              {!hasPermission ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Activez les notifications pour ne jamais manquer une session d'apprentissage.
                  </p>
                  <button
                    onClick={requestPermission}
                    className="w-full py-3 bg-rdc-blue text-white rounded-xl font-black text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-100"
                  >
                    Activer les Notifications
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rappel Rapide</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '15 min', value: 15 },
                        { label: '1 heure', value: 60 },
                        { label: '4 heures', value: 240 },
                        { label: 'Demain', value: 1440 },
                      ].map((time) => (
                        <button
                          key={time.value}
                          onClick={() => scheduleReminder(time.value)}
                          className="py-2 px-3 bg-slate-50 hover:bg-rdc-blue hover:text-white text-slate-600 rounded-xl text-xs font-bold transition-all border border-slate-100"
                        >
                          {time.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rappel Personnalisé</p>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <select 
                          value={customDay}
                          onChange={(e) => setCustomDay(e.target.value)}
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-rdc-blue"
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
                        <input 
                          type="time" 
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="w-24 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-rdc-blue"
                        />
                      </div>
                      <button
                        onClick={scheduleCustomReminder}
                        className="w-full py-2 bg-rdc-blue text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md shadow-blue-50"
                      >
                        Programmer
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Statut</p>
                    <div className="flex items-center gap-2 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold">Notifications actives</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
