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
  allocationType?: 'total_balance' | 'opening_balance' | 'invoice';
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
    categoryId: 'INC-CAT-002', // Default to Customer Payment
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    allocationType: 'total_balance'
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
      try { 
        let parsedIncomes = JSON.parse(savedIncomes);
        const cleanIncomes = parsedIncomes.filter((inc: any) => 
          inc && 
          inc.date !== '24/07/2026' && 
          inc.date !== '2026-07-24' && 
          inc.invoiceNo !== 'PSV&CO/25-26/01'
        );
        if (cleanIncomes.length !== parsedIncomes.length) {
          localStorage.setItem('inven_income_records', JSON.stringify(cleanIncomes));
        }
        setIncomes(cleanIncomes); 
      } catch (e) { console.error(e); }
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
      try { 
        let parsedInvs = JSON.parse(savedInvoices);
        const cleanInvs = parsedInvs.filter((i: any) => 
          i && 
          i.date !== '24/07/2026' && 
          i.date !== '2026-07-24' && 
          i.invoiceNo !== 'PSV&CO/25-26/01'
        );
        if (cleanInvs.length !== parsedInvs.length) {
          localStorage.setItem('inven_generated_invoices', JSON.stringify(cleanInvs));
        }
        setInvoices(cleanInvs); 
      } catch (e) { console.error(e); }
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
    allocationType: 'total_balance' | 'opening_balance' | 'invoice' | undefined,
    invoiceId: string | undefined,
    amount: number,
    revert: boolean = false
  ) => {
    if (!customerId || amount <= 0) return;
    
    const savedCustomers = localStorage.getItem('inven_customers');
    const savedInvoices = localStorage.getItem('inven_generated_invoices');
    let custs = savedCustomers ? JSON.parse(savedCustomers) : [];
    let invs = savedInvoices ? JSON.parse(savedInvoices) : [];

    // 1. Total Balance Allocation (Applies to Opening Balance first, then unpaid invoices FIFO)
    if (allocationType === 'total_balance') {
      const custObj = custs.find((c: any) => c.id === customerId);
      const selCustName = String(custObj?.name || '').toLowerCase().trim();

      if (!revert) {
        let remAmount = amount;
        // Step A: Pay off opening balance first
        custs = custs.map((c: any) => {
          if (c.id === customerId) {
            const currentOB = Number(c.openingBalance) || 0;
            if (currentOB > 0) {
              const obPaid = Math.min(currentOB, remAmount);
              remAmount -= obPaid;
              return { ...c, openingBalance: Math.max(0, currentOB - obPaid) };
            }
          }
          return c;
        });

        // Step B: Pay remaining amount towards unpaid invoices (oldest to newest)
        if (remAmount > 0) {
          const custInvoices = invs
            .filter((inv: any) => {
              const invBuyer = String(inv.buyerName || '').toLowerCase().trim();
              return (invBuyer.includes(selCustName) || selCustName.includes(invBuyer)) && inv.status !== 'Paid';
            })
            .sort((a: any, b: any) => new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime());

          for (const inv of custInvoices) {
            if (remAmount <= 0) break;
            const currentPaid = Number(inv.paidAmount) || 0;
            const total = Number(inv.totalAmount) || 0;
            const unpaid = Math.max(0, total - currentPaid);
            if (unpaid > 0) {
              const payAmt = Math.min(unpaid, remAmount);
              remAmount -= payAmt;
              const newPaid = currentPaid + payAmt;
              let status: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
              if (newPaid >= total) status = 'Paid';
              else if (newPaid > 0) status = 'Partially Paid';

              invs = invs.map((i: any) => i.id === inv.id ? { ...i, paidAmount: newPaid, status } : i);
            }
          }
        }
      } else {
        // REVERTING PAYMENT
        let remAmount = amount;
        // Step A: Revert from invoices first (newest to oldest)
        const custInvoices = invs
          .filter((inv: any) => {
            const invBuyer = String(inv.buyerName || '').toLowerCase().trim();
            return (invBuyer.includes(selCustName) || selCustName.includes(invBuyer)) && (Number(inv.paidAmount) || 0) > 0;
          })
          .sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime());

        for (const inv of custInvoices) {
          if (remAmount <= 0) break;
          const currentPaid = Number(inv.paidAmount) || 0;
          const revertAmt = Math.min(currentPaid, remAmount);
          remAmount -= revertAmt;
          const newPaid = Math.max(0, currentPaid - revertAmt);
          const total = Number(inv.totalAmount) || 0;
          let status: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
          if (newPaid >= total) status = 'Paid';
          else if (newPaid > 0) status = 'Partially Paid';

          invs = invs.map((i: any) => i.id === inv.id ? { ...i, paidAmount: newPaid, status } : i);
        }

        // Step B: Revert any remaining amount back to opening balance
        if (remAmount > 0) {
          custs = custs.map((c: any) => {
            if (c.id === customerId) {
              const currentOB = Number(c.openingBalance) || 0;
              return { ...c, openingBalance: currentOB + remAmount };
            }
            return c;
          });
        }
      }

      localStorage.setItem('inven_customers', JSON.stringify(custs));
      localStorage.setItem('inven_generated_invoices', JSON.stringify(invs));
      setCustomers(custs);
      setInvoices(invs);
      return;
    }

    const factor = revert ? 1 : -1; // reverting adds back, applying subtracts

    // 2. If applied to opening balance
    if (allocationType === 'opening_balance' || !allocationType) {
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
    }

    // 3. If applied to invoice
    if (allocationType === 'invoice' && invoiceId) {
      const updated = invs.map((inv: any) => {
        if (inv.id === invoiceId) {
          const currentPaid = Number(inv.paidAmount) || 0;
          const paidChange = revert ? -amount : amount;
          const newPaid = Math.max(0, currentPaid + paidChange);
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
    const allocationType = formData.allocationType || 'total_balance';
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
    const customerPaymentCat = categories.find(c => c && c.name === 'Customer Payment');
    setFormData({
      categoryId: customerPaymentCat ? customerPaymentCat.id : 'INC-CAT-002',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer',
      allocationType: 'total_balance'
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

  // Construct opening balance rows for customers
  const openingBalanceRows: any[] = [];
  customers.forEach(c => {
    if (!c || !c.name) return;
    const currentOB = Number(c.openingBalance) || 0;
    const obPaidSum = incomes
      .filter(inc => inc && (inc.customerId === c.id || (inc.customerName && c.name && inc.customerName.trim().toLowerCase() === c.name.trim().toLowerCase())) && inc.allocationType === 'opening_balance')
      .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
    
    const initialOB = currentOB + obPaidSum;
    if (initialOB > 0) {
      const matchesSearch = !searchQuery || 
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        'opening balance'.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (matchesSearch) {
        openingBalanceRows.push({
          id: `OB-${c.id}`,
          isOpeningBalance: true,
          date: c.createdAt ? c.createdAt.split('T')[0] : '2026-07-01',
          customerName: c.name,
          customerId: c.id,
          debitAmount: initialOB,
          notes: 'Opening Balance'
        });
      }
    }
  });

  const displayRecords = [...openingBalanceRows, ...filteredIncomes].sort((a, b) => {
    if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
    if (a.isOpeningBalance) return -1;
    if (b.isOpeningBalance) return 1;
    return (a.id || '').localeCompare(b.id || '');
  });

  const selectedCategory = categories.find(c => c && c.id === formData.categoryId);
  const isCustomerPayment = selectedCategory?.name === 'Product Sales' || selectedCategory?.name === 'Customer Payment';

  const handleViewInvoiceBill = (invoiceNo: string) => {
    if (!invoiceNo) return;
    localStorage.setItem('inven_target_view_invoice', invoiceNo);
    window.dispatchEvent(new CustomEvent('inven_navigate_tab', { detail: { view: 'billing', invoiceNo } }));
    window.dispatchEvent(new CustomEvent('inven_view_invoice', { detail: { invoiceNo } }));
  };

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

      {/* Table List View */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-5">Date</th>
                <th className="py-4 px-5">Bill No.</th>
                <th className="py-4 px-5">Customer Name</th>
                <th className="py-4 px-5">Payment Mode</th>
                <th className="py-4 px-5">Payment ID</th>
                <th className="py-4 px-5 text-right">Credit (₹)</th>
                <th className="py-4 px-5 text-right">Debit (₹)</th>
                <th className="py-4 px-5 text-right">Balance (₹)</th>
                <th className="py-4 px-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {displayRecords.map((item) => {
                const selCust = customers.find(c => (item.customerId && c.id === item.customerId) || (c.name && item.customerName && c.name.trim().toLowerCase() === item.customerName.trim().toLowerCase()));
                const selCustName = (item.customerName || selCust?.name || '').trim().toLowerCase();
                
                const custInvoicesList = invoices.filter(inv => {
                  if (!inv) return false;
                  const bName = String(inv.buyerName || inv.buyer?.name || '').trim().toLowerCase();
                  return selCustName !== '' && (bName.includes(selCustName) || selCustName.includes(bName));
                });

                // Calculate Customer Balance
                const currentOB = selCust ? Math.max(0, Number(selCust.openingBalance) || 0) : 0;
                const obPaidSum = incomes
                  .filter(inc => inc && (inc.customerId === selCust?.id || (inc.customerName && selCust?.name && inc.customerName.trim().toLowerCase() === selCust.name.trim().toLowerCase())) && inc.allocationType === 'opening_balance')
                  .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
                const initialOB = currentOB + obPaidSum;

                const custInvoicesSum = custInvoicesList.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
                const initialBalance = initialOB + custInvoicesSum;

                if (item.isOpeningBalance) {
                  const runningBalance = initialBalance;
                  return (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors group bg-amber-50/10">
                      <td className="py-3.5 px-5 font-mono text-slate-600 whitespace-nowrap">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg font-bold font-mono text-[11px] uppercase tracking-wider">
                          Opening Balance
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-800">
                        {item.customerName || '-'}
                      </td>
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="text-slate-400 font-mono">-</span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-amber-600 font-bold whitespace-nowrap">
                        OB
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-400 whitespace-nowrap font-mono">
                        ₹0.00
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-rose-600 whitespace-nowrap font-mono">
                        ₹{(item.debitAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-slate-800 whitespace-nowrap font-mono">
                        ₹{runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-5 text-center whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Master OB
                        </span>
                      </td>
                    </tr>
                  );
                }

                const income = item;
                // Calculate Invoice Number / Bill No
                let invNo = income.invoiceNo || (income.invoiceId ? invoices.find(i => i.id === income.invoiceId)?.invoiceNo : null);
                if (!invNo && custInvoicesList.length > 0) {
                  invNo = custInvoicesList.map(i => i.invoiceNo).filter(Boolean).join(', ');
                }

                // Payments made up to this receipt
                const customerPayments = incomes.filter(inc => {
                  const incCustName = String(inc.customerName || '').trim().toLowerCase();
                  const matchesCust = (inc.customerId && income.customerId && inc.customerId === income.customerId) ||
                    (incCustName !== '' && selCustName !== '' && (incCustName.includes(selCustName) || selCustName.includes(incCustName)));
                  return matchesCust;
                });
                
                // Sum payments prior or equal to this income record
                const totalPaidUpToThis = customerPayments
                  .filter(inc => inc.date < income.date || (inc.date === income.date && inc.id <= income.id))
                  .reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
                  
                const runningBalance = Math.max(0, initialBalance - totalPaidUpToThis);

                return (
                  <tr key={income.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="py-3.5 px-5 font-mono text-slate-600 whitespace-nowrap">
                      {income.date}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {invNo ? (
                        <button
                          type="button"
                          onClick={() => handleViewInvoiceBill(invNo.split(',')[0].trim())}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold font-mono text-[11px] cursor-pointer transition-colors text-left"
                          title="Click to view bill on Billing page"
                        >
                          {invNo}
                        </button>
                      ) : income.allocationType === 'opening_balance' ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-semibold">
                          Opening Balance
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {income.customerName || income.categoryName || '-'}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase tracking-wider">
                        {income.paymentMode || 'Cash'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-indigo-600 font-bold whitespace-nowrap">
                      {income.id}
                    </td>
                    <td className="py-3.5 px-5 text-right font-bold text-emerald-600 whitespace-nowrap font-mono">
                      ₹{(Number(income.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5 text-right text-slate-400 whitespace-nowrap font-mono">
                      ₹0.00
                    </td>
                    <td className="py-3.5 px-5 text-right font-extrabold text-slate-800 whitespace-nowrap font-mono">
                      ₹{runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => { 
                            setEditingId(income.id); 
                            setFormData(income); 
                            setIsFormOpen(true); 
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(income.id)} 
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredIncomes.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="font-medium text-sm">No income records found matching your selection.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
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
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.5rem_center] bg-no-repeat pr-12"
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
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23475569%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_1.5rem_center] bg-no-repeat pr-12"
                      value={formData.customerId || ''}
                      onChange={(e) => {
                        const custId = e.target.value;
                        const cust = customers.find(c => c && c.id === custId);
                        if (cust) {
                          const selCustName = String(cust.name || '').toLowerCase().trim();
                          const custOB = Math.max(0, Number(cust.openingBalance) || 0);
                          const custInvs = invoices.filter(inv => {
                            if (!inv) return false;
                            const bName = String(inv.buyerName || '').toLowerCase().trim();
                            return (bName.includes(selCustName) || selCustName.includes(bName)) && inv.status !== 'Paid';
                          });
                          const unpaidSum = custInvs.reduce((sum, inv) => sum + Math.max(0, Number(inv.totalAmount) - (Number(inv.paidAmount) || 0)), 0);
                          const totalRem = custOB + unpaidSum;

                          setFormData({
                            ...formData, 
                            customerId: custId,
                            invoiceId: '',
                            allocationType: 'total_balance',
                            amount: totalRem
                          });
                        } else {
                          setFormData({
                            ...formData, 
                            customerId: '',
                            invoiceId: '',
                            allocationType: 'total_balance',
                            amount: 0
                          });
                        }
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
                    const outstandingInvoices = invoices.filter(inv => {
                      if (!inv) return false;
                      
                      const invBuyerName = (inv.buyer?.name || inv.buyerName || '').trim().toLowerCase();
                      const selCustName = (selectedCust?.name || '').trim().toLowerCase();
                      const invCustId = (inv.customerId || '').trim().toLowerCase();
                      const selCustId = (selectedCust?.id || '').trim().toLowerCase();
                      
                      const isMatchingCustomer = 
                        (invBuyerName === selCustName && invBuyerName !== '') || 
                        (invCustId === selCustId && invCustId !== '') ||
                        (invBuyerName.includes(selCustName) && selCustName !== '') ||
                        (selCustName.includes(invBuyerName) && invBuyerName !== '');
                      
                      const isUnpaid = inv.status !== 'Paid' || (editingId && inv.id === formData.invoiceId);
                      const hasBalance = (Number(inv.totalAmount) - (Number(inv.paidAmount) || 0) > 0) || (editingId && inv.id === formData.invoiceId);
                      
                      return isMatchingCustomer && isUnpaid && hasBalance;
                    });

                    const custOB = Math.max(0, Number(selectedCust?.openingBalance) || 0);
                    const unpaidInvoicesSum = outstandingInvoices.reduce((sum, inv) => {
                      const originalRecAmount = editingId && formData.invoiceId === inv.id ? (formData.amount || 0) : 0;
                      const unpaid = Number(inv.totalAmount) - (Number(inv.paidAmount) || 0) + originalRecAmount;
                      return sum + (unpaid > 0 ? unpaid : 0);
                    }, 0);
                    const totalRemainingAmount = custOB + unpaidInvoicesSum;

                    return (
                      <div className="bg-[#f4f7fc]/90 p-4 rounded-[24px] border border-indigo-50/50 shadow-sm">
                        
                        {/* Total Remaining Balance Header Box */}
                        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 block mb-0.5">Total Remaining Amount</span>
                            <span className="text-2xl font-black tracking-tight">
                              ₹{totalRemainingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-right text-[11px] font-medium text-indigo-100 space-y-0.5">
                            <div>Opening Balance: <span className="font-bold text-white">₹{custOB.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                            <div>Unpaid Bills ({outstandingInvoices.length}): <span className="font-bold text-white">₹{unpaidInvoicesSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                          </div>
                        </div>
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
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
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
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                    value={formData.date || ''}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

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
                  className="flex-1 py-4 rounded-2xl bg-[#f0f4f8] text-[#5c6e83] text-sm font-bold hover:bg-[#e4ebf3] transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-[#029b6c] text-white text-sm font-bold hover:bg-[#02885f] transition-all active:scale-95 shadow-lg shadow-emerald-100"
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
