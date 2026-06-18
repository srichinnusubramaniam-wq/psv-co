import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Trash2, 
  Edit2, 
  X, 
  Calendar,
  Wallet,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface IncomeRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  date: string;
  paymentMode: string;
  notes: string;
  createdAt: string;
  customerId?: string;
  customerName?: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
}

export default function Income() {
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<Partial<IncomeRecord>>({
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer'
  });

  useEffect(() => {
    // Load categories from master
    const savedCategories = localStorage.getItem('inven_income_master');
    if (savedCategories) {
      try { setCategories(JSON.parse(savedCategories)); } catch (e) { console.error(e); }
    } else {
      // Default income categories
      const defaultCategories = [
        { id: 'INC-CAT-001', name: 'Product Sales' },
        { id: 'INC-CAT-002', name: 'Service Fee' },
        { id: 'INC-CAT-003', name: 'Investment' },
        { id: 'INC-CAT-004', name: 'Tax Refund' },
        { id: 'INC-CAT-005', name: 'Other Income' },
      ];
      setCategories(defaultCategories);
      localStorage.setItem('inven_income_master', JSON.stringify(defaultCategories));
    }

    // Load recorded incomes
    const savedIncomes = localStorage.getItem('inven_income_records');
    if (savedIncomes) {
      try { setIncomes(JSON.parse(savedIncomes)); } catch (e) { console.error(e); }
    } else {
      const demoIncomes: IncomeRecord[] = [
        { 
          id: 'INC-001', 
          categoryId: 'INC-CAT-001', 
          categoryName: 'Product Sales', 
          amount: 15000, 
          date: '2026-05-15', 
          paymentMode: 'Bank Transfer', 
          notes: 'Bulk order payment',
          createdAt: new Date().toISOString() 
        }
      ];
      setIncomes(demoIncomes);
      localStorage.setItem('inven_income_records', JSON.stringify(demoIncomes));
    }

    // Load customers from master
    const savedCustomers = localStorage.getItem('inven_customers');
    if (savedCustomers) {
      try { setCustomers(JSON.parse(savedCustomers)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveIncomes = (data: IncomeRecord[]) => {
    setIncomes(data);
    localStorage.setItem('inven_income_records', JSON.stringify(data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCategory = categories.find(c => c && c.id === formData.categoryId);
    const isProductSales = selectedCategory?.name === 'Product Sales';
    const selectedCustomer = isProductSales && formData.customerId 
      ? customers.find(c => c && c.id === formData.customerId)
      : null;
    
    if (editingId) {
      const updated = incomes.map(b => b.id === editingId ? { 
        ...b, 
        ...formData as IncomeRecord,
        categoryName: selectedCategory?.name || b.categoryName,
        customerName: selectedCustomer ? selectedCustomer.name : (isProductSales ? b.customerName : undefined),
        customerId: selectedCustomer ? selectedCustomer.id : (isProductSales ? b.customerId : undefined)
      } : b);
      saveIncomes(updated);
    } else {
      const newRecord: IncomeRecord = {
        ...formData as IncomeRecord,
        id: `INC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        categoryName: selectedCategory?.name || 'Unknown',
        customerName: selectedCustomer ? selectedCustomer.name : undefined,
        customerId: selectedCustomer ? selectedCustomer.id : undefined,
        createdAt: new Date().toISOString(),
      };
      saveIncomes([newRecord, ...incomes]);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer'
    });
  };

  const deleteRecord = (id: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      saveIncomes(incomes.filter(b => b.id !== id));
    }
  };

  const filteredIncomes = incomes.filter(b => 
    b && (
      (b.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Record Income</h2>
          <p className="text-sm text-slate-500">Track and manage your miscellaneous business incomes.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
        >
          <Plus className="w-4 h-4" />
          Record Income
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search income records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredIncomes.map((income) => (
          <div key={income.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex gap-1">
                  <button 
                    onClick={() => { setEditingId(income.id); setFormData(income); setIsFormOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteRecord(income.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{income.id}</p>
                <h4 className="text-lg font-bold text-slate-800 truncate">{income.categoryName}</h4>
                {income.customerName && (
                  <p className="text-xs text-indigo-600 font-bold bg-indigo-50/50 rounded-lg px-2 py-0.5 mt-1 inline-block">
                    Client: {income.customerName}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount</span>
                <span className="text-xl font-bold text-emerald-600">₹{income.amount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{income.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-3 h-3 text-slate-400" />
                  <span className="bg-white border border-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-600 uppercase">
                    {income.paymentMode}
                  </span>
                </div>
              </div>
              {income.notes && (
                <p className="text-[11px] text-slate-500 line-clamp-1 italic pt-1 border-t border-slate-100/50">
                  {income.notes}
                </p>
              )}
            </div>
          </div>
        ))}
        {filteredIncomes.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No income records found.</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit' : 'Record'} Income
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Income Type / Category</label>
                <select 
                  required
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm appearance-none cursor-pointer"
                  value={formData.categoryId || ''}
                  onChange={(e) => {
                    const newCatId = e.target.value;
                    const catObj = categories.find(c => c && c.id === newCatId);
                    setFormData({
                      ...formData, 
                      categoryId: newCatId,
                      // clear customerId if not changing to/staying in Product Sales
                      customerId: catObj?.name === 'Product Sales' ? formData.customerId : undefined
                    });
                  }}
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {categories.find(c => c && c.id === formData.categoryId)?.name === 'Product Sales' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Select Customer</label>
                  <select 
                    required
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                    value={formData.customerId || ''}
                    onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                  >
                    <option value="" disabled>Choose customer...</option>
                    {customers.map(cust => (
                      <option key={cust.id} value={cust.id}>{cust.name} ({cust.id})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Amount (₹)</label>
                  <input 
                    required
                    type="number" 
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Mode</label>
                <select 
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm appearance-none cursor-pointer"
                  value={formData.paymentMode || 'Bank Transfer'}
                  onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                >
                  <option>Bank Transfer</option>
                  <option>Net Banking</option>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Notes</label>
                <textarea 
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm resize-none"
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

