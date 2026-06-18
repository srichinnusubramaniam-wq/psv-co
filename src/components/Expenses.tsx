import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Receipt, 
  Trash2, 
  Edit2, 
  X, 
  Calendar,
  CreditCard,
  CircleDollarSign
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface ExpenseRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  date: string;
  paymentMode: string;
  notes: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export default function Expenses({ 
  autoOpenForm, 
  onFormOpened 
}: { 
  autoOpenForm?: boolean; 
  onFormOpened?: () => void;
} = {}) {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<Partial<ExpenseRecord>>({
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash'
  });

  useEffect(() => {
    if (autoOpenForm) {
      setEditingId(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash'
      });
      setIsFormOpen(true);
      onFormOpened?.();
    }
  }, [autoOpenForm, onFormOpened]);

  useEffect(() => {
    // Load categories from master
    const savedCategories = localStorage.getItem('inven_expense_master');
    if (savedCategories) {
      try { setCategories(JSON.parse(savedCategories)); } catch (e) { console.error(e); }
    }

    // Load recorded expenses
    const savedExpenses = localStorage.getItem('inven_expense_records');
    if (savedExpenses) {
      try { setExpenses(JSON.parse(savedExpenses)); } catch (e) { console.error(e); }
    } else {
      const demoExpenses: ExpenseRecord[] = [
        { 
          id: 'REC-001', 
          categoryId: 'EXP-001', 
          categoryName: 'Electricity', 
          amount: 4500, 
          date: '2026-05-01', 
          paymentMode: 'Bank Transfer', 
          notes: 'Main floor bill',
          createdAt: new Date().toISOString() 
        }
      ];
      setExpenses(demoExpenses);
      localStorage.setItem('inven_expense_records', JSON.stringify(demoExpenses));
    }
  }, []);

  const saveExpenses = (data: ExpenseRecord[]) => {
    setExpenses(data);
    localStorage.setItem('inven_expense_records', JSON.stringify(data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCategory = categories.find(c => c && c.id === formData.categoryId);
    
    if (editingId) {
      const updated = expenses.map(ex => ex.id === editingId ? { 
        ...ex, 
        ...formData as ExpenseRecord,
        categoryName: selectedCategory?.name || ex.categoryName 
      } : ex);
      saveExpenses(updated);
    } else {
      const newRecord: ExpenseRecord = {
        ...formData as ExpenseRecord,
        id: `REC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        categoryName: selectedCategory?.name || 'Unknown',
        createdAt: new Date().toISOString(),
      };
      saveExpenses([newRecord, ...expenses]);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash'
    });
  };

  const deleteRecord = (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      saveExpenses(expenses.filter(ex => ex.id !== id));
    }
  };

  const filteredExpenses = expenses.filter(ex => 
    ex && (
      (ex.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (ex.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Record Expenses</h2>
          <p className="text-sm text-slate-500">Track and manage your business expenditures.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Record Expense
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredExpenses.map((expense) => (
          <div key={expense.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex gap-1">
                  <button 
                    onClick={() => { setEditingId(expense.id); setFormData(expense); setIsFormOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteRecord(expense.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
               </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{expense.id}</p>
                <h4 className="text-lg font-bold text-slate-800">{expense.categoryName}</h4>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount</span>
                <span className="text-xl font-bold text-slate-900">₹{expense.amount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{expense.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  <span className="bg-white border border-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-indigo-600 uppercase">
                    {expense.paymentMode}
                  </span>
                </div>
              </div>
              {expense.notes && (
                <p className="text-[11px] text-slate-500 line-clamp-1 italic pt-1 border-t border-slate-100/50">
                  {expense.notes}
                </p>
              )}
            </div>
          </div>
        ))}
        {filteredExpenses.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
            <CircleDollarSign className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No expense records found.</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit' : 'Record'} Expense
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Expense Category</label>
                <select 
                  required
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm appearance-none cursor-pointer"
                  value={formData.categoryId || ''}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                >
                  <option value="" disabled>Select Category</option>
                  {categories.filter(cat => cat && cat.id).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-medium px-1">
                    No categories found. Please add them in Master data.
                  </p>
                )}
              </div>

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
                  value={formData.paymentMode || 'Cash'}
                  onChange={(e) => setFormData({...formData, paymentMode: e.target.value})}
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>UPI</option>
                  <option>Cheque</option>
                  <option>Credit Card</option>
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
                  className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200"
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
