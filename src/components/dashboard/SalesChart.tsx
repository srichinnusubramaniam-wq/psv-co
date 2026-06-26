import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const parseSafeDate = (dateStr: any): Date => {
  if (!dateStr) return new Date();
  const str = String(dateStr).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function SalesChart() {
  const invoices = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]');
    } catch {
      return [];
    }
  }, []);

  const totalSalesVal = useMemo(() => {
    return invoices.reduce((sum: number, inv: any) => sum + (Number(inv.totalAmount) || 0), 0);
  }, [invoices]);

  const chartData = useMemo(() => {
    const monthlySum: Record<string, number> = {
      'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0,
      'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
    };

    let hasInvoices = false;
    invoices.forEach((inv: any) => {
      const total = Number(inv.totalAmount) || 0;
      if (total > 0 && inv.date) {
        const dateObj = parseSafeDate(inv.date);
        if (!isNaN(dateObj.getTime())) {
          hasInvoices = true;
          const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthName = monthsShort[dateObj.getMonth()] || 'Jan';
          if (monthlySum[monthName] !== undefined) {
            monthlySum[monthName] += total;
          }
        }
      }
    });

    if (!hasInvoices) {
      // Return high-fidelity default dummy dataset if no invoices yet
      return [
        { name: 'Jan', value: 18 },
        { name: 'Feb', value: 25 },
        { name: 'Mar', value: 15 },
        { name: 'Apr', value: 42 },
        { name: 'May', value: 18 },
        { name: 'Jun', value: 28 },
        { name: 'Jul', value: 32 },
        { name: 'Aug', value: 50 },
        { name: 'Sep', value: 35 },
        { name: 'Oct', value: 45 },
      ];
    }

    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthsOrder.map(name => ({
      name,
      value: Number((monthlySum[name] / 1000).toFixed(1)) // Expressed in thousands for clean charting
    }));
  }, [invoices]);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-medium text-slate-500">Total Sales Ledger</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">₹{totalSalesVal.toLocaleString()}</h3>
        </div>
        <div className="px-3 py-1.5 bg-slate-50 text-[10px] uppercase font-black text-slate-500 rounded-xl select-none">
          Live Sync Output
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={(value) => `${value}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: 'none', 
                borderRadius: '12px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
              cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
