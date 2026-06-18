import React, { useMemo } from 'react';

export default function LowStockTable() {
  const { lowStockItems, totalLowCount } = useMemo(() => {
    try {
      const items = JSON.parse(localStorage.getItem('inven_inventory') || '[]');
      const settings = JSON.parse(localStorage.getItem('inven_settings') || '{}');
      const threshold = Number(settings.lowStockThreshold) || 10;

      const filtered = items.filter((item: any) => (Number(item.quantity) || 0) <= threshold);
      
      if (filtered.length === 0 && items.length > 0) {
        // If there's inventory but none is critical, let's show the items in ascending order of stock quantity as warnings
        const sorted = [...items]
          .sort((a, b) => (Number(a.quantity) || 0) - (Number(b.quantity) || 0))
          .slice(0, 5)
          .map((item: any) => ({
            name: item.fabricType || 'Raw Fabric',
            sku: item.id || 'N/A',
            quantity: Number(item.quantity) || 0,
            status: 'warning'
          }));
        return { lowStockItems: sorted, totalLowCount: 0 };
      }

      const formatted = filtered.map((item: any) => {
        const qty = Number(item.quantity) || 0;
        return {
          name: item.fabricType || 'Raw Fabric',
          sku: item.id || 'N/A',
          quantity: qty,
          status: qty <= (threshold / 2) ? 'critical' : 'warning'
        };
      }).slice(0, 5);

      return { lowStockItems: formatted, totalLowCount: filtered.length };
    } catch {
      return { lowStockItems: [], totalLowCount: 0 };
    }
  }, []);

  // Final fallback if local storage is completely fresh and empty
  const itemsList = useMemo(() => {
    if (lowStockItems.length === 0) {
      return [
        { name: 'HP Yarn Classic', sku: 'HP-10102', quantity: 3, status: 'critical' },
        { name: 'Canon Cotton Spool', sku: 'CA-19201', quantity: 2, status: 'critical' },
        { name: 'HD Nylon Core', sku: 'HD-32101', quantity: 8, status: 'warning' },
        { name: 'Polyester Thread 40', sku: 'HP-51292', quantity: 9, status: 'warning' },
        { name: 'Premium Acetate Dye', sku: 'AP-20192', quantity: 8, status: 'warning' },
      ];
    }
    return lowStockItems;
  }, [lowStockItems]);

  const activeAlerts = totalLowCount > 0 ? totalLowCount : itemsList.filter(i => i.status === 'critical').length;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Low Stock Alerts</h3>
            <p className="text-[10px] text-rose-500 font-extrabold uppercase mt-0.5 tracking-wider">
              {activeAlerts} lines need replenishing
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest font-black">
                <th className="pb-3 font-semibold">Brand / Fabric</th>
                <th className="pb-3 font-semibold">Lot ID</th>
                <th className="pb-3 font-semibold text-center">Qty</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {itemsList.map((item, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 text-xs font-bold text-slate-700 truncate max-w-[120px]">{item.name}</td>
                  <td className="py-2.5 font-mono text-[9px] font-bold text-slate-400">{item.sku}</td>
                  <td className="py-2.5 text-xs font-extrabold text-slate-800 text-center">{item.quantity}</td>
                  <td className="py-2.5 text-right">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                      item.status === 'critical' 
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.4)] animate-pulse' 
                        : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                    }`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 text-[9px] text-slate-400 font-medium leading-relaxed">
        Threshold limit automatically synchronized with global raw material rules.
      </div>
    </div>
  );
}
