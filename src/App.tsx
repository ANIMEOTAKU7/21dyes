import React, { useState } from 'react';
import PullupTracker from './PullupTracker';
import WaterTracker from './WaterTracker';
import { Activity, Droplet } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pullup' | 'water'>('pullup');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0] font-sans pb-20" dir="rtl">
      {activeTab === 'pullup' ? <PullupTracker /> : <WaterTracker />}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#111]/90 backdrop-blur-md border-t border-[#1e1e1e] pb-safe z-40">
        <div className="max-w-[480px] mx-auto flex">
          <button
            onClick={() => setActiveTab('pullup')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'pullup' ? 'text-[#c8f065]' : 'text-[#555] hover:text-[#999]'
            }`}
          >
            <Activity size={20} />
            <span className="text-[10px] font-bold tracking-wide">العقلة</span>
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'water' ? 'text-[#60a5fa]' : 'text-[#555] hover:text-[#999]'
            }`}
          >
            <Droplet size={20} />
            <span className="text-[10px] font-bold tracking-wide">الماء</span>
          </button>
        </div>
      </div>
    </div>
  );
}

