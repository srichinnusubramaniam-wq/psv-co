import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  Trash2, 
  Edit2, 
  X, 
  Filter,
  ArrowUpDown,
  Layers,
  Palette,
  Hash,
  Scale,
  BarChart2,
  AlertTriangle,
  Coins,
  Wallet,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  Download,
  Printer
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { Supplier } from './Suppliers';
import { ProductModel } from './ProductMaster';

export interface InventoryItem {
  id: string;
  supplierId: string;
  supplierName: string;
  fabricType: string;
  pricePerMeter: number;
  quantity: number;
  unit: 'Meters' | 'Pieces' | 'KGs';
  entryDate: string;
  createdAt: string;
  paymentStatus?: 'Unpaid' | 'Partially Paid' | 'Paid';
  paidAmount?: number;
  paymentType?: 'Cash' | 'Credit';
  creditDays?: number;
  dueDate?: string;
  totalCost?: number;
  rawMaterialType?: 'yarn' | 'cloth' | 'jari';
  amount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  netAmount?: number;
  productGroupName?: string;
  gstType?: 'GST' | 'NON-GST';
}

function addDays(dateStr: string, days: number | string | undefined): string {
  if (!dateStr) return '';
  const parsedDays = parseInt(String(days || '0'), 10);
  if (isNaN(parsedDays) || parsedDays <= 0) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  date.setDate(date.getDate() + parsedDays);
  return date.toISOString().split('T')[0];
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [threshold, setThreshold] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState<'excel' | 'pdf'>('excel');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedSupplierDetails, setSelectedSupplierDetails] = useState<Supplier | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const handleInventoryExcelExport = () => {
    const headers = [
      "Lot ID/No", 
      "Payment Mode", 
      "Due Date",
      "Quantity", 
      "Unit", 
      "Price Per Unit (INR)", 
      "Total Cost (INR)", 
      "Paid Amount (INR)", 
      "Balance Due (INR)", 
      "Supplier Name", 
      "Entry Date", 
      "Payment Status"
    ];

    const rows = items.map(item => {
      const total = (item.pricePerMeter || 0) * (item.quantity || 0);
      const paid = Number(item.paidAmount) || 0;
      const balance = Math.max(0, total - paid);
      const status = item.paymentStatus || 
        (paid >= total ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Unpaid'));

      return [
        item.id,
        item.paymentType || "Cash",
        item.dueDate || "N/A",
        item.quantity,
        item.unit,
        item.pricePerMeter,
        total,
        paid,
        balance,
        item.supplierName || "Default",
        new Date(item.entryDate || item.createdAt).toLocaleDateString(),
        status
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `INVEN_Inventory_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    fabricType: '',
    productGroupName: '',
    unit: 'Meters',
    entryDate: new Date().toISOString().split('T')[0],
    paidAmount: 0,
    paymentType: 'Cash',
    creditDays: 0,
    dueDate: '',
    rawMaterialType: 'cloth',
    gstType: 'GST'
  });

  const getGSTPercentInline = (supplierId?: string) => {
    const targetId = supplierId !== undefined ? supplierId : formData.supplierId;
    const selectedSupplier = suppliers.find(s => s && s.id === targetId);
    if (!selectedSupplier || !selectedSupplier.state) {
      return { cgstPercent: 2.5, sgstPercent: 2.5, igstPercent: 0, isInterstate: false, locationType: 'Tamil Nadu (Local)' };
    }
    const stateStr = selectedSupplier.state.trim().toLowerCase().replace(/\s+/g, '');
    if (stateStr === 'tamilnadu' || stateStr.includes('tamilnadu')) {
      return { cgstPercent: 2.5, sgstPercent: 2.5, igstPercent: 0, isInterstate: false, locationType: 'Tamil Nadu (Local)' };
    } else {
      return { cgstPercent: 0, sgstPercent: 0, igstPercent: 5.0, isInterstate: true, locationType: 'Interstate' };
    }
  };

  const [activeTab, setActiveTab] = useState<'all' | 'pending_payments' | 'paid'>('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<InventoryItem | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    notes: '',
    amountToPay: 0,
    isFullPayment: true
  });

  useEffect(() => {
    // Load Items
    const savedItems = localStorage.getItem('inven_inventory');
    if (savedItems) {
      try { setItems(JSON.parse(savedItems)); } catch (e) { console.error(e); }
    }

    // Load Suppliers for dropdown
    const savedSuppliers = localStorage.getItem('inven_suppliers');
    if (savedSuppliers) {
      try { setSuppliers(JSON.parse(savedSuppliers)); } catch (e) { console.error(e); }
    }

    // Load Products for Cloth dropdown
    const savedProducts = localStorage.getItem('inven_product_master');
    if (savedProducts) {
      try { setProducts(JSON.parse(savedProducts)); } catch (e) { console.error(e); }
    }

    // Load Threshold from settings
    const savedSettings = localStorage.getItem('inven_settings');
    if (savedSettings) {
      try { 
        const settings = JSON.parse(savedSettings);
        if (settings.lowStockThreshold !== undefined) {
          setThreshold(settings.lowStockThreshold);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (products.length > 0 && !editingId) {
      const exists = products.some(p => p.description === formData.fabricType);
      if (!exists && formData.rawMaterialType === 'cloth') {
        setFormData(prev => ({
          ...prev,
          fabricType: products[0].description,
          productGroupName: products[0].productGroupName
        }));
      }
    }
  }, [products, editingId]);

  const saveToLocal = (data: InventoryItem[]) => {
    setItems(data);
    localStorage.setItem('inven_inventory', JSON.stringify(data));
  };

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

  const openPaymentDialog = (item: InventoryItem) => {
    const grossAmount = item.totalCost || ((item.pricePerMeter || 0) * (item.quantity || 0));
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

    const grossAmount = paymentItem.totalCost || ((paymentItem.pricePerMeter || 0) * (paymentItem.quantity || 0));
    const previousPaid = Number(paymentItem.paidAmount) || 0;
    const amountToPay = Number(paymentDetails.amountToPay) || 0;
    const newTotalPaid = Math.min(grossAmount, previousPaid + amountToPay);
    const isFullyPaid = newTotalPaid >= grossAmount;
    const newStatus = isFullyPaid ? 'Paid' as const : 'Partially Paid' as const;

    const updatedItems = items.map(item => {
      if (item.id === paymentItem.id) {
        return { 
          ...item, 
          paymentStatus: newStatus,
          paidAmount: newTotalPaid
        };
      }
      return item;
    });

    saveToLocal(updatedItems);

    recordExpenseEntry(
      paymentItem.id,
      paymentItem.supplierName,
      amountToPay,
      paymentDetails.date,
      paymentDetails.paymentMode,
      paymentDetails.notes
    );

    setIsPaymentDialogOpen(false);
    setPaymentItem(null);
  };

  const handleUnmarkPaid = () => {
    if (!paymentItem) return;

    const updatedItems = items.map(item => {
      if (item.id === paymentItem.id) {
        return { 
          ...item, 
          paymentStatus: 'Unpaid' as const, 
          paidAmount: 0 
        };
      }
      return item;
    });

    saveToLocal(updatedItems);
    setIsPaymentDialogOpen(false);
    setPaymentItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedSupplier = suppliers.find(s => s && s.id === formData.supplierId);
    const supplierName = selectedSupplier ? (selectedSupplier.name || selectedSupplier.companyName || 'Unknown') : 'Unknown';

    const isYarn = formData.rawMaterialType === 'yarn';
    const isJari = formData.rawMaterialType === 'jari';
    const finalFabricType = isYarn ? 'Yarn' : (isJari ? (formData.fabricType || 'Jari') : (formData.fabricType || 'Cotton'));
    const finalUnit = (isYarn || isJari) ? 'KGs' : (formData.unit || 'Meters');
    const finalQty = formData.quantity || 0;

    const grossTotal = formData.amount !== undefined
      ? ((formData.amount || 0) + (formData.cgst || 0) + (formData.sgst || 0) + (formData.igst || 0))
      : (formData.totalCost !== undefined ? formData.totalCost : ((formData.pricePerMeter || 0) * finalQty));
      
    const initialPaid = Number(formData.paidAmount) || 0;
    
    let status: 'Unpaid' | 'Partially Paid' | 'Paid' = 'Unpaid';
    if (initialPaid >= grossTotal) {
      status = 'Paid';
    } else if (initialPaid > 0) {
      status = 'Partially Paid';
    }

    const entryDateVal = formData.entryDate || new Date().toISOString().split('T')[0];
    const calculatedDueDate = addDays(entryDateVal, formData.creditDays || 0);

    const calculatedPricePerMeter = finalQty > 0
      ? (grossTotal / finalQty)
      : (formData.pricePerMeter || 0);

    if (editingId) {
      const updated = items.map(item => 
        item.id === editingId ? { 
          ...item, 
          ...formData as InventoryItem, 
          fabricType: finalFabricType,
          unit: finalUnit,
          quantity: finalQty,
          pricePerMeter: calculatedPricePerMeter,
          totalCost: grossTotal,
          supplierName,
          paymentStatus: status,
          paidAmount: initialPaid,
          dueDate: calculatedDueDate
        } : item
      );
      saveToLocal(updated);
    } else {
      const settingsStr = localStorage.getItem('inven_settings');
      let prefix = 'PUR';
      let currentNextId = 1;
      let parsedSettings: any = {};

      if (settingsStr) {
        try {
          parsedSettings = JSON.parse(settingsStr);
          if (parsedSettings.purchasePrefix) prefix = parsedSettings.purchasePrefix;
          if (parsedSettings.nextPurchaseId !== undefined && parsedSettings.nextPurchaseId !== '') currentNextId = Number(parsedSettings.nextPurchaseId);
        } catch (e) {
          console.error('Error parsing settings for purchase ID', e);
        }
      }

      const formattedId = `${prefix}-${currentNextId.toString().padStart(3, '0')}`;

      const newItem: InventoryItem = {
        fabricType: finalFabricType,
        ...formData as InventoryItem,
        unit: finalUnit,
        quantity: finalQty,
        pricePerMeter: calculatedPricePerMeter,
        totalCost: grossTotal,
        id: formattedId,
        supplierName,
        createdAt: new Date().toISOString(),
        paymentStatus: status,
        paidAmount: initialPaid,
        dueDate: calculatedDueDate
      };

      // Increment and update next purchase id in localstorage
      const updatedSettings = {
        ...parsedSettings,
        nextPurchaseId: currentNextId + 1
      };
      localStorage.setItem('inven_settings', JSON.stringify(updatedSettings));
      window.dispatchEvent(new Event('inven_localstorage_sync'));

      if (initialPaid > 0) {
        recordExpenseEntry(
          newItem.id, 
          newItem.supplierName, 
          initialPaid, 
          newItem.entryDate || new Date().toISOString().split('T')[0], 
          'Cash', 
          'Initial payment for raw materials lot'
        );
      }

      saveToLocal([newItem, ...items]);
    }

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      fabricType: '', 
      productGroupName: '',
      unit: 'Meters',
      entryDate: new Date().toISOString().split('T')[0],
      paidAmount: 0,
      paymentType: 'Cash',
      creditDays: 0,
      dueDate: '',
      totalCost: undefined,
      rawMaterialType: 'cloth',
      gstType: 'GST'
    });
  };

  const deleteItem = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      saveToLocal(items.filter(i => i.id !== deleteId));
      setDeleteId(null);
    }
  };

  const filteredItems = items.filter(i => 
    (i.paymentType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.fabricType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedItems = useMemo(() => {
    return filteredItems.filter(item => {
      const grossAmount = (item.pricePerMeter || 0) * (item.quantity || 0);
      const paid = Number(item.paidAmount) || 0;
      const isPending = paid < grossAmount;
      
      const passTab = activeTab === 'pending_payments' ? isPending : (activeTab === 'paid' ? !isPending : true);
      const passLowStock = showLowStockOnly ? (item.quantity <= threshold) : true;
      return passTab && passLowStock;
    });
  }, [filteredItems, activeTab, showLowStockOnly, threshold]);

  const lowStockItems = items.filter(item => item.quantity <= threshold);

  const supplierData = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      acc[item.supplierName] = (acc[item.supplierName] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total: total as number }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8); // Top 8 suppliers
  }, [items]);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

  const paymentItemNetAmount = paymentItem ? (paymentItem.totalCost || ((paymentItem.pricePerMeter || 0) * (paymentItem.quantity || 0))) : 0;

  const handlePurIdClick = (item: InventoryItem) => {
    const found = suppliers.find(s => s && (s.id === item.supplierId || s.name === item.supplierName || s.companyName === item.supplierName));
    if (found) {
      setSelectedSupplierDetails(found);
    } else {
      setSelectedSupplierDetails({
        id: item.supplierId || 'N/A',
        name: item.supplierName || 'Unknown Supplier',
        companyName: item.supplierName || 'Unknown Supplier',
        address: 'No detailed address found for this supplier.',
        gstNumber: 'N/A',
        createdAt: item.createdAt || new Date().toISOString()
      });
    }
    setIsSupplierModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">



      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Purchase Management</h2>
          <p className="text-sm text-slate-500">Track fabric stock, costs, and lot details.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Tab Switcher for payment statuses */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button 
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === 'all' 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              All Lots
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('pending_payments')}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                activeTab === 'pending_payments' 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Pending Payments
              {items.filter(item => {
                const gross = (item.pricePerMeter || 0) * (item.quantity || 0);
                return (item.paidAmount || 0) < gross;
              }).length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('paid')}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all",
                activeTab === 'paid' 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              Paid Lots
            </button>
          </div>

          <button 
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-50/50 px-5 py-2.5 rounded-2xl font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>

          <button 
            type="button"
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Add Raw Materials
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Fabric or Supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer h-10 select-none",
              showLowStockOnly 
                ? "bg-rose-50 border-rose-200 text-rose-600 shadow-sm shadow-rose-50" 
                : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
            )}
            title={`Isolate items with stock level ≤ ${threshold}`}
          >
            <AlertTriangle className={cn("w-4 h-4 text-rose-500", showLowStockOnly && "animate-pulse")} />
            <span>Low Stock Filter (≤ {threshold})</span>
            <span className={cn(
              "px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ml-1",
              showLowStockOnly ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-600"
            )}>
              {lowStockItems.length}
            </span>
          </button>
          
          <button 
            type="button"
            onClick={() => {
              setSearchQuery('');
              setShowLowStockOnly(false);
            }}
            className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition-colors h-10 w-10 flex items-center justify-center cursor-pointer"
            title="Reset search query & low stock filter"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Payment Mode</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Net Amount</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {displayedItems.map((item) => {
                const netAmount = item.totalCost || ((item.pricePerMeter || 0) * (item.quantity || 0));
                const paidAmt = Number(item.paidAmount) || 0;
                const pendingAmt = Math.max(0, netAmount - paidAmt);
                
                return (
                  <tr 
                    key={item.id} 
                    className={cn(
                      "group hover:bg-slate-50/30 transition-colors",
                      item.quantity <= threshold ? "bg-rose-50/40" : ""
                    )}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          item.quantity <= threshold ? "bg-rose-100 text-rose-600" :
                          item.paymentType === 'Credit' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <button
                            onClick={() => handlePurIdClick(item)}
                            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none text-left transition-colors cursor-pointer block"
                            title="Click to view supplier details"
                          >
                            {item.id}
                          </button>
                          <p className="text-xs font-bold text-indigo-600">
                            {item.fabricType} {item.productGroupName ? `(${item.productGroupName})` : ''}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.entryDate}</p>
                          <p className="text-[10px] text-slate-400 font-medium">From: {item.supplierName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-lg w-fit border uppercase tracking-wider",
                          item.paymentType === 'Credit' 
                             ? "bg-amber-50 text-amber-700 border-amber-100" 
                            : "bg-emerald-50 text-emerald-700 border-emerald-100"
                        )}>
                          {item.paymentType || 'Cash'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {item.dueDate && (item.paymentType === 'Credit' || (item.creditDays !== undefined && item.creditDays > 0) || pendingAmt > 0) ? (
                        <div className="flex flex-col gap-0.5">
                          <span className={cn(
                            "text-sm font-bold",
                            pendingAmt > 0 ? "text-rose-600 animate-pulse" : "text-slate-600"
                          )}>
                            {item.dueDate}
                          </span>
                          {item.creditDays !== undefined && item.creditDays > 0 && (
                            <span className="text-[10px] text-slate-400 font-semibold">({item.creditDays} days)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">-</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-indigo-600">₹{netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      {Number(item.quantity) > 0 && (
                        <p className="text-[10px] text-slate-500 font-semibold">
                          {item.quantity} {item.unit === 'KGs' ? 'KGs' : (item.unit === 'Meters' ? 'm' : 'pcs')}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 w-fit">
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider text-center",
                          item.paymentStatus === 'Paid' 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : item.paymentStatus === 'Partially Paid'
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {item.paymentStatus || 'Unpaid'}
                        </span>
                        <div className="text-[10px] font-medium text-slate-400 divide-x divide-slate-200 flex gap-1.5 items-center">
                          <span>Paid: <span className="font-semibold text-slate-600">₹{paidAmt.toLocaleString()}</span></span>
                          <span className="pl-1.5">Pending: <span className={cn("font-bold", pendingAmt > 0 ? "text-rose-600" : "text-slate-500")}>₹{pendingAmt.toLocaleString()}</span></span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => openPaymentDialog(item)}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            item.paymentStatus === 'Paid' 
                              ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                              : item.paymentStatus === 'Partially Paid'
                              ? "text-blue-600 bg-blue-50 hover:bg-blue-100 animate-pulse"
                              : "text-amber-600 bg-amber-50 hover:bg-amber-100"
                          )}
                          title="Record Supplier Payment"
                        >
                          <Coins className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { 
                            setEditingId(item.id); 
                            const isYarnItem = item.rawMaterialType === 'yarn' || item.fabricType === 'Yarn';
                            const isJariItem = item.rawMaterialType === 'jari' || item.fabricType === 'Jari';
                            const totalVal = item.totalCost !== undefined ? item.totalCost : (item.pricePerMeter || 0) * (item.quantity || 0);
                            setFormData({
                              ...item,
                              rawMaterialType: isYarnItem ? 'yarn' : (isJariItem ? 'jari' : 'cloth'),
                              amount: item.amount || totalVal - (item.cgst || 0) - (item.sgst || 0) - (item.igst || 0),
                              cgst: item.cgst || 0,
                              sgst: item.sgst || 0,
                              igst: item.igst || 0,
                              totalCost: totalVal,
                              gstType: item.gstType || ((item.cgst || item.sgst || item.igst) ? 'GST' : 'NON-GST')
                            }); 
                            setIsFormOpen(true); 
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteItem(item.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayedItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No inventory items found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Purchase' : 'Add Raw Materials'}</h3>
                <p className="text-sm text-slate-500">Specify details for fabric stock entry.</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                {/* Supplier Selection */}
                <div className="space-y-2 col-span-full">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Supplier</label>
                  <select 
                    required
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                    value={formData.supplierId || ''}
                    onChange={(e) => {
                      const suppId = e.target.value;
                      const { cgstPercent, sgstPercent, igstPercent, isInterstate } = getGSTPercentInline(suppId);
                      const isGST = (formData.gstType || 'GST') === 'GST';
                      let nextCgst = formData.cgst;
                      let nextSgst = formData.sgst;
                      let nextIgst = formData.igst;

                      if (isGST) {
                        const amt = formData.amount || 0;
                        if (isInterstate) {
                          nextCgst = 0;
                          nextSgst = 0;
                          nextIgst = parseFloat(((amt * igstPercent) / 100).toFixed(2));
                        } else {
                          nextCgst = parseFloat(((amt * cgstPercent) / 100).toFixed(2));
                          nextSgst = parseFloat(((amt * sgstPercent) / 100).toFixed(2));
                          nextIgst = 0;
                        }
                      } else {
                        nextCgst = 0;
                        nextSgst = 0;
                        nextIgst = 0;
                      }

                      setFormData({
                        ...formData,
                        supplierId: suppId,
                        cgst: nextCgst,
                        sgst: nextSgst,
                        igst: nextIgst
                      });
                    }}
                  >
                    <option value="">Select Supplier with ID</option>
                    {suppliers.filter(s => s && s.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name || s.companyName} ({s.id}){s.state ? ` - ${s.state}` : ''}</option>
                    ))}
                  </select>
                  {formData.supplierId && (
                    <div className="text-xs font-semibold text-indigo-600 px-1">
                      Supplier Location: {
                        suppliers.find(s => s && s.id === formData.supplierId)?.state 
                          ? `${suppliers.find(s => s && s.id === formData.supplierId)?.state} (${getGSTPercentInline(formData.supplierId).locationType})` 
                          : 'Not Specified (Default: Tamil Nadu / Local)'
                      }
                    </div>
                  )}
                </div>

                {/* Raw Material Type Choice (Radio Buttons) */}
                <div className="space-y-2 col-span-full">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Raw Material Type</label>
                  <div className="flex gap-4">
                    <label
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                        (formData.rawMaterialType || 'cloth') === 'cloth'
                          ? "bg-[#0b1329] text-white border-[#0b1329]" 
                          : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      <input
                        type="radio"
                        name="rawMaterialType"
                        value="cloth"
                        checked={(formData.rawMaterialType || 'cloth') === 'cloth'}
                        onChange={() => {
                          const isYarn = formData.rawMaterialType === 'yarn';
                          const needDefault = isYarn || !formData.fabricType;
                          setFormData({ 
                            ...formData, 
                            rawMaterialType: 'cloth',
                            fabricType: needDefault ? '' : formData.fabricType,
                            productGroupName: needDefault ? '' : formData.productGroupName
                          });
                        }}
                        className="sr-only"
                      />
                      <span className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                        (formData.rawMaterialType || 'cloth') === 'cloth'
                          ? "border-white"
                          : "border-slate-400"
                      )}>
                        {(formData.rawMaterialType || 'cloth') === 'cloth' && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </span>
                      Cloth
                    </label>
                    <label
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                        formData.rawMaterialType === 'yarn'
                          ? "bg-[#0b1329] text-white border-[#0b1329]" 
                          : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      <input
                        type="radio"
                        name="rawMaterialType"
                        value="yarn"
                        checked={formData.rawMaterialType === 'yarn'}
                        onChange={() => {
                          const { cgstPercent, sgstPercent, igstPercent, isInterstate } = getGSTPercentInline(formData.supplierId);
                          const amt = formData.amount || 0;
                          let calculatedCGST = 0;
                          let calculatedSGST = 0;
                          let calculatedIGST = 0;
                          if (isInterstate) {
                            calculatedIGST = parseFloat(((amt * igstPercent) / 100).toFixed(2));
                          } else {
                            calculatedCGST = parseFloat(((amt * cgstPercent) / 100).toFixed(2));
                            calculatedSGST = parseFloat(((amt * sgstPercent) / 100).toFixed(2));
                          }
                          setFormData({ 
                            ...formData, 
                            rawMaterialType: 'yarn',
                            cgst: calculatedCGST,
                            sgst: calculatedSGST,
                            igst: calculatedIGST
                          });
                        }}
                        className="sr-only"
                      />
                      <span className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                        formData.rawMaterialType === 'yarn'
                          ? "border-white"
                          : "border-slate-400"
                      )}>
                        {formData.rawMaterialType === 'yarn' && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </span>
                      Yarn
                    </label>
                    <label
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                        formData.rawMaterialType === 'jari'
                          ? "bg-[#0b1329] text-white border-[#0b1329]" 
                          : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                      )}
                    >
                      <input
                        type="radio"
                        name="rawMaterialType"
                        value="jari"
                        checked={formData.rawMaterialType === 'jari'}
                        onChange={() => {
                          const { cgstPercent, sgstPercent, igstPercent, isInterstate } = getGSTPercentInline(formData.supplierId);
                          const amt = formData.amount || 0;
                          let calculatedCGST = 0;
                          let calculatedSGST = 0;
                          let calculatedIGST = 0;
                          if (isInterstate) {
                            calculatedIGST = parseFloat(((amt * igstPercent) / 100).toFixed(2));
                          } else {
                            calculatedCGST = parseFloat(((amt * cgstPercent) / 100).toFixed(2));
                            calculatedSGST = parseFloat(((amt * sgstPercent) / 100).toFixed(2));
                          }
                          const isYarn = formData.rawMaterialType === 'yarn';
                          const needDefault = isYarn || !formData.fabricType;
                          setFormData({ 
                            ...formData, 
                            rawMaterialType: 'jari',
                            fabricType: needDefault ? '' : formData.fabricType,
                            productGroupName: needDefault ? '' : formData.productGroupName,
                            cgst: calculatedCGST,
                            sgst: calculatedSGST,
                            igst: calculatedIGST
                          });
                        }}
                        className="sr-only"
                      />
                      <span className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                        formData.rawMaterialType === 'jari'
                          ? "border-white"
                          : "border-slate-400"
                      )}>
                        {formData.rawMaterialType === 'jari' && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </span>
                      Jari
                    </label>
                  </div>
                </div>

                {formData.rawMaterialType === 'yarn' || formData.rawMaterialType === 'jari' ? (
                  <>
                    {/* YARN/JARI SPECIFIC FIELDS */}
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 mr-1">Payment Mode</label>
                      <div className="flex gap-4">
                        <label className={cn(
                          "flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                          (formData.paymentType || 'Cash') === 'Cash' 
                            ? "bg-[#0b1329] text-white border-[#0b1329]" 
                            : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          <input 
                            type="radio" 
                            name="paymentType" 
                            value="Cash"
                            checked={(formData.paymentType || 'Cash') === 'Cash'}
                            onChange={() => setFormData({ ...formData, paymentType: 'Cash' })}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                            (formData.paymentType || 'Cash') === 'Cash'
                              ? "border-white"
                              : "border-slate-400"
                          )}>
                            {(formData.paymentType || 'Cash') === 'Cash' && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-sm font-bold">Cash</span>
                        </label>
                        <label className={cn(
                          "flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                          formData.paymentType === 'Credit' 
                            ? "bg-[#0b1329] text-white border-[#0b1329]" 
                            : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          <input 
                            type="radio" 
                            name="paymentType" 
                            value="Credit"
                            checked={formData.paymentType === 'Credit'}
                            onChange={() => setFormData({ ...formData, paymentType: 'Credit' })}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                            formData.paymentType === 'Credit'
                              ? "border-white"
                              : "border-slate-400"
                          )}>
                            {formData.paymentType === 'Credit' && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-sm font-bold">Credit</span>
                        </label>
                      </div>
                    </div>

                    {formData.rawMaterialType === 'jari' && (
                      <>
                        <div className="space-y-2 animate-in fade-in duration-200">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Product Description</label>
                          <select 
                            required
                            className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                            value={formData.fabricType || ''}
                            onChange={(e) => {
                              const desc = e.target.value;
                              const matchedProduct = products.find(p => p.description === desc);
                              const groupName = matchedProduct?.productGroupName || formData.productGroupName || 'COLOUR BASANA';
                              
                              setFormData({
                                ...formData,
                                fabricType: desc,
                                productGroupName: groupName
                              });
                            }}
                          >
                            <option value="" disabled>Select Product Description</option>
                            {products.map(p => p && p.description && (
                              <option key={p.id || p.name} value={p.description}>
                                {p.description}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2 animate-in fade-in duration-200">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Product Group Name</label>
                          <select 
                            required
                            className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                            value={formData.productGroupName || ''}
                            onChange={(e) => setFormData({ ...formData, productGroupName: e.target.value })}
                          >
                            <option value="" disabled>Select Product Group Name</option>
                            <option value="COLOUR BASANA">COLOUR BASANA</option>
                            <option value="GREY CLOTH">GREY CLOTH</option>
                            <option value="COTTON CLOTH">COTTON CLOTH</option>
                            {Array.from(new Set(products.map(p => p.productGroupName).filter(Boolean)))
                              .filter(g => g !== 'COLOUR BASANA' && g !== 'GREY CLOTH' && g !== 'COTTON CLOTH')
                              .map(g => (
                                <option key={g} value={g}>{g}</option>
                              ))
                            }
                          </select>
                        </div>
                      </>
                    )}

                    <div className="space-y-2 col-span-full">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">GST Status</label>
                      <div className="flex gap-4">
                        <label
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                            (formData.gstType || 'GST') === 'GST'
                              ? "bg-[#0b1329] text-white border-[#0b1329]" 
                              : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          <input
                            type="radio"
                            name="rawMaterialGstType"
                            value="GST"
                            checked={(formData.gstType || 'GST') === 'GST'}
                            onChange={() => {
                              const amt = formData.amount || 0;
                              const { cgstPercent, sgstPercent, igstPercent, isInterstate } = getGSTPercentInline(formData.supplierId);
                              let calculatedCGST = 0;
                              let calculatedSGST = 0;
                              let calculatedIGST = 0;
                              if (isInterstate) {
                                calculatedIGST = parseFloat(((amt * igstPercent) / 100).toFixed(2));
                              } else {
                                calculatedCGST = parseFloat(((amt * cgstPercent) / 100).toFixed(2));
                                calculatedSGST = parseFloat(((amt * sgstPercent) / 100).toFixed(2));
                              }
                              const qty = formData.quantity || 0;
                              const calculatedTotalCost = parseFloat((amt + calculatedCGST + calculatedSGST + calculatedIGST).toFixed(2));
                              setFormData({
                                ...formData,
                                gstType: 'GST',
                                cgst: calculatedCGST,
                                sgst: calculatedSGST,
                                igst: calculatedIGST,
                                totalCost: calculatedTotalCost,
                                pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                              });
                            }}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                            (formData.gstType || 'GST') === 'GST'
                              ? "border-white"
                              : "border-slate-400"
                          )}>
                            {(formData.gstType || 'GST') === 'GST' && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-sm font-bold">GST</span>
                        </label>
                        <label
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                            formData.gstType === 'NON-GST'
                              ? "bg-[#0b1329] text-white border-[#0b1329]" 
                              : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          <input
                            type="radio"
                            name="rawMaterialGstType"
                            value="NON-GST"
                            checked={formData.gstType === 'NON-GST'}
                            onChange={() => {
                              const amt = formData.amount || 0;
                              const qty = formData.quantity || 0;
                              setFormData({
                                ...formData,
                                gstType: 'NON-GST',
                                cgst: 0,
                                sgst: 0,
                                igst: 0,
                                totalCost: amt,
                                pricePerMeter: qty > 0 ? (amt / qty) : (formData.pricePerMeter || 0)
                              });
                            }}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                            formData.gstType === 'NON-GST'
                              ? "border-white"
                              : "border-slate-400"
                          )}>
                            {formData.gstType === 'NON-GST' && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-sm font-bold">NON-GST</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Amount (₹)</label>
                      <input 
                        required
                        type="number" 
                        placeholder="0.00"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                        value={formData.amount !== undefined && formData.amount !== 0 ? formData.amount : ''}
                        onChange={(e) => {
                          const amt = parseFloat(e.target.value) || 0;
                          const isGST = (formData.gstType || 'GST') === 'GST';
                          const { cgstPercent, sgstPercent, igstPercent, isInterstate } = isGST ? getGSTPercentInline(formData.supplierId) : { cgstPercent: 0, sgstPercent: 0, igstPercent: 0, isInterstate: false };
                          let calculatedCGST = 0;
                          let calculatedSGST = 0;
                          let calculatedIGST = 0;
                          if (isGST) {
                            if (isInterstate) {
                              calculatedIGST = parseFloat(((amt * igstPercent) / 100).toFixed(2));
                            } else {
                              calculatedCGST = parseFloat(((amt * cgstPercent) / 100).toFixed(2));
                              calculatedSGST = parseFloat(((amt * sgstPercent) / 100).toFixed(2));
                            }
                          }
                          const calculatedTotalCost = parseFloat((amt + calculatedCGST + calculatedSGST + calculatedIGST).toFixed(2));
                          const qty = formData.quantity || 0;
                          setFormData({
                            ...formData,
                            amount: amt,
                            cgst: calculatedCGST,
                            sgst: calculatedSGST,
                            igst: calculatedIGST,
                            totalCost: calculatedTotalCost,
                            pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                          });
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>

                    {(formData.gstType || 'GST') === 'GST' && (
                      <>
                        {getGSTPercentInline(formData.supplierId).isInterstate ? (
                          <div className="space-y-2 animate-in fade-in duration-200">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 animate-in fade-in duration-200">
                              IGST ({getGSTPercentInline(formData.supplierId).igstPercent}%) (₹)
                            </label>
                            <input 
                              type="number" 
                              placeholder="0.00"
                              className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                              value={formData.igst !== undefined ? formData.igst : ''}
                              onChange={(e) => {
                                const ig = parseFloat(e.target.value) || 0;
                                const subAmt = formData.amount || 0;
                                const calculatedTotalCost = parseFloat((subAmt + ig).toFixed(2));
                                const qty = formData.quantity || 0;
                                setFormData({
                                  ...formData,
                                  igst: ig,
                                  cgst: 0,
                                  sgst: 0,
                                  totalCost: calculatedTotalCost,
                                  pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                                });
                              }}
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                                CGST ({getGSTPercentInline(formData.supplierId).cgstPercent}%) (₹)
                              </label>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                                value={formData.cgst !== undefined ? formData.cgst : ''}
                                onChange={(e) => {
                                  const cg = parseFloat(e.target.value) || 0;
                                  const subAmt = formData.amount || 0;
                                  const calculatedTotalCost = parseFloat((subAmt + cg + (formData.sgst || 0)).toFixed(2));
                                  const qty = formData.quantity || 0;
                                  setFormData({
                                    ...formData,
                                    cgst: cg,
                                    igst: 0,
                                    totalCost: calculatedTotalCost,
                                    pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                                  });
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </div>

                            <div className="space-y-2 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                                SGST ({getGSTPercentInline(formData.supplierId).sgstPercent}%) (₹)
                              </label>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                                value={formData.sgst !== undefined ? formData.sgst : ''}
                                onChange={(e) => {
                                  const sg = parseFloat(e.target.value) || 0;
                                  const subAmt = formData.amount || 0;
                                  const calculatedTotalCost = parseFloat((subAmt + (formData.cgst || 0) + sg).toFixed(2));
                                  const qty = formData.quantity || 0;
                                  setFormData({
                                    ...formData,
                                    sgst: sg,
                                    igst: 0,
                                    totalCost: calculatedTotalCost,
                                    pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                                  });
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest px-1">Net Amount (₹)</label>
                      <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl py-4 px-6 text-sm font-black text-indigo-700 shadow-sm flex items-center gap-2 h-[54px]">
                        ₹ {((formData.amount || 0) + (formData.cgst || 0) + (formData.sgst || 0) + (formData.igst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Choose Date</label>
                      <input 
                        required
                        type="date" 
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                        value={formData.entryDate || ''}
                        onChange={(e) => setFormData({...formData, entryDate: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Credit Days</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 30"
                        min="0"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                        value={formData.creditDays || ''}
                        onChange={(e) => setFormData({...formData, creditDays: parseInt(e.target.value) || 0})}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>

                    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <label className="text-[11px] font-bold text-rose-500 uppercase tracking-widest px-1">Calculated Due Date</label>
                      <div className="w-full bg-rose-50 border border-rose-100 rounded-2xl py-4 px-6 text-sm font-black text-rose-700 shadow-sm flex items-center gap-2 h-[54px]">
                        {addDays(formData.entryDate || new Date().toISOString().split('T')[0], formData.creditDays)}
                      </div>
                    </div>

                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-emerald-500" />
                        Amount Paid Initially (₹)
                      </label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-emerald-700 shadow-sm"
                        value={formData.paidAmount || ''}
                        onChange={(e) => setFormData({...formData, paidAmount: parseFloat(e.target.value) || 0})}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                      <p className="text-[10px] text-emerald-600/80 font-semibold px-1">
                        Logs status to Expense ledger if &gt; ₹0.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* CLOTH SPECIFIC FIELDS (ORIGINAL) */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Mode</label>
                      <div className="flex gap-4">
                        <label className={cn(
                          "flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                          (formData.paymentType || 'Cash') === 'Cash' 
                            ? "bg-[#0b1329] text-white border-[#0b1329]" 
                            : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          <input 
                            type="radio" 
                            name="paymentType" 
                            value="Cash"
                            checked={(formData.paymentType || 'Cash') === 'Cash'}
                            onChange={() => setFormData({ ...formData, paymentType: 'Cash' })}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                            (formData.paymentType || 'Cash') === 'Cash'
                              ? "border-white"
                              : "border-slate-400"
                          )}>
                            {(formData.paymentType || 'Cash') === 'Cash' && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-sm font-bold">Cash</span>
                        </label>
                        <label className={cn(
                          "flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                          formData.paymentType === 'Credit' 
                            ? "bg-[#0b1329] text-white border-[#0b1329]" 
                            : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          <input 
                            type="radio" 
                            name="paymentType" 
                            value="Credit"
                            checked={formData.paymentType === 'Credit'}
                            onChange={() => setFormData({ ...formData, paymentType: 'Credit' })}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                            formData.paymentType === 'Credit'
                              ? "border-white"
                              : "border-slate-400"
                          )}>
                            {formData.paymentType === 'Credit' && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-sm font-bold">Credit</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Product Description</label>
                      <select 
                        required
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                        value={formData.fabricType || ''}
                        onChange={(e) => {
                          const desc = e.target.value;
                          const matchedProduct = products.find(p => p.description === desc);
                          const groupName = matchedProduct?.productGroupName || formData.productGroupName || 'COLOUR BASANA';
                          
                          setFormData({
                            ...formData,
                            fabricType: desc,
                            productGroupName: groupName
                          });
                        }}
                      >
                        <option value="" disabled>Select Product Description</option>
                        {products.map(p => p && p.description && (
                          <option key={p.id || p.name} value={p.description}>
                            {p.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Product Group Name</label>
                      <select 
                        required
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                        value={formData.productGroupName || ''}
                        onChange={(e) => setFormData({ ...formData, productGroupName: e.target.value })}
                      >
                        <option value="" disabled>Select Product Group Name</option>
                        <option value="COLOUR BASANA">COLOUR BASANA</option>
                        <option value="GREY CLOTH">GREY CLOTH</option>
                        <option value="COTTON CLOTH">COTTON CLOTH</option>
                        {Array.from(new Set(products.map(p => p.productGroupName).filter(Boolean)))
                          .filter(g => g !== 'COLOUR BASANA' && g !== 'GREY CLOTH' && g !== 'COTTON CLOTH')
                          .map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Choose Date</label>
                      <input 
                        required
                        type="date" 
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                        value={formData.entryDate || ''}
                        onChange={(e) => setFormData({...formData, entryDate: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Credit Days</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 30"
                        min="0"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                        value={formData.creditDays || ''}
                        onChange={(e) => setFormData({...formData, creditDays: parseInt(e.target.value) || 0})}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>

                    <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                      <label className="text-[11px] font-bold text-rose-500 uppercase tracking-widest px-1">Calculated Due Date</label>
                      <div className="w-full bg-rose-50 border border-rose-100 rounded-2xl py-4 px-6 text-sm font-black text-rose-700 shadow-sm flex items-center gap-2 h-[54px]">
                        {addDays(formData.entryDate || new Date().toISOString().split('T')[0], formData.creditDays)}
                      </div>
                    </div>

                    {/* Amount & GST params */}
                    <div className="space-y-2 col-span-full">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">GST Status</label>
                      <div className="flex gap-4">
                        <label
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                            (formData.gstType || 'GST') === 'GST'
                              ? "bg-[#0b1329] text-white border-[#0b1329]" 
                              : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          <input
                            type="radio"
                            name="clothGstType"
                            value="GST"
                            checked={(formData.gstType || 'GST') === 'GST'}
                            onChange={() => {
                              const amt = formData.amount || 0;
                              const { cgstPercent, sgstPercent, igstPercent, isInterstate } = getGSTPercentInline(formData.supplierId);
                              let calculatedCGST = 0;
                              let calculatedSGST = 0;
                              let calculatedIGST = 0;
                              if (isInterstate) {
                                calculatedIGST = parseFloat(((amt * igstPercent) / 100).toFixed(2));
                              } else {
                                calculatedCGST = parseFloat(((amt * cgstPercent) / 100).toFixed(2));
                                calculatedSGST = parseFloat(((amt * sgstPercent) / 100).toFixed(2));
                              }
                              const qty = formData.quantity || 0;
                              const calculatedTotalCost = parseFloat((amt + calculatedCGST + calculatedSGST + calculatedIGST).toFixed(2));
                              setFormData({
                                ...formData,
                                gstType: 'GST',
                                cgst: calculatedCGST,
                                sgst: calculatedSGST,
                                igst: calculatedIGST,
                                totalCost: calculatedTotalCost,
                                pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                              });
                            }}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                            (formData.gstType || 'GST') === 'GST'
                              ? "border-white"
                              : "border-slate-400"
                          )}>
                            {(formData.gstType || 'GST') === 'GST' && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-sm font-bold">GST</span>
                        </label>
                        <label
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 px-5 cursor-pointer transition-all border font-bold text-sm shadow-sm",
                            formData.gstType === 'NON-GST'
                              ? "bg-[#0b1329] text-white border-[#0b1329]" 
                              : "bg-[#f8faff] hover:bg-slate-100 text-slate-700 border-slate-200"
                          )}
                        >
                          <input
                            type="radio"
                            name="clothGstType"
                            value="NON-GST"
                            checked={formData.gstType === 'NON-GST'}
                            onChange={() => {
                              const amt = formData.amount || 0;
                              const qty = formData.quantity || 0;
                              setFormData({
                                ...formData,
                                gstType: 'NON-GST',
                                cgst: 0,
                                sgst: 0,
                                igst: 0,
                                totalCost: amt,
                                pricePerMeter: qty > 0 ? (amt / qty) : (formData.pricePerMeter || 0)
                              });
                            }}
                            className="sr-only"
                          />
                          <span className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mr-1",
                            formData.gstType === 'NON-GST'
                              ? "border-white"
                              : "border-slate-400"
                          )}>
                            {formData.gstType === 'NON-GST' && (
                              <span className="w-2 h-2 rounded-full bg-white" />
                            )}
                          </span>
                          <span className="text-sm font-bold">NON-GST</span>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Amount (Taxable Subtotal) (₹)</label>
                      <input 
                        required
                        type="number"
                        placeholder="0.00"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                        value={formData.amount !== undefined && formData.amount !== 0 ? formData.amount : ''}
                        onChange={(e) => {
                          const amt = parseFloat(e.target.value) || 0;
                          const isGST = (formData.gstType || 'GST') === 'GST';
                          const { cgstPercent, sgstPercent, igstPercent, isInterstate } = isGST ? getGSTPercentInline(formData.supplierId) : { cgstPercent: 0, sgstPercent: 0, igstPercent: 0, isInterstate: false };
                          let calculatedCGST = 0;
                          let calculatedSGST = 0;
                          let calculatedIGST = 0;
                          if (isGST) {
                            if (isInterstate) {
                              calculatedIGST = parseFloat(((amt * igstPercent) / 100).toFixed(2));
                            } else {
                              calculatedCGST = parseFloat(((amt * cgstPercent) / 100).toFixed(2));
                              calculatedSGST = parseFloat(((amt * sgstPercent) / 100).toFixed(2));
                            }
                          }
                          const calculatedTotalCost = parseFloat((amt + calculatedCGST + calculatedSGST + calculatedIGST).toFixed(2));
                          const qty = formData.quantity || 0;
                          setFormData({
                            ...formData,
                            amount: amt,
                            cgst: calculatedCGST,
                            sgst: calculatedSGST,
                            igst: calculatedIGST,
                            totalCost: calculatedTotalCost,
                            pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                          });
                        }}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </div>

                    {(formData.gstType || 'GST') === 'GST' && (
                      <>
                        {getGSTPercentInline(formData.supplierId).isInterstate ? (
                          <div className="space-y-2 animate-in fade-in duration-200">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 animate-in fade-in duration-200">
                              IGST ({getGSTPercentInline(formData.supplierId).igstPercent}%) (₹)
                            </label>
                            <input 
                              type="number" 
                              placeholder="0.00"
                              className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                              value={formData.igst !== undefined ? formData.igst : ''}
                              onChange={(e) => {
                                const ig = parseFloat(e.target.value) || 0;
                                const subAmt = formData.amount || 0;
                                const calculatedTotalCost = parseFloat((subAmt + ig).toFixed(2));
                                const qty = formData.quantity || 0;
                                setFormData({
                                  ...formData,
                                  igst: ig,
                                  cgst: 0,
                                  sgst: 0,
                                  totalCost: calculatedTotalCost,
                                  pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                                });
                              }}
                              onWheel={(e) => e.currentTarget.blur()}
                            />
                          </div>
                        ) : (
                          <>
                            <div className="space-y-2 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 animate-in fade-in duration-200">
                                CGST ({getGSTPercentInline(formData.supplierId).cgstPercent}%) (₹)
                              </label>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                                value={formData.cgst !== undefined ? formData.cgst : ''}
                                onChange={(e) => {
                                  const cg = parseFloat(e.target.value) || 0;
                                  const subAmt = formData.amount || 0;
                                  const calculatedTotalCost = parseFloat((subAmt + cg + (formData.sgst || 0)).toFixed(2));
                                  const qty = formData.quantity || 0;
                                  setFormData({
                                    ...formData,
                                    cgst: cg,
                                    igst: 0,
                                    totalCost: calculatedTotalCost,
                                    pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                                  });
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </div>

                            <div className="space-y-2 animate-in fade-in duration-200">
                              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 animate-in fade-in duration-200">
                                SGST ({getGSTPercentInline(formData.supplierId).sgstPercent}%) (₹)
                              </label>
                              <input 
                                type="number" 
                                placeholder="0.00"
                                className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                                value={formData.sgst !== undefined ? formData.sgst : ''}
                                onChange={(e) => {
                                  const sg = parseFloat(e.target.value) || 0;
                                  const subAmt = formData.amount || 0;
                                  const calculatedTotalCost = parseFloat((subAmt + (formData.cgst || 0) + sg).toFixed(2));
                                  const qty = formData.quantity || 0;
                                  setFormData({
                                    ...formData,
                                    sgst: sg,
                                    igst: 0,
                                    totalCost: calculatedTotalCost,
                                    pricePerMeter: qty > 0 ? (calculatedTotalCost / qty) : (formData.pricePerMeter || 0)
                                  });
                                }}
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}

                    <div className="space-y-2 animate-in fade-in duration-200">
                      <label className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest px-1 animate-in fade-in duration-200">
                        Net Amount (Total Cost) (₹)
                      </label>
                      <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl py-4 px-6 text-sm font-black text-indigo-700 shadow-sm flex items-center gap-2 h-[54px]">
                        ₹ {((formData.amount || 0) + (formData.cgst || 0) + (formData.sgst || 0) + (formData.igst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-emerald-500" />
                        Amount Paid Initially (₹)
                      </label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-emerald-700 shadow-sm"
                        value={formData.paidAmount || ''}
                        onChange={(e) => setFormData({...formData, paidAmount: parseFloat(e.target.value) || 0})}
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                      <p className="text-[10px] text-emerald-600/80 font-semibold px-1">
                        Logs an automatic Expense entry if greater than ₹0.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  {editingId ? 'Update Stock' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentDialogOpen && paymentItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm animate-in fade-in duration-250">
          <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
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
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
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
                  <span className="text-slate-800 font-bold text-sm">₹{paymentItemNetAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Paid So Far</span>
                  <span>₹{(paymentItem.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-extrabold text-sm pt-2 border-t border-dashed border-slate-200">
                  <span>Remaining Pending Due</span>
                  <span>₹{Math.max(0, paymentItemNetAmount - (paymentItem.paidAmount || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Entry Option */}
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      const remain = Math.max(0, paymentItemNetAmount - (paymentItem.paidAmount || 0));
                      setPaymentDetails({ ...paymentDetails, isFullPayment: true, amountToPay: remain });
                    }}
                    className={cn(
                      "flex-1 p-4 rounded-2xl border text-center transition-all",
                      paymentDetails.isFullPayment 
                        ? "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold" 
                        : "border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-extrabold mb-1">Pay Remaining Full</p>
                    <p className="text-sm">₹{Math.max(0, paymentItemNetAmount - (paymentItem.paidAmount || 0)).toLocaleString()}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentDetails({ ...paymentDetails, isFullPayment: false })}
                    className={cn(
                      "flex-1 p-4 rounded-2xl border text-center transition-all",
                      !paymentDetails.isFullPayment 
                        ? "border-indigo-500 bg-indigo-50/50 text-indigo-800 font-bold" 
                        : "border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <p className="text-[10px] uppercase tracking-wider font-extrabold mb-1">Pay Partial Amount</p>
                    <p className="text-sm">Customize amount</p>
                  </button>
                </div>

                {!paymentDetails.isFullPayment && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-150">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Specify Amount to Pay (₹)</label>
                    <input 
                      required
                      type="number"
                      max={Math.max(0, paymentItemNetAmount - (paymentItem.paidAmount || 0))}
                      min={1}
                      placeholder="0.00"
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/10 shadow-sm"
                      value={paymentDetails.amountToPay || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, amountToPay: parseFloat(e.target.value) || 0 })}
                      onWheel={(e) => e.currentTarget.blur()}
                    />
                  </div>
                )}
              </div>

              {/* Core fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-semibold text-slate-700 shadow-sm"
                    value={paymentDetails.date}
                    onChange={(e) => setPaymentDetails({ ...paymentDetails, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Mode</label>
                  <select 
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-semibold text-slate-700 shadow-sm"
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
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm resize-none"
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
                    className="py-4 px-5 rounded-2xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-colors border border-rose-100 whitespace-nowrap"
                  >
                    Unmark/Reset Payments
                  </button>
                )}
                <div className="flex-1 flex gap-2">
                  <button 
                    type="button"
                    onClick={() => { setIsPaymentDialogOpen(false); setPaymentItem(null); }}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={paymentDetails.amountToPay <= 0}
                    className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={() => setDeleteId(null)}
              className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors"
              title="Close Dialog"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Purchase Item?</h3>
            <p className="text-sm text-slate-500 mb-8">
              Are you sure you want to delete item <span className="font-extrabold text-slate-700">"{deleteId}"</span>? This action cannot be undone and will permanently remove this stock record.
            </p>
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
              >
                No, Keep
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-3.5 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all text-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto no-print">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] my-4 animate-in zoom-in-95 duration-200">
            {/* Sidebar Export Panel */}
            <div className="w-full md:w-80 bg-slate-50 p-8 border-r border-slate-100 flex flex-col justify-between shrink-0">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-tight">Export Hub</h3>
                  </div>
                  <button 
                    onClick={() => setIsExportModalOpen(false)}
                    className="p-1 px-2.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                  Generate professional Raw Material reports. Choose your export format and download or review live.
                </p>

                <div className="space-y-3">
                  <button 
                    onClick={() => setReportFormat('excel')}
                    className={cn(
                      "w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                      reportFormat === 'excel' 
                        ? "bg-white border-indigo-600 shadow-md shadow-indigo-50/50" 
                        : "border-slate-200/60 bg-transparent hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl mt-0.5",
                      reportFormat === 'excel' ? "bg-indigo-50 text-indigo-600" : "bg-slate-200/50 text-slate-500"
                    )}>
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Excel / CSV Ledger</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">Compatible with Excel, Sheets, & ERP systems.</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setReportFormat('pdf')}
                    className={cn(
                      "w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer",
                      reportFormat === 'pdf' 
                        ? "bg-white border-indigo-600 shadow-md shadow-indigo-50/50" 
                        : "border-slate-200/60 bg-transparent hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    <div className={cn(
                      "p-2 rounded-xl mt-0.5",
                      reportFormat === 'pdf' ? "bg-indigo-50 text-indigo-600" : "bg-slate-200/50 text-slate-500"
                    )}>
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">Printable PDF Report</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">Polished layouts optimized for paper/PDF print.</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200/60 space-y-3">
                {reportFormat === 'excel' ? (
                  <button 
                    onClick={handleInventoryExcelExport}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-100 transition-all cursor-pointer flex justify-center items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV Ledger
                  </button>
                ) : (
                  <button 
                    onClick={() => window.print()}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-100 transition-all cursor-pointer flex justify-center items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print / Save as PDF
                  </button>
                )}

                <button 
                  onClick={() => setIsExportModalOpen(false)}
                  className="w-full py-3 bg-slate-200/40 hover:bg-slate-200/80 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Close Export Hub
                </button>
              </div>
            </div>

            {/* Document Preview Workspace */}
            <div className="flex-1 bg-slate-100/50 p-6 md:p-10 overflow-y-auto flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                Interactive Document Preview (A4 Dimensions)
              </span>

              {/* Printable container starts here */}
              <div className="bg-white w-full max-w-3xl border border-slate-200/60 shadow-xl rounded-2xl p-8 min-h-[900px] text-slate-900 flex flex-col justify-between invoice-print-container">
                <div>
                  {/* Top Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                    <div>
                      <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">INVEN MANUFACTORIES</h1>
                      <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-1">Raw Material Assets Ledger Report</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">Documented: {new Date().toLocaleString()}</p>
                    </div>
                    <div className="text-right text-[10px] font-medium text-slate-500">
                      <p className="font-extrabold text-slate-800">Report No: #RPT-PUR-{Math.floor(Date.now() / 1000)}</p>
                      <p>Agent ID: jyadevi14@gmail.com</p>
                      <p>Filter Status: Active Stock Lots</p>
                    </div>
                  </div>

                  {/* Summary Metric Boxes */}
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Lots</p>
                      <p className="text-xl font-black text-slate-800 mt-1">{items.length}</p>
                    </div>
                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Volume</p>
                      <p className="text-xl font-black text-slate-800 mt-1">
                        {items.reduce((sum, i) => sum + i.quantity, 0).toLocaleString()}
                        <span className="text-xs font-medium text-slate-400 ml-1">mtrs/pcs</span>
                      </p>
                    </div>
                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Capital Spent</p>
                      <p className="text-xl font-black text-slate-800 mt-1">
                        ₹{items.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Valuation</p>
                      <p className="text-xl font-black text-indigo-700 mt-1">
                        ₹{items.reduce((sum, i) => sum + (i.pricePerMeter * i.quantity), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Items List Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold pb-2">
                          <th className="py-2.5">Lot ID</th>
                          <th className="py-2.5">Fabric</th>
                          <th className="py-2.5 text-right">Qty</th>
                          <th className="py-2.5 text-right">Price/Mtr</th>
                          <th className="py-2.5 text-right">Total Cost</th>
                          <th className="py-2.5 text-right">Balance Due</th>
                          <th className="py-2.5 text-right">Supplier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((item) => {
                          const totalCost = (item.pricePerMeter || 0) * (item.quantity || 0);
                          const paidAmt = Number(item.paidAmount) || 0;
                          const balance = Math.max(0, totalCost - paidAmt);
                          return (
                            <tr key={item.id} className="text-slate-700 hover:bg-slate-50/50">
                              <td className="py-2.5 font-mono text-[10px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => handlePurIdClick(item)}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none text-left cursor-pointer font-mono"
                                  title="Click to view supplier details"
                                >
                                  {item.id}
                                </button>
                              </td>
                              <td className="py-2.5 font-extrabold text-slate-800">{item.fabricType}</td>
                              <td className="py-2.5 text-right font-bold">
                                {Number(item.quantity) > 0 ? (
                                  `${item.quantity} ${item.unit === 'KGs' ? 'KGs' : (item.unit === 'Meters' ? 'm' : 'pcs')}`
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-2.5 text-right">₹{item.pricePerMeter}</td>
                              <td className="py-2.5 text-right font-extrabold">₹{totalCost.toLocaleString()}</td>
                              <td className="py-2.5 text-right font-mono text-rose-500 font-bold">
                                {balance > 0 ? `₹${balance.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-2.5 text-right truncate max-w-[120px]" title={item.supplierName}>
                                {item.supplierName || 'Locally Sourced'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Report Signoff Footer */}
                <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <div>
                    <p>Report Issued By</p>
                    <div className="w-32 border-b border-slate-300 h-8 mt-2" />
                    <p className="text-[8px] lowercase text-slate-400 mt-1 font-mono">system-record-agent</p>
                  </div>
                  <div className="text-right">
                    <p>Official Auditor Validation</p>
                    <div className="w-40 border-b border-slate-300 h-8 mt-2 ml-auto" />
                    <p className="text-[8px] text-slate-400 mt-1">INVEN COMPLIANCE OFFICE</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {isSupplierModalOpen && selectedSupplierDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto no-print">
          <div className="bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg uppercase tracking-tight">Supplier Profile</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedSupplierDetails.id !== 'N/A' ? `ID: ${selectedSupplierDetails.id}` : 'Temporary Supplier Profile'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 font-bold transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Basic & Contact Info */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-3">General Information</h4>
                    <div className="bg-[#f8faff] rounded-2xl p-5 space-y-4 shadow-sm">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Supplier Name</p>
                        <p className="text-base font-extrabold text-slate-800">{selectedSupplierDetails.name || 'N/A'}</p>
                      </div>
                      {selectedSupplierDetails.companyName && selectedSupplierDetails.companyName !== selectedSupplierDetails.name && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Company Name</p>
                          <p className="text-sm font-bold text-slate-700">{selectedSupplierDetails.companyName}</p>
                        </div>
                      )}
                      {selectedSupplierDetails.contactPerson && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Contact Person</p>
                          <p className="text-sm font-semibold text-slate-600">{selectedSupplierDetails.contactPerson}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-3">Contact Details</h4>
                    <div className="bg-[#f8faff] rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Phone / Mobile</p>
                          <p className="text-sm font-bold text-slate-800">{selectedSupplierDetails.phone || selectedSupplierDetails.mobileNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Email</p>
                          <p className="text-sm font-bold text-slate-800 truncate" title={selectedSupplierDetails.email}>{selectedSupplierDetails.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Address</p>
                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                          {selectedSupplierDetails.address || 'No address specified'}
                          {selectedSupplierDetails.district && `, ${selectedSupplierDetails.district}`}
                          {selectedSupplierDetails.state && `, ${selectedSupplierDetails.state}`}
                          {selectedSupplierDetails.pincode && ` - ${selectedSupplierDetails.pincode}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-3">Registration & Terms</h4>
                    <div className="bg-[#f8faff] rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">GST Number</p>
                          <span className="inline-block bg-indigo-50 text-indigo-700 font-mono text-xs font-bold px-2.5 py-1 rounded-lg mt-1 border border-indigo-100 uppercase">
                            {selectedSupplierDetails.gstNumber || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Payment Terms</p>
                          <span className="inline-block bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg mt-1 border border-slate-200">
                            {selectedSupplierDetails.paymentTerms || 'N/A'}
                          </span>
                        </div>
                      </div>
                      {selectedSupplierDetails.notes && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Internal Notes</p>
                          <p className="text-xs font-medium text-slate-500 italic mt-1">{selectedSupplierDetails.notes}</p>
                        </div>
                      )}
                      {selectedSupplierDetails.opBalance !== undefined && (
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Opening Balance</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">₹{selectedSupplierDetails.opBalance.toLocaleString('en-IN')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Supplier Purchase History (Lots Supplied) */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-3">Lots Supplied History</h4>
                    <div className="bg-[#f8faff] rounded-2xl p-5 shadow-sm max-h-[500px] overflow-y-auto">
                      {items.filter(item => 
                        item.supplierId === selectedSupplierDetails.id || 
                        item.supplierName === selectedSupplierDetails.name || 
                        item.supplierName === selectedSupplierDetails.companyName
                      ).length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                          <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="text-xs font-bold">No purchase lots recorded for this supplier.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {items.filter(item => 
                            item.supplierId === selectedSupplierDetails.id || 
                            item.supplierName === selectedSupplierDetails.name || 
                            item.supplierName === selectedSupplierDetails.companyName
                          ).map((item) => {
                            const lotCost = item.totalCost || ((item.pricePerMeter || 0) * (item.quantity || 0));
                            const lotPaid = Number(item.paidAmount) || 0;
                            const lotPending = Math.max(0, lotCost - lotPaid);
                            const lotStatus = lotPaid >= lotCost ? 'Paid' : (lotPaid > 0 ? 'Partially Paid' : 'Unpaid');

                            return (
                              <div key={item.id} className="bg-white rounded-xl p-4 border border-slate-100 flex justify-between items-center hover:border-indigo-100 transition-colors">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-extrabold text-slate-800">{item.id}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">{item.entryDate}</span>
                                  </div>
                                  <p className="text-xs font-bold text-indigo-600">
                                    {item.fabricType} {item.productGroupName ? `(${item.productGroupName})` : ''}
                                  </p>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="text-xs font-bold text-slate-800">₹{lotCost.toLocaleString('en-IN')}</p>
                                  <span className={cn(
                                    "inline-block text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                                    lotStatus === 'Paid' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                    lotStatus === 'Partially Paid' ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                    "bg-rose-50 text-rose-700 border border-rose-100"
                                  )}>
                                    {lotStatus}
                                  </span>
                                  {lotPending > 0 && (
                                    <p className="text-[9px] text-rose-600 font-bold">Due: ₹{lotPending.toLocaleString('en-IN')}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsSupplierModalOpen(false)}
                className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold transition-all text-sm shadow-md"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
