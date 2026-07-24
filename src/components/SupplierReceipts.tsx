import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Coins, 
  Trash2, 
  Edit2, 
  X, 
  Calendar,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Users,
  ArrowUpCircle,
  FileText,
  History,
  Info,
  Clock,
  Printer,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface SupplierPaymentRecord {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  date: string;
  paymentMode: string;
  notes: string;
  createdAt: string;
  supplierId?: string;
  supplierName?: string;
  // Dynamic fields matching Bank Ledger style
  txnDate?: string;
  txnTime?: string;
  valueDate?: string;
  particulars?: string;
  refNo?: string;
}

export default function SupplierReceipts() {
  const [payments, setPayments] = useState<SupplierPaymentRecord[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First of this month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [isOverallSupplierStatementOpen, setIsOverallSupplierStatementOpen] = useState(false);
  const [modalSelectedSupplierId, setModalSelectedSupplierId] = useState('');
  const [companyName, setCompanyName] = useState('P.S.V & CO');
  
  const [formData, setFormData] = useState<Partial<SupplierPaymentRecord>>({
    categoryId: 'EXP-CAT-SUPPLIER', // Supplier Payment
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    amount: 0,
    notes: '',
    txnDate: new Date().toISOString().split('T')[0],
    txnTime: new Date().toLocaleTimeString('en-GB', { hour12: false }), // e.g. "13:32:25"
    valueDate: new Date().toISOString().split('T')[0],
    particulars: '',
    refNo: ''
  });

  const loadAllData = () => {
    // Load recorded supplier payments
    const savedPayments = localStorage.getItem('inven_supplier_payments');
    if (savedPayments) {
      try { setPayments(JSON.parse(savedPayments)); } catch (e) { console.error(e); }
    } else {
      const defaultRecord: SupplierPaymentRecord[] = [];
      setPayments(defaultRecord);
      localStorage.setItem('inven_supplier_payments', JSON.stringify(defaultRecord));
    }

    // Load suppliers from master
    const savedSuppliers = localStorage.getItem('inven_suppliers');
    if (savedSuppliers) {
      try { setSuppliers(JSON.parse(savedSuppliers)); } catch (e) { console.error(e); }
    }

    // Load inventory purchases (to reflect Credits in statement)
    const savedInventory = localStorage.getItem('inven_inventory');
    if (savedInventory) {
      try { setInventoryItems(JSON.parse(savedInventory)); } catch (e) { console.error(e); }
    }

    try {
      const settings = JSON.parse(localStorage.getItem('inven_settings') || '{}');
      if (settings.companyName) {
        setCompanyName(settings.companyName);
      }
    } catch (e) {
      console.error(e);
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

  // Sync default modal selected supplier when main selection or supplier list changes
  useEffect(() => {
    if (selectedSupplier !== 'All') {
      const supp = suppliers.find(s => s && s.name === selectedSupplier);
      if (supp) {
        setModalSelectedSupplierId(supp.id);
      }
    } else if (suppliers.length > 0 && !modalSelectedSupplierId) {
      setModalSelectedSupplierId(suppliers[0].id);
    }
  }, [selectedSupplier, suppliers, modalSelectedSupplierId]);

  // Dynamically pre-populate particulars on new records based on inputs, matching bank-style nomenclature
  useEffect(() => {
    if (!editingId && isFormOpen) {
      const selectedSuppObj = suppliers.find(s => s && s.id === formData.supplierId);
      const sName = selectedSuppObj ? selectedSuppObj.name : 'SUPPLIER';
      const mode = formData.paymentMode || 'Bank Transfer';
      const ref = formData.refNo || '';
      
      let generated = '';
      if (mode.toLowerCase().includes('upi')) {
        generated = `UPI-DR-${ref || '12341740263'}-PhonePe-YESB-${sName.toUpperCase()}`;
      } else if (mode.toLowerCase().includes('bank') || mode.toLowerCase().includes('transfer') || mode.toLowerCase().includes('net')) {
        generated = `NEFT CR-SIBL0000053-${sName.toUpperCase().replace(/\s+/g, '')}-PSVCo-${ref || 'SIBLN2616'}`;
      } else if (mode.toLowerCase().includes('cash')) {
        generated = `CASH-DR-${sName.toUpperCase()}`;
      } else if (mode.toLowerCase().includes('cheque')) {
        generated = `CHQ-DR-${ref || '000123'}-CLG-${sName.toUpperCase()}`;
      } else {
        generated = `${mode.toUpperCase()}-DR-${ref || 'XXXX'}-${sName.toUpperCase()}`;
      }
      
      setFormData(prev => ({
        ...prev,
        particulars: generated
      }));
    }
  }, [formData.supplierId, formData.paymentMode, formData.refNo, isFormOpen, editingId, suppliers]);

  const savePayments = (data: SupplierPaymentRecord[]) => {
    setPayments(data);
    localStorage.setItem('inven_supplier_payments', JSON.stringify(data));
  };

  // Adjust supplier opening balance
  const adjustSupplierBalance = (
    supplierId: string | undefined,
    amount: number,
    revert: boolean = false
  ) => {
    if (!supplierId) return;
    
    // Applying payment (revert=false): we subtract from balance (reduce what we owe them).
    // Reverting payment (revert=true): we add back to balance (increase what we owe them).
    const change = revert ? amount : -amount;

    const savedSuppliers = localStorage.getItem('inven_suppliers');
    if (savedSuppliers) {
      try {
        const supps = JSON.parse(savedSuppliers);
        const updated = supps.map((s: any) => {
          if (s.id === supplierId) {
            // Support both opBalance and openingBalance for robust schema resilience
            const currentOB = s.opBalance !== undefined ? Number(s.opBalance) : (s.openingBalance !== undefined ? Number(s.openingBalance) : 0);
            const newOB = currentOB + change;
            
            return { 
              ...s, 
              opBalance: newOB,
              openingBalance: newOB // Maintain both keys in sync
            };
          }
          return s;
        });
        localStorage.setItem('inven_suppliers', JSON.stringify(updated));
        setSuppliers(updated);
      } catch (e) {
        console.error('Error adjusting supplier opening balance:', e);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedSupp = formData.supplierId 
      ? suppliers.find(s => s && s.id === formData.supplierId)
      : null;
    
    const amount = Number(formData.amount) || 0;

    // Use current time if time is not specified
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour12: false });

    if (editingId) {
      // Find the old record to revert its previous impact
      const oldRecord = payments.find(r => r.id === editingId);
      if (oldRecord) {
        adjustSupplierBalance(
          oldRecord.supplierId,
          oldRecord.amount,
          true // revert previous value (add it back)
        );
      }

      // Apply new financial impact (subtract new value)
      adjustSupplierBalance(
        formData.supplierId,
        amount,
        false // apply new value
      );

      const updated = payments.map(b => b.id === editingId ? { 
        ...b, 
        ...formData as SupplierPaymentRecord,
        categoryName: 'Supplier Payment',
        supplierName: selectedSupp ? selectedSupp.name : b.supplierName,
        supplierId: selectedSupp ? selectedSupp.id : b.supplierId,
        txnTime: formData.txnTime || b.txnTime || nowTime
      } : b);
      savePayments(updated);
    } else {
      // Apply financial impact (subtract value)
      adjustSupplierBalance(
        formData.supplierId,
        amount,
        false // apply
      );

      const newRecord: SupplierPaymentRecord = {
        ...formData as SupplierPaymentRecord,
        id: `PAY-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        categoryId: 'EXP-CAT-SUPPLIER',
        categoryName: 'Supplier Payment',
        supplierName: selectedSupp ? selectedSupp.name : undefined,
        supplierId: selectedSupp ? selectedSupp.id : undefined,
        createdAt: new Date().toISOString(),
        txnTime: formData.txnTime || nowTime
      };
      savePayments([newRecord, ...payments]);
    }

    // Trigger sync
    window.dispatchEvent(new Event('inven_localstorage_sync'));

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setIsSupplierDropdownOpen(false);
    setSupplierSearchQuery('');
    setFormData({
      categoryId: 'EXP-CAT-SUPPLIER',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer',
      amount: 0,
      notes: '',
      txnDate: new Date().toISOString().split('T')[0],
      txnTime: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      valueDate: new Date().toISOString().split('T')[0],
      particulars: '',
      refNo: ''
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;
    const recordToDelete = payments.find(r => r.id === deleteConfirmId);
    if (recordToDelete) {
      adjustSupplierBalance(
        recordToDelete.supplierId,
        recordToDelete.amount,
        true // revert financial impact (add it back)
      );
    }
    
    savePayments(payments.filter(b => b.id !== deleteConfirmId));

    // Trigger sync
    window.dispatchEvent(new Event('inven_localstorage_sync'));
    setDeleteConfirmId(null);
  };

  const isWithinRange = (dateStr: string) => {
    if (!dateStr) return true;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) {
        start.setHours(0, 0, 0, 0);
        if (d < start) return false;
      }
      if (end) {
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const supplierPayments = payments.filter(b => {
    if (!b || !b.supplierId) return false;
    const matchRange = isWithinRange(b.date);
    const matchSupplier = selectedSupplier === 'All' || b.supplierName === selectedSupplier;
    return matchRange && matchSupplier;
  });

  const filteredPayments = supplierPayments.filter(b => 
    b && (
      (b.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.particulars || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (b.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.refNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const selectedSupp = formData.supplierId ? suppliers.find(s => s && s.id === formData.supplierId) : null;
  
  // Calculate selected supplier's active total balance
  const activeSuppBalance = selectedSupp 
    ? (selectedSupp.opBalance !== undefined ? Number(selectedSupp.opBalance) : (selectedSupp.openingBalance !== undefined ? Number(selectedSupp.openingBalance) : 0))
    : 0;

  // Expected balance after subtracting the current input amount
  const inputAmount = Number(formData.amount) || 0;
  const expectedBalanceAfterPayment = activeSuppBalance - inputAmount;

  // Metrics
  const totalPaid = supplierPayments.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalOwedRemaining = suppliers.reduce((sum, s) => {
    const val = s.opBalance !== undefined ? Number(s.opBalance) : (s.openingBalance !== undefined ? Number(s.openingBalance) : 0);
    return sum + val;
  }, 0);

  // Dynamic ledger logic for rendering a full chronological bank statement style ledger
  const ledgerData = useMemo(() => {
    if (!modalSelectedSupplierId) return { txns: [], bfBalance: 0, hasBf: false, endBalance: 0 };

    const supplierObj = suppliers.find(s => s && s.id === modalSelectedSupplierId);
    if (!supplierObj) return { txns: [], bfBalance: 0, hasBf: false, endBalance: 0 };

    // 1. Gather recorded direct payments (Debits)
    const suppPayments = payments.filter(p => p.supplierId === modalSelectedSupplierId);
    const ledgerPayments = suppPayments.map(p => {
      const pDate = p.txnDate || p.date;
      const pTime = p.txnTime || "12:00:00";
      let dateObj: Date;
      if (p.createdAt) {
        dateObj = new Date(p.createdAt);
      } else {
        dateObj = new Date(`${pDate}T${pTime}`);
      }
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      return {
        id: p.id,
        txnDate: pDate,
        txnTime: pTime,
        valueDate: p.valueDate || p.date,
        particulars: p.particulars || `UPI-DR-${p.refNo || 'XXXX'}-PhonePe-${p.supplierName?.toUpperCase() || 'SUPPLIER'}`,
        refNo: p.refNo || p.id,
        debit: Number(p.amount) || 0,
        credit: 0,
        dateObj
      };
    });

    // 2. Gather recorded inventory lot purchases (Credits)
    const suppPurchases = inventoryItems.filter(item => item.supplierId === modalSelectedSupplierId);
    const ledgerPurchases = suppPurchases.map(item => {
      const amt = item.netAmount || item.totalCost || (Number(item.pricePerMeter) * Number(item.quantity)) || 0;
      const entryDate = item.entryDate || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
      
      let dateObj: Date;
      if (item.createdAt) {
        dateObj = new Date(item.createdAt);
      } else {
        dateObj = new Date(`${entryDate}T12:00:00`);
      }
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      const entryTime = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : "12:00:00";

      return {
        id: item.id,
        txnDate: entryDate,
        txnTime: entryTime,
        valueDate: entryDate,
        particulars: item.particulars || `Purchase Lot #${item.id} - ${item.fabricType || ''} (${item.quantity} ${item.unit || 'Meters'})`,
        refNo: item.id,
        debit: 0,
        credit: Number(amt) || 0,
        dateObj
      };
    });

    // 3. Combine and sort ascending chronologically
    const allTxns = [...ledgerPayments, ...ledgerPurchases].sort((a, b) => {
      const tA = a.dateObj.getTime();
      const tB = b.dateObj.getTime();
      if (tA !== tB) {
        return tA - tB;
      }
      return a.id.localeCompare(b.id);
    });

    // Calculate current live balance
    const totalCredits = allTxns.reduce((sum, t) => sum + t.credit, 0);
    const totalDebits = allTxns.reduce((sum, t) => sum + t.debit, 0);

    // Determine initial opening balance before any transactions
    let initialBalance = 0;
    if (supplierObj.initialBalance !== undefined) {
      initialBalance = Number(supplierObj.initialBalance);
    } else if (supplierObj.opBalance !== undefined) {
      // If opBalance was recorded, derive base initial balance or current balance
      const rawOp = Number(supplierObj.opBalance);
      // If rawOp was updated with payments only or both:
      initialBalance = rawOp;
    } else if (supplierObj.openingBalance !== undefined) {
      initialBalance = Number(supplierObj.openingBalance);
    }

    // Work backwards from current balance or forward from initial balance
    const currentBalance = initialBalance + totalCredits - totalDebits;
    const baseStartingBalance = initialBalance;

    // 5. Calculate cumulative running balance
    let bal = baseStartingBalance;
    const txnsWithBalance = allTxns.map(t => {
      bal = bal + t.credit - t.debit;
      return {
        ...t,
        balance: bal
      };
    });

    // 6. Split based on date filter for statement period
    const beforeTxns = txnsWithBalance.filter(t => t.txnDate < startDate);
    const bfBalance = beforeTxns.length > 0 ? beforeTxns[beforeTxns.length - 1].balance : baseStartingBalance;

    const filteredPeriodTxns = txnsWithBalance.filter(t => {
      const matchStart = !startDate || t.txnDate >= startDate;
      const matchEnd = !endDate || t.txnDate <= endDate;
      return matchStart && matchEnd;
    });

    return {
      txns: filteredPeriodTxns,
      bfBalance,
      hasBf: true, // We will always render B/F row for banking look-and-feel
      endBalance: currentBalance
    };
  }, [modalSelectedSupplierId, payments, inventoryItems, suppliers, startDate, endDate]);

  const activeModalSuppObj = useMemo(() => {
    return suppliers.find(s => s && s.id === modalSelectedSupplierId);
  }, [suppliers, modalSelectedSupplierId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Record Payments to Supplier</h2>
          <p className="text-sm text-slate-500">Maintain total outstanding balances of suppliers and record payments directly to reduce what is owed.</p>
        </div>
        <button 
          id="btn-record-supplier-payment"
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 bg-[#4f3df5] text-white px-5 py-3 rounded-2xl font-semibold hover:bg-[#3b2cd4] transition-all shadow-lg shadow-indigo-100 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Record Supplier Payment
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Paid in Period</span>
            <span className="text-2xl font-black text-slate-800">₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Outstanding Balance (Owed to Suppliers)</span>
            <span className="text-2xl font-black text-slate-800">₹{totalOwedRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Supplier Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">Filter by Supplier</label>
            <select
              id="select-filter-supplier"
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full bg-[#f8faff] border-none rounded-xl py-2.5 px-4 text-sm outline-none font-semibold text-slate-700 cursor-pointer"
            >
              <option value="All">All Active Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#f8faff] border-none rounded-xl py-2.5 px-4 text-sm outline-none font-semibold text-slate-700 font-mono"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#f8faff] border-none rounded-xl py-2.5 px-4 text-sm outline-none font-semibold text-slate-700 font-mono"
            />
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">Search Keywords</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search particulars, notes, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f8faff] border-none rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none font-medium text-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
          <p className="text-xs text-slate-400 font-semibold">
            Showing <span className="text-indigo-600 font-bold">{filteredPayments.length}</span> records in this selection
          </p>
          <button
            id="btn-view-ledger-statement"
            onClick={() => setIsOverallSupplierStatementOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer animate-pulse"
          >
            <FileText className="w-4 h-4" />
            View Ledger Statement (Bank Format)
          </button>
        </div>
      </div>

      {/* Table List Line Items */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                <th className="py-4 px-5">Receipt & Ref ID</th>
                <th className="py-4 px-5">Supplier Name & Particulars</th>
                <th className="py-4 px-5">Txn Date</th>
                <th className="py-4 px-5">Payment Mode</th>
                <th className="py-4 px-5 text-right">Debit (Amount Paid)</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPayments.map((payment, idx) => {
                return (
                  <tr key={`supp-pay-${payment.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4f3df5] shrink-0">
                          <ArrowUpCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-800 text-xs block">{payment.id}</span>
                          {payment.refNo ? (
                            <span className="text-[10px] font-mono text-indigo-600 block">Ref: {payment.refNo}</span>
                          ) : (
                            <span className="text-[9px] text-[#4f3df5] font-bold bg-indigo-50 rounded px-1.5 py-0.5 inline-block border border-indigo-100">
                              Debit Payment
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 align-top">
                      <h4 className="font-bold text-slate-800 text-sm">{payment.supplierName}</h4>
                      {payment.particulars && (
                        <p className="text-[11px] text-slate-600 mt-1 font-medium bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 inline-block max-w-sm truncate">
                          {payment.particulars}
                        </p>
                      )}
                      {payment.notes && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5">Notes: {payment.notes}</p>
                      )}
                    </td>
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-700">{payment.txnDate || payment.date}</span>
                        {payment.txnTime && <span className="font-mono text-[10px] text-slate-400">({payment.txnTime})</span>}
                      </div>
                    </td>
                    <td className="py-4 px-5 align-top">
                      <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-700 uppercase tracking-wider inline-flex items-center gap-1.5">
                        <Wallet className="w-3 h-3 text-slate-400" />
                        {payment.paymentMode || 'NET BANKING'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right align-top">
                      <span className="text-base font-bold text-[#029b6c] block font-mono">
                        ₹{(payment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center align-top">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => { 
                            setEditingId(payment.id); 
                            setFormData({
                              ...payment,
                              txnDate: payment.txnDate || payment.date,
                              txnTime: payment.txnTime || "12:00:00",
                              particulars: payment.particulars || '',
                              refNo: payment.refNo || ''
                            }); 
                            setIsFormOpen(true); 
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                          title="Edit Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(payment.id)} 
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium text-xs">No supplier payment records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit' : 'Record'} Supplier Payment (Debit)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Maintain standard ledger-compliant debit entries</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto flex-1">
              
              {/* Category selector (readonly indicator) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Type / Category</label>
                <div className="w-full bg-[#f8faff] rounded-2xl py-3.5 px-6 text-sm font-bold text-slate-700 shadow-sm border border-slate-100">
                  Supplier Payment
                </div>
              </div>

              {/* Searchable Supplier Dropdown */}
              <div className="space-y-2 relative">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Select Supplier</label>
                
                {/* Trigger / Display Box */}
                <div 
                  onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
                  className="w-full bg-[#f8faff] rounded-2xl py-3.5 px-6 text-sm font-bold text-slate-700 shadow-sm border border-slate-200/60 cursor-pointer flex items-center justify-between hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    {formData.supplierId ? (
                      <span>
                        {suppliers.find(s => s.id === formData.supplierId)?.name || 'Selected Supplier'} 
                        <span className="text-slate-400 font-normal ml-1.5 text-xs">({formData.supplierId})</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">-- Choose a Supplier --</span>
                    )}
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0", isSupplierDropdownOpen && "rotate-180")} />
                </div>

                {/* Dropdown Popup Menu */}
                {isSupplierDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 space-y-2 animate-in fade-in-50 zoom-in-95 duration-150">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        autoFocus
                        placeholder="Search supplier by name or ID..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                        value={supplierSearchQuery}
                        onChange={(e) => setSupplierSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* Supplier List Options */}
                    <div className="max-h-52 overflow-y-auto space-y-0.5 divide-y divide-slate-50">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, supplierId: '' });
                          setIsSupplierDropdownOpen(false);
                          setSupplierSearchQuery('');
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer",
                          !formData.supplierId ? "bg-indigo-50 text-indigo-600 font-bold" : "text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        <span>-- Choose a Supplier --</span>
                      </button>

                      {suppliers
                        .filter(s => 
                          !supplierSearchQuery || 
                          (s.name && s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())) ||
                          (s.id && s.id.toLowerCase().includes(supplierSearchQuery.toLowerCase()))
                        )
                        .map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, supplierId: s.id });
                              setIsSupplierDropdownOpen(false);
                              setSupplierSearchQuery('');
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer",
                              formData.supplierId === s.id ? "bg-indigo-50 text-[#4f3df5] font-bold" : "text-slate-700 hover:bg-slate-50 font-medium"
                            )}
                          >
                            <div>
                              <p className="font-bold text-slate-800">{s.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{s.id}</p>
                            </div>
                            {formData.supplierId === s.id && (
                              <CheckCircle2 className="w-4 h-4 text-[#4f3df5] shrink-0" />
                            )}
                          </button>
                        ))
                      }

                      {suppliers.filter(s => 
                        !supplierSearchQuery || 
                        (s.name && s.name.toLowerCase().includes(supplierSearchQuery.toLowerCase())) ||
                        (s.id && s.id.toLowerCase().includes(supplierSearchQuery.toLowerCase()))
                      ).length === 0 && (
                        <p className="text-center text-xs text-slate-400 py-3 font-medium">No matching suppliers found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Outstanding Balance card */}
              {formData.supplierId && (
                <div className="bg-[#f4f7fc]/90 p-5 rounded-[24px] border border-indigo-50/50 space-y-3 shadow-sm animate-in slide-in-from-top-4 duration-300">
                  
                  {/* Dynamic Balance Fields */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-500">Current Outstanding Balance:</span>
                      <span className="font-extrabold text-slate-800 text-base">
                        ₹{activeSuppBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200/50">
                      <span className="font-semibold text-slate-500">Post-Payment Outstanding:</span>
                      <span className={cn(
                        "font-extrabold text-base",
                        expectedBalanceAfterPayment <= 0 
                          ? "text-emerald-600" 
                          : expectedBalanceAfterPayment < activeSuppBalance 
                            ? "text-[#4f3df5]" 
                            : "text-slate-800"
                      )}>
                        ₹{expectedBalanceAfterPayment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 text-[11px] text-slate-500 font-medium">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>This payment (Debit) will reduce your outstanding balance.</span>
                  </div>
                </div>
              )}

              {/* Bank Ledger Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Txn Date */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Txn Date (Transaction Date)</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                    value={formData.txnDate || ''}
                    onChange={(e) => setFormData({...formData, txnDate: e.target.value, date: e.target.value})}
                  />
                </div>

                {/* Txn Time */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Txn Time (HH:MM:SS)</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. 13:32:25"
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold font-mono text-slate-700 shadow-sm"
                    value={formData.txnTime || ''}
                    onChange={(e) => setFormData({...formData, txnTime: e.target.value})}
                  />
                </div>
              </div>

              {/* Ref Number */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Ref. No. / Chq. No.</label>
                <input 
                  type="text" 
                  placeholder="e.g. 12341740263"
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold font-mono text-slate-700 shadow-sm"
                  value={formData.refNo || ''}
                  onChange={(e) => setFormData({...formData, refNo: e.target.value})}
                />
              </div>

              {/* Particulars (Pre-filled and fully editable) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Particulars (Transaction Description)</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. UPI-DR-12341740263-PhonePe-YESB"
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-800 shadow-sm"
                  value={formData.particulars || ''}
                  onChange={(e) => setFormData({...formData, particulars: e.target.value})}
                />
                <span className="text-[10px] text-slate-400 px-1">This is generated automatically from mode/ref-no but you can customize it completely.</span>
              </div>

              {/* Amount and Mode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Debit Amount (Amount Given ₹)</label>
                  <input 
                    required
                    id="input-amount"
                    type="number" 
                    step="any"
                    min="0.01"
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    placeholder="Enter debit amount"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Mode</label>
                  <select 
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.5rem_center] bg-no-repeat pr-12"
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
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Internal Notes</label>
                <textarea 
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm resize-none"
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional billing remarks..."
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-4 pt-4 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-[#f0f4f8] text-[#5c6e83] text-sm font-bold hover:bg-[#e4ebf3] transition-all active:scale-95 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3.5 rounded-2xl bg-[#4f3df5] text-white text-sm font-bold hover:bg-[#3b2cd4] transition-all active:scale-95 shadow-lg shadow-indigo-100 cursor-pointer"
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
                  Are you sure you want to delete this payment record? The supplier's outstanding balance will be automatically restored/recalculated.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all active:scale-95 cursor-pointer"
              >
                No, Keep
              </button>
              <button 
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-3.5 rounded-2xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-200 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overall Supplier Statement Dialog (BANK FORMAT) */}
      {isOverallSupplierStatementOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-250 print:static print:block print:w-full print:h-auto print:bg-white print:p-0">
          
          {/* Print specific media query styles to isolate printed statement component */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body {
                background: white !important;
                color: black !important;
              }
              .no-print {
                display: none !important;
              }
              #print-ledger-statement {
                display: block !important;
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
                box-shadow: none !important;
                border: none !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}} />

          <div id="print-ledger-statement" className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-left print:max-h-none print:overflow-visible print:h-auto print:border-none print:shadow-none print:p-6">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-indigo-50/10 flex items-center justify-between shrink-0 no-print">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#4f3df5]" />
                  Supplier Account Ledger Statement
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {/* Print button */}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Statement
                </button>
                <button 
                  onClick={() => setIsOverallSupplierStatementOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Statement Main Content */}
            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar print:max-h-none print:overflow-visible print:h-auto print:p-0">
              
              {/* Supplier Switcher inside Statement modal (highly professional) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Supplier Account</label>
                  <span className="text-sm font-bold text-slate-700">Displaying chronological transactions of selected ledger</span>
                </div>
                <select
                  value={modalSelectedSupplierId}
                  onChange={(e) => setModalSelectedSupplierId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl py-2 px-4 text-xs font-bold text-slate-700 outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500/50"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              {activeModalSuppObj ? (
                <>
                  {/* Header Details Summary (Bank Look-and-feel details box) */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-xs">
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Supplier Account Details</p>
                      <p className="text-lg font-black text-slate-800">
                        {activeModalSuppObj.name}
                      </p>
                      <div className="text-[11px] text-slate-500 space-y-0.5 font-medium">
                        <p>Supplier ID: <span className="font-bold text-slate-700">{activeModalSuppObj.id}</span></p>
                        {activeModalSuppObj.companyName && <p>Company: <span className="font-semibold text-slate-700">{activeModalSuppObj.companyName}</span></p>}
                        {activeModalSuppObj.phone && <p>Phone: {activeModalSuppObj.phone}</p>}
                        {activeModalSuppObj.gstNumber && <p>GSTIN: <span className="font-mono font-bold text-slate-700">{activeModalSuppObj.gstNumber}</span></p>}
                        {activeModalSuppObj.address && <p>Address: {activeModalSuppObj.address}</p>}
                      </div>
                      <p className="text-slate-500 font-semibold pt-1">
                        Statement Period: <span className="font-bold text-indigo-600">{startDate || 'Anytime'}</span> to <span className="font-bold text-indigo-600">{endDate || 'Anytime'}</span>
                      </p>
                    </div>
                    <div className="space-y-1.5 md:text-right self-start md:self-auto">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Statement Generator</p>
                      <p className="text-base font-black text-slate-800">{companyName}</p>
                      <p className="text-slate-500 font-semibold font-mono">Date: {new Date().toLocaleDateString('en-IN')}</p>
                      <p className="text-slate-500 font-semibold font-mono">Time: {new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</p>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
                      <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Total Debits in Period (Payments Made)</p>
                      <p className="text-xl font-black text-emerald-800">
                        ₹{ledgerData.txns.reduce((sum, t) => sum + t.debit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/50 space-y-1">
                      <p className="text-[9px] uppercase font-bold text-amber-700 tracking-wider">Outstanding Outstanding Balance (Owed)</p>
                      <p className="text-xl font-black text-amber-800">
                        ₹{ledgerData.endBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {/* Ledger / Bank Statement Table */}
                  <div className="space-y-3 pt-2 relative">
                    <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                      Chronological Ledger Statement
                    </h4>

                    {/* Table Box Wrapper with relative position for the watermark */}
                    <div className="relative border border-[#aed691] rounded-2xl overflow-hidden shadow-sm min-h-[300px]">
                      
                      {/* Authentic KVB Background Watermark matching the image perfectly */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] select-none pointer-events-none z-0">
                        <span className="text-[140px] md:text-[220px] font-black tracking-widest text-[#7cb04c]">KVB</span>
                      </div>

                      <table className="w-full text-xs text-left border-collapse relative z-10">
                        <thead className="bg-[#7cb04c] text-[11px] text-slate-900 font-black uppercase tracking-wider border-b border-[#aed691]">
                          <tr>
                            <th className="py-3.5 px-4 border-r border-[#6aa137]/30 text-slate-950 font-extrabold">Txn Date</th>
                            <th className="py-3.5 px-4 border-r border-[#6aa137]/30 text-slate-950 font-extrabold">Particulars</th>
                            <th className="py-3.5 px-4 border-r border-[#6aa137]/30 text-slate-950 font-extrabold">Ref. No.</th>
                            <th className="py-3.5 px-4 border-r border-[#6aa137]/30 text-slate-950 font-extrabold text-right">Debit</th>
                            <th className="py-3.5 px-4 border-r border-[#6aa137]/30 text-slate-950 font-extrabold text-right">Credit</th>
                            <th className="py-3.5 px-4 text-slate-950 font-extrabold text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#cce5b8] font-semibold text-slate-700 bg-white/95">
                          
                          {/* B/F Balance Forward Entry */}
                          {ledgerData.hasBf && (
                            <tr className="hover:bg-slate-50/50 transition-colors bg-slate-50/20">
                              <td className="py-3 px-4 font-mono font-bold text-slate-600">{startDate || '10-JUN-2026'}</td>
                              <td className="py-3 px-4 font-black text-slate-800">B/F...</td>
                              <td className="py-3 px-4 text-slate-400 font-mono text-center">-</td>
                              <td className="py-3 px-4 text-right text-slate-400 font-mono">-</td>
                              <td className="py-3 px-4 text-right text-slate-400 font-mono">-</td>
                              <td className="py-3 px-4 text-right font-black font-mono text-slate-800">
                                {ledgerData.bfBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          )}

                          {/* Dynamic transaction list (Debits and Credits) */}
                          {ledgerData.txns.map((tx, idx) => (
                            <tr key={`supp-tx-${tx.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-4 font-mono text-slate-600">
                                <div>{tx.txnDate}</div>
                                {tx.txnTime && (
                                  <div className="text-[10px] text-slate-400 font-medium">{tx.txnTime}</div>
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-800 break-words max-w-xs leading-relaxed">
                                {tx.particulars}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-600">{tx.refNo}</td>
                              <td className={cn(
                                "py-3 px-4 text-right font-mono",
                                tx.debit > 0 ? "text-rose-600 font-bold" : "text-slate-400"
                              )}>
                                {tx.debit > 0 ? tx.debit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                              </td>
                              <td className={cn(
                                "py-3 px-4 text-right font-mono",
                                tx.credit > 0 ? "text-indigo-600 font-bold" : "text-slate-400"
                              )}>
                                {tx.credit > 0 ? tx.credit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                              </td>
                              <td className="py-3 px-4 text-right font-black font-mono text-slate-800">
                                {tx.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}

                          {ledgerData.txns.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-slate-400 font-bold bg-white z-20">
                                No payments or purchases found for this supplier within the period.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-10">
                  <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">Please select an active supplier to generate a bank ledger statement.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
