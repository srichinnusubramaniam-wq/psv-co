import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Volume2, VolumeX, AlertTriangle, Clock, Package, Check, Play, Sparkles } from 'lucide-react';

interface ProductionAssignment {
  id: string;
  unit: string;
  expectedDate: string;
  status: string;
  items?: { modelName: string; quantity: number; rate: number }[];
  modelName?: string;
  totalQty?: number;
}

interface InventoryItem {
  id: string;
  modelName: string;
  quantity: number;
}

export default function Header({ onViewChange }: { onViewChange?: (view: string) => void }) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('inven_sound_muted');
    return saved ? JSON.parse(saved) : false;
  });

  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [dueAssignments, setDueAssignments] = useState<ProductionAssignment[]>([]);
  const [playedAlerts, setPlayedAlerts] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Play subtle synthesis sound
  const playNotificationChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      // Tone 1: Gentle synth chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Tone 2: Harmonizing ring
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25); // C6
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.08, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.4);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio play blocked/unsupported:', e);
    }
  };

  const toggleMute = () => {
    const newVal = !isMuted;
    setIsMuted(newVal);
    localStorage.setItem('inven_sound_muted', JSON.stringify(newVal));
    if (!newVal) {
      setTimeout(() => playNotificationChime(), 100);
    }
  };

  const checkAlerts = () => {
    // 1. Check Low Stock Items
    const savedItems = localStorage.getItem('inven_inventory');
    const savedSettings = localStorage.getItem('inven_settings');
    let lowStockList: any[] = [];
    let threshold = 10;
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        threshold = settings.lowStockThreshold || 10;
      } catch (e) {
        console.error(e);
      }
    }

    if (savedItems) {
      try {
        const items = JSON.parse(savedItems);
        lowStockList = items.filter((item: any) => item.quantity <= threshold);
        setLowStockItems(lowStockList);
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Check Production Alerts within 24 Hours (or Overdue)
    const savedProduction = localStorage.getItem('inven_production');
    let highUrgencyProduction: ProductionAssignment[] = [];
    if (savedProduction) {
      try {
        const assignments: ProductionAssignment[] = JSON.parse(savedProduction);
        const nowTime = new Date().getTime();

        highUrgencyProduction = assignments.filter((a: ProductionAssignment) => {
          if (a.status === 'Finished Goods') return false;
          const expectedTime = new Date(a.expectedDate).getTime();
          const diffMs = expectedTime - nowTime;
          const diffHours = diffMs / (1000 * 60 * 60);
          
          // Fall within 24 hours (or already overdue)
          return diffHours <= 24;
        });

        setDueAssignments(highUrgencyProduction);
      } catch (e) {
        console.error(e);
      }
    }
    
    setNotificationCount(lowStockList.length + highUrgencyProduction.length);

    // Audio chime logic for newly detected high-priority alerts
    if (highUrgencyProduction.length > 0) {
      const currentIds = highUrgencyProduction.map(a => a.id);
      setPlayedAlerts(prev => {
        const hasNewAlert = currentIds.some(id => !prev.includes(id));
        if (hasNewAlert) {
          if (!isMuted) {
            playNotificationChime();
          }
          return currentIds;
        }
        return prev;
      });
    }
  };

  useEffect(() => {
    checkAlerts();
    // Listen for storage changes
    window.addEventListener('storage', checkAlerts);
    const interval = setInterval(checkAlerts, 5000);

    // Click outside listener for dropdown
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('storage', checkAlerts);
      clearInterval(interval);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMuted]);

  return (
    <header id="header" className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search products, orders..." 
            className="w-full bg-slate-100/50 border-none rounded-2xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none animate-in fade-in duration-300"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${
            isOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'
          }`}
          title="Notification Queue"
        >
          <Bell className={`w-5 h-5 ${notificationCount > 0 && !isOpen ? 'animate-bounce' : ''}`} />
          {notificationCount > 0 && (
            <span className="absolute top-2 right-2 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative flex items-center justify-center rounded-full h-4 w-4 bg-rose-500 text-[8px] text-white font-bold leading-none">
                {notificationCount}
              </span>
            </span>
          )}
        </button>

        {/* Dropdown notification panel */}
        {isOpen && (
          <div className="absolute right-0 top-14 w-96 bg-white border border-slate-100 rounded-[28px] shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200 max-h-[550px] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-tight">Alert Center</h4>
              </div>
              <div className="flex items-center gap-1">
                {/* Manual check sound button */}
                <button 
                  onClick={() => playNotificationChime()}
                  className="p-1.5 hover:bg-slate-50 text-indigo-500 rounded-lg transition-colors cursor-pointer"
                  title="Test Alert Chime"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
                <button 
                  onClick={toggleMute}
                  className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-0">
              {/* Due Assignments queue */}
              {dueAssignments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-extrabold tracking-widest text-[#bfaa1e] bg-amber-50 rounded-lg py-1 px-2.5 inline-block">
                    Urgent Production Due (&lt; 24h)
                  </p>
                  <div className="space-y-2">
                    {dueAssignments.map((assignment) => {
                      const modelName = assignment.items?.[0]?.modelName || assignment.modelName || 'Unknown SKU';
                      const isOverdue = new Date(assignment.expectedDate).getTime() < new Date().getTime();
                      return (
                        <div 
                          key={assignment.id} 
                          className="p-4 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-2xl flex gap-3 items-start transition-all"
                        >
                          <div className="p-2 bg-amber-100 rounded-xl text-amber-700 mt-0.5 shrink-0 animate-pulse">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-amber-800 font-extrabold uppercase tracking-tight">
                                Batch {assignment.id}
                              </span>
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}`}>
                                {isOverdue ? 'Overdue' : 'Due Soon'}
                              </span>
                            </div>
                            <h5 className="text-[11px] font-extrabold text-slate-700 truncate mt-1">
                              {modelName}
                            </h5>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5 font-medium">
                              Assignee: <span className="font-bold text-slate-600">{assignment.unit || 'Not Set'}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono mt-1 font-bold">
                              Exp: {new Date(assignment.expectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              if (!isMuted) { playNotificationChime(); }
                            }}
                            className="p-1 hover:bg-amber-100 text-amber-700 rounded-md transition-colors self-center cursor-pointer shrink-0"
                            title="Play sound indication"
                          >
                            <Play className="w-3 h-3 fill-current" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Low stock alerts queue */}
              {lowStockItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">
                    Low Stock warnings
                  </p>
                  <div className="space-y-2">
                    {lowStockItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl flex gap-3 items-start transition-all"
                      >
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-500 mt-0.5 shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-mono text-slate-400 font-extrabold uppercase">
                            SKU Stock Warning
                          </span>
                          <h5 className="text-[11px] font-extrabold text-slate-700 truncate mt-0.5">
                            {item.modelName}
                          </h5>
                          <p className="text-[10px] text-rose-500 font-black mt-1 font-mono">
                            Available: {item.quantity} units
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dueAssignments.length === 0 && lowStockItems.length === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto">
                    <Check className="w-6 h-6 animate-pulse" />
                  </div>
                  <h5 className="text-[11px] font-black uppercase tracking-widest text-slate-600">All Systems Clear</h5>
                  <p className="text-[10px] font-medium max-w-[200px] mx-auto text-slate-400">
                    No urgent manufacturing deadlines or low stock items detected.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[9px] text-slate-400 font-bold">
                Sound Alerts: {isMuted ? 'Muted' : 'Active'}
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-700 py-1 px-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                Dismiss Panel
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-800 leading-tight">Admin User</p>
            <p className="text-xs text-slate-500">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold p-0.5">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
              alt="Avatar" 
              className="w-full h-full rounded-[10px] bg-white"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
