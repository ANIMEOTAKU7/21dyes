import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const PLAN = [
  { day: 1,  reps: 15, desc: 'عقلة بالإمساك الكامل، تعلّق 10 ثواني بعد الانتهاء' },
  { day: 2,  reps: 15, desc: 'ركز على الشد الكامل للكتفين لأسفل' },
  { day: 3,  reps: 16, desc: 'جسم مستقيم — لا تأرجح' },
  { day: 4,  reps: 16, desc: 'اضبط التنفس: شهيق نزول، زفير صعود' },
  { day: 5,  reps: 17, desc: 'تعلّق 15 ثانية بعد آخر ست' },
  { day: 6,  reps: 17, desc: 'بطء في النزول 3 ثواني كل تكرار' },
  { day: 7,  reps: 18, desc: 'زيادة تكرار بالتدريج' },
  { day: 8,  reps: 18, desc: 'أضف تعلّق 20 ثانية في نهاية التدريب' },
  { day: 9,  reps: 19, desc: 'عقلة واسعة الإمساك إذا أمكن' },
  { day: 10, reps: 19, desc: 'وزّع الجهد بالتساوي بين السيتات' },
  { day: 11, reps: 20, desc: 'الأداء الكامل — ذقن فوق البار' },
  { day: 12, reps: 20, desc: 'تعلّق 25 ثانية في نهاية التدريب' },
  { day: 13, reps: 22, desc: 'بطء كامل: 2 ثانية صعود / 3 ثواني نزول' },
  { day: 14, reps: 22, desc: 'ركز على الاستشفاء بالنوم الجيد الليلة' },
  { day: 15, reps: 24, desc: 'تعلّق 30 ثانية بعد الانتهاء' },
  { day: 16, reps: 24, desc: 'حافظ على الشكل الكامل في كل تكرار' },
  { day: 17, reps: 25, desc: 'اليوم المرجعي — سجّل كيف تشعر' },
  { day: 18, reps: 25, desc: 'بطء كامل: 2 ثانية صعود / 4 ثواني نزول' },
  { day: 19, reps: 27, desc: 'تعلّق 40 ثانية في النهاية' },
  { day: 20, reps: 27, desc: 'حاول تجاوز اليوم 19' },
  { day: 21, reps: 30, desc: 'آخر يوم — أعطِ كل ما عندك! 🏁' },
];

interface DayRecord {
  reps: number;
  timestamp: number;
}

interface AppState {
  startDate: string;
  completed: Record<number, DayRecord>;
  reminderEnabled?: boolean;
  reminderTime?: string;
}

const defaultState = (): AppState => ({
  startDate: new Date().toDateString(),
  completed: {},
  reminderEnabled: false,
  reminderTime: '09:00',
});

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem('pullup21');
      return saved ? { ...defaultState(), ...JSON.parse(saved) } : defaultState();
    } catch {
      return defaultState();
    }
  });

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('pullup21', JSON.stringify(state));
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
        const lastNotified = localStorage.getItem('pullup21_last_notified');
        const todayStr = now.toDateString();

        if (!isDone && lastNotified !== todayStr) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('تذكير العقلة!', {
              body: `حان وقت تمرين العقلة لليوم ${PLAN[todayIdx]?.day || ''}. لا تستسلم!`,
            });
            localStorage.setItem('pullup21_last_notified', todayStr);
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
        setState(prev => ({ ...prev, reminderEnabled: true, reminderTime: prev.reminderTime || '09:00' }));
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

    const totalReps = Object.values(state.completed).reduce((a, v) => a + (v.reps || 0), 0);

    return { doneCount, maxStreak, totalReps, currentActiveStreak };
  }, [state.completed, todayIdx]);

  const completeDay = (i: number) => {
    if (state.completed[i]) return;
    setState(prev => ({
      ...prev,
      completed: {
        ...prev.completed,
        [i]: { reps: PLAN[i].reps, timestamp: Date.now() }
      }
    }));
    showToast(`✓ ${PLAN[i].reps} تكرار — اليوم ${PLAN[i].day} مكتمل!`);
  };

  const confirmReset = () => {
    if (window.confirm('هل أنت متأكد؟ سيتم حذف كل البيانات وإعادة البدء من اليوم 1.')) {
      setState(defaultState());
      showToast('🔄 تم إعادة التحدي!');
    }
  };

  const pct = Math.round((stats.doneCount / 21) * 100);
  const todayPlan = PLAN[todayIdx] || PLAN[20];
  const isTodayDone = !!state.completed[todayIdx];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] font-sans p-8 pb-16" dir="rtl">
      <div className="max-w-[480px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col gap-1.5 mb-10">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold tracking-widest uppercase text-[#c8f065] border border-[#c8f065] px-2.5 py-0.5 rounded-sm">
              تحدي العقلة
            </div>
            <div className="text-[13px] text-[#999]">
              سلسلة: <span className="text-[#c8f065] font-bold">{stats.currentActiveStreak}</span> يوم
            </div>
          </div>
          <h1 className="text-4xl md:text-[42px] font-bold leading-tight tracking-tight text-[#f0f0f0]">
            ثبات <em className="text-[#c8f065] not-italic">21 يوم</em>
          </h1>
          <p className="text-[13px] text-[#555] mt-1">
            21 يوم متواصل بدون انقطاع — الهدف: تطويل العمود الفقري
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-[#555] mb-2">
            <span>{stats.doneCount} يوم مكتمل</span>
            <span>{21 - stats.doneCount} متبقي</span>
          </div>
          <div className="h-1 bg-[#1e1e1e] rounded-sm overflow-hidden">
            <div 
              className="h-full bg-[#c8f065] rounded-sm transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-9">
          <div className="bg-[#111] border border-[#1e1e1e] rounded-md p-4 text-center">
            <div className="text-2xl font-bold text-[#c8f065] leading-none mb-1">{stats.doneCount}</div>
            <div className="text-[11px] text-[#555] tracking-wide">يوم مكتمل</div>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-md p-4 text-center">
            <div className="text-2xl font-bold text-[#c8f065] leading-none mb-1">{stats.maxStreak}</div>
            <div className="text-[11px] text-[#555] tracking-wide">أطول سلسلة</div>
          </div>
          <div className="bg-[#111] border border-[#1e1e1e] rounded-md p-4 text-center">
            <div className="text-2xl font-bold text-[#c8f065] leading-none mb-1">{stats.totalReps}</div>
            <div className="text-[11px] text-[#555] tracking-wide">إجمالي تكرار</div>
          </div>
        </div>

        {/* Days Grid */}
        <div className="mb-8">
          <div className="text-xs text-[#555] tracking-widest uppercase mb-3.5">خريطة الأيام</div>
          <div className="grid grid-cols-7 gap-2">
            {PLAN.map((p, i) => {
              const isDone = !!state.completed[i];
              const isToday = i === todayIdx;
              
              let cellClasses = "aspect-square rounded-md border flex flex-col items-center justify-center relative gap-0.5 transition-all duration-150 ";
              
              if (isDone) {
                cellClasses += "bg-[#141a04] border-[#c8f065] text-[#c8f065]";
              } else if (isToday) {
                cellClasses += "bg-[#1a1f0e] border-[#8aaa3a] shadow-[0_0_0_1px_#8aaa3a] cursor-pointer hover:scale-105";
              } else {
                cellClasses += "bg-[#111] border-[#1e1e1e] text-[#f0f0f0] cursor-pointer hover:border-[#8aaa3a] hover:scale-105";
              }

              return (
                <div 
                  key={i} 
                  className={cellClasses}
                  onClick={() => {
                    if (isToday && !isDone) completeDay(i);
                  }}
                  title={isToday && !isDone ? 'اضغط لتسجيل اليوم' : ''}
                >
                  {isDone && (
                    <span className="absolute top-1 left-1.5 text-[9px] font-bold text-[#c8f065]">✓</span>
                  )}
                  <span className={`text-sm font-bold leading-none ${isDone ? 'text-[#c8f065]' : 'text-[#f0f0f0]'}`}>
                    {p.day}
                  </span>
                  <span className="text-[9px] text-[#555] tracking-wide">
                    {isDone ? 'تم' : (isToday ? 'اليوم' : '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-[#111] border border-[#1e1e1e] border-r-4 border-r-[#c8f065] rounded-md p-4 md:p-5 flex items-center justify-between gap-4 mb-8">
          {isTodayDone || todayIdx > 20 ? (
            <div className="text-sm font-semibold text-[#c8f065] w-full text-center">
              ✓ اليوم {todayPlan.day} مكتمل — {todayPlan.reps} تكرار
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-[11px] text-[#c8f065] tracking-widest uppercase">اليوم {todayPlan.day}</span>
                <span className="text-[22px] font-bold text-[#f0f0f0] leading-none">{todayPlan.reps} تكرار</span>
                <span className="text-xs text-[#555]">{todayPlan.desc}</span>
              </div>
              <button 
                onClick={() => completeDay(todayIdx)}
                className="bg-[#c8f065] hover:bg-[#d8ff77] text-[#0a0a0a] border-none rounded-md px-5 py-3 text-sm font-bold whitespace-nowrap transition-all duration-150 hover:-translate-y-[1px]"
              >
                ✓ سجّل اليوم
              </button>
            </>
          )}
        </div>

        {/* Reminder Settings */}
        <div className="bg-[#111] border border-[#1e1e1e] rounded-md p-4 md:p-5 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[#f0f0f0]">تذكير يومي</div>
              <div className="text-[11px] text-[#555] mt-1">احصل على إشعار لتذكيرك بالتمرين (يجب ترك الموقع مفتوحاً)</div>
            </div>
            <button
              onClick={toggleReminder}
              className={`px-4 py-2 rounded text-xs font-bold transition-colors ${
                state.reminderEnabled 
                  ? 'bg-[#c8f065] text-[#0a0a0a]' 
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
                value={state.reminderTime || '09:00'} 
                onChange={(e) => setState(prev => ({ ...prev, reminderTime: e.target.value }))}
                className="bg-[#1a1a1a] border border-[#333] text-[#f0f0f0] text-sm rounded px-3 py-1.5 outline-none focus:border-[#c8f065] transition-colors"
                dir="ltr"
              />
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="text-center">
          <button 
            onClick={confirmReset}
            className="bg-transparent border border-[#222] hover:border-[#444] text-[#333] hover:text-[#555] rounded px-5 py-2 text-xs tracking-wide transition-colors duration-150"
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
            className="fixed bottom-8 left-1/2 bg-[#c8f065] text-[#0a0a0a] font-bold text-[13px] px-6 py-3 rounded whitespace-nowrap z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
