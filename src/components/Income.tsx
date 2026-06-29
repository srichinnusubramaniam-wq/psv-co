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
  CheckCircle2,
  AlertTriangle
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
  allocationType?: 'opening_balance' | 'invoice';
  invoiceId?: string;
  invoiceNo?: string;
}

export interface IncomeCategory {
  id: string;
  name: string;
}

export default function Income() {
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<IncomeRecord>>({
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    allocationType: 'opening_balance'
  });

  const loadAllData = () => {
    // Load categories from master
    const savedCategories = localStorage.getItem('inven_income_master');
    if (savedCategories) {
      try { setCategories(JSON.parse(savedCategories)); } catch (e) { console.error(e); }
    } else {
      // Default income categories
      const defaultCategories = [
        { id: 'INC-CAT-001', name: 'Product Sales' },
        { id: 'INC-CAT-002', name: 'Customer Payment' },
        { id: 'INC-CAT-003', name: 'Service Fee' },
        { id: 'INC-CAT-004', name: 'Investment' },
        { id: 'INC-CAT-005', name: 'Tax Refund' },
        { id: 'INC-CAT-006', name: 'Other Income' },
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

    // Load invoices
    const savedInvoices = localStorage.getItem('inven_generated_invoices');
    if (savedInvoices) {
      try { setInvoices(JSON.parse(savedInvoices)); } catch (e) { console.error(e); }
    }
  };

  useEffect(() => {
    loadAllData();

    const handleSync = () => {
      loadAllData();
    };
    window.addEventListener('inven_localstorage_sync', handleSync);
    return () => window.removeEventListener('inven_localstorage_sync', handleSync);
  }, []);

  const saveIncomes = (data: IncomeRecord[]) => {
    setIncomes(data);
    localStorage.setItem('inven_income_records', JSON.stringify(data));
  };

  // Adjust financial records (Customer Opening Balance or Invoice Pending Amount)
  const adjustCustomerBalanceAndInvoice = (
    customerId: string | undefined,
    allocationType: 'opening_balance' | 'invoice' | undefined,
    invoiceId: string | undefined,
    amount: number,
    revert: boolean = false
  ) => {
    if (!customerId) return;
    
    const factor = revert ? 1 : -1; // reverting adds back, applying subtracts

    // 1. If applied to opening balance
    if (allocationType === 'opening_balance' || !allocationType) {
      const savedCustomers = localStorage.getItem('inven_customers');
      if (savedCustomers) {
        try {
          const custs = JSON.parse(savedCustomers);
          const updated = custs.map((c: any) => {
            if (c.id === customerId) {
              const currentOB = Number(c.openingBalance) || 0;
              const newOB = currentOB + (amount * factor);
              return { ...c, openingBalance: newOB };
            }
            return c;
          });
          localStorage.setItem('inven_customers', JSON.stringify(updated));
        } catch (e) {
          console.error('Error adjusting customer opening balance:', e);
        }
      }
    }

    // 2. If applied to invoice
    if (allocationType === 'invoice' && invoiceId) {
      const savedInvoices = localStorage.getItem('inven_generated_invoices');
      if (savedInvoices) {
        try {
          const invs = JSON.parse(savedInvoices);
          const updated = invs.map((inv: any) => {
            if (inv.id === invoiceId) {
              const currentPaid = Number(inv.paidAmount) || 0;
              // Applying: paidAmount increases. Reverting: paidAmount decreases.
              const paidChange = revert ? -amount : amount;
              const newPaid = Math.max(0, currentPaid + paidChange);
              
              // Recalculate status
              let status: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
              if (newPaid >= Number(inv.totalAmount)) {
                status = 'Paid';
              } else if (newPaid > 0) {
                status = 'Partially Paid';
              } else {
                status = 'Unpaid';
              }
              return { ...inv, paidAmount: newPaid, status };
            }
            return inv;
          });
          localStorage.setItem('inven_generated_invoices', JSON.stringify(updated));
        } catch (e) {
          console.error('Error adjusting invoice paid amount:', e);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCategory = categories.find(c => c && c.id === formData.categoryId);
    const isCustomerPayment = selectedCategory?.name === 'Product Sales' || selectedCategory?.name === 'Customer Payment';
    const selectedCustomer = isCustomerPayment && formData.customerId 
      ? customers.find(c => c && c.id === formData.customerId)
      : null;
    
    const amount = Number(formData.amount) || 0;
    const allocationType = formData.allocationType || 'opening_balance';
    const selectedInvoice = allocationType === 'invoice' && formData.invoiceId
      ? invoices.find(inv => inv.id === formData.invoiceId)
      : null;

    if (editingId) {
      // Find the old record to revert its previous impact
      const oldRecord = incomes.find(r => r.id === editingId);
      if (oldRecord) {
        adjustCustomerBalanceAndInvoice(
          oldRecord.customerId,
          oldRecord.allocationType,
          oldRecord.invoiceId,
          oldRecord.amount,
          true // revert previous values
        );
      }

      // Apply new financial impact
      adjustCustomerBalanceAndInvoice(
        formData.customerId,
        allocationType,
        formData.invoiceId,
        amount,
        false // apply new values
      );

      const updated = incomes.map(b => b.id === editingId ? { 
        ...b, 
        ...formData as IncomeRecord,
        categoryName: selectedCategory?.name || b.categoryName,
        customerName: selectedCustomer ? selectedCustomer.name : (isCustomerPayment ? b.customerName : undefined),
        customerId: selectedCustomer ? selectedCustomer.id : (isCustomerPayment ? b.customerId : undefined),
        allocationType: isCustomerPayment ? allocationType : undefined,
        invoiceId: isCustomerPayment && allocationType === 'invoice' ? formData.invoiceId : undefined,
        invoiceNo: isCustomerPayment && allocationType === 'invoice' ? (selectedInvoice?.invoiceNo || formData.invoiceNo) : undefined
      } : b);
      saveIncomes(updated);
    } else {
      // Apply financial impact
      adjustCustomerBalanceAndInvoice(
        formData.customerId,
        allocationType,
        formData.invoiceId,
        amount,
        false // apply
      );

      const newRecord: IncomeRecord = {
        ...formData as IncomeRecord,
        id: `INC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        categoryName: selectedCategory?.name || 'Unknown',
        customerName: selectedCustomer ? selectedCustomer.name : undefined,
        customerId: selectedCustomer ? selectedCustomer.id : undefined,
        allocationType: isCustomerPayment ? allocationType : undefined,
        invoiceId: isCustomerPayment && allocationType === 'invoice' ? formData.invoiceId : undefined,
        invoiceNo: isCustomerPayment && allocationType === 'invoice' ? selectedInvoice?.invoiceNo : undefined,
        createdAt: new Date().toISOString(),
      };
      saveIncomes([newRecord, ...incomes]);
    }

    // Trigger sync
    window.dispatchEvent(new Event('inven_localstorage_sync'));

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer',
      allocationType: 'opening_balance'
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;
    const recordToDelete = incomes.find(r => r.id === deleteConfirmId);
    if (recordToDelete) {
      adjustCustomerBalanceAndInvoice(
        recordToDelete.customerId,
        recordToDelete.allocationType,
        recordToDelete.invoiceId,
        recordToDelete.amount,
        true // revert financial impact
      );
    }
    
    saveIncomes(incomes.filter(b => b.id !== deleteConfirmId));

    // Trigger sync
    window.dispatchEvent(new Event('inven_localstorage_sync'));
    setDeleteConfirmId(null);
  };

  const filteredIncomes = incomes.filter(b => 
    b && (
      (b.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const selectedCategory = categories.find(c => c && c.id === formData.categoryId);
  const isCustomerPayment = selectedCategory?.name === 'Product Sales' || selectedCategory?.name === 'Customer Payment';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Record Income</h2>
          <p className="text-sm text-slate-500">Track miscellaneous business incomes and customer balance payments.</p>
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
            <div className="absolute top-0 right-0 p-4">
               <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { setEditingId(income.id); setFormData(income); setIsFormOpen(true); }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(income.id)} 
                    className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
                  >
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
                  <div className="mt-1 flex flex-col gap-1 items-start">
                    <p className="text-xs text-indigo-600 font-bold bg-indigo-50/50 rounded-lg px-2 py-0.5 inline-block">
                      Client: {income.customerName}
                    </p>
                    {income.allocationType === 'opening_balance' ? (
                      <span className="text-[9px] text-amber-600 font-bold bg-amber-50 rounded px-2 py-0.5 inline-block">
                        Deducted from Opening Balance
                      </span>
                    ) : income.allocationType === 'invoice' && income.invoiceNo ? (
                      <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 rounded px-2 py-0.5 inline-block">
                        Paid Against Bill: #{income.invoiceNo}
                      </span>
                    ) : null}
                  </div>
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
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit' : 'Record'} Income
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Income Type / Category</label>
                <select 
                  required
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm appearance-none cursor-pointer"
                  value={formData.categoryId || ''}
                  onChange={(e) => {
                    const newCatId = e.target.value;
                    const catObj = categories.find(c => c && c.id === newCatId);
                    const isCatCust = catObj?.name === 'Product Sales' || catObj?.name === 'Customer Payment';
                    setFormData({
                      ...formData, 
                      categoryId: newCatId,
                      // clear customerId if not changing to/staying in Customer Payment category
                      customerId: isCatCust ? formData.customerId : undefined,
                      allocationType: 'opening_balance',
                      invoiceId: ''
                    });
                  }}
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {isCustomerPayment && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Select Customer</label>
                    <select 
                      required
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                      value={formData.customerId || ''}
                      onChange={(e) => {
                        const custId = e.target.value;
                        setFormData({
                          ...formData,
                          customerId: custId,
                          invoiceId: '', // reset selected invoice when customer changes
                          allocationType: 'opening_balance' // default allocation
                        });
                      }}
                    >
                      <option value="" disabled>Choose customer...</option>
                      {customers.map(cust => (
                        <option key={cust.id} value={cust.id}>{cust.name} ({cust.id})</option>
                      ))}
                    </select>
                  </div>

                  {formData.customerId && (() => {
                    const selectedCust = customers.find(c => c.id === formData.customerId);
                    const customerInvoices = invoices.filter(inv => {
                      const invBuyerName = (inv.buyer?.name || '').trim().toUpperCase();
                      const selCustName = (selectedCust?.name || '').trim().toUpperCase();
                      const invCustId = (inv.customerId || '').trim().toUpperCase();
                      const selCustId = (selectedCust?.id || '').trim().toUpperCase();
                      return (invBuyerName === selCustName && invBuyerName !== '') || (invCustId === selCustId && invCustId !== '');
                    });

                    // Include the invoice being edited even if its status is 'Paid' so it stays selectable
                    const outstandingInvoices = customerInvoices.filter(inv => 
                      inv.status !== 'Paid' || (editingId && inv.id === formData.invoiceId)
                    );

                    return (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                          <span>Opening Balance:</span>
                          <span className="font-bold text-slate-800">
                            ₹{(selectedCust?.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Payment Allocation</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, allocationType: 'opening_balance', invoiceId: '' })}
                              className={cn(
                                "py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center",
                                formData.allocationType === 'opening_balance' || !formData.allocationType
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              Opening Balance
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (outstandingInvoices.length === 0) {
                                  alert("This customer has no unpaid invoices.");
                                  return;
                                }
                                setFormData({ ...formData, allocationType: 'invoice' });
                              }}
                              className={cn(
                                "py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center",
                                formData.allocationType === 'invoice'
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              Specific Invoice ({outstandingInvoices.length})
                            </button>
                          </div>
                        </div>

                        {formData.allocationType === 'invoice' && (
                          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Choose Invoice / Bill Number</label>
                            <select
                              required
                              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm cursor-pointer"
                              value={formData.invoiceId || ''}
                              onChange={(e) => {
                                const invId = e.target.value;
                                const inv = outstandingInvoices.find(i => i.id === invId);
                                
                                // Get the base amount change. If editing, we can add back the amount currently recorded to reflect its limit
                                const originalRecAmount = editingId && formData.invoiceId === invId ? (formData.amount || 0) : 0;
                                const unpaid = inv ? (Number(inv.totalAmount) - (Number(inv.paidAmount) || 0) + originalRecAmount) : 0;
                                
                                setFormData({
                                  ...formData,
                                  invoiceId: invId,
                                  amount: unpaid // automatically set to remaining unpaid balance
                                });
                              }}
                            >
                              <option value="" disabled>Select Bill Number...</option>
                              {outstandingInvoices.map(inv => {
                                const originalRecAmount = editingId && formData.invoiceId === inv.id ? (formData.amount || 0) : 0;
                                const unpaid = Number(inv.totalAmount) - (Number(inv.paidAmount) || 0) + originalRecAmount;
                                return (
                                  <option key={inv.id} value={inv.id}>
                                    #{inv.invoiceNo} (Unpaid: ₹{unpaid.toLocaleString()})
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Amount (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="any"
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

      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8 space-y-6">
            <div className="flex gap-4 text-rose-600">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Delete Income Record?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete this income record? This action will permanently remove the record and automatically revert its financial impact from the customer's balance or invoice.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all active:scale-95"
              >
                No, Keep
              </button>
              <button 
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-3.5 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
