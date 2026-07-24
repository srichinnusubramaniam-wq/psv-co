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
  Eye,
  X,
  Coins,
  Layers,
  Clock,
  History,
  Trash2,
  ChevronDown,
  Check
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface SearchableDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  allOptionLabel?: string;
}

const SearchableFilterSelect: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "All Product Descriptions",
  allOptionLabel = "All Product Descriptions"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-xs font-semibold text-slate-700 transition-all flex items-center justify-between gap-1 text-left cursor-pointer"
      >
        <span className="truncate">{value === 'All' ? allOptionLabel : value}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] left-0 right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150 min-w-[220px]">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description..."
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-8 pr-7 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
            <button
              type="button"
              onClick={() => {
                onChange('All');
                setIsOpen(false);
                setSearch('');
              }}
              className={cn(
                "w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors",
                value === 'All'
                  ? "bg-indigo-50 text-indigo-700 font-bold"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <span className="truncate">{allOptionLabel}</span>
              {value === 'All' && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
            </button>

            {filtered.map((opt) => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors",
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-[11px] text-slate-400 text-center font-medium py-2">
                No matching description
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

type ReportType = 'sales' | 'expenses' | 'income' | 'inventory' | 'production' | 'supplier' | 'godown';

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
  unit: 'Meters' | 'Pieces' | 'KGs';
  entryDate: string;
  paidAmount?: number;
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Paid';
  paymentType?: 'Cash' | 'Credit';
  creditDays?: number;
  dueDate?: string;
  totalCost?: number;
  productGroupName?: string;
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
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [selectedGodown, setSelectedGodown] = useState<string>('All');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
  const [selectedSupplierProductDesc, setSelectedSupplierProductDesc] = useState<string>('All');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('All');
  const [companyName, setCompanyName] = useState('P.S.V & CO');
  const [selectedLedgerType, setSelectedLedgerType] = useState<string>('All');
  const [selectedItemModel, setSelectedItemModel] = useState<string>('All');
  const [ledgerItemToDelete, setLedgerItemToDelete] = useState<any | null>(null);
  const [isDeleteLedgerOpen, setIsDeleteLedgerOpen] = useState(false);

  // Supplier Payment Modal State
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<any | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    date: '',
    paymentMode: 'Bank Transfer',
    notes: '',
    amountToPay: 0,
    isFullPayment: true
  });

  // Supplier Statement Modal State
  const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
  const [statementItem, setStatementItem] = useState<any | null>(null);
  const [isOverallSupplierStatementOpen, setIsOverallSupplierStatementOpen] = useState(false);
  const [isOverallCustomerStatementOpen, setIsOverallCustomerStatementOpen] = useState(false);
  const isModalOpen = isOverallSupplierStatementOpen || isOverallCustomerStatementOpen;

  // Reload data from localstorage
  const loadData = () => {
    try {
      setInvoices(JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]'));
      setExpenses(JSON.parse(localStorage.getItem('inven_expense_records') || '[]'));
      setIncomes(JSON.parse(localStorage.getItem('inven_income_records') || '[]'));
      setInventory(JSON.parse(localStorage.getItem('inven_inventory') || '[]'));
      setProduction(JSON.parse(localStorage.getItem('inven_production') || '[]'));
      setCustomers(JSON.parse(localStorage.getItem('inven_customers') || '[]'));
      setSuppliers(JSON.parse(localStorage.getItem('inven_suppliers') || '[]'));
      
      let savedGodowns = JSON.parse(localStorage.getItem('inven_unit_master') || '[]');
      if (!savedGodowns || savedGodowns.length === 0) {
        savedGodowns = [
          { id: 'U-001', name: 'UNIT-1' },
          { id: 'U-002', name: 'UNIT-2' },
          { id: 'U-003', name: 'UNIT-3' }
        ];
      }
      setGodowns(savedGodowns);

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

    const totalOpeningBalance = customers.reduce((sum, c) => sum + (Number(c.openingBalance) || 0), 0);

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
      totalReceivable: totalOpeningBalance,
      totalTax: 0,
      totalQtySold: 0,
      cashSalesCount: 0,
      creditSalesCount: 0,
      cashAmount: 0,
      creditAmount: 0
    });

    return { items: filtered, summary };
  }, [invoices, startDate, endDate, searchQuery, customers]);


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
      const matchCustomer = selectedCustomer === 'All' || 
        (inc.customerName && inc.customerName.trim().toUpperCase() === selectedCustomer.trim().toUpperCase());
      const matchSearch = searchQuery === '' ||
        inc.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inc.customerName && inc.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (inc.notes && inc.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRange && matchCustomer && matchSearch;
    });

    const totalAmount = filtered.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);

    return { items: filtered, totalAmount };
  }, [incomes, startDate, endDate, searchQuery, selectedCustomer]);


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

  // 6. Supplier Report Calculations
  const supplierReportData = useMemo(() => {
    const filtered = inventory.filter(item => {
      const matchRange = isWithinRange(item.entryDate);
      const matchSupplier = selectedSupplier === 'All' || item.supplierName === selectedSupplier;
      const matchProductDesc = selectedSupplierProductDesc === 'All' || (item.fabricType && item.fabricType.trim() === selectedSupplierProductDesc);
      const matchSearch = searchQuery === '' ||
        item.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.fabricType && item.fabricType.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.id && item.id.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRange && matchSupplier && matchProductDesc && matchSearch;
    });

    const summary = filtered.reduce((acc, item) => {
      const gross = item.totalCost !== undefined && item.totalCost !== null ? Number(item.totalCost) : (Number(item.pricePerMeter) || 0) * (Number(item.quantity) || 0);
      const paid = Number(item.paidAmount) || 0;
      const pending = Math.max(0, gross - paid);

      acc.totalPurchases += gross;
      acc.totalPaid += paid;
      acc.totalPending += pending;
      acc.totalLots += 1;

      return acc;
    }, {
      totalPurchases: 0,
      totalPaid: 0,
      totalPending: 0,
      totalLots: 0
    });

    return { items: filtered, summary };
  }, [inventory, startDate, endDate, selectedSupplier, selectedSupplierProductDesc, searchQuery]);

  // Derived unique product descriptions list for Supplier Ledger filter
  const availableSupplierProductDescriptions = useMemo(() => {
    const listSet = new Set<string>();
    inventory.forEach(item => {
      if (item.fabricType && item.fabricType.trim()) {
        listSet.add(item.fabricType.trim());
      }
    });
    try {
      const savedProducts = JSON.parse(localStorage.getItem('inven_product_master') || '[]');
      if (Array.isArray(savedProducts)) {
        savedProducts.forEach((pm: any) => {
          if (pm.description && pm.description.trim()) {
            listSet.add(pm.description.trim());
          } else if (pm.name && pm.name.trim()) {
            listSet.add(pm.name.trim());
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse product master for descriptions', e);
    }
    return Array.from(listSet).sort((a, b) => a.localeCompare(b));
  }, [inventory]);


  // Derived unique item/models list for Godown Stock Ledger filter
  const availableItemModels = useMemo(() => {
    const modelsSet = new Set<string>();
    
    // 1. From production assignments
    production.forEach(p => {
      const m = (p.modelName || p.fabricType || '').trim();
      if (m) modelsSet.add(m);
    });

    // 2. From Product Master stored in localStorage
    try {
      const savedProducts = JSON.parse(localStorage.getItem('inven_product_master') || '[]');
      if (Array.isArray(savedProducts)) {
        savedProducts.forEach((pm: any) => {
          if (pm.name && pm.name.trim()) {
            modelsSet.add(pm.name.trim());
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse product master for models', e);
    }

    return Array.from(modelsSet).sort((a, b) => a.localeCompare(b));
  }, [production]);

  // 7. Godown Stock Ledger Calculations
  const godownReportData = useMemo(() => {
    const filtered = production.filter(p => {
      const matchRange = isWithinRange(p.assignedDate);
      
      // Filter by selected godown.
      // If we select a specific godown, the item belongs to it if p.unit === selectedGodown OR (p.type === 'Transfer' && p.toGodown === selectedGodown)
      const matchesGodown = selectedGodown === 'All' || 
        p.unit === selectedGodown || 
        (p.type === 'Transfer' && p.toGodown === selectedGodown);
        
      const isFinished = p.type === 'Finished Goods' || p.status === 'Finished Goods';
      const isDamage = p.type === 'Damage';
      const isTransfer = p.type === 'Transfer';
      
      let itemType = 'WIP';
      if (isFinished) itemType = 'Finished Goods';
      else if (isDamage) itemType = 'Damage';
      else if (isTransfer) itemType = 'Transfer';
      
      const matchesType = selectedLedgerType === 'All' || itemType === selectedLedgerType;

      const pModel = (p.modelName || p.fabricType || '').trim();
      const matchesItemModel = selectedItemModel === 'All' || pModel.toLowerCase() === selectedItemModel.trim().toLowerCase();

      const matchSearch = searchQuery === '' ||
        p.fabricType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.toGodown && p.toGodown.toLowerCase().includes(searchQuery.toLowerCase()));
        
      return matchRange && matchesGodown && matchesType && matchesItemModel && matchSearch;
    });

    const summary = filtered.reduce((acc, p) => {
      const qty = Number(p.quantity) || 0;
      
      const isFinished = p.type === 'Finished Goods' || p.status === 'Finished Goods';
      const isDamage = p.type === 'Damage';
      const isTransfer = p.type === 'Transfer';
      const isWIP = !isFinished && !isDamage && !isTransfer;

      if (isFinished) {
        acc.totalFinished += qty;
      } else if (isDamage) {
        acc.totalDamage += qty;
      } else if (isTransfer) {
        acc.totalTransferred += qty;
      } else if (isWIP) {
        acc.totalWIP += qty;
      }
      
      acc.totalRecords += 1;
      return acc;
    }, {
      totalFinished: 0,
      totalDamage: 0,
      totalTransferred: 0,
      totalWIP: 0,
      totalRecords: 0
    });

    const netFinished = Math.max(0, summary.totalFinished - summary.totalDamage);

    return { items: filtered, summary: { ...summary, netFinished } };
  }, [production, startDate, endDate, selectedGodown, selectedLedgerType, selectedItemModel, searchQuery]);


  // Record Expense Entry on Supplier Payment
  const recordExpenseEntry = (
    lotId: string, 
    supplierName: string, 
    amount: number, 
    date: string, 
    paymentMode: string, 
    customNotes?: string
  ) => {
    try {
      const savedCategoriesRaw = localStorage.getItem('inven_expense_master') || '[]';
      let categoriesList = JSON.parse(savedCategoriesRaw);
      let targetCategory = categoriesList.find((c: any) => c && c.name?.toLowerCase() === 'raw material purchases');
      
      if (!targetCategory) {
        targetCategory = {
          id: `EXP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          name: 'Raw Material Purchases'
        };
        categoriesList.push(targetCategory);
        localStorage.setItem('inven_expense_master', JSON.stringify(categoriesList));
      }

      const savedExpensesRaw = localStorage.getItem('inven_expense_records') || '[]';
      const expensesList = JSON.parse(savedExpensesRaw);
      
      const newExpenseRecord = {
        id: `REC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        categoryId: targetCategory.id,
        categoryName: targetCategory.name,
        amount: amount,
        date: date,
        paymentMode: paymentMode,
        notes: customNotes || `Payment for Raw Materials Lot ${lotId} to ${supplierName}`,
        createdAt: new Date().toISOString()
      };

      expensesList.unshift(newExpenseRecord);
      localStorage.setItem('inven_expense_records', JSON.stringify(expensesList));
    } catch (e) {
      console.error('Failed to log expense record', e);
    }
  };

  const openPaymentDialog = (item: any) => {
    const grossAmount = item.totalCost !== undefined && item.totalCost !== null ? Number(item.totalCost) : (item.pricePerMeter || 0) * (item.quantity || 0);
    const previousPaid = Number(item.paidAmount) || 0;
    const remainingPending = Math.max(0, grossAmount - previousPaid);
    
    setPaymentItem(item);
    setPaymentDetails({
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer',
      notes: `Payment for Raw Materials Lot ${item.id} (${item.supplierName})`,
      amountToPay: remainingPending,
      isFullPayment: true
    });
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentItem) return;

    const grossAmount = paymentItem.totalCost !== undefined && paymentItem.totalCost !== null ? Number(paymentItem.totalCost) : (paymentItem.pricePerMeter || 0) * (paymentItem.quantity || 0);
    const previousPaid = Number(paymentItem.paidAmount) || 0;
    const amountToPay = Number(paymentDetails.amountToPay) || 0;
    const newTotalPaid = Math.min(grossAmount, previousPaid + amountToPay);
    const isFullyPaid = newTotalPaid >= grossAmount;
    const newStatus = isFullyPaid ? 'Paid' as const : 'Partially Paid' as const;

    const updatedInventory = inventory.map(item => {
      if (item.id === paymentItem.id) {
        return { 
          ...item, 
          paymentStatus: newStatus,
          paidAmount: newTotalPaid
        };
      }
      return item;
    });

    localStorage.setItem('inven_inventory', JSON.stringify(updatedInventory));

    recordExpenseEntry(
      paymentItem.id,
      paymentItem.supplierName,
      amountToPay,
      paymentDetails.date,
      paymentDetails.paymentMode,
      paymentDetails.notes
    );

    // Refresh state
    setInventory(updatedInventory);
    const savedExpenses = JSON.parse(localStorage.getItem('inven_expense_records') || '[]');
    setExpenses(savedExpenses);

    setIsPaymentDialogOpen(false);
    setPaymentItem(null);

    // Trigger local storage sync across tabs
    window.dispatchEvent(new Event('storage'));
  };

  const handleUnmarkPaid = () => {
    if (!paymentItem) return;
    const updatedInventory = inventory.map(item => {
      if (item.id === paymentItem.id) {
        return { 
          ...item, 
          paymentStatus: 'Unpaid' as const, 
          paidAmount: 0 
        };
      }
      return item;
    });

    localStorage.setItem('inven_inventory', JSON.stringify(updatedInventory));
    
    // Refresh state
    setInventory(updatedInventory);
    setIsPaymentDialogOpen(false);
    setPaymentItem(null);

    // Trigger local storage sync across tabs
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteLedgerItem = (item: any) => {
    setLedgerItemToDelete(item);
    setIsDeleteLedgerOpen(true);
  };

  const confirmDeleteLedgerItem = () => {
    if (!ledgerItemToDelete) return;
    const updated = production.filter(p => p.id !== ledgerItemToDelete.id);
    setProduction(updated);
    localStorage.setItem('inven_production', JSON.stringify(updated));
    setIsDeleteLedgerOpen(false);
    setLedgerItemToDelete(null);
    window.dispatchEvent(new Event('storage'));
  };

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
      headers = [
        'Income Category',
        'Filing Date',
        'Filing System',
        'Client / Customer Mapping',
        'Balance Amount',
        'Ledger Context',
        'Received Amount'
      ];
      rows = incomesReportData.items.map(inc => {
        const cust = inc.customerId ? customers.find(c => c.id === inc.customerId) : null;
        
        // Calculate remaining balance (receivable)
        let remainingBalance = 0;
        if (cust) {
          const customerInvoices = invoices.filter(inv => {
            const invBuyerName = (inv.buyer?.name || '').trim().toUpperCase();
            const selCustName = (cust?.name || '').trim().toUpperCase();
            const invCustId = (inv.customerId || '').trim().toUpperCase();
            const selCustId = (cust?.id || '').trim().toUpperCase();
            return (invBuyerName === selCustName && invBuyerName !== '') || (invCustId === selCustId && invCustId !== '');
          });
          const unpaidInvoiceAmount = customerInvoices.reduce((sum, inv) => {
            const total = Number(inv.totalAmount) || 0;
            const paid = Number(inv.paidAmount) || 0;
            return sum + Math.max(0, total - paid);
          }, 0);
          remainingBalance = (cust.openingBalance || 0) + unpaidInvoiceAmount;
        }

        // Ledger Context string
        let ledgerContextStr = '';
        if (inc.allocationType === 'opening_balance') {
          ledgerContextStr = 'Deducted from OB' + (inc.notes ? ` - ${inc.notes}` : '');
        } else if (inc.allocationType === 'invoice' && inc.invoiceNo) {
          ledgerContextStr = `Paid Against Bill: #${inc.invoiceNo}` + (inc.notes ? ` - ${inc.notes}` : '');
        } else {
          ledgerContextStr = inc.notes || '---';
        }

        const categoryVal = inc.id ? `${inc.categoryName} (${inc.id})` : inc.categoryName;
        const customerVal = cust ? `${inc.customerName} (${cust.id})` : (inc.customerName || 'Standard Client');
        const balanceVal = cust ? `${remainingBalance.toFixed(2)}` : '---';

        return [
          categoryVal,
          inc.date,
          inc.paymentMode,
          customerVal,
          balanceVal,
          ledgerContextStr,
          String(inc.amount)
        ];
      });
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
    } else if (selectedReport === 'supplier') {
      headers = [
        'Lot ID',
        'Supplier Name',
        'Item Details (Fabric Lot)',
        'Acquisition Date',
        'Payment Mode',
        'Due Date',
        'Net Amount (Gross)',
        'Quantity',
        'Unit',
        'Paid So Far',
        'Remaining Pending Due',
        'Payment Status'
      ];
      rows = supplierReportData.items.map(i => {
        const gross = i.totalCost !== undefined && i.totalCost !== null ? Number(i.totalCost) : (Number(i.pricePerMeter) || 0) * (Number(i.quantity) || 0);
        const paid = Number(i.paidAmount) || 0;
        const pending = Math.max(0, gross - paid);
        const itemDetails = `${i.fabricType}${i.productGroupName ? ` (${i.productGroupName})` : ''}`;
        const statusText = paid >= gross ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid');

        return [
          i.id,
          i.supplierName,
          itemDetails,
          i.entryDate,
          i.paymentType || 'Cash',
          i.dueDate || '-',
          String(gross),
          String(i.quantity),
          i.unit || 'Meters',
          String(paid),
          String(pending),
          statusText
        ];
      });
    } else if (selectedReport === 'godown') {
      headers = [
        'Transaction ID',
        'Date',
        'Fabric Type / Item Details',
        'Model Name',
        'Size',
        'Transaction Type',
        'Quantity',
        'Source Godown',
        'Destination Godown',
        'Status'
      ];
      rows = godownReportData.items.map(i => {
        const transType = i.type === 'Finished Goods' || i.status === 'Finished Goods'
          ? 'Finished Goods'
          : i.type === 'Damage'
          ? 'Damage'
          : i.type === 'Transfer'
          ? 'Transfer'
          : 'Work in Progress';
          
        return [
          i.id,
          i.assignedDate,
          i.fabricType,
          i.modelName || '-',
          i.size || '-',
          transType,
          String(i.quantity),
          i.unit,
          i.toGodown || '-',
          i.status
        ];
      });
    }

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','), 
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 max-w-[1500px] mx-auto pb-12 print:bg-white print:p-0 ${isModalOpen ? '' : 'printable-report'}`}>
      
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
          
          {([ 'sales', 'income', 'supplier', 'godown' ] as const).map((type) => {
            const isActive = selectedReport === type;
            const meta = {
              sales: { label: 'Sales & Invoices', desc: 'Invoiced orders, GST breakdown & dues', icon: FileText, color: 'text-indigo-600' },
              income: { label: 'Customer Receipts', desc: 'Customer payments & invoice receipts', icon: TrendingUp, color: 'text-emerald-500' },
              supplier: { label: 'Supplier Ledger', desc: 'Vendor transactions & payment desk dues', icon: Coins, color: 'text-amber-500' },
              godown: { label: 'Godown Stock Ledger', desc: 'Warehousing stock assets & transfers', icon: Layers, color: 'text-violet-600' }
            }[type];

            return (
              <button
                key={type}
                onClick={() => { 
                  setSelectedReport(type); 
                  setSearchQuery(''); 
                  setSelectedSupplier('All'); 
                  setSelectedGodown('All'); 
                }}
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

          <div className={cn(
            "grid grid-cols-1 gap-6 items-end",
            selectedReport === 'godown' ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" : selectedReport === 'supplier' ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" : selectedReport === 'income' ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"
          )}>
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

            {selectedReport === 'godown' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 matches-label">
                    <Layers className="w-3 h-3 text-slate-400" /> Godown Warehouse
                  </label>
                  <select
                    value={selectedGodown}
                    onChange={(e) => setSelectedGodown(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-xs font-semibold text-slate-700 transition-all"
                  >
                    <option value="All">All Godowns</option>
                    {godowns.map(g => (
                      <option key={g.id || g.name} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 matches-label">
                    <Filter className="w-3 h-3 text-slate-400" /> Transaction Type
                  </label>
                  <select
                    value={selectedLedgerType}
                    onChange={(e) => setSelectedLedgerType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-xs font-semibold text-slate-700 transition-all"
                  >
                    <option value="All">All Transactions</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Damage">Damage</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 matches-label">
                    <Package className="w-3 h-3 text-slate-400" /> Item / Model Details
                  </label>
                  <select
                    value={selectedItemModel}
                    onChange={(e) => setSelectedItemModel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                  >
                    <option value="All">All Items / Models</option>
                    {availableItemModels.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {selectedReport === 'supplier' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 matches-label">
                    <Users className="w-3 h-3 text-slate-400" /> Supplier Vendor
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                  >
                    <option value="All">All Suppliers</option>
                    {suppliers.map(s => (
                      <option key={s.id || s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 matches-label">
                    <Package className="w-3 h-3 text-slate-400" /> Product Description
                  </label>
                  <SearchableFilterSelect
                    value={selectedSupplierProductDesc}
                    onChange={(val) => setSelectedSupplierProductDesc(val)}
                    options={availableSupplierProductDescriptions}
                    allOptionLabel="All Product Descriptions"
                  />
                </div>
              </>
            )}

            {selectedReport === 'income' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1.5 matches-label">
                  <Users className="w-3 h-3 text-slate-400" /> Choose Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:outline-none p-2.5 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                >
                  <option value="All">All Customers</option>
                  {customers.map(c => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
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
      <div className={`hidden print:block border-b-2 border-slate-900 pb-5 mb-8 ${isModalOpen ? 'print:hidden' : ''}`}>
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
      <div className={`print:bg-white ${isModalOpen ? 'print:hidden' : ''}`}>
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
                {/* 2. List component */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-50 mb-4 select-none">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase">Customer Receipts Audit Stream</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{incomesReportData.items.length} records matched</p>
                    </div>
                    <button
                      onClick={() => setIsOverallCustomerStatementOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 border-none text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <FileText className="w-4 h-4" />
                      View Statement
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest font-black border-b border-slate-100">
                          <th className="pb-3.5">Income Category</th>
                          <th className="pb-3.5">Filing Date</th>
                          <th className="pb-3.5 text-center">Filing System</th>
                          <th className="pb-3.5">Client / Customer Mapping</th>
                          <th className="pb-3.5">Balance Amount</th>
                          <th className="pb-3.5">Ledger Context</th>
                          <th className="pb-3.5 text-right">Received Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {incomesReportData.items.map((inc) => {
                          const cust = inc.customerId ? customers.find(c => c.id === inc.customerId) : null;
                          
                          // Calculate remaining balance (receivable)
                          let remainingBalance = 0;
                          if (cust) {
                            const customerInvoices = invoices.filter(inv => {
                              const invBuyerName = (inv.buyer?.name || '').trim().toUpperCase();
                              const selCustName = (cust?.name || '').trim().toUpperCase();
                              const invCustId = (inv.customerId || '').trim().toUpperCase();
                              const selCustId = (cust?.id || '').trim().toUpperCase();
                              return (invBuyerName === selCustName && invBuyerName !== '') || (invCustId === selCustId && invCustId !== '');
                            });
                            const unpaidInvoiceAmount = customerInvoices.reduce((sum, inv) => {
                              const total = Number(inv.totalAmount) || 0;
                              const paid = Number(inv.paidAmount) || 0;
                              return sum + Math.max(0, total - paid);
                            }, 0);
                            remainingBalance = (cust.openingBalance || 0) + unpaidInvoiceAmount;
                          }

                          return (
                            <tr key={inc.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="py-3 text-xs font-bold text-emerald-700">
                                <div>{inc.categoryName}</div>
                                <div className="text-[9px] font-mono text-slate-400 font-semibold">{inc.id}</div>
                              </td>
                              <td className="py-3 text-xs font-semibold text-slate-500 font-mono">{inc.date}</td>
                              <td className="py-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase">
                                  {inc.paymentMode}
                                </span>
                              </td>
                              <td className="py-3 text-xs">
                                {cust ? (
                                  <div className="space-y-1">
                                    <span className="font-bold text-slate-800 capitalize block">{inc.customerName}</span>
                                    <span className="text-[10px] font-mono text-slate-400 block font-semibold">{cust.id}</span>
                                  </div>
                                ) : (
                                  <span className="font-bold text-slate-500 italic capitalize">{inc.customerName || 'Standard Client'}</span>
                                )}
                              </td>
                              <td className="py-3 text-xs">
                                {cust ? (
                                  <span className="text-slate-800 font-bold font-mono bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">
                                    ₹{remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic font-mono">---</span>
                                )}
                              </td>
                              <td className="py-3 text-xs">
                                {inc.allocationType === 'opening_balance' ? (
                                  <div className="space-y-1">
                                    <span className="inline-block bg-amber-50 text-amber-600 border border-amber-200 rounded px-2 py-0.5 text-[9px] font-bold uppercase">
                                      Deducted from OB
                                    </span>
                                    {inc.notes && <p className="text-[10px] text-slate-400 italic line-clamp-1">{inc.notes}</p>}
                                  </div>
                                ) : inc.allocationType === 'invoice' && inc.invoiceNo ? (
                                  <div className="space-y-1">
                                    <span className="inline-block bg-indigo-50 text-indigo-600 border border-indigo-200 rounded px-2 py-0.5 text-[9px] font-bold uppercase">
                                      Paid Against Bill: #{inc.invoiceNo}
                                    </span>
                                    {inc.notes && <p className="text-[10px] text-slate-400 italic line-clamp-1">{inc.notes}</p>}
                                  </div>
                                ) : (
                                  <span className="text-slate-500 italic text-[11px] block">{inc.notes || '---'}</span>
                                )}
                              </td>
                              <td className="py-3 text-right text-xs font-black text-slate-800 font-mono">₹{inc.amount.toLocaleString()}</td>
                            </tr>
                          );
                        })}

                        {incomesReportData.items.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-10">
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

            {/* Supplier report logs */}
            {selectedReport === 'supplier' && (
              <>
                {/* 1. Sum grid metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gross Purchases</p>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mt-2 select-none">
                      ₹{supplierReportData.summary.totalPurchases.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Overall raw material purchase values.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-emerald-600">Total Paid So Far</p>
                    <h3 className="text-xl font-black text-emerald-800 tracking-tight mt-2 select-none">
                      ₹{supplierReportData.summary.totalPaid.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Sum of cleared supplier accounts.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider text-rose-600">Remaining Pending Dues</p>
                    <h3 className="text-xl font-black text-rose-800 tracking-tight mt-2 select-none">
                      ₹{supplierReportData.summary.totalPending.toLocaleString()}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Current unpaid/pending balances.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Active Batches</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2 select-none">
                      {supplierReportData.summary.totalLots} Lots
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Total batches recorded within dates.</p>
                  </div>
                </div>

                {/* 2. Detailed audit grid */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-50 mb-4 select-none">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase">Supplier Transaction Ledger</h3>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{supplierReportData.items.length} lots matched</p>
                    </div>
                    <button
                      onClick={() => setIsOverallSupplierStatementOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 border-none text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <FileText className="w-4 h-4" />
                      View Statement
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest font-black border-b border-slate-100">
                          <th className="pb-3.5 px-4">Item Details</th>
                          <th className="pb-3.5 px-4">Payment Mode</th>
                          <th className="pb-3.5 px-4">Due Date</th>
                          <th className="pb-3.5 px-4">Net Amount</th>
                          <th className="pb-3.5 px-4">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {supplierReportData.items.map((item, idx) => {
                          const gross = item.totalCost !== undefined && item.totalCost !== null ? Number(item.totalCost) : (Number(item.pricePerMeter) || 0) * (Number(item.quantity) || 0);
                          const paid = Number(item.paidAmount) || 0;
                          const pending = Math.max(0, gross - paid);
                          
                          let paymentStatusText = 'Unpaid';
                          if (paid >= gross) {
                            paymentStatusText = 'Paid';
                          } else if (paid > 0) {
                            paymentStatusText = 'Partially Paid';
                          }

                          return (
                            <tr key={`supp-rep-${item.id}-${idx}`} className="hover:bg-slate-50/50 transition-all">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 text-rose-600">
                                    <Layers className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-indigo-600">{item.id}</span>
                                      <span className="text-[10px] text-slate-400 font-semibold">{item.entryDate}</span>
                                    </div>
                                    <p className="text-xs font-bold text-indigo-600">
                                      {item.fabricType} {item.productGroupName ? `(${item.productGroupName})` : ''}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">From: {item.supplierName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <span className={cn(
                                  "text-xs font-bold px-2.5 py-1 rounded-xl border uppercase tracking-wider",
                                  item.paymentType === 'Credit' 
                                    ? "bg-amber-50 text-amber-700 border-amber-100" 
                                    : "bg-emerald-50 text-emerald-700 border-emerald-100"
                                )}>
                                  {item.paymentType || 'Cash'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                {item.dueDate ? (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-bold text-rose-600">
                                      {item.dueDate}
                                    </span>
                                    {item.creditDays !== undefined && item.creditDays > 0 ? (
                                      <span className="text-[10px] text-slate-400 font-semibold">({item.creditDays} days)</span>
                                    ) : (
                                      item.dueDate && item.entryDate && (
                                        <span className="text-[10px] text-slate-400 font-semibold">
                                          ({Math.round((new Date(item.dueDate).getTime() - new Date(item.entryDate).getTime()) / (1000 * 60 * 60 * 24))} days)
                                        </span>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400 font-medium">-</span>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <p className="text-sm font-bold text-indigo-600">₹{gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                {Number(item.quantity) > 0 && (
                                  <p className="text-[10px] text-slate-500 font-semibold">
                                    {item.quantity} {item.unit === 'KGs' ? 'KGs' : (item.unit === 'Meters' ? 'm' : 'pcs')}
                                  </p>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex flex-col gap-1 w-fit">
                                  <span className={cn(
                                    "text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider text-center",
                                    paymentStatusText === 'Paid' 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                      : paymentStatusText === 'Partially Paid'
                                      ? "bg-blue-50 text-blue-700 border-blue-100"
                                      : "bg-amber-50 text-amber-700 border-amber-100"
                                  )}>
                                    {paymentStatusText}
                                  </span>
                                  <div className="text-[10px] font-medium text-slate-400 divide-x divide-slate-200 flex gap-1.5 items-center">
                                    <span>Paid: <span className="font-semibold text-slate-600">₹{paid.toLocaleString()}</span></span>
                                    <span className="pl-1.5">Pending: <span className={cn("font-bold", pending > 0 ? "text-rose-600" : "text-slate-500")}>₹{pending.toLocaleString()}</span></span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {supplierReportData.items.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-10">
                              <p className="text-xs font-black text-slate-400 uppercase select-none">No active supplier records in coordinates</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Godown Stock Ledger Section */}
            {selectedReport === 'godown' && (
              <>
                {/* 1. Sum grid metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Net Available FG Stock</p>
                    <h3 className="text-xl font-black text-emerald-600 tracking-tight mt-2 select-none">
                      {godownReportData.summary.netFinished.toLocaleString()} pcs
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Available stock (FG minus Damage)</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gross Finished Goods</p>
                    <h3 className="text-xl font-black text-indigo-600 tracking-tight mt-2 select-none">
                      {godownReportData.summary.totalFinished.toLocaleString()} pcs
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Total recorded finished receipts.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Damage</p>
                    <h3 className="text-xl font-black text-rose-600 tracking-tight mt-2 select-none">
                      {godownReportData.summary.totalDamage.toLocaleString()} pcs
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Deducted from finished stock.</p>
                  </div>

                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Transfers</p>
                    <h3 className="text-xl font-black text-sky-600 tracking-tight mt-2 select-none">
                      {godownReportData.summary.totalTransferred.toLocaleString()} pcs
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">Godown movement transactions.</p>
                  </div>
                </div>

                {/* 2. Detailed godown transaction list */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-50 mb-4 select-none">
                    <h3 className="text-sm font-black text-slate-800 uppercase">
                      Godown Stock Ledger Log ({selectedGodown === 'All' ? 'All Godowns' : selectedGodown})
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase font-mono">{godownReportData.items.length} matched transactions</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-[10px] text-slate-400 uppercase tracking-widest font-black border-b border-slate-100">
                          <th className="pb-3.5">Date</th>
                          <th className="pb-3.5">Item / Model Details</th>
                          <th className="pb-3.5 text-center">Type</th>
                          <th className="pb-3.5 text-center font-mono">Quantity</th>
                          <th className="pb-3.5 text-right">Godown Warehouse</th>
                          <th className="pb-3.5 text-right no-print">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {godownReportData.items.map((item) => {
                          const isFinished = item.type === 'Finished Goods' || item.status === 'Finished Goods';
                          const isDamage = item.type === 'Damage';
                          const isTransfer = item.type === 'Transfer';
                          
                          let typeLabel = 'Work in Progress';
                          let typeBadgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                          if (isFinished) {
                            typeLabel = 'Finished Goods';
                            typeBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                          } else if (isDamage) {
                            typeLabel = 'Damage';
                            typeBadgeColor = 'bg-rose-50 text-rose-700 border-rose-100';
                          } else if (isTransfer) {
                            typeLabel = 'Transfer';
                            typeBadgeColor = 'bg-sky-50 text-sky-700 border-sky-100';
                          }

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                              <td className="py-4 text-xs font-semibold text-slate-500 font-mono">
                                {item.assignedDate}
                              </td>
                              <td className="py-4">
                                <div className="text-xs font-bold text-slate-800">
                                  {item.modelName || 'Raw Material'} {item.size ? `(${item.size})` : ''}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">ID: {item.id}</div>
                              </td>
                              <td className="py-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${typeBadgeColor}`}>
                                  {typeLabel}
                                </span>
                              </td>
                              <td className="py-4 text-center text-xs font-black text-slate-800 font-mono">
                                {item.quantity} {item.finishedPieces !== undefined ? 'pcs' : (item.unit === 'KGs' ? 'KGs' : (item.unit === 'Pieces' ? 'pcs' : 'm'))}
                              </td>
                              <td className="py-4 text-right">
                                <div className="text-xs font-bold text-slate-700">
                                  {item.unit || 'Unknown'}
                                </div>
                                {item.toGodown && (
                                  <div className="text-[10px] text-indigo-600 font-bold">
                                    → To: {item.toGodown}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 text-right no-print">
                                <button
                                  onClick={() => handleDeleteLedgerItem(item)}
                                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all inline-flex items-center justify-center cursor-pointer border-none bg-transparent"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {godownReportData.items.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-10">
                              <p className="text-xs font-black text-slate-400 uppercase select-none">No matched godown transactions in coordinates</p>
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

      {/* Supplier Payment Gate Dialog */}
      {isPaymentDialogOpen && paymentItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-left">
            <div className="p-8 border-b border-rose-100 bg-gradient-to-r from-rose-50/50 to-amber-50/20 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Payments desk</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500 animate-bounce" />
                  Supplier Payment Gate
                </h3>
              </div>
              <button 
                onClick={() => { setIsPaymentDialogOpen(false); setPaymentItem(null); }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {(() => {
                const modalGross = paymentItem.totalCost !== undefined && paymentItem.totalCost !== null ? Number(paymentItem.totalCost) : (paymentItem.pricePerMeter || 0) * (paymentItem.quantity || 0);
                const modalPaid = Number(paymentItem.paidAmount) || 0;
                const modalRemaining = Math.max(0, modalGross - modalPaid);
                return (
                  <>
                    <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Supplier & Entry</span>
                        <span className="font-bold text-slate-800">{paymentItem.supplierName} ({paymentItem.id})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Purchase Date</span>
                        <span className="font-bold text-slate-600">{paymentItem.entryDate}</span>
                      </div>
                      <hr className="border-slate-200/50" />
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-500">Gross Lot Amount</span>
                        <span className="text-slate-800 font-bold text-sm">₹{modalGross.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Paid So Far</span>
                        <span>₹{modalPaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-extrabold text-sm pt-2 border-t border-dashed border-slate-200">
                        <span>Remaining Pending Due</span>
                        <span>₹{modalRemaining.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Payment Entry Option */}
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentDetails({ ...paymentDetails, isFullPayment: true, amountToPay: modalRemaining });
                          }}
                          className={`flex-1 p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                            paymentDetails.isFullPayment 
                              ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold" 
                              : "border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50 bg-white"
                          }`}
                        >
                          <p className="text-[10px] uppercase tracking-wider font-extrabold mb-1">Pay Remaining Full</p>
                          <p className="text-sm">₹{modalRemaining.toLocaleString()}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentDetails({ ...paymentDetails, isFullPayment: false })}
                          className={`flex-1 p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                            !paymentDetails.isFullPayment 
                              ? "border-indigo-500 bg-indigo-50/50 text-indigo-800 font-bold" 
                              : "border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50 bg-white"
                          }`}
                        >
                          <p className="text-[10px] uppercase tracking-wider font-extrabold mb-1">Pay Partial Amount</p>
                          <p className="text-sm">Customize amount</p>
                        </button>
                      </div>

                      {!paymentDetails.isFullPayment && (
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Specify Amount to Pay (₹)</label>
                          <input 
                            required
                            type="number"
                            max={modalRemaining}
                            min={1}
                            placeholder="0.00"
                            className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-sm"
                            value={paymentDetails.amountToPay || ''}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, amountToPay: parseFloat(e.target.value) || 0 })}
                            onWheel={(e) => e.currentTarget.blur()}
                          />
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Core fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-semibold text-slate-700 shadow-sm"
                    value={paymentDetails.date}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Mode</label>
                  <select 
                    className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-semibold text-slate-700 shadow-sm"
                    value={paymentDetails.paymentMode}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentMode: e.target.value })}
                  >
                    <option>Bank Transfer</option>
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Cheque</option>
                    <option>Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Notes / Expense Remarks</label>
                <textarea 
                  className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm resize-none"
                  rows={2}
                  value={paymentDetails.notes}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                  placeholder="Record payment memo..."
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                {Number(paymentItem.paidAmount) > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to unmark all payments for this lot? This will reset paid amount back to ₹0.')) {
                        handleUnmarkPaid();
                      }
                    }}
                    className="py-4 px-5 rounded-2xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors border border-rose-100 whitespace-nowrap cursor-pointer"
                  >
                    Unmark/Reset Payments
                  </button>
                )}
                <div className="flex-1 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => { setIsPaymentDialogOpen(false); setPaymentItem(null); }}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors border-none cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={paymentDetails.amountToPay <= 0}
                    className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 border-none cursor-pointer"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Statement Dialog */}
      {isStatementDialogOpen && statementItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-left">
            <div className="p-8 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-indigo-50/10 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Account ledger</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Supplier Payment Statement
                </h3>
              </div>
              <button 
                onClick={() => { setIsStatementDialogOpen(false); setStatementItem(null); }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {(() => {
                const stmtGross = statementItem.totalCost !== undefined && statementItem.totalCost !== null ? Number(statementItem.totalCost) : (Number(statementItem.pricePerMeter) || 0) * (Number(statementItem.quantity) || 0);
                const stmtPaid = Number(statementItem.paidAmount) || 0;
                const stmtPending = Math.max(0, stmtGross - stmtPaid);

                // Search through expenses to match this lot
                const stmtPayments = expenses.filter(exp => 
                  exp.notes && (
                    exp.notes.includes(statementItem.id) || 
                    exp.notes.toLowerCase().includes(statementItem.id.toLowerCase())
                  )
                );

                const formatDateTime = (createdAt: string, fallbackDate: string) => {
                  if (!createdAt) {
                    try {
                      const d = new Date(fallbackDate);
                      if (isNaN(d.getTime())) return { date: fallbackDate, time: '—' };
                      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                      return { date: dateStr, time: '—' };
                    } catch {
                      return { date: fallbackDate, time: '—' };
                    }
                  }
                  try {
                    const d = new Date(createdAt);
                    if (isNaN(d.getTime())) return { date: fallbackDate, time: '—' };
                    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                    return { date: dateStr, time: timeStr };
                  } catch (e) {
                    return { date: fallbackDate, time: '—' };
                  }
                };

                return (
                  <>
                    {/* Header Details summary */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Supplier details</p>
                        <p className="text-base font-black text-slate-800">{statementItem.supplierName}</p>
                        <p className="text-slate-500">Lot reference: <span className="font-bold text-indigo-600">{statementItem.id}</span></p>
                      </div>
                      <div className="space-y-1 md:text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Purchase context</p>
                        <p className="text-slate-700 font-semibold">{statementItem.fabricType} {statementItem.productGroupName ? `(${statementItem.productGroupName})` : ''}</p>
                        <p className="text-slate-500 font-mono">Date: {statementItem.entryDate}</p>
                      </div>
                    </div>

                    {/* Cost summary card grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider">Net Amount</p>
                        <p className="text-lg font-black text-slate-800">₹{stmtGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Total Paid</p>
                        <p className="text-lg font-black text-emerald-700">₹{stmtPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100/50 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-rose-700 tracking-wider">Remaining Due</p>
                        <p className="text-lg font-black text-rose-700">₹{stmtPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* Timeline List */}
                    <div className="space-y-3.5">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 select-none">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Supplier Payment Timeline Logs
                      </h4>

                      {stmtPayments.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl p-6">
                          <Coins className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                          <p className="text-xs font-bold text-slate-400 uppercase">No transactions logged for this lot</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Use the "Pay/Manage" desk to record invoice payments.</p>
                        </div>
                      ) : (
                        <div className="relative border-l border-slate-100 pl-5 ml-2.5 space-y-5">
                          {stmtPayments.map((exp, idx) => {
                            const { date: dStr, time: tStr } = formatDateTime(exp.createdAt || '', exp.date);
                            return (
                              <div key={exp.id || idx} className="relative animate-in fade-in duration-300">
                                {/* Timeline Bullet dot */}
                                <div className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white ring-4 ring-indigo-50" />
                                
                                <div className="bg-slate-50 hover:bg-slate-50/80 border border-slate-100 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-700">{dStr}</span>
                                      {tStr !== '—' && (
                                        <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1">
                                          <Clock className="w-2.5 h-2.5" /> {tStr}
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-400 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
                                        {exp.paymentMode || 'Bank Transfer'}
                                      </span>
                                    </div>
                                    <p className="text-slate-500 font-medium">{exp.notes || 'Payment installation'}</p>
                                  </div>
                                  <div className="sm:text-right shrink-0">
                                    <span className="text-xs text-slate-400 font-semibold block">Paid Amount</span>
                                    <span className="text-sm font-black text-emerald-600">₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Statement Ledger
                </button>
                <button 
                  type="button"
                  onClick={() => { setIsStatementDialogOpen(false); setStatementItem(null); }}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors border-none cursor-pointer"
                >
                  Dismiss / Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Supplier Statement Dialog */}
      {isOverallSupplierStatementOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-250 invoice-print-parent print:static print:block print:w-full print:h-auto print:bg-white print:p-0">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-left invoice-print-container print:max-h-none print:overflow-visible print:h-auto print:border-none print:shadow-none print:p-6">
            <div className="p-8 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-indigo-50/10 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Statement Ledger</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Supplier Account Statement
                </h3>
              </div>
              <button 
                onClick={() => setIsOverallSupplierStatementOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar print:max-h-none print:overflow-visible print:h-auto print:p-0">
              {(() => {
                const stmtGross = supplierReportData.summary.totalPurchases;
                const stmtPaid = supplierReportData.summary.totalPaid;
                const stmtPending = supplierReportData.summary.totalPending;
                const totalLots = supplierReportData.summary.totalLots;

                // Match relevant expenses/payments
                const stmtPayments = expenses.filter(exp => {
                  return supplierReportData.items.some(lot => 
                    exp.notes && (
                      exp.notes.includes(lot.id) || 
                      exp.notes.toLowerCase().includes(lot.id.toLowerCase())
                    )
                  ) || (selectedSupplier !== 'All' && exp.notes && exp.notes.toLowerCase().includes(selectedSupplier.toLowerCase()));
                }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const formatDateTime = (createdAt: string, fallbackDate: string) => {
                  if (!createdAt) {
                    try {
                      const d = new Date(fallbackDate);
                      if (isNaN(d.getTime())) return { date: fallbackDate, time: '—' };
                      const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                      return { date: dateStr, time: '—' };
                    } catch {
                      return { date: fallbackDate, time: '—' };
                    }
                  }
                  try {
                    const d = new Date(createdAt);
                    if (isNaN(d.getTime())) return { date: fallbackDate, time: '—' };
                    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                    return { date: dateStr, time: timeStr };
                  } catch (e) {
                    return { date: fallbackDate, time: '—' };
                  }
                };

                return (
                  <>
                    {/* Header Details summary */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Account statement for</p>
                        <p className="text-lg font-black text-slate-800">
                          {selectedSupplier === 'All' ? 'All Active Suppliers' : selectedSupplier}
                        </p>
                        <p className="text-slate-500 font-semibold">
                          Period: <span className="font-bold text-indigo-600">{startDate || 'Anytime'}</span> to <span className="font-bold text-indigo-600">{endDate || 'Anytime'}</span>
                        </p>
                      </div>
                      <div className="space-y-1 md:text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">System Metadata</p>
                        <p className="text-slate-700 font-bold">Company: {companyName}</p>
                        <p className="text-slate-500 font-mono">Statement generated on {new Date().toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Cost summary card grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider">Gross Purchases</p>
                        <p className="text-base font-black text-slate-800">₹{stmtGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Total Paid</p>
                        <p className="text-base font-black text-emerald-700">₹{stmtPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100/50 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-rose-700 tracking-wider">Remaining Dues</p>
                        <p className="text-base font-black text-rose-700">₹{stmtPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Active Lots</p>
                        <p className="text-base font-black text-slate-800">{totalLots} Lots</p>
                      </div>
                    </div>

                    {/* Tabular summary of matched lots */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 select-none">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        Matched Lots & Valuation Audit
                      </h4>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[220px] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                            <tr>
                              <th className="py-2.5 px-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">Lot ID</th>
                              <th className="py-2.5 px-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
                              <th className="py-2.5 px-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">Raw Material / Fabric</th>
                              <th className="py-2.5 px-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Net Amount</th>
                              <th className="py-2.5 px-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Paid</th>
                              <th className="py-2.5 px-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pending</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {supplierReportData.items.map((lot, lIdx) => {
                              const lotGross = lot.totalCost !== undefined && lot.totalCost !== null ? Number(lot.totalCost) : (Number(lot.pricePerMeter) || 0) * (Number(lot.quantity) || 0);
                              const lotPaid = Number(lot.paidAmount) || 0;
                              const lotPending = Math.max(0, lotGross - lotPaid);
                              return (
                                <tr key={`stmt-lot-${lot.id}-${lIdx}`} className="hover:bg-slate-50/50">
                                  <td className="py-2 px-4 font-bold text-indigo-600">{lot.id}</td>
                                  <td className="py-2 px-4 text-slate-600 font-semibold">{lot.entryDate || '-'}</td>
                                  <td className="py-2 px-4 text-slate-500">
                                    <span className="capitalize font-medium text-slate-700">{(lot.rawMaterialType || 'cloth').replace(/_/g, ' ')}</span>
                                    {lot.fabricType && lot.fabricType.toLowerCase() !== (lot.rawMaterialType || 'cloth').toLowerCase() && ` (${lot.fabricType})`}
                                  </td>
                                  <td className="py-2 px-4 text-right font-bold text-slate-800">₹{lotGross.toLocaleString('en-IN')}</td>
                                  <td className="py-2 px-4 text-right font-semibold text-emerald-600">₹{lotPaid.toLocaleString('en-IN')}</td>
                                  <td className="py-2 px-4 text-right font-bold text-rose-500">₹{lotPending.toLocaleString('en-IN')}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Chronological payment list */}
                    <div className="space-y-3.5">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 select-none">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Transactions History (Date & Time logs)
                      </h4>

                      {stmtPayments.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-100 rounded-3xl p-6">
                          <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[11px] font-bold text-slate-400 uppercase">No individual payments found in this context</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                          {stmtPayments.map((exp, idx) => {
                            const { date: dStr, time: tStr } = formatDateTime(exp.createdAt || '', exp.date);
                            return (
                              <div key={exp.id || idx} className="bg-slate-50 hover:bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 transition-all flex items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-700">{dStr}</span>
                                    {tStr !== '—' && (
                                      <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5" /> {tStr}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]" title={exp.notes}>
                                    {exp.notes || 'Payment installation'}
                                  </p>
                                  <span className="text-[9px] text-slate-400 font-mono font-bold bg-slate-100 px-1 rounded-md">
                                    {exp.paymentMode || 'Bank Transfer'}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[9px] text-slate-400 font-semibold block">Amount</span>
                                  <span className="font-black text-emerald-600">₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Actions */}
              <div className="pt-4 flex gap-3 print:hidden">
                <button 
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Printer className="w-4 h-4" />
                  Print / Download Statement
                </button>
                <button 
                  type="button"
                  onClick={() => setIsOverallSupplierStatementOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors border-none cursor-pointer"
                >
                  Dismiss / Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall Customer Statement Dialog */}
      {isOverallCustomerStatementOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-250 invoice-print-parent print:static print:block print:w-full print:h-auto print:bg-white print:p-0">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-left invoice-print-container print:max-h-none print:overflow-visible print:h-auto print:border-none print:shadow-none print:p-6">
            <div className="p-8 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/50 to-indigo-50/10 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Statement Ledger</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Customer Account Statement
                </h3>
              </div>
              <button 
                onClick={() => setIsOverallCustomerStatementOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar print:max-h-none print:overflow-visible print:h-auto print:p-0">
              {(() => {
                const stmtInvoices = invoices.filter(inv => {
                  const matchRange = isWithinRange(inv.date);
                  const buyerName = inv.buyer?.name || '';
                  const matchCustomer = selectedCustomer === 'All' ||
                    (buyerName && buyerName.trim().toUpperCase() === selectedCustomer.trim().toUpperCase());
                  const matchSearch = searchQuery === '' ||
                    buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()));
                  return matchRange && matchCustomer && matchSearch;
                });

                const totalBilled = stmtInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
                const totalCollected = stmtInvoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
                const totalReceivable = stmtInvoices.reduce((sum, inv) => sum + Math.max(0, (Number(inv.totalAmount) || 0) - (Number(inv.paidAmount) || 0)), 0);
                const totalReceipts = incomesReportData.totalAmount;

                const activeCustomerObj = selectedCustomer !== 'All' 
                  ? customers.find(c => c.name.trim().toUpperCase() === selectedCustomer.trim().toUpperCase()) 
                  : null;

                return (
                  <>
                    {/* Header Details summary */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Customer details</p>
                        <p className="text-lg font-black text-slate-800">
                          {selectedCustomer === 'All' ? 'All Active Customers' : selectedCustomer}
                        </p>
                        {activeCustomerObj && (
                          <div className="text-[11px] text-slate-500 space-y-0.5 font-medium">
                            <p>Cust ID: <span className="font-bold text-slate-700">{activeCustomerObj.id}</span></p>
                            {activeCustomerObj.phone && <p>Phone: {activeCustomerObj.phone}</p>}
                            {activeCustomerObj.gstin && <p>GSTIN: {activeCustomerObj.gstin}</p>}
                            <p>Opening Balance: <span className="font-bold text-amber-600">₹{(activeCustomerObj.openingBalance || 0).toLocaleString('en-IN')}</span></p>
                          </div>
                        )}
                        <p className="text-slate-500 font-semibold pt-1">
                          Period: <span className="font-bold text-indigo-600">{startDate || 'Anytime'}</span> to <span className="font-bold text-indigo-600">{endDate || 'Anytime'}</span>
                        </p>
                      </div>
                      <div className="space-y-1 md:text-right self-start md:self-auto">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Company Identity</p>
                        <p className="text-slate-700 font-bold">{companyName}</p>
                        <p className="text-slate-500 font-mono">Statement generated on {new Date().toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Cost summary card grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-indigo-600 tracking-wider">Gross Billed (Sales)</p>
                        <p className="text-base font-black text-slate-800">₹{totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/50 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-emerald-700 tracking-wider">Invoiced Paid</p>
                        <p className="text-base font-black text-emerald-700">₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="p-4 bg-rose-50/40 rounded-2xl border border-rose-100/50 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-rose-700 tracking-wider">Net Dues</p>
                        <p className="text-base font-black text-rose-700">₹{totalReceivable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 bg-opacity-30 rounded-2xl border border-emerald-100 space-y-1">
                        <p className="text-[9px] uppercase font-bold text-teal-800 tracking-wider">Total Received (Receipts)</p>
                        <p className="text-base font-black text-teal-800">₹{totalReceipts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* Tabular summary of matched invoices */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 select-none">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Invoices Billing Records
                      </h4>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[180px] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                            <tr>
                              <th className="py-2 px-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">Invoice No</th>
                              <th className="py-2 px-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">Date</th>
                              <th className="py-2 px-4 text-left font-bold text-slate-500 uppercase tracking-wider text-[10px]">Customer</th>
                              <th className="py-2 px-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Net Amount</th>
                              <th className="py-2 px-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Paid</th>
                              <th className="py-2 px-4 text-right font-bold text-slate-500 uppercase tracking-wider text-[10px]">Pending</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {stmtInvoices.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center py-6 text-slate-400 text-[11px] font-semibold">No invoices matched this selection</td>
                              </tr>
                            ) : (
                              stmtInvoices.map((inv, lIdx) => {
                                const total = Number(inv.totalAmount) || 0;
                                const paid = Number(inv.paidAmount) || 0;
                                const pending = Math.max(0, total - paid);
                                return (
                                  <tr key={inv.id || lIdx} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-4 font-bold text-indigo-600">#{inv.invoiceNo}</td>
                                    <td className="py-2 px-4 text-slate-500 font-mono">{inv.date}</td>
                                    <td className="py-2 px-4 text-slate-700 font-semibold">{inv.buyer?.name || 'Standard Customer'}</td>
                                    <td className="py-2 px-4 text-right font-bold text-slate-800">₹{total.toLocaleString('en-IN')}</td>
                                    <td className="py-2 px-4 text-right font-semibold text-emerald-600">₹{paid.toLocaleString('en-IN')}</td>
                                    <td className="py-2 px-4 text-right font-bold text-rose-500">₹{pending.toLocaleString('en-IN')}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Chronological payment list */}
                    <div className="space-y-3.5">
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 select-none">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Customer Receipts logs
                      </h4>

                      {incomesReportData.items.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-slate-100 rounded-3xl p-6">
                          <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-[11px] font-bold text-slate-400 uppercase">No receipt records found in this context</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                          {incomesReportData.items.map((inc, idx) => {
                            return (
                              <div key={inc.id || idx} className="bg-slate-50 hover:bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5 transition-all flex items-center justify-between gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-slate-700 font-mono">{inc.date}</span>
                                    <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                                      {inc.categoryName}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]" title={inc.notes}>
                                    {inc.notes || 'No description notes'}
                                  </p>
                                  <span className="text-[9px] text-slate-400 font-mono font-bold bg-slate-100 px-1 rounded-md">
                                    {inc.paymentMode || 'Cash'}
                                  </span>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[9px] text-slate-400 font-semibold block">Amount</span>
                                  <span className="font-black text-emerald-600">₹{inc.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Actions */}
              <div className="pt-4 flex gap-3 print:hidden">
                <button 
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Printer className="w-4 h-4" />
                  Print / Download Statement
                </button>
                <button 
                  type="button"
                  onClick={() => setIsOverallCustomerStatementOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors border-none cursor-pointer"
                >
                  Dismiss / Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Ledger Item Dialog */}
      {isDeleteLedgerOpen && ledgerItemToDelete && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-left">
            <div className="p-8 border-b border-rose-100 bg-gradient-to-r from-rose-50/50 to-amber-50/20 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Warning</span>
                <h3 className="text-xl font-bold text-slate-800 mt-1 flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-rose-600" />
                  Confirm Delete Ledger Entry
                </h3>
              </div>
              <button 
                onClick={() => { setIsDeleteLedgerOpen(false); setLedgerItemToDelete(null); }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Are you sure you want to permanently delete this ledger entry?
              </p>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                <p className="text-slate-500 font-semibold">
                  ID: <span className="font-bold text-slate-700">{ledgerItemToDelete.id}</span>
                </p>
                <p className="text-slate-500 font-semibold">
                  Item: <span className="font-bold text-slate-700">{ledgerItemToDelete.modelName}</span>
                </p>
                <p className="text-slate-500 font-semibold">
                  Type: <span className="font-bold text-rose-600 uppercase">{ledgerItemToDelete.type || 'Production'}</span>
                </p>
                <p className="text-slate-500 font-semibold">
                  Quantity: <span className="font-bold text-slate-700">{ledgerItemToDelete.quantity} {ledgerItemToDelete.finishedPieces !== undefined ? 'pcs' : (ledgerItemToDelete.unit === 'KGs' ? 'KGs' : (ledgerItemToDelete.unit === 'Pieces' ? 'pcs' : 'm'))}</span>
                </p>
              </div>
              <p className="text-xs text-rose-500 font-bold">
                * This will permanently remove this entry from your production records. This action cannot be undone.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => { setIsDeleteLedgerOpen(false); setLedgerItemToDelete(null); }}
                className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDeleteLedgerItem}
                className="px-5 py-3 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer border-none shadow-sm"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
