import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  FileText, 
  TrendingDown, 
  TrendingUp, 
  Package, 
  Factory, 
  IndianRupee, 
  Users, 
  CheckCircle,
  AlertOctagon,
  ChevronRight,
  RefreshCw,
  Eye
} from 'lucide-react';

type ReportType = 'sales' | 'expenses' | 'income' | 'inventory' | 'production';

interface InvoiceItem {
  id: string;
  modelName: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  discountPercentage?: number;
}

interface GeneratedInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  term: 'Credit' | 'Cash';
  buyer: {
    name: string;
    address: string;
    phone: string;
    gstin: string;
  };
  items: InvoiceItem[];
  totalQty: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  totalAmount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid';
  paidAmount?: number;
}

interface ExpenseRecord {
  id: string;
  categoryName: string;
  amount: number;
  date: string;
  paymentMode: string;
  notes: string;
}

interface IncomeRecord {
  id: string;
  categoryName: string;
  amount: number;
  date: string;
  paymentMode: string;
  notes: string;
  customerName?: string;
}

interface InventoryItem {
  id: string;
  supplierName: string;
  fabricType: string;
  pricePerMeter: number;
  quantity: number;
  unit: 'Meters' | 'Pieces';
  entryDate: string;
}

interface ProductionAssignment {
  id: string;
  fabricType: string;
  unit: string;
  size: string;
  modelName: string;
  quantity: number;
  rate: number;
  assignedDate: string;
  status: 'Assigned' | 'Progressing' | 'Finished Goods' | 'Sold';
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('sales');
  
  // Date range state - initialize to start of current month and today
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // First of this month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [searchQuery, setSearchQuery] = useState('');
  
  // Storage states
  const [invoices, setInvoices] = useState<GeneratedInvoice[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [production, setProduction] = useState<ProductionAssignment[]>([]);
  const [companyName, setCompanyName] = useState('P.S.V & CO');

  // Reload data from localstorage
  const loadData = () => {
    try {
      setInvoices(JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]'));
      setExpenses(JSON.parse(localStorage.getItem('inven_expense_records') || '[]'));
      setIncomes(JSON.parse(localStorage.getItem('inven_income_records') || '[]'));
      setInventory(JSON.parse(localStorage.getItem('inven_inventory') || '[]'));
      setProduction(JSON.parse(localStorage.getItem('inven_production') || '[]'));
      const settings = JSON.parse(localStorage.getItem('inven_settings') || '{}');
      if (settings.companyName) {
        setCompanyName(settings.companyName);
      }
    } catch (err) {
      console.error('Error loading reports data:', err);
    }
  };

  useEffect(() => {
    loadData();
    // Watch for updates
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // Pre-configured date range presets
  const handlePreset = (preset: 'today' | 'thisMonth' | 'last30' | 'thisQuarter' | 'thisYear' | 'all') => {
    const today = new Date();
    let start = new Date();
    
    switch (preset) {
      case 'today':
        start = today;
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last30':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'thisQuarter':
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        start = new Date(today.getFullYear(), quarterMonth, 1);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'all':
        start = new Date(2020, 0, 1);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

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

  // Helper to check if a date falls strictly within user range
  const isWithinRange = (dateStr: string) => {
    if (!dateStr) return false;
    const itemDate = parseSafeDate(dateStr).getTime();
    const start = new Date(startDate + 'T00:00:00').getTime();
    const end = new Date(endDate + 'T23:59:59').getTime();
    return itemDate >= start && itemDate <= end;
  };

  // --- Filtering & Calculations per report type ---

  // 1. Sales Report Calculations
  const salesReportData = useMemo(() => {
    const filtered = invoices.filter(inv => {
      const matchRange = isWithinRange(inv.date);
      const matchSearch = searchQuery === '' || 
        inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.buyer?.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRange && matchSearch;
    });

    const summary = filtered.reduce((acc, inv) => {
      const total = Number(inv.totalAmount) || 0;
      const paid = Number(inv.paidAmount) || 0;
      const tax = (Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.igst) || 0);
      const qty = Number(inv.totalQty) || 0;

      acc.totalSales += total;
      acc.totalCollected += paid;
      acc.totalReceivable += Math.max(0, total - paid);
      acc.totalTax += tax;
      acc.totalQtySold += qty;
      
      if (inv.term === 'Cash') {
        acc.cashSalesCount += 1;
        acc.cashAmount += total;
      } else {
        acc.creditSalesCount += 1;
        acc.creditAmount += total;
      }

      return acc;
    }, {
      totalSales: 0,
      totalCollected: 0,
      totalReceivable: 0,
      totalTax: 0,
      totalQtySold: 0,
      cashSalesCount: 0,
      creditSalesCount: 0,
      cashAmount: 0,
      creditAmount: 0
    });

    return { items: filtered, summary };
  }, [invoices, startDate, endDate, searchQuery]);


  // 2. Expenses Report Calculations
  const expensesReportData = useMemo(() => {
    const filtered = expenses.filter(exp => {
      const matchRange = isWithinRange(exp.date);
      const matchSearch = searchQuery === '' ||
        exp.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRange && matchSearch;
    });

    const categoryBreakdown: Record<string, number> = {};
    const totalAmount = filtered.reduce((sum, exp) => {
      const amt = Number(exp.amount) || 0;
      categoryBreakdown[exp.categoryName] = (categoryBreakdown[exp.categoryName] || 0) + amt;
      return sum + amt;
    }, 0);

    return { items: filtered, totalAmount, categoryBreakdown };
  }, [expenses, startDate, endDate, searchQuery]);


  // 3. Other Incomes Report Calculations
  const incomesReportData = useMemo(() => {
    const filtered = incomes.filter(inc => {
      const matchRange = isWithinRange(inc.date);
      const matchSearch = searchQuery === '' ||
        inc.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inc.customerName && inc.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.notes && inc.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRange && matchSearch;
    });

    const totalAmount = filtered.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    return { items: filtered, totalAmount };
  }, [incomes, startDate, endDate, searchQuery]);


  // 4. Inventory Report Calculations 
  const inventoryReportData = useMemo(() => {
    const filtered = inventory.filter(item => {
      const matchRange = isWithinRange(item.entryDate);
      const matchSearch = searchQuery === '' ||
        item.fabricType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRange && matchSearch;
    });

    const summary = filtered.reduce((acc, item) => {
      const qty = Number(item.quantity) || 0;
      const value = qty * (Number(item.pricePerMeter) || 0);
      
      acc.totalQuantity += qty;
      acc.totalValue += value;
      acc.totalBatches += 1;
      
      return acc;
    }, {
      totalQuantity: 0,
      totalValue: 0,
      totalBatches: 0
    });

    return { items: filtered, summary };
  }, [inventory, startDate, endDate, searchQuery]);


  // 5. Production Assignment Report Calculations
  const productionReportData = useMemo(() => {
    const filtered = production.filter(p => {
      const matchRange = isWithinRange(p.assignedDate);
      const matchSearch = searchQuery === '' ||
        p.fabricType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.unit.toLowerCase().includes(searchQuery.toLowerCase());
      return matchRange && matchSearch;
    });

    const summary = filtered.reduce((acc, p) => {
      const qty = Number(p.quantity) || 0;
      acc.totalQtyAssigned += qty;
      acc.totalAssignments += 1;
      
      if (p.status === 'Finished Goods') acc.finishedCount += 1;
      else if (p.status === 'Sold') acc.soldCount += 1;
      else if (p.status === 'Progressing') acc.progressCount += 1;
      else acc.assignedCount += 1;

      return acc;
    }, {
      totalQtyAssigned: 0,
      totalAssignments: 0,
      finishedCount: 0,
      soldCount: 0,
      progressCount: 0,
      assignedCount: 0
    });

    return { items: filtered, summary };
  }, [production, startDate, endDate, searchQuery]);

  // Trigger print view
  const handlePrint = () => {
    window.print();
  };

  // Simple CSV export simulation
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `Report_${selectedReport}_${startDate}_to_${endDate}.csv`;

    if (selectedReport === 'sales') {
      headers = ['Invoice No', 'Date', 'Term', 'Buyer', 'Total Quantity', 'Total Amount', 'Paid Amount', 'Status'];
      rows = salesReportData.items.map(i => [
        i.invoiceNo,
        i.date,
        i.term,
        i.buyer?.name || '',
        String(i.totalQty),
        String(i.totalAmount),
        String(i.paidAmount || 0),
        i.status
      ]);
    } else if (selectedReport === 'expenses') {
      headers = ['Category', 'Date', 'Amount', 'Payment Mode', 'Notes'];
      rows = expensesReportData.items.map(e => [
        e.categoryName,
        e.date,
        String(e.amount),
        e.paymentMode,
        e.notes || ''
      ]);
    } else if (selectedReport === 'income') {
      headers = ['Category', 'Date', 'Amount', 'Payment Mode', 'Customer', 'Notes'];
      rows = incomesReportData.items.map(i => [
        i.categoryName,
        i.date,
        String(i.amount),
        i.paymentMode,
        i.customerName || '',
        i.notes || ''
      ]);
    } else if (selectedReport === 'inventory') {
      headers = ['Fabric Type', 'Supplier', 'Entry Date', 'Quantity', 'Price/Meter', 'Total Value'];
      rows = inventoryReportData.items.map(i => [
        i.fabricType,
        i.supplierName,
        i.entryDate,
        String(i.quantity),
        String(i.pricePerMeter),
        String(i.quantity * i.pricePerMeter)
      ]);
    } else if (selectedReport === 'production') {
      headers = ['Fabric/Item', 'Unit', 'Model/Client', 'Quantity', 'Status', 'Date'];
      rows = productionReportData.items.map(p => [
        p.fabricType,
        p.unit,
        p.modelName,
        String(p.quantity),
        p.status,
        p.assignedDate
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1500px] mx-auto pb-12 print:bg-white print:p-0">
      
      {/* Header section with print layout hiding */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise Intelligence</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Generate, visualize and export professional audit and ledger report logs.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={loadData}
            className="p-2.5 hover:bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            CSV Ledger
          </button>
        </div>
      </div>

      {/* Control panel & Tab Selector (Hidden on Print) */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 print:hidden">
        
        {/* Report Categorization Tabs */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest px-2.5 mb-3">Ledger Modules</p>
          
          {(['sales', 'expenses', 'income', 'inventory', 'production'] as const).map((type) => {
            const isActive = selectedReport === type;
            const meta = {
              sales: { label: 'Sales & Invoices', desc: 'Invoiced orders, GST breakdown & dues', icon: FileText, color: 'text-indigo-600' },
              expenses: { label: 'Expenses Records', desc: 'Cash outflows & vendor transactions', icon: TrendingDown, color: 'text-rose-500' },
              income: { label: 'Other Income Logs', desc: 'Capital inputs & secondary incomes', icon: TrendingUp, color: 'text-emerald-500' },
              inventory: { label: 'Inventory Stock Assets', desc: 'Fabric warehouse & valuation audit', icon: Package, color: 'text-amber-500' },
              production: { label: 'Production Workflows', desc: 'Fabric delivery & supervisor assignments', icon: Factory, color: 'text-sky-500' },
            }[type];

            return (
              <button
                key={type}
                onClick={() => { setSelectedReport(type); setSearchQuery(''); }}
                className={`w-full flex items-start gap-3.5 p-3 rounded-2xl text-left transition-all duration-300 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-50/70 border-none shadow-sm' 
                    : 'hover:bg-slate-50 border-none'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white shadow-sm' : 'bg-slate-50'} transition-all`}>
                  <meta.icon className={`w-4 h-4 ${isActive ? meta.color : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`text-xs font-extrabold ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>{meta.label}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5 leading-relaxed">{meta.desc}</p>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600 self-center shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Date Ranges and filtering limits */}
        <div className="xl:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100/60">
            <h3 className="text-sm font-black text-slate-700 tracking-tight uppercase">Date Range Filter</h3>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase">Range Constraint Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 matches-label">
                <Calendar className="w-3 h-3 text-slate-400" /> Start Date
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-xs font-semibold text-slate-700 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 matches-label">
                <Calendar className="w-3 h-3 text-slate-400" /> End Date
              </label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-xs font-semibold text-slate-700 transition-all"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 matches-label">
                <Search className="w-3 h-3 text-slate-400" /> Search Parameters
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Invoice, Supplier, Notes..."
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none p-2.5 pl-9 rounded-xl text-xs font-semibold text-slate-600 transition-all placeholder:text-slate-400"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100/60">
            <span className="text-[10px] uppercase font-black text-slate-400 mr-2.5">Quick Presets:</span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'last30', label: 'Last 30 Days' },
              { id: 'thisQuarter', label: 'This Quarter' },
              { id: 'thisYear', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handlePreset(btn.id as any)}
                className="px-3 py-1.5 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 font-extrabold text-[10px] rounded-lg transition-all cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Print Mode Only Header (Hidden on normal screen) --- */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-5 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-940 tracking-tight">{companyName.toUpperCase()} AUDIT LOG</h1>
            <p className="text-xs font-bold text-slate-500 uppercase mt-1 tracking-wider">
              Issued Report: <span className="text-slate-800">{selectedReport.toUpperCase()} LEDGER</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-extrabold text-slate-800">Date Range Constraint</p>
            <p className="text-xs font-semibold text-slate-500">{startDate} to {endDate}</p>
          </div>
        </div>
      </div>

      {/* --- Dynamic Report Output View --- */}
      <div className="print:bg-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedReport}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Sales & Bills Report Section */}
            {selectedReport === 'sales' && (
              <>
                {/* 1. Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gross Book Value</p>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2 flex items-baseline gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-slate-400 inline shrink-0" />
                      {salesReportData.summary.totalSales.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Sum of generated credit & cash sales bills.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-emerald-600">Total Capital Received</p>
                    <h3 className="text-xl font-black text-emerald-700 tracking-tight mt-2 flex items-baseline gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                      {salesReportData.summary.totalCollected.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Actual paid invoices aggregated amount.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-rose-500">Accounts Receivable</p>
                    <h3 className="text-xl font-black text-rose-700 tracking-tight mt-2 flex items-baseline gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-rose-400 inline shrink-0" />
                      {salesReportData.summary.totalReceivable.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Pending payments yet to be recovered.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Taxes (GST Audit)</p>
                    <h3 className="text-base font-black text-slate-800 tracking-tight mt-2.5 flex items-baseline gap-1">
                      <IndianRupee className="w-3 h-3 text-slate-400 inline shrink-0" />
                      {salesReportData.summary.totalTax.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1.5 font-semibold leading-normal">Accumulated CGST + SGST + IGST logs.</p>
                  </div>
                </div>

                {/* 2. Secondary Breakdown Metrics Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cash vs. Credit Liquidity Ratio</p>
                    <div className="mt-4 space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 select-none">
                          <span>Cash Sales ({salesReportData.summary.cashSalesCount} Bills)</span>
                          <span>₹{salesReportData.summary.cashAmount.toLocaleString()}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden mt-1 p-0.5 border border-slate-100">
                          <div 
                            className="h-full bg-slate-900 rounded-full transition-all" 
                            style={{ width: `${(salesReportData.summary.cashAmount / (salesReportData.summary.totalSales || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-slate-700 select-none">
                          <span>Credit Sales ({salesReportData.summary.creditSalesCount} Bills)</span>
                          <span>₹{salesReportData.summary.creditAmount.toLocaleString()}</span>
                        </div>
                        <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden mt-1 p-0.5 border border-slate-100">
                          <div 
                            className="h-full bg-rose-500 rounded-full transition-all" 
                            style={{ width: `${(salesReportData.summary.creditAmount / (salesReportData.summary.totalSales || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bulk Quantities Dispatched</p>
                      <h4 className="text-xl font-extrabold text-slate-800 tracking-tight mt-1.5 select-none">{salesReportData.summary.totalQtySold.toLocaleString()} Pieces</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-4">This metric isolates products actually recorded in buyers invoices across the registered dates.</p>
                  </div>
                </div>

                {/* 3. Transaction Details List */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-4 select-none">
                    <h3 className="text-sm font-black text-slate-800 uppercase">Sales Transaction Audit Stream</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase font-mono">{salesReportData.items.length} matched ledgers</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest font-black border-b border-slate-100">
                          <th className="pb-3.5">Invoice / Client</th>
                          <th className="pb-3.5">Billing Date</th>
                          <th className="pb-3.5 text-center">Receipt Term</th>
                          <th className="pb-3.5 text-center">Dispatch Qty</th>
                          <th className="pb-3.5 text-right">CGST+SGST / IGST</th>
                          <th className="pb-3.5 text-right">Invoice Amount</th>
                          <th className="pb-3.5 text-right">Audit Dues</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {salesReportData.items.map((inv) => {
                          const total = Number(inv.totalAmount) || 0;
                          const paid = Number(inv.paidAmount) || 0;
                          const dues = Math.max(0, total - paid);
                          const tax = (Number(inv.cgst) || 0) + (Number(inv.sgst) || 0) + (Number(inv.igst) || 0);

                          return (
                            <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all">
                              <td className="py-3">
                                <div className="text-xs font-bold text-slate-800">{inv.invoiceNo}</div>
                                <div className="text-[9px] text-slate-400 font-medium capitalize mt-0.5">{inv.buyer?.name}</div>
                              </td>
                              <td className="py-3 text-xs font-semibold text-slate-500 font-mono">{inv.date}</td>
                              <td className="py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                  inv.term === 'Cash' ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-600'
                                }`}>
                                  {inv.term}
                                </span>
                              </td>
                              <td className="py-3 text-xs font-extrabold text-slate-800 text-center font-mono">{inv.totalQty}</td>
                              <td className="py-3 text-right text-xs font-semibold text-slate-500 font-mono">₹{tax.toLocaleString()}</td>
                              <td className="py-3 text-right text-xs font-black text-slate-800 font-mono">₹{total.toLocaleString()}</td>
                              <td className="py-3 text-right">
                                <span className={`text-xs font-black font-mono ${dues > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-500'}`}>
                                  ₹{dues.toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {salesReportData.items.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-10">
                              <p className="text-xs font-black text-slate-400 uppercase select-none">No matched invoice records within coordinates</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Expenses Breakdown Page */}
            {selectedReport === 'expenses' && (
              <>
                {/* 1. Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gross Outwards Cashflow</p>
                    <h3 className="text-xl font-black text-rose-700 tracking-tight mt-2 flex items-baseline gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-rose-450 inline shrink-0" />
                      {expensesReportData.totalAmount.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Sum of audited expenses ledger.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Categories Logged</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2 select-none">
                      {Object.keys(expensesReportData.categoryBreakdown).length} Items
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Distinct categories targeted in current range.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Audited Records Count</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2 select-none">
                      {expensesReportData.items.length} Receipts
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Individual receipts matched.</p>
                  </div>
                </div>

                {/* 2. Categorization breakdown logs */}
                <div className="grid grid-cols-1 gap-5">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-700 tracking-widest uppercase mb-4 select-none">Expense Budget Distribution</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {Object.entries(expensesReportData.categoryBreakdown).map(([cat, val]) => {
                        const valNum = val as number;
                        const pct = (valNum / (expensesReportData.totalAmount || 1)) * 100;
                        return (
                          <div key={cat} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                            <div className="flex justify-between text-xs font-bold text-slate-700 select-none">
                              <span className="truncate max-w-[150px]">{cat}</span>
                              <span className="font-mono">₹{valNum.toLocaleString()}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-2 p-0.5">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[9px] text-slate-450 mt-1 font-medium select-none">{pct.toFixed(1)}% of range budget allocation.</p>
                          </div>
                        );
                      })}

                      {Object.keys(expensesReportData.categoryBreakdown).length === 0 && (
                        <div className="col-span-full text-center py-6 text-xs text-slate-400 font-extrabold pb-4 uppercase select-none">
                          No category allocations in this segment
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Transaction logs */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-4 select-none">
                    <h3 className="text-sm font-black text-slate-800 uppercase">Expense Audit Stream</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase font-mono">{expensesReportData.items.length} records</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full font-sans">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest font-black border-b border-slate-100">
                          <th className="pb-3.5">Category Target</th>
                          <th className="pb-3.5">Transaction Date</th>
                          <th className="pb-3.5 text-center">Payment System</th>
                          <th className="pb-3.5">Ledger Notes / Context</th>
                          <th className="pb-3.5 text-right">Debit Outflow</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expensesReportData.items.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="py-3 text-xs font-bold text-rose-700">{exp.categoryName}</td>
                            <td className="py-3 text-xs font-semibold text-slate-500 font-mono">{exp.date}</td>
                            <td className="py-3 text-center">
                              <span className="inline-block px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase">
                                {exp.paymentMode}
                              </span>
                            </td>
                            <td className="py-3 text-xs text-slate-600 truncate max-w-[250px]">{exp.notes || '---'}</td>
                            <td className="py-3 text-right text-xs font-black text-slate-800 font-mono">₹{exp.amount.toLocaleString()}</td>
                          </tr>
                        ))}

                        {expensesReportData.items.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-10">
                              <p className="text-xs font-black text-slate-400 uppercase select-none">No outwards cashflow matched in this segment</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Income Report Section */}
            {selectedReport === 'income' && (
              <>
                {/* 1. Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-emerald-600">Total Auxiliary Incomes</p>
                    <h3 className="text-xl font-black text-emerald-700 tracking-tight mt-2 flex items-baseline gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400 inline shrink-0" />
                      {incomesReportData.totalAmount.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Sum of secondary cash infusions matched.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Entries Aggregate</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2 select-none">
                      {incomesReportData.items.length} Inflows
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Individual receipts matching criteria.</p>
                  </div>
                </div>

                {/* 2. List component */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-4 select-none">
                    <h3 className="text-sm font-black text-slate-800 uppercase">Auxiliary Incomes Audit Stream</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase font-mono">{incomesReportData.items.length} records</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest font-black border-b border-slate-100">
                          <th className="pb-3.5">Income Category</th>
                          <th className="pb-3.5">Filing Date</th>
                          <th className="pb-3.5 text-center">Filing System</th>
                          <th className="pb-3.5">Client / Customer Mapping</th>
                          <th className="pb-3.5">Ledger Context</th>
                          <th className="pb-3.5 text-right">Inflow Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {incomesReportData.items.map((inc) => (
                          <tr key={inc.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="py-3 text-xs font-bold text-emerald-700">{inc.categoryName}</td>
                            <td className="py-3 text-xs font-semibold text-slate-500 font-mono">{inc.date}</td>
                            <td className="py-3 text-center">
                              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase">
                                {inc.paymentMode}
                              </span>
                            </td>
                            <td className="py-3 text-xs font-bold text-slate-700 capitalize">{inc.customerName || 'Standard Client'}</td>
                            <td className="py-3 text-xs text-slate-500 truncate max-w-[200px]">{inc.notes || '---'}</td>
                            <td className="py-3 text-right text-xs font-black text-slate-800 font-mono">₹{inc.amount.toLocaleString()}</td>
                          </tr>
                        ))}

                        {incomesReportData.items.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10">
                              <p className="text-xs font-black text-slate-400 uppercase select-none">No secondary inflows matched in coordinates</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Inventory report logs */}
            {selectedReport === 'inventory' && (
              <>
                {/* 1. Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-amber-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-amber-600">Consolidated Raw Stock Valuation</p>
                    <h3 className="text-xl font-black text-amber-700 tracking-tight mt-2 flex items-baseline gap-1">
                      <IndianRupee className="w-3.5 h-3.5 text-amber-400 inline shrink-0" />
                      {inventoryReportData.summary.totalValue.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Theoretical cash valuation of current ranges.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Quantity In Warehouse</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2 select-none">
                      {inventoryReportData.summary.totalQuantity.toLocaleString()} Units
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Sum of both raw meters and fabrics.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Matched Item Batches</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2 select-none">
                      {inventoryReportData.summary.totalBatches} Registers
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Unique batches currently sitting in audit.</p>
                  </div>
                </div>

                {/* 2. Detailed audit grid */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-4 select-none">
                    <h3 className="text-sm font-black text-slate-800 uppercase">Warehouse Raw Inventory Audit</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase font-mono">{inventoryReportData.items.length} lots matched</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest font-black border-b border-slate-100">
                          <th className="pb-3.5">Fabric Lot / Subtype</th>
                          <th className="pb-3.5">Assigned Supplier</th>
                          <th className="pb-3.5">Acquisition Date</th>
                          <th className="pb-3.5 text-center">In Stock Balance</th>
                          <th className="pb-3.5 text-right">Audit Base Price</th>
                          <th className="pb-3.5 text-right">Valuation Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inventoryReportData.items.map((item) => {
                          const quantity = Number(item.quantity) || 0;
                          const basePrice = Number(item.pricePerMeter) || 0;
                          const lotVal = quantity * basePrice;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="py-3 text-xs font-bold text-slate-800">{item.fabricType}</td>
                              <td className="py-3 text-xs text-slate-500 font-semibold">{item.supplierName}</td>
                              <td className="py-3 text-xs font-semibold text-slate-400 font-mono">{item.entryDate}</td>
                              <td className="py-3 text-center">
                                <span className={`text-xs font-extrabold ${quantity <= 10 ? 'text-rose-600 font-black' : 'text-slate-800'}`}>
                                  {quantity} {item.unit}
                                </span>
                              </td>
                              <td className="py-3 text-right text-xs font-bold text-slate-500 font-mono">₹{basePrice.toLocaleString()}</td>
                              <td className="py-3 text-right text-xs font-black text-slate-800 font-mono">₹{lotVal.toLocaleString()}</td>
                            </tr>
                          );
                        })}

                        {inventoryReportData.items.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10">
                              <p className="text-xs font-black text-slate-400 uppercase select-none">No active inventory records in this range coordinates</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Production assignment workflows report */}
            {selectedReport === 'production' && (
              <>
                {/* 1. Sum grid metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gross Assignments</p>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2 select-none">
                      {productionReportData.summary.totalAssignments} Items
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Overall assigned production contracts.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-indigo-600">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-indigo-600">Total Quantities Out</p>
                    <h3 className="text-xl font-black text-indigo-700 tracking-tight mt-2 select-none">
                      {productionReportData.summary.totalQtyAssigned.toLocaleString()} Pieces
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Sum of parts running in workshops.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-emerald-600">Finished Assets Ledger</p>
                    <h3 className="text-xl font-black text-emerald-800 tracking-tight mt-2 select-none">
                      {productionReportData.summary.finishedCount} Deliveries
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Units safely registered as completed.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Work In Progress</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2 select-none">
                      {productionReportData.summary.progressCount} Running
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Fabric coordinates currently spinning.</p>
                  </div>
                </div>

                {/* 2. Detailed audit grid */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-4 select-none">
                    <h3 className="text-sm font-black text-slate-800 uppercase">Production Workflows Audit Tracker</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase font-mono">{productionReportData.items.length} units mapped</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest font-black border-b border-slate-100">
                          <th className="pb-3.5">Primary Fabric Type</th>
                          <th className="pb-3.5">Assigned Workshop Unit</th>
                          <th className="pb-3.5">Work Target Model</th>
                          <th className="pb-3.5 text-center">Batch Quantity</th>
                          <th className="pb-3.5 text-center">Current Status</th>
                          <th className="pb-3.5 text-right">Filing Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {productionReportData.items.map((p) => {
                          const statusColor = {
                            Assigned: 'bg-slate-100 text-slate-600',
                            Progressing: 'bg-amber-50 text-amber-700',
                            'Finished Goods': 'bg-emerald-50 text-emerald-700',
                            Sold: 'bg-indigo-50 text-indigo-700',
                          }[p.status];

                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="py-3 text-xs font-bold text-slate-800">{p.fabricType}</td>
                              <td className="py-3 text-xs font-semibold text-slate-500">{p.unit}</td>
                              <td className="py-3 text-xs text-slate-600">{p.modelName} ({p.size})</td>
                              <td className="py-3 text-center text-xs font-black text-slate-800 font-mono">{p.quantity}</td>
                              <td className="py-3 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${statusColor}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="py-3 text-right text-xs font-semibold text-slate-400 font-mono">{p.assignedDate}</td>
                            </tr>
                          );
                        })}

                        {productionReportData.items.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10">
                              <p className="text-xs font-black text-slate-400 uppercase select-none">No active contracts assigned in range coordinates</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
