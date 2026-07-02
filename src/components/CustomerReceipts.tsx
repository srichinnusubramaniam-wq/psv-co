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
  AlertTriangle,
  Receipt,
  Users,
  ArrowDownLeft,
  ArrowDownCircle,
  FileText
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

export default function CustomerReceipts() {
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<IncomeRecord>>({
    categoryId: 'INC-CAT-002', // Customer Payment
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    allocationType: 'opening_balance',
    amount: 0,
    notes: ''
  });

  const loadAllData = () => {
    // Load recorded incomes (which holds customer receipts as well)
    const savedIncomes = localStorage.getItem('inven_income_records');
    if (savedIncomes) {
      try { setIncomes(JSON.parse(savedIncomes)); } catch (e) { console.error(e); }
    } else {
      const defaultRecord: IncomeRecord[] = [
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
      setIncomes(defaultRecord);
      localStorage.setItem('inven_income_records', JSON.stringify(defaultRecord));
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
    
    const factor = revert ? 1 : -1; // reverting adds back to balance, applying subtracts

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
          setCustomers(updated);
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
          setInvoices(updated);
        } catch (e) {
          console.error('Error adjusting invoice paid amount:', e);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCustomer = formData.customerId 
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
        categoryName: 'Customer Payment',
        customerName: selectedCustomer ? selectedCustomer.name : b.customerName,
        customerId: selectedCustomer ? selectedCustomer.id : b.customerId,
        allocationType: allocationType,
        invoiceId: allocationType === 'invoice' ? formData.invoiceId : undefined,
        invoiceNo: allocationType === 'invoice' ? (selectedInvoice?.invoiceNo || formData.invoiceNo) : undefined
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
        categoryId: 'INC-CAT-002',
        categoryName: 'Customer Payment',
        customerName: selectedCustomer ? selectedCustomer.name : undefined,
        customerId: selectedCustomer ? selectedCustomer.id : undefined,
        allocationType: allocationType,
        invoiceId: allocationType === 'invoice' ? formData.invoiceId : undefined,
        invoiceNo: allocationType === 'invoice' ? selectedInvoice?.invoiceNo : undefined,
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
      categoryId: 'INC-CAT-002',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer',
      allocationType: 'opening_balance',
      amount: 0,
      notes: ''
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

  // Only show incomes from customer payments
  const customerIncomes = incomes.filter(b => b && b.customerId);

  const filteredIncomes = customerIncomes.filter(b => 
    b && (
      (b.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.invoiceNo || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const selectedCust = formData.customerId ? customers.find(c => c && c.id === formData.customerId) : null;
  
  // Find outstanding invoices for selected customer
  const outstandingInvoices = selectedCust 
    ? invoices.filter(inv => {
        if (!inv) return false;
        
        const invBuyerName = (inv.buyer?.name || '').trim().toUpperCase();
        const selCustName = (selectedCust?.name || '').trim().toUpperCase();
        const invCustId = (inv.customerId || '').trim().toUpperCase();
        const selCustId = (selectedCust?.id || '').trim().toUpperCase();
        
        const isMatchingCustomer = 
          (invBuyerName === selCustName && invBuyerName !== '') || 
          (invCustId === selCustId && invCustId !== '') ||
          (invBuyerName.replace(/\(.*\)/g, '').trim() === selCustName.replace(/\(.*\)/g, '').trim() && invBuyerName !== '') ||
          (invBuyerName.includes(selCustName) && selCustName !== '') ||
          (selCustName.includes(invBuyerName) && invBuyerName !== '');
        
        const isUnpaid = inv.status !== 'Paid' || (editingId && inv.id === formData.invoiceId);
        const hasBalance = (Number(inv.totalAmount) - (Number(inv.paidAmount) || 0) > 0) || (editingId && inv.id === formData.invoiceId);
        
        return isMatchingCustomer && isUnpaid && hasBalance;
      })
    : [];

  // Metrics
  const totalReceived = customerIncomes.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalOpeningBalanceRemaining = customers.reduce((sum, c) => sum + (Number(c.openingBalance) || 0), 0);
  const totalUnpaidInvoicesAmount = invoices.reduce((sum, inv) => {
    if (inv && inv.status !== 'Paid') {
      const remaining = Number(inv.totalAmount) - (Number(inv.paidAmount) || 0);
      return sum + Math.max(0, remaining);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Record Incomes from Customer</h2>
          <p className="text-sm text-slate-500">Maintain customer balances, track payments against opening balances, and allocate specific bills/invoice numbers.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 bg-[#4f3df5] text-white px-5 py-3 rounded-2xl font-semibold hover:bg-[#3b2cd4] transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-4 h-4" />
          Record Customer Income
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Received</span>
            <span className="text-2xl font-black text-slate-800">₹{totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Remaining Opening Balance</span>
            <span className="text-2xl font-black text-slate-800">₹{totalOpeningBalanceRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Outstanding Bill Amount</span>
            <span className="text-2xl font-black text-slate-800">₹{totalUnpaidInvoicesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search records by customer name, bill number, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f8faff] border-none rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-700"
          />
        </div>
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredIncomes.map((income) => (
          <div key={income.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
               <div className="flex items-center gap-1">
                  <button 
                    onClick={() => { 
                      setEditingId(income.id); 
                      setFormData(income); 
                      setIsFormOpen(true); 
                    }}
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
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#4f3df5]">
                <ArrowDownCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{income.id}</p>
                <h4 className="text-base font-bold text-slate-800 truncate">{income.customerName}</h4>
                <div className="mt-1 flex flex-col gap-1 items-start">
                  {income.allocationType === 'opening_balance' ? (
                    <span className="text-[9px] text-amber-600 font-bold bg-amber-50 rounded-lg px-2 py-0.5 inline-block border border-amber-100">
                      Deducted from Opening Balance
                    </span>
                  ) : income.allocationType === 'invoice' && income.invoiceNo ? (
                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 rounded-lg px-2 py-0.5 inline-block border border-emerald-100">
                      Paid Against Bill: #{income.invoiceNo}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="bg-[#f8faff] rounded-2xl p-4 space-y-3 border border-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount</span>
                <span className="text-xl font-bold text-[#029b6c]">₹{(income.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{income.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-slate-400" />
                  <span className="bg-white border border-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 uppercase">
                    {income.paymentMode}
                  </span>
                </div>
              </div>
              {income.notes && (
                <p className="text-[11px] text-slate-500 line-clamp-2 italic pt-2 border-t border-slate-100/50">
                  {income.notes}
                </p>
              )}
            </div>
          </div>
        ))}
        {filteredIncomes.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No customer income records found.</p>
          </div>
        )}
      </div>

      {/* Record Income modal matching the user's reference image */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
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

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
              
              {/* Category selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Income Type / Category</label>
                <select 
                  required
                  disabled
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none font-bold text-slate-700 shadow-sm appearance-none cursor-not-allowed"
                  value={formData.categoryId || 'INC-CAT-002'}
                >
                  <option value="INC-CAT-002">Customer Payment</option>
                  <option value="INC-CAT-001">Product Sales</option>
                </select>
              </div>

              {/* Customer Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Select Customer</label>
                <select 
                  required
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.5rem_center] bg-no-repeat pr-12"
                  value={formData.customerId || ''}
                  onChange={(e) => {
                    const custId = e.target.value;
                    setFormData({
                      ...formData, 
                      customerId: custId,
                      invoiceId: '',
                      allocationType: 'opening_balance'
                    });
                  }}
                >
                  <option value="">-- Choose a Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Opening Balance card + allocation + Choose Invoice, matching prompt screen exactly */}
              {formData.customerId && (
                <div className="bg-[#f4f7fc]/90 p-6 rounded-[24px] border border-indigo-50/50 space-y-4 shadow-sm">
                  
                  {/* Opening Balance Header */}
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
                    <span>Opening Balance:</span>
                    <span className="font-bold text-slate-800">
                      ₹{(selectedCust?.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Payment Allocation Toggle Buttons */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Payment Allocation</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, allocationType: 'opening_balance', invoiceId: '' })}
                        className={cn(
                          "py-3 px-4 rounded-xl text-xs font-bold border transition-all text-center shadow-sm",
                          formData.allocationType === 'opening_balance' || !formData.allocationType
                            ? "bg-[#4f3df5] border-[#4f3df5] text-white shadow-indigo-100"
                            : "bg-white border-[#d2dbec] text-[#5c6e83] hover:bg-slate-50"
                        )}
                      >
                        Opening Balance
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, allocationType: 'invoice' });
                        }}
                        className={cn(
                          "py-3 px-4 rounded-xl text-xs font-bold border transition-all text-center shadow-sm",
                          formData.allocationType === 'invoice'
                            ? "bg-[#4f3df5] border-[#4f3df5] text-white shadow-indigo-100"
                            : "bg-white border-[#d2dbec] text-[#5c6e83] hover:bg-slate-50"
                        )}
                      >
                        Specific Invoice ({outstandingInvoices.length})
                      </button>
                    </div>
                  </div>

                  {/* Conditional Bill Number selector */}
                  {formData.allocationType === 'invoice' && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Choose Invoice / Bill Number</label>
                      <select
                        required
                        className="w-full bg-white border border-[#d2dbec] rounded-2xl py-3 px-4 pr-10 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.1rem_1.1rem] bg-[right_1rem_center] bg-no-repeat"
                        value={formData.invoiceId || ''}
                        onChange={(e) => {
                          const invId = e.target.value;
                          const selectedInv = invoices.find(inv => inv.id === invId);
                          const remainingUnpaid = selectedInv ? (Number(selectedInv.totalAmount) - (Number(selectedInv.paidAmount) || 0)) : 0;
                          setFormData({ 
                            ...formData, 
                            invoiceId: invId,
                            invoiceNo: selectedInv?.invoiceNo,
                            amount: remainingUnpaid
                          });
                        }}
                      >
                        <option value="">-- Select Bill Number --</option>
                        {outstandingInvoices.map(inv => {
                          const remaining = Number(inv.totalAmount) - (Number(inv.paidAmount) || 0);
                          return (
                            <option key={inv.id} value={inv.id}>
                              #{inv.invoiceNo} (Unpaid: ₹{remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Amount and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Amount (₹)</label>
                  <input 
                    required
                    type="number" 
                    step="any"
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    placeholder="5229"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Mode</label>
                <select 
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.5rem_center] bg-no-repeat pr-12"
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

              {/* Notes */}
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

              {/* Modal Buttons */}
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-[#f0f4f8] text-[#5c6e83] text-sm font-bold hover:bg-[#e4ebf3] transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-[#4f3df5] text-white text-sm font-bold hover:bg-[#3b2cd4] transition-all active:scale-95 shadow-lg shadow-indigo-100"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8 space-y-6">
            <div className="flex gap-4 text-rose-600">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Delete Record?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to delete this payment record? The customer's opening balance or outstanding invoice will be automatically restored/recalculated.
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
