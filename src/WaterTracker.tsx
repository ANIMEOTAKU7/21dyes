import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, Plus, Minus } from 'lucide-react';

const GOAL_ML = 2500; // 2.5 Liters
const GLASS_ML = 250;

interface WaterState {
  startDate: string;
  completed: Record<number, boolean>;
  todayIntake: number;
  lastIntakeDate: string;
  reminderEnabled?: boolean;
  reminderTime?: string;
}

const defaultState = (): WaterState => ({
  startDate: new Date().toDateString(),
  completed: {},
  todayIntake: 0,
  lastIntakeDate: new Date().toDateString(),
  reminderEnabled: false,
  reminderTime: '10:00',
});

export default function WaterTracker() {
  const [state, setState] = useState<WaterState>(() => {
    try {
      const saved = localStorage.getItem('water21');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset today's intake if it's a new day
        if (parsed.lastIntakeDate !== new Date().toDateString()) {
          parsed.todayIntake = 0;
          parsed.lastIntakeDate = new Date().toDateString();
        }
        return { ...defaultState(), ...parsed };
      }
      return defaultState();
    } catch {
      return defaultState();
    }
  });

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('water21', JSON.stringify(state));
  }, [state]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const todayIdx = useMemo(() => {
    const diff = Math.floor((new Date().getTime() - new Date(state.startDate).getTime()) / 86400000);
    return Math.min(Math.max(diff, 0), 20);
  }, [state.startDate]);

  useEffect(() => {
    if (!state.reminderEnabled || !state.reminderTime) return;

    const checkAndNotify = () => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;

      if (currentTime === state.reminderTime) {
        const isDone = !!state.completed[todayIdx];
        const lastNotified = localStorage.getItem('water21_last_notified');
        const todayStr = now.toDateString();

        if (!isDone && lastNotified !== todayStr) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('تذكير شرب الماء!', {
              body: `لا تنسَ شرب الماء اليوم! هدفك 2.5 لتر.`,
            });
            localStorage.setItem('water21_last_notified', todayStr);
          }
        }
      }
    };

    const interval = setInterval(checkAndNotify, 30000);
    return () => clearInterval(interval);
  }, [state.reminderEnabled, state.reminderTime, state.completed, todayIdx]);

  const toggleReminder = async () => {
    if (!state.reminderEnabled) {
      if (!('Notification' in window)) {
        showToast('المتصفح لا يدعم الإشعارات');
        return;
      }
      
      let permission = Notification.permission;
      if (permission !== 'granted' && permission !== 'denied') {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        setState(prev => ({ ...prev, reminderEnabled: true, reminderTime: prev.reminderTime || '10:00' }));
        showToast('تم تفعيل الإشعارات');
      } else {
        showToast('يرجى السماح بالإشعارات من إعدادات المتصفح');
      }
    } else {
      setState(prev => ({ ...prev, reminderEnabled: false }));
      showToast('تم إيقاف الإشعارات');
    }
  };

  const stats = useMemo(() => {
    const doneCount = Object.keys(state.completed).length;
    let maxStreak = 0;
    let curStreak = 0;
    for (let i = 0; i < 21; i++) {
      if (state.completed[i]) {
        curStreak++;
        maxStreak = Math.max(maxStreak, curStreak);
      } else {
        curStreak = 0;
      }
    }

    let currentActiveStreak = 0;
    for (let i = todayIdx; i >= 0; i--) {
      if (state.completed[i]) currentActiveStreak++;
      else break;
    }

    return { doneCount, maxStreak, currentActiveStreak };
  }, [state.completed, todayIdx]);

  const addWater = (amount: number) => {
    setState(prev => {
      const newIntake = Math.max(0, prev.todayIntake + amount);
      const isNowDone = newIntake >= GOAL_ML;
      const wasDone = prev.todayIntake >= GOAL_ML;
      
      const newCompleted = { ...prev.completed };
      if (isNowDone) {
        newCompleted[todayIdx] = true;
      } else {
        delete newCompleted[todayIdx];
      }

      if (isNowDone && !wasDone) {
        showToast(`🎉 أحسنت! لقد وصلت لهدفك اليوم (2.5 لتر)`);
      }

      return {
        ...prev,
        todayIntake: newIntake,
        completed: newCompleted,
        lastIntakeDate: new Date().toDateString()
      };
    });
  };

  const confirmReset = () => {
    if (window.confirm('هل أنت متأكد؟ سيتم حذف كل البيانات وإعادة البدء من اليوم 1.')) {
      setState(defaultState());
      showToast('🔄 تم إعادة التحدي!');
    }
  };

  const pct = Math.round((stats.doneCount / 21) * 100);
  const todayPct = Math.min(100, Math.round((state.todayIntake / GOAL_ML) * 100));
  const isTodayDone = !!state.completed[todayIdx];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] font-sans p-4 sm:p-8 pb-32" dir="rtl">
      <div className="max-w-[480px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-8 sm:mb-10">
          <div className="flex items-center justify-between">
            <div className="text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-[#60a5fa] border border-[#60a5fa] px-2 py-0.5 rounded-sm flex items-center gap-1">
              <Droplet size={12} /> تحدي الماء
            </div>
            <div className="text-xs sm:text-[13px] text-[#999]">
              سلسلة: <span className="text-[#60a5fa] font-bold">{stats.currentActiveStreak}</span> يوم
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-bold leading-tight tracking-tight text-[#f0f0f0] mt-1">
            ترطيب <em className="text-[#60a5fa] not-italic">21 يوم</em>
          </h1>
          <p className="text-xs sm:text-[13px] text-[#555] mt-1">
            2.5 لتر يومياً — الهدف: صحة أفضل ونشاط دائم
          </p>
        </div>

        {/* Progress Bar (Overall) */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between text-[11px] sm:text-xs text-[#555] mb-2">
            <span>{stats.doneCount} يوم مكتمل</span>
            <span>{21 - stats.doneCount} متبقي</span>
          </div>
          <div className="h-1.5 sm:h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#60a5fa] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-8 sm:mb-9">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl sm:rounded-md p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-[#60a5fa] leading-none mb-1.5 sm:mb-1">{stats.doneCount}</div>
            <div className="text-[10px] sm:text-[11px] text-[#555] tracking-wide">يوم مكتمل</div>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-xl sm:rounded-md p-3 sm:p-4 text-center">
            <div className="text-xl sm:text-2xl font-bold text-[#60a5fa] leading-none mb-1.5 sm:mb-1">{stats.maxStreak}</div>
            <div className="text-[10px] sm:text-[11px] text-[#555] tracking-wide">أطول سلسلة</div>
          </div>
        </div>

        {/* Today's Water Tracker */}
        <div className="bg-[#111] border border-[#1e1e1e] border-r-4 border-r-[#60a5fa] rounded-xl sm:rounded-md p-4 sm:p-5 mb-8">
          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="text-[10px] sm:text-[11px] text-[#60a5fa] tracking-widest uppercase mb-1">استهلاك اليوم</div>
              <div className="text-2xl sm:text-3xl font-bold text-[#f0f0f0] leading-none">
                {state.todayIntake} <span className="text-sm font-normal text-[#555]">/ {GOAL_ML} مل</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-[#60a5fa]">{todayPct}%</div>
            </div>
          </div>

          <div className="h-3 bg-[#1e1e1e] rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-[#60a5fa] rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${todayPct}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => addWater(-GLASS_ML)}
              disabled={state.todayIntake === 0}
              className="flex-1 bg-[#1a1a1a] hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-[#f0f0f0] border border-[#333] rounded-lg py-3 flex items-center justify-center gap-2 transition-all"
            >
              <Minus size={16} />
              <span className="text-sm font-bold">250 مل</span>
            </button>
            <button 
              onClick={() => addWater(GLASS_ML)}
              className="flex-[2] bg-[#60a5fa] hover:bg-[#7db4fb] active:scale-95 text-[#0a0a0a] border-none rounded-lg py-3 flex items-center justify-center gap-2 transition-all font-bold"
            >
              <Plus size={18} />
              <span>إضافة كوب (250 مل)</span>
            </button>
          </div>
        </div>

        {/* Days Grid */}
        <div className="mb-8">
          <div className="text-[11px] sm:text-xs text-[#555] tracking-widest uppercase mb-3 sm:mb-3.5">خريطة الأيام</div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {Array.from({ length: 21 }).map((_, i) => {
              const isDone = !!state.completed[i];
              const isToday = i === todayIdx;
              
              let cellClasses = "aspect-square rounded-lg sm:rounded-md border flex flex-col items-center justify-center relative gap-0.5 transition-all duration-150 ";
              
              if (isDone) {
                cellClasses += "bg-[#0a192f] border-[#60a5fa] text-[#60a5fa]";
              } else if (isToday) {
                cellClasses += "bg-[#0d1b2a] border-[#3b82f6] shadow-[0_0_0_1px_#3b82f6]";
              } else {
                cellClasses += "bg-[#111] border-[#1e1e1e] text-[#f0f0f0]";
              }

              return (
                <div key={i} className={cellClasses}>
                  {isDone && (
                    <span className="absolute top-1 left-1 sm:left-1.5 text-[8px] sm:text-[9px] font-bold text-[#60a5fa]">✓</span>
                  )}
                  <span className={`text-xs sm:text-sm font-bold leading-none ${isDone ? 'text-[#60a5fa]' : 'text-[#f0f0f0]'}`}>
                    {i + 1}
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-[#555] tracking-wide">
                    {isDone ? 'تم' : (isToday ? 'اليوم' : '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reminder Settings */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-xl sm:rounded-md p-4 sm:p-5 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div>
              <div className="text-sm font-bold text-[#f0f0f0]">تذكير يومي</div>
              <div className="text-[10px] sm:text-[11px] text-[#555] mt-1 leading-relaxed">احصل على إشعار لتذكيرك بشرب الماء</div>
            </div>
            <button
              onClick={toggleReminder}
              className={`w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-lg sm:rounded text-xs font-bold transition-all active:scale-95 ${
                state.reminderEnabled 
                  ? 'bg-[#60a5fa] text-[#0a0a0a]' 
                  : 'bg-[#222] text-[#f0f0f0] hover:bg-[#333]'
              }`}
            >
              {state.reminderEnabled ? 'مفعل' : 'تفعيل'}
            </button>
          </div>
          
          {state.reminderEnabled && (
            <div className="mt-4 pt-4 border-t border-[#1e1e1e] flex items-center justify-between">
              <div className="text-xs text-[#999]">وقت التذكير</div>
              <input 
                type="time" 
                value={state.reminderTime || '10:00'} 
                onChange={(e) => setState(prev => ({ ...prev, reminderTime: e.target.value }))}
                className="bg-[#1a1a1a] border border-[#333] text-[#f0f0f0] text-sm rounded-lg sm:rounded px-3 py-2 sm:py-1.5 outline-none focus:border-[#60a5fa] transition-colors"
                dir="ltr"
              />
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="text-center">
          <button 
            onClick={confirmReset}
            className="bg-transparent border border-[#222] hover:border-[#444] active:scale-95 text-[#333] hover:text-[#555] rounded-lg sm:rounded px-5 py-2.5 sm:py-2 text-xs tracking-wide transition-all duration-150"
          >
            إعادة التحدي من البداية
          </button>
        </div>

      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-20 left-1/2 bg-[#60a5fa] text-[#0a0a0a] font-bold text-[13px] px-6 py-3 rounded-full shadow-lg whitespace-nowrap z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
