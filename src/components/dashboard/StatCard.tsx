import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  className?: string;
  index?: number;
  icon?: React.ReactNode;
}

export default function StatCard({ label, value, change, isPositive, className, index = 0, icon }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1, 
        ease: [0.16, 1, 0.3, 1] 
      }}
      className={cn("bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group", className)}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && (
          <div className="p-2 bg-indigo-50/50 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-3">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{value}</h3>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded-lg shrink-0 whitespace-nowrap select-none",
          isPositive ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
        )}>
          {isPositive ? <TrendingUp className="w-2.5 h-2.5 shrink-0" /> : <TrendingDown className="w-2.5 h-2.5 shrink-0" />}
          <span>{change}</span>
        </div>
      </div>
    </motion.div>
  );
}
