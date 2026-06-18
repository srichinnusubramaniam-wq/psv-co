import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function UsersDonut() {
  const chartData = useMemo(() => {
    try {
      const customers = JSON.parse(localStorage.getItem('inven_customers') || '[]');
      const suppliers = JSON.parse(localStorage.getItem('inven_suppliers') || '[]');
      const units = JSON.parse(localStorage.getItem('inven_unit_master') || '[]');
      
      const customerCount = Array.isArray(customers) ? customers.length : 2;
      const supplierCount = Array.isArray(suppliers) ? suppliers.length : 2;
      const unitCount = Array.isArray(units) ? units.length : 3;

      return [
        { name: 'Customers', value: customerCount || 1, color: '#2e3dbd' },
        { name: 'Units', value: unitCount || 1, color: '#4ade80' },
        { name: 'Suppliers', value: supplierCount || 1, color: '#f59e0b' },
      ];
    } catch {
      return [
        { name: 'Customers', value: 2, color: '#2e3dbd' },
        { name: 'Units', value: 3, color: '#4ade80' },
        { name: 'Suppliers', value: 2, color: '#f59e0b' },
      ];
    }
  }, []);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Active Directory</h3>
        <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Enterprise Directory Elements</p>
      </div>
      
      <div className="h-[180px] w-full mt-2 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex justify-center gap-4 flex-wrap">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100/50 px-2 py-1 rounded-xl">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight">{item.name}</span>
            <span className="text-[9px] font-black text-slate-500 font-mono">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
}
