import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  BarChart3, 
  Users, 
  Settings,
  LogOut,
  Factory,
  Tag,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Package, label: 'Purchase' },
  { icon: Factory, label: 'Godown Transfer' },
  { icon: Tag, label: 'Master' },
  { icon: FileText, label: 'Invoice' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Settings, label: 'Settings' },
];

export default function Sidebar({ 
  currentView, 
  onViewChange 
}: { 
  currentView: string; 
  onViewChange: (view: string) => void 
}) {
  return (
    <aside id="sidebar" className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
          I
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800 uppercase">Inven</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => onViewChange(item.label.toLowerCase())}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
              currentView === item.label.toLowerCase() 
                ? "bg-indigo-50 text-indigo-600 font-medium" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              currentView === item.label.toLowerCase() ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span className="text-sm">{item.label}</span>
            {currentView === item.label.toLowerCase() && (
              <div className="absolute right-0 top-2 bottom-2 w-1 bg-indigo-600 rounded-l-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
}
