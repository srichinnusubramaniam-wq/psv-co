import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Plus, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Trash2, 
  Edit, 
  Printer, 
  Coins, 
  Undo2, 
  User, 
  Truck, 
  Building, 
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { InvoicePreviewOverlay } from './InvoicePreviewOverlay';

interface SaleRecord {
  id: string;
  customerId: string;
  date: string;
  quantity: number;
  discountCost: number;
  discountPercentage: number;
  totalCost: number;
  batchId: string;
  modelName: string;
  unitPrice: number;
  createdAt: string;
  hsn?: string;
  unit?: string;
  style?: string;
  godown?: string;
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
  items: SaleRecord[];
  totalQty: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  totalAmount: number;
  amountInWords: string;
  transport?: string;
  shipToName?: string;
  shipToAddress?: string;
  lrDate?: string;
  status?: 'Unpaid' | 'Partially Paid' | 'Paid';
  paidAmount?: number;
  companyName?: string;
  companySubHeader?: string;
  companyAddress?: string;
  companyGstin?: string;
  companyPhone?: string;
  buyerSubHeader?: string;
  source?: string;
  despatchedThrough?: string;
  lrNo?: string;
  noOfBundles?: string;
  packingSlipNo?: string;
  packingCharges?: number;
  cgstPercent?: number;
  sgstPercent?: number;
  igstPercent?: number;
  isNonGst?: boolean;
  bankName?: string;
  bankBranch?: string;
  bankAccNo?: string;
  bankIfsc?: string;
  isModified?: boolean;
  modifiedAt?: string;
  originalAmount?: number;
  customerId?: string;
}

const numberToWords = (num: number) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return n.toString();
  };

  const words = inWords(Math.floor(num)).trim();
  return words ? `${words} Rupees Only` : 'Zero Rupees Only';
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

export default function Billing() {
  const [activeTab, setActiveTab] = useState<'view_bills' | 'modified_bills' | 'create_bill'>('view_bills');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Unpaid' | 'Partially Paid'>('all');
  
  // Custom Delete Confirm state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string; invoiceNo: string } | null>(null);
  
  // Data States
  const [invoices, setInvoices] = useState<GeneratedInvoice[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [appSettings, setAppSettings] = useState<any>({});
  const [productionAssignments, setProductionAssignments] = useState<any[]>([]);
  const [styles, setStyles] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);

  // Active Billing Creator Form State
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [term, setTerm] = useState<'Credit' | 'Cash'>('Credit');
  const [isNonGst, setIsNonGst] = useState<boolean>(false);
  
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');

  const [shipToName, setShipToName] = useState('');
  const [shipToAddress, setShipToAddress] = useState('');

  const [despatchedThrough, setDespatchedThrough] = useState('');
  const [selectedTransport, setSelectedTransport] = useState('');
  const [lrNo, setLrNo] = useState('');
  const [lrDate, setLrDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [noOfBundles, setNoOfBundles] = useState('');
  const [packingSlipNo, setPackingSlipNo] = useState('');

  // Line items state
  const [billItems, setBillItems] = useState<SaleRecord[]>([]);

  // Rates & CGST/SGST/Packing Charges
  const [packingCharges, setPackingCharges] = useState<number>(0);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [cgstPercent, setCgstPercent] = useState<number>(2.5);
  const [sgstPercent, setSgstPercent] = useState<number>(2.5);
  const [igstPercent, setIgstPercent] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<number>(0);

  // Auto-detect if customer is in Tamil Nadu
  const isTamilNadu = useMemo(() => {
    if (buyerGstin && buyerGstin.trim().length >= 2) {
      const stateCode = buyerGstin.trim().substring(0, 2);
      if (/^\d+$/.test(stateCode)) {
        return stateCode === '33';
      }
    }
    const found = customers.find(c => (c?.name || '').toUpperCase() === (buyerName || '').toUpperCase());
    if (found && found.state) {
      return found.state.toUpperCase().includes('TAMIL');
    }
    if (buyerAddress) {
      const addrUpper = buyerAddress.toUpperCase();
      return addrUpper.includes('TAMIL') || addrUpper.includes('TN') || addrUpper.includes('33');
    }
    return true; // default to local state
  }, [buyerGstin, buyerName, buyerAddress, customers]);

  // Synchronize tax percentages when isNonGst or isTamilNadu changes
  useEffect(() => {
    if (isNonGst) {
      setCgstPercent(0);
      setSgstPercent(0);
      setIgstPercent(0);
    } else {
      if (isTamilNadu) {
        setCgstPercent(2.5);
        setSgstPercent(2.5);
        setIgstPercent(0);
      } else {
        setCgstPercent(0);
        setSgstPercent(0);
        setIgstPercent(5.0);
      }
    }
  }, [isNonGst, isTamilNadu]);

  // Overlay previewing modal
  const [previewInvoice, setPreviewInvoice] = useState<GeneratedInvoice | null>(null);

  // Success / Error Alerts
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Recording Payment Modal
  const [paymentInvoice, setPaymentInvoice] = useState<GeneratedInvoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Load all data
  const loadData = () => {
    try {
      const savedInvoices = JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]');
      const savedCustomers = JSON.parse(localStorage.getItem('inven_customers') || '[]');
      const savedProducts = JSON.parse(localStorage.getItem('inven_product_master') || '[]');
      const savedTransports = JSON.parse(localStorage.getItem('inven_transports') || '[]');
      const settings = JSON.parse(localStorage.getItem('inven_settings') || '{}');
      const savedProduction = JSON.parse(localStorage.getItem('inven_production') || '[]');
      let savedGodowns = JSON.parse(localStorage.getItem('inven_unit_master') || '[]');
      if (!savedGodowns || savedGodowns.length === 0) {
        savedGodowns = [
          { id: 'U-001', name: 'UNIT-1' },
          { id: 'U-002', name: 'UNIT-2' },
          { id: 'U-003', name: 'UNIT-3' }
        ];
        localStorage.setItem('inven_unit_master', JSON.stringify(savedGodowns));
      }
      
      let savedStyles = JSON.parse(localStorage.getItem('inven_style_master') || '[]');
      if (!savedStyles || savedStyles.length === 0) {
        savedStyles = [
          { id: 'ST-001', name: 'A-LINE KNIT', createdAt: new Date().toISOString() },
          { id: 'ST-002', name: 'ROUND NECK COMFORT', createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('inven_style_master', JSON.stringify(savedStyles));
      }

      setInvoices(savedInvoices);
      setCustomers(savedCustomers);
      setProducts(savedProducts);
      setTransports(savedTransports);
      setAppSettings(settings);
      setProductionAssignments(savedProduction);
      setStyles(savedStyles);
      setGodowns(savedGodowns);

      // Initialize default values for creator form
      if (!editingInvoiceId) {
        const prefix = settings.invoicePrefix || 'GT';
        const year = settings.invoiceYear || '25-26';
        const nextId = settings.nextInvoiceId || 1;
        setInvoiceNo(`${prefix}/${year}/${nextId.toString().padStart(2, '0')}`);
      }
    } catch (e) {
      console.error("Failed to load local storage data in Billing", e);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('inven_localstorage_sync', handleSync);
    return () => window.removeEventListener('inven_localstorage_sync', handleSync);
  }, [editingInvoiceId]);

  // Helper trigger sync event across the application
  const triggerSync = () => {
    window.dispatchEvent(new Event('inven_localstorage_sync'));
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Pre-fill fields when customer is selected
  const handleSelectCustomer = (custName: string) => {
    setBuyerName(custName);
    const found = customers.find(c => (c?.name || '').toUpperCase() === (custName || '').toUpperCase());
    if (found) {
      setBuyerAddress(found.address || '');
      setBuyerPhone(found.phone || found.mobileNumber || '');
      setBuyerGstin(found.gstNumber || found.gstin || '');
    }
  };

  // Helper to check if a string matches a product master record robustly
  const doesStringMatchProduct = (p: any, str: string): boolean => {
    if (!p || !str) return false;
    const val = str.toUpperCase().trim();
    const desc = (p.description || '').toUpperCase().trim();
    const code = (p.code || p.styleNo || '').toUpperCase().trim();
    const name = (p.name || p.modelName || '').toUpperCase().trim();

    if (!desc && !code && !name) return false;

    // Dimension mismatch safety: e.g. "20*45" vs "14*30"
    const extractDimension = (s: string) => {
      const m = s.match(/\d+\s*\*\s*\d+/);
      return m ? m[0].replace(/\s+/g, '') : null;
    };
    const valDim = extractDimension(val);
    const prodDim = extractDimension(desc) || extractDimension(name) || extractDimension(code);
    if (valDim && prodDim && valDim !== prodDim) {
      return false;
    }

    // Direct exact matches
    if (desc && val === desc) return true;
    if (code && val === code) return true;
    if (name && val === name) return true;

    // Exact matches with common formats
    if (desc && code && val === `${desc} - ${code}`) return true;
    if (code && name && val === `${code} - ${name}`) return true;
    if (desc && code && name && val === `${desc} - ${code} - ${name}`) return true;

    // Substring containment or vice versa
    const combinedDescCode = desc && code ? `${desc} - ${code}` : (desc || code);
    if (combinedDescCode && (combinedDescCode.includes(val) || val.includes(combinedDescCode))) return true;

    // Token-based matching (if we have at least 2 tokens overlap or full match)
    const valTokens = val.split(/[\s\-*!]+/).filter(t => t.length > 1);
    const prodTokens = `${desc} ${code} ${name}`.toUpperCase().split(/[\s\-*!]+/).filter(t => t.length > 1);
    
    if (valTokens.length > 0 && prodTokens.length > 0) {
      const common = valTokens.filter(t => prodTokens.includes(t));
      if (common.length >= Math.min(2, valTokens.length)) return true;
    }

    // Fallback contains check
    if (desc && (desc.includes(val) || val.includes(desc))) return true;
    if (code && (code.includes(val) || val.includes(code))) return true;
    if (name && (name.includes(val) || val.includes(name))) return true;

    return false;
  };

  // Dedicated helper to find a product by label with layered priority (Exact -> Strict Substring -> Token)
  const findProductByLabel = (label: string): any => {
    if (!label) return undefined;
    const val = label.toUpperCase().trim();

    // 1st Pass: Try exact match with formatted fields
    let found = products.find(p => {
      const desc = (p.description || '').toUpperCase().trim();
      const code = (p.code || p.styleNo || '').toUpperCase().trim();
      const name = (p.name || p.modelName || '').toUpperCase().trim();
      if (!desc && !code && !name) return false;
      
      const format1 = desc && code ? `${desc} - ${code}` : desc;
      const format2 = code && name ? `${code} - ${name}` : name;
      
      return val === desc || val === code || val === name || val === format1 || val === format2;
    });

    if (found) return found;

    // 2nd Pass: Safe substring match with dimension enforcement
    found = products.find(p => {
      const desc = (p.description || '').toUpperCase().trim();
      const code = (p.code || p.styleNo || '').toUpperCase().trim();
      const name = (p.name || p.modelName || '').toUpperCase().trim();
      if (!desc && !code && !name) return false;

      const format1 = desc && code ? `${desc} - ${code}` : desc;

      const extractDimension = (s: string) => {
        const m = s.match(/\d+\s*\*\s*\d+/);
        return m ? m[0].replace(/\s+/g, '') : null;
      };

      const valDim = extractDimension(val);
      const descDim = extractDimension(desc) || extractDimension(name) || extractDimension(code);
      if (valDim && descDim && valDim !== descDim) {
        return false;
      }

      return (format1 && (format1 === val || format1.includes(val) || val.includes(format1))) ||
             (desc && (desc === val || desc.includes(val) || val.includes(desc))) ||
             (code && (code === val || code.includes(val) || val.includes(code))) ||
             (name && (name === val || name.includes(val) || val.includes(name)));
    });

    if (found) return found;

    // 3rd Pass: Fallback to token matching via doesStringMatchProduct
    return products.find(p => doesStringMatchProduct(p, label));
  };

  // Helper to query available finished goods stock and group by godown
  const getProductStockInfo = (modelNameLabel: string, ignoreInvoiceId?: string | null) => {
    const found = findProductByLabel(modelNameLabel);
    if (!found) return null;

    // Filter assignments that are 'Finished Goods' or 'Transfer' and match the master model name
    const matches = productionAssignments.filter(a => {
      const type = a.type || 'Transfer';
      const isEligible = type === 'Finished Goods' || a.status === 'Finished Goods' || type === 'Transfer' || a.status === 'Transfer';
      if (!isEligible) return false;
      
      if (!a.modelName) return false;
      
      // Attempt robust product lookup for assignment's modelName
      const assignmentProduct = findProductByLabel(a.modelName);
      if (assignmentProduct) {
        if (assignmentProduct.id && found.id) {
          return assignmentProduct.id === found.id;
        }
        return (
          (assignmentProduct.description || '').toUpperCase().trim() === (found.description || '').toUpperCase().trim() &&
          (assignmentProduct.code || '').toUpperCase().trim() === (found.code || '').toUpperCase().trim() &&
          (assignmentProduct.name || '').toUpperCase().trim() === (found.name || '').toUpperCase().trim()
        );
      }

      return (
        doesStringMatchProduct(found, a.modelName) || 
        doesStringMatchProduct({ description: a.modelName, code: '', name: '' }, found.description) ||
        doesStringMatchProduct({ name: a.modelName, code: '', description: '' }, found.name)
      );
    });

    const byGodown: Record<string, number> = {};
    let totalQty = 0;
    matches.forEach(a => {
      const qty = Number(a.quantity) || 0;
      totalQty += qty;
    });

    // If we have an ignoreInvoiceId, let's find the existing invoice and add back its item quantities for accurate validation during editing
    if (ignoreInvoiceId) {
      try {
        const savedInvoices = JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]');
        const existingInv = savedInvoices.find((i: any) => i.id === ignoreInvoiceId);
        if (existingInv && existingInv.items) {
          existingInv.items.forEach((item: any) => {
            if (item.modelName) {
              const itemProduct = findProductByLabel(item.modelName);
              if (itemProduct && found && itemProduct.id === found.id) {
                const itemQty = Number(item.quantity) || 0;
                totalQty += itemQty;
              }
            }
          });
        }
      } catch (err) {
        console.error('Error recovering allocated stock for edit preview', err);
      }
    }

    if (totalQty > 0) {
      byGodown['SALEM'] = totalQty;
    }

    return { totalQty, byGodown };
  };

  // Helper to find matching production assignments for stock restoration and deduction
  const findMatchingProductionAssignmentsForRestore = (modelNameLabel: string, assignmentsList: any[]) => {
    const found = findProductByLabel(modelNameLabel);
    if (!found) return [];

    return assignmentsList.filter(a => {
      const type = a.type || 'Transfer';
      const isEligible = type === 'Finished Goods' || a.status === 'Finished Goods' || type === 'Transfer' || a.status === 'Transfer';
      if (!isEligible) return false;
      
      if (!a.modelName) return false;
      
      const assignmentProduct = findProductByLabel(a.modelName);
      if (assignmentProduct) {
        if (assignmentProduct.id && found.id) {
          return assignmentProduct.id === found.id;
        }
        return (
          (assignmentProduct.description || '').toUpperCase().trim() === (found.description || '').toUpperCase().trim() &&
          (assignmentProduct.code || '').toUpperCase().trim() === (found.code || '').toUpperCase().trim() &&
          (assignmentProduct.name || '').toUpperCase().trim() === (found.name || '').toUpperCase().trim()
        );
      }

      return (
        doesStringMatchProduct(found, a.modelName) || 
        doesStringMatchProduct({ description: a.modelName, code: '', name: '' }, found.description) ||
        doesStringMatchProduct({ name: a.modelName, code: '', description: '' }, found.name)
      );
    });
  };

  // Main stock updater when invoices are saved, modified, or deleted
  const updateStockForInvoice = (
    oldInvoiceItems: SaleRecord[] | null, 
    newInvoiceItems: SaleRecord[] | null
  ) => {
    try {
      const savedProduction = JSON.parse(localStorage.getItem('inven_production') || '[]');
      
      // 1. Restore old stock levels (add back sold quantities from previously saved invoice)
      if (oldInvoiceItems && oldInvoiceItems.length > 0) {
        for (const oldItem of oldInvoiceItems) {
          if (!oldItem.modelName) continue;
          const qtyToRestore = Number(oldItem.quantity) || 0;
          if (qtyToRestore <= 0) continue;

          const matches = findMatchingProductionAssignmentsForRestore(oldItem.modelName, savedProduction);
          if (matches.length > 0) {
            // Sort to add back to the first match with available capacity, or simply add back to the first match
            matches[0].quantity = (Number(matches[0].quantity) || 0) + qtyToRestore;
          }
        }
      }

      // 2. Deduct new stock levels (subtract sold quantities from newly generated invoice)
      if (newInvoiceItems && newInvoiceItems.length > 0) {
        for (const newItem of newInvoiceItems) {
          if (!newItem.modelName) continue;
          let qtyToDeduct = Number(newItem.quantity) || 0;
          if (qtyToDeduct <= 0) continue;

          const matches = findMatchingProductionAssignmentsForRestore(newItem.modelName, savedProduction);
          // Sort matches chronologically (FIFO) based on assignedDate or assignedAt to consume oldest stock first
          matches.sort((a, b) => {
            const dateA = new Date(a.assignedDate || a.assignedAt || 0).getTime();
            const dateB = new Date(b.assignedDate || b.assignedAt || 0).getTime();
            return dateA - dateB;
          });

          for (const match of matches) {
            const available = Number(match.quantity) || 0;
            if (available >= qtyToDeduct) {
              match.quantity = available - qtyToDeduct;
              qtyToDeduct = 0;
              break;
            } else {
              match.quantity = 0;
              qtyToDeduct -= available;
            }
          }

          // Fallback if sold quantity exceeds available capacity (validation should prevent this, but be safe)
          if (qtyToDeduct > 0 && matches.length > 0) {
            matches[0].quantity = (Number(matches[0].quantity) || 0) - qtyToDeduct;
          }
        }
      }

      // Save updated production assignments
      localStorage.setItem('inven_production', JSON.stringify(savedProduction));
      setProductionAssignments(savedProduction);
    } catch (error) {
      console.error('Error updating stock levels:', error);
    }
  };

  // Add line item row
  const addLineItem = () => {
    const newItem: SaleRecord = {
      id: `SALE-ADD-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      customerId: '',
      date: invoiceDate,
      quantity: 1,
      discountCost: 0,
      discountPercentage: 0,
      totalCost: 0,
      batchId: 'CUSTOM',
      modelName: '',
      unitPrice: 0,
      createdAt: new Date().toISOString(),
      hsn: '52082910',
      unit: 'Pcs',
      style: '',
      godown: ''
    };
    setBillItems([...billItems, newItem]);
  };

  // Remove line item row
  const removeLineItem = (index: number) => {
    setBillItems(billItems.filter((_, idx) => idx !== index));
  };

  // Update specific line item
  const updateLineItem = (index: number, key: keyof SaleRecord, value: any) => {
    const updated = billItems.map((item, idx) => {
      if (idx === index) {
        const temp = { ...item, [key]: value };
        if (key === 'quantity' || key === 'unitPrice') {
          const qty = Number(key === 'quantity' ? value : temp.quantity) || 0;
          const price = Number(key === 'unitPrice' ? value : temp.unitPrice) || 0;
          temp.totalCost = qty * price;
        }
        return temp;
      }
      return item;
    });
    setBillItems(updated);
  };

  // Pre-fill model selection
  const handleSelectModel = (index: number, modelName: string) => {
    const found = findProductByLabel(modelName);

    const modelLabel = found 
      ? (found.description ? `${found.description} - ${found.code || found.styleNo || ''}` : (found.styleNo ? `${found.styleNo} - ${found.modelName}` : (found.name || found.modelName))) 
      : modelName;

    const rate = found ? Number(found.sellingPrice || found.price || found.rate || found.basePrice) || 0 : 0;
    const hsn = found ? found.hsn || found.hsnCode || '52082910' : '52082910';
    const unit = found ? found.unit || 'Pcs' : 'Pcs';

    const updated = billItems.map((item, idx) => {
      if (idx === index) {
        const qty = item.quantity || 1;
        const total = qty * rate;
        return {
          ...item,
          modelName: modelLabel,
          unitPrice: rate,
          hsn,
          unit,
          totalCost: total
        };
      }
      return item;
    });
    setBillItems(updated);
  };

  // Calculate Subtotals & Totals
  const billingCalculations = useMemo(() => {
    const itemsTotal = billItems.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
    const totalQty = billItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    
    const packing = Number(packingCharges) || 0;
    const discountAmount = Number(overallDiscount) || 0;
    const taxableAmount = Math.max(0, itemsTotal - discountAmount);
    const baseForGst = taxableAmount + packing;

    const cgst = (!isNonGst && isTamilNadu) ? parseFloat(((baseForGst * cgstPercent) / 100).toFixed(2)) : 0;
    const sgst = (!isNonGst && isTamilNadu) ? parseFloat(((baseForGst * sgstPercent) / 100).toFixed(2)) : 0;
    const igst = (!isNonGst && !isTamilNadu) ? parseFloat(((baseForGst * igstPercent) / 100).toFixed(2)) : 0;
    
    const totalAmount = Math.round(baseForGst + cgst + sgst + igst + Number(roundOff));
    const words = numberToWords(totalAmount);

    return {
      totalQty,
      itemsSubtotal: itemsTotal,
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalAmount,
      amountInWords: words
    };
  }, [billItems, packingCharges, overallDiscount, cgstPercent, sgstPercent, igstPercent, roundOff, isTamilNadu, isNonGst]);

  // Construct current invoice object from form state
  const getInvoiceFromForm = (): GeneratedInvoice => {
    const { totalQty, taxableAmount, cgst, sgst, igst, totalAmount, amountInWords } = billingCalculations;
    
    // Check if editing or generating new ID
    const currentId = editingInvoiceId || `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Get original invoice to maintain modifications
    const originalInvoice = invoices.find(inv => inv.id === editingInvoiceId);
    
    const foundCust = customers.find(c => (c?.name || '').toUpperCase() === (buyerName || '').toUpperCase());
    const matchedCustomerId = foundCust ? foundCust.id : originalInvoice?.customerId || '';
    
    return {
      id: currentId,
      invoiceNo,
      date: parseSafeDate(invoiceDate).toLocaleDateString('en-GB'),
      term,
      customerId: matchedCustomerId,
      buyer: {
        name: (buyerName || '').toUpperCase(),
        address: (buyerAddress || '').toUpperCase(),
        phone: buyerPhone || '',
        gstin: (buyerGstin || '').toUpperCase()
      },
      items: billItems,
      totalQty,
      discount: Number(overallDiscount),
      taxableAmount,
      cgst,
      sgst,
      igst,
      roundOff: Number(roundOff),
      totalAmount,
      amountInWords,
      transport: selectedTransport || 'None',
      shipToName: (shipToName || '').toUpperCase(),
      shipToAddress: (shipToAddress || '').toUpperCase(),
      lrDate: parseSafeDate(lrDate).toISOString().split('T')[0],
      lrNo,
      noOfBundles,
      despatchedThrough,
      packingSlipNo,
      packingCharges: Number(packingCharges),
      cgstPercent,
      sgstPercent,
      igstPercent,
      isNonGst,
      status: originalInvoice?.status || 'Unpaid',
      paidAmount: originalInvoice?.paidAmount || 0,
      companyName: appSettings.companyName || 'P.S.V & CO',
      companyAddress: appSettings.companyAddress || '189/92, P.V.IYER STREET, NEAR SINGAMETHAI,\nAMMAPET MAIN ROAD, SALEM - 636001\nTAMILNADU',
      companyGstin: appSettings.companyGstin || '33ATNPC7827K1ZE',
      companyPhone: appSettings.companyPhone || '+91-9442434807',
      bankName: appSettings.bankName || 'THE KARUR VYSYA BANK LTD',
      bankBranch: appSettings.bankBranch || 'THATHIENGARPET',
      bankAccNo: appSettings.bankAccNo || '1192115000001283',
      bankIfsc: appSettings.bankIfsc || 'KVBL0001192',
      isModified: editingInvoiceId ? true : originalInvoice?.isModified || false,
      modifiedAt: editingInvoiceId ? new Date().toISOString() : originalInvoice?.modifiedAt,
      originalAmount: originalInvoice?.originalAmount || originalInvoice?.totalAmount || totalAmount
    };
  };

  // Preview bill in high-fidelity GST format
  const handlePreviewBill = () => {
    if (!buyerName) {
      showToast('error', 'Please enter or select a buyer name.');
      return;
    }
    if (billItems.length === 0) {
      showToast('error', 'Please add at least one item line to the bill.');
      return;
    }
    const invObj = getInvoiceFromForm();

    // Validate stock levels
    for (const item of invObj.items) {
      if (item.modelName) {
        const stock = getProductStockInfo(item.modelName, editingInvoiceId);
        const totalStock = stock ? stock.totalQty : 0;
        if (Number(item.quantity) > totalStock) {
          showToast('error', `Insufficient stock! Entered quantity (${item.quantity}) exceeds available stock (${totalStock} pcs) for: "${item.modelName}".`);
          return;
        }
      }
    }

    // Concatenate description column with style column
    invObj.items = invObj.items.map(item => {
      if (item.style) {
        const suffix = ` - ${item.style}`;
        if (!item.modelName.includes(suffix)) {
          return {
            ...item,
            modelName: `${item.modelName}${suffix}`
          };
        }
      }
      return item;
    });

    setPreviewInvoice(invObj);
  };

  // Save/Generate Bill direct to local storage
  const handleSaveBill = (forceInvoiceObj?: GeneratedInvoice) => {
    let finalInvoice = forceInvoiceObj || getInvoiceFromForm();

    if (!forceInvoiceObj) {
      finalInvoice.items = finalInvoice.items.map(item => {
        if (item.style) {
          const suffix = ` - ${item.style}`;
          if (!item.modelName.includes(suffix)) {
            return {
              ...item,
              modelName: `${item.modelName}${suffix}`
            };
          }
        }
        return item;
      });
    }

    if (!finalInvoice.buyer.name) {
      showToast('error', 'Please select or enter a buyer name.');
      return;
    }
    if (finalInvoice.items.length === 0) {
      showToast('error', 'Please add at least one item.');
      return;
    }

    // Validate stock levels
    for (const item of finalInvoice.items) {
      if (item.modelName) {
        const stock = getProductStockInfo(item.modelName, editingInvoiceId);
        const totalStock = stock ? stock.totalQty : 0;
        if (Number(item.quantity) > totalStock) {
          showToast('error', `Insufficient stock! Entered quantity (${item.quantity}) exceeds available stock (${totalStock} pcs) for: "${item.modelName}".`);
          return;
        }
      }
    }

    try {
      const savedInvoices = JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]');
      
      let updatedInvoices = [];
      const exists = savedInvoices.find((i: any) => i.id === finalInvoice.id);

      if (exists) {
        // Update stock levels: restore old stock, then deduct new stock
        updateStockForInvoice(exists.items, finalInvoice.items);

        // Edit / Modify flow
        updatedInvoices = savedInvoices.map((inv: any) => {
          if (inv.id === finalInvoice.id) {
            // Log modifications!
            return {
              ...finalInvoice,
              isModified: true,
              modifiedAt: new Date().toISOString(),
              originalAmount: inv.originalAmount || inv.totalAmount
            };
          }
          return inv;
        });
        showToast('success', `Bill ${finalInvoice.invoiceNo} modified and updated successfully!`);
      } else {
        // Update stock levels: deduct new stock
        updateStockForInvoice(null, finalInvoice.items);

        // Create new flow
        updatedInvoices = [finalInvoice, ...savedInvoices];
        
        // Increment nextInvoiceId in settings
        const settings = JSON.parse(localStorage.getItem('inven_settings') || '{}');
        const nextId = settings.nextInvoiceId || 1;
        settings.nextInvoiceId = nextId + 1;
        localStorage.setItem('inven_settings', JSON.stringify(settings));

        showToast('success', `Bill ${finalInvoice.invoiceNo} created successfully!`);
      }

      localStorage.setItem('inven_generated_invoices', JSON.stringify(updatedInvoices));
      triggerSync();
      setPreviewInvoice(null);
      resetCreatorForm();
      setActiveTab('view_bills');
    } catch (e) {
      showToast('error', 'Failed to save bill records. Check storage spaces.');
    }
  };

  // Reset creator fields
  const resetCreatorForm = () => {
    setEditingInvoiceId(null);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setTerm('Credit');
    setBuyerName('');
    setBuyerAddress('');
    setBuyerPhone('');
    setBuyerGstin('');
    setShipToName('');
    setShipToAddress('');
    setDespatchedThrough('');
    setSelectedTransport('');
    setLrNo('');
    setLrDate(new Date().toISOString().split('T')[0]);
    setNoOfBundles('');
    setPackingSlipNo('');
    
    // Add one blank line item default
    const defaultItem: SaleRecord = {
      id: `SALE-ADD-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      quantity: 1,
      discountCost: 0,
      discountPercentage: 0,
      totalCost: 0,
      batchId: 'CUSTOM',
      modelName: '',
      unitPrice: 0,
      createdAt: new Date().toISOString(),
      hsn: '52082910',
      unit: 'Pcs',
      style: ''
    };
    setBillItems([defaultItem]);
    setPackingCharges(0);
    setOverallDiscount(0);
    setRoundOff(0);
    setIgstPercent(0);
    setIsNonGst(false);
  };

  // Initialize form with existing invoice details for modification
  const handleEditInvoice = (inv: GeneratedInvoice) => {
    setEditingInvoiceId(inv.id);
    setInvoiceNo(inv.invoiceNo);
    
    // Format Date string safely
    let formattedDate = new Date().toISOString().split('T')[0];
    if (inv.date) {
      const parsed = parseSafeDate(inv.date);
      formattedDate = parsed.toISOString().split('T')[0];
    }
    setInvoiceDate(formattedDate);
    setTerm(inv.term || 'Credit');
    setIsNonGst(inv.isNonGst !== undefined ? inv.isNonGst : (inv.cgstPercent === 0 && inv.sgstPercent === 0));
    
    setBuyerName(inv.buyer?.name || '');
    setBuyerAddress(inv.buyer?.address || '');
    setBuyerPhone(inv.buyer?.phone || '');
    setBuyerGstin(inv.buyer?.gstin || '');

    setShipToName(inv.shipToName || '');
    setShipToAddress(inv.shipToAddress || '');

    setDespatchedThrough(inv.despatchedThrough || '');
    setSelectedTransport(inv.transport || '');
    setLrNo(inv.lrNo || '');
    
    let formattedLrDate = new Date().toISOString().split('T')[0];
    if (inv.lrDate) {
      const parsedLr = parseSafeDate(inv.lrDate);
      formattedLrDate = parsedLr.toISOString().split('T')[0];
    }
    setLrDate(formattedLrDate);
    setNoOfBundles(inv.noOfBundles || '');
    setPackingSlipNo(inv.packingSlipNo || '');

    setBillItems(inv.items || []);
    setPackingCharges(inv.packingCharges || 0);
    setOverallDiscount(inv.discount || 0);
    setCgstPercent(inv.cgstPercent !== undefined ? inv.cgstPercent : 2.5);
    setSgstPercent(inv.sgstPercent !== undefined ? inv.sgstPercent : 2.5);
    setIgstPercent(inv.igst !== undefined ? (inv.igst > 0 ? 5.0 : 0) : 0);
    setRoundOff(inv.roundOff || 0);

    setActiveTab('create_bill');
    showToast('success', `Loaded Bill ${inv.invoiceNo} for editing.`);
  };

  const recalculateInvoiceTotals = (invoice: GeneratedInvoice): GeneratedInvoice => {
    const itemsTotal = invoice.items.reduce((sum: number, item: any) => sum + (Number(item.totalCost) || 0), 0);
    const totalQty = invoice.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
    const discount = Number(invoice.discount) || 0;
    const taxableAmount = Math.max(0, itemsTotal - discount);
    const packing = Number(invoice.packingCharges) || 0;
    const baseForGst = taxableAmount + packing;

    const isNonGst = !!invoice.isNonGst;
    
    // Check if Tamil Nadu (either by explicit property or by GSTIN state code)
    const isTamilNadu = (() => {
      if (invoice.buyer?.gstin && invoice.buyer.gstin.trim().length >= 2) {
        const stateCode = invoice.buyer.gstin.trim().substring(0, 2);
        if (/^\d+$/.test(stateCode)) {
          return stateCode === '33';
        }
      }
      if (invoice.buyer?.address) {
        const addrUpper = invoice.buyer.address.toUpperCase();
        return addrUpper.includes('TAMIL') || addrUpper.includes('TN') || addrUpper.includes('33');
      }
      return true;
    })();

    let cgstPercent = isNonGst ? 0 : (invoice.cgstPercent !== undefined ? invoice.cgstPercent : 2.5);
    let sgstPercent = isNonGst ? 0 : (invoice.sgstPercent !== undefined ? invoice.sgstPercent : 2.5);
    let igstPercent = isNonGst ? 0 : (invoice.igstPercent !== undefined ? invoice.igstPercent : (isTamilNadu ? 0 : 5.0));

    // Keep state aligned
    if (!isNonGst) {
      if (isTamilNadu) {
        cgstPercent = cgstPercent || 2.5;
        sgstPercent = sgstPercent || 2.5;
        igstPercent = 0;
      } else {
        cgstPercent = 0;
        sgstPercent = 0;
        igstPercent = igstPercent || 5.0;
      }
    }

    const cgst = isNonGst ? 0 : parseFloat(((baseForGst * cgstPercent) / 100).toFixed(2));
    const sgst = isNonGst ? 0 : parseFloat(((baseForGst * sgstPercent) / 100).toFixed(2));
    const igst = isNonGst ? 0 : parseFloat(((baseForGst * igstPercent) / 100).toFixed(2));

    const roundOff = Number(invoice.roundOff) || 0;
    const totalAmount = Math.round(baseForGst + cgst + sgst + igst + roundOff);

    return {
      ...invoice,
      totalQty,
      taxableAmount: taxableAmount,
      cgstPercent,
      sgstPercent,
      igstPercent,
      cgst,
      sgst,
      igst,
      totalAmount,
      amountInWords: numberToWords(totalAmount)
    };
  };

  // Restore modified bill to its original form
  const handleRestoreInvoice = (inv: GeneratedInvoice) => {
    if (window.confirm(`Are you sure you want to restore Bill ${inv.invoiceNo} to its original state? This will revert modifications.`)) {
      try {
        const savedInvoices = JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]');
        const updated = savedInvoices.map((item: any) => {
          if (item.id === inv.id) {
            return {
              ...item,
              totalAmount: item.originalAmount || item.totalAmount,
              isModified: false,
              modifiedAt: undefined,
              originalAmount: undefined
            };
          }
          return item;
        });
        localStorage.setItem('inven_generated_invoices', JSON.stringify(updated));
        triggerSync();
        showToast('success', `Bill ${inv.invoiceNo} successfully restored.`);
      } catch (e) {
        showToast('error', 'Failed to restore bill.');
      }
    }
  };

  // Delete Invoice with confirmation dialog
  const handleDeleteInvoice = (id: string, invoiceNo: string) => {
    setInvoiceToDelete({ id, invoiceNo });
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteInvoice = () => {
    if (!invoiceToDelete) return;
    const { id, invoiceNo } = invoiceToDelete;
    try {
      const savedInvoices = JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]');
      const itemToDelete = savedInvoices.find((item: any) => item.id === id);
      if (itemToDelete) {
        updateStockForInvoice(itemToDelete.items, null);
      }
      const filtered = savedInvoices.filter((item: any) => item.id !== id);
      localStorage.setItem('inven_generated_invoices', JSON.stringify(filtered));
      triggerSync();
      showToast('success', `Bill ${invoiceNo} deleted successfully.`);
    } catch (e) {
      showToast('error', 'Failed to delete bill.');
    } finally {
      setDeleteConfirmOpen(false);
      setInvoiceToDelete(null);
    }
  };

  // Open record payment modal
  const handleOpenPayment = (inv: GeneratedInvoice) => {
    setPaymentInvoice(inv);
    const balance = (inv.totalAmount || 0) - (inv.paidAmount || 0);
    setPayAmount(balance > 0 ? balance : 0);
  };

  // Save payments
  const handleSavePayment = () => {
    if (!paymentInvoice) return;
    try {
      const savedInvoices = JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]');
      const updated = savedInvoices.map((inv: any) => {
        if (inv.id === paymentInvoice.id) {
          const currentPaid = Number(inv.paidAmount) || 0;
          const newPaid = Math.min(inv.totalAmount, currentPaid + payAmount);
          let newStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
          if (newPaid >= inv.totalAmount) {
            newStatus = 'Paid';
          } else if (newPaid > 0) {
            newStatus = 'Partially Paid';
          }
          return {
            ...inv,
            paidAmount: newPaid,
            status: newStatus
          };
        }
        return inv;
      });

      localStorage.setItem('inven_generated_invoices', JSON.stringify(updated));
      triggerSync();
      setPaymentInvoice(null);
      showToast('success', 'Payment logged successfully!');
    } catch (e) {
      showToast('error', 'Failed to log payments.');
    }
  };

  // Search & Filter computation for normal invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchQuery = (inv.invoiceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.buyer?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.buyer?.phone || '').includes(searchQuery);
        
      if (statusFilter === 'all') return matchQuery;
      return matchQuery && inv.status === statusFilter;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Filter modified invoices
  const modifiedInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const isMod = inv.isModified === true || !!inv.modifiedAt;
      const matchQuery = (inv.invoiceNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.buyer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      return isMod && matchQuery;
    });
  }, [invoices, searchQuery]);

  // Pre-populate with a blank line on mount
  useEffect(() => {
    if (billItems.length === 0) {
      addLineItem();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className={previewInvoice ? "no-print space-y-6" : "space-y-6"}>
        {/* Toast Alert */}
      {toast && (
        <div className={cn(
          "fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-in slide-in-from-top-4 duration-300",
          toast.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-rose-50 border-rose-100 text-rose-800"
        )}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Receipt className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Billing Center</h1>
          </div>
          <p className="text-sm text-slate-500 pl-1">Generate professional bills, review edit modifications, and record client transactions.</p>
        </div>
        
        {/* Quick action creator */}
        {activeTab !== 'create_bill' && (
          <button 
            onClick={() => {
              resetCreatorForm();
              setActiveTab('create_bill');
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Custom Bill
          </button>
        )}
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('view_bills')}
          className={cn(
            "px-6 py-3 text-sm font-black transition-all border-b-2 -mb-[2px]",
            activeTab === 'view_bills'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          View Bills ({filteredInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('modified_bills')}
          className={cn(
            "px-6 py-3 text-sm font-black transition-all border-b-2 -mb-[2px] flex items-center gap-2",
            activeTab === 'modified_bills'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Modified Bills 
          {modifiedInvoices.length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {modifiedInvoices.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            if (!editingInvoiceId) resetCreatorForm();
            setActiveTab('create_bill');
          }}
          className={cn(
            "px-6 py-3 text-sm font-black transition-all border-b-2 -mb-[2px] flex items-center gap-2",
            activeTab === 'create_bill'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          {editingInvoiceId ? (
            <>
              <Edit className="w-3.5 h-3.5" />
              Modifying Bill ({invoiceNo})
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Create New Bill
            </>
          )}
        </button>
      </div>

      {/* VIEW BILLS TAB CONTENT */}
      {activeTab === 'view_bills' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search bills by number, buyer, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-800"
              />
            </div>
            
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {(['all', 'Paid', 'Partially Paid', 'Unpaid'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                    statusFilter === filter 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {filter === 'all' ? 'All Status' : filter}
                </button>
              ))}
            </div>
          </div>

          {/* Bills Grid / Table */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8" />
              </div>
              <p className="text-slate-800 font-bold text-lg">No billing invoices found</p>
              <p className="text-slate-400 text-sm mt-1">Try modifying your search or click "Create Custom Bill" to record a new invoice.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Bill No / Date</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Buyer Name</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Payment Term</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Qty</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Net Amount</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Paid / Balance</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-center">Status</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredInvoices.map((inv) => {
                      const total = Number(inv.totalAmount) || 0;
                      const paid = Number(inv.paidAmount) || 0;
                      const balance = Math.max(0, total - paid);

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="space-y-0.5">
                              <p className="font-mono text-xs font-black text-indigo-600 uppercase tracking-wide">{inv.invoiceNo}</p>
                              <p className="text-xs text-slate-400 font-medium">{inv.date}</p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-slate-800 line-clamp-1">{inv.buyer?.name || 'N/A'}</p>
                              {inv.buyer?.gstin && (
                                <p className="text-[10px] font-semibold text-slate-400">GSTIN: {inv.buyer.gstin}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold",
                              inv.term === 'Cash' ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                            )}>
                              {inv.term || 'Credit'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-bold text-slate-700 text-sm">
                            {inv.totalQty || 0}
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-black text-slate-800 text-sm">
                            ₹{total.toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-right text-xs">
                            <div className="font-mono font-bold text-slate-700">Paid: ₹{paid.toLocaleString('en-IN')}</div>
                            <div className="font-mono text-slate-400">Bal: ₹{balance.toLocaleString('en-IN')}</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase",
                              inv.status === 'Paid' 
                                ? "bg-emerald-100 text-emerald-800" 
                                : inv.status === 'Partially Paid' 
                                  ? "bg-amber-100 text-amber-800" 
                                  : "bg-slate-100 text-slate-600"
                            )}>
                              {inv.status || 'Unpaid'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => setPreviewInvoice(inv)}
                                title="Print / PDF Invoice"
                                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditInvoice(inv)}
                                title="Edit / Modify Bill"
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNo)}
                                title="Delete Bill"
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODIFIED BILLS TAB CONTENT */}
      {activeTab === 'modified_bills' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 font-bold text-sm">Modified Bills Audit Panel</p>
              <p className="text-amber-800/80 text-xs mt-0.5">This pane displays invoices that have undergone manual field-level changes or corrections, preserving history and showing any divergence from the original calculated total.</p>
            </div>
          </div>

          {modifiedInvoices.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8" />
              </div>
              <p className="text-slate-800 font-bold text-lg">No modified bills logged</p>
              <p className="text-slate-400 text-sm mt-1">When you edit an existing invoice or recalculate values from the "View Bills" page, they will record here as Modified.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Bill Number</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Buyer</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider">Modified Date</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Original Amount</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Modified Amount</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Variance</th>
                      <th className="py-4 px-6 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {modifiedInvoices.map((inv) => {
                      const original = Number(inv.originalAmount) || Number(inv.totalAmount) || 0;
                      const current = Number(inv.totalAmount) || 0;
                      const variance = current - original;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <p className="font-mono text-xs font-black text-amber-600 uppercase tracking-wide">{inv.invoiceNo}</p>
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Modified</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-sm font-bold text-slate-800">{inv.buyer?.name || 'N/A'}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-xs text-slate-600 font-semibold">
                              {inv.modifiedAt ? new Date(inv.modifiedAt).toLocaleDateString() : 'N/A'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {inv.modifiedAt ? new Date(inv.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-bold text-slate-500 text-sm">
                            ₹{original.toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-black text-slate-800 text-sm">
                            ₹{current.toLocaleString('en-IN')}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className={cn(
                              "font-mono text-xs font-bold",
                              variance === 0 
                                ? "text-slate-400" 
                                : variance > 0 
                                  ? "text-emerald-600" 
                                  : "text-rose-600"
                            )}>
                              {variance === 0 ? 'No change' : `${variance > 0 ? '+' : ''}₹${variance.toLocaleString('en-IN')}`}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => setPreviewInvoice(inv)}
                                title="Print Preview"
                                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditInvoice(inv)}
                                title="Edit Further"
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRestoreInvoice(inv)}
                                title="Revert to Original"
                                className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                              >
                                <Undo2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE NEW BILLS TAB CONTENT */}
      {activeTab === 'create_bill' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-800">
              {editingInvoiceId ? `Modify Bill: ${invoiceNo}` : 'Billing Invoice Details'}
            </h2>
            {editingInvoiceId && (
              <button 
                onClick={() => {
                  resetCreatorForm();
                  setActiveTab('view_bills');
                }}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1.5"
              >
                Cancel Modification
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* COLUMN 1: General Info */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2">
                <FileText className="w-4 h-4" />
                <span>Invoice Settings</span>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Invoice Number</label>
                <input 
                  type="text" 
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="e.g. GT/25-26/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                <input 
                  type="date" 
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Payment Term</label>
                <div className="flex gap-2">
                  {(['Credit', 'Cash'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTerm(t)}
                      className={cn(
                        "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                        term === t 
                          ? "bg-slate-950 border-slate-950 text-white shadow-sm" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Billing Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNonGst(false)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                      !isNonGst 
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    GST (Tax)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNonGst(true)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold transition-all border",
                      isNonGst 
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Non GST (No Tax)
                  </button>
                </div>
              </div>
            </div>

            {/* COLUMN 2: Buyer details */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2">
                <User className="w-4 h-4" />
                <span>Buyer / Customer Details</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">M/s Buyer Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    list="billing-customer-options"
                    value={buyerName}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                    placeholder="Enter or select customer name"
                  />
                  <datalist id="billing-customer-options">
                    {customers.map((cust) => (
                      <option key={cust.id} value={cust.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Buyer GSTIN</label>
                  <input 
                    type="text" 
                    value={buyerGstin}
                    onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="33XXXXX..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Billing Address</label>
                <textarea 
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none resize-y"
                  placeholder="Address"
                />
              </div>
            </div>

            {/* COLUMN 3: Shipping & Despatch details */}
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2">
                <Truck className="w-4 h-4" />
                <span>Despatch & Transport</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Transport</label>
                  <input 
                    type="text" 
                    list="billing-transport-options"
                    value={selectedTransport}
                    onChange={(e) => setSelectedTransport(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Transport Name"
                  />
                  <datalist id="billing-transport-options">
                    {transports.map((t) => (
                      <option key={t.id || t} value={t.name || t} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Despatched Through</label>
                  <input 
                    type="text" 
                    value={despatchedThrough}
                    onChange={(e) => setDespatchedThrough(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g. Lorry"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">LR No.</label>
                  <input 
                    type="text" 
                    value={lrNo}
                    onChange={(e) => setLrNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="LR Number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">LR Date</label>
                  <input 
                    type="date" 
                    value={lrDate}
                    onChange={(e) => setLrDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">No. of Bundles</label>
                  <input 
                    type="text" 
                    value={noOfBundles}
                    onChange={(e) => setNoOfBundles(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="e.g. 5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Packing Slip No.</label>
                  <input 
                    type="text" 
                    value={packingSlipNo}
                    onChange={(e) => setPackingSlipNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    placeholder="Slip Number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* LINE ITEMS BLOCK */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Line Items</h3>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Row
              </button>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-center w-[3%]">S.No</th>
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-left w-[35%]">Fabric Model / Description</th>
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-left w-[11%]">Style</th>
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-left w-[10%]">Godown</th>
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-left w-[6%]">HSN</th>
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-right w-[6%]">Quantity</th>
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-left w-[4%]">Unit</th>
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-right w-[9%]">Unit Price</th>
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-right w-[12%]">Amount</th>
                    <th className="py-3 px-4 text-[11px] font-black text-slate-400 uppercase text-center w-[4%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {billItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/40">
                      <td className="py-2 px-4 text-center text-xs font-bold text-slate-400 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-2 px-4">
                        <input 
                          type="text" 
                          list="billing-product-options"
                          value={item.modelName}
                          onChange={(e) => handleSelectModel(index, e.target.value)}
                          className="w-full bg-slate-50/50 hover:bg-slate-100/40 focus:bg-white border-b border-dashed border-slate-200 outline-none text-sm font-bold text-slate-800 px-2 py-1.5 rounded"
                          placeholder="Select model description"
                        />
                        <datalist id="billing-product-options">
                          {products.map((prod) => {
                            const desc = prod.description || '';
                            const style = prod.code || prod.styleNo || '';
                            const modelName = prod.name || prod.modelName || '';
                            const valueStr = desc 
                              ? (style ? `${desc} - ${style}` : desc)
                              : (style ? `${style} - ${modelName}` : modelName);
                            return (
                              <option key={prod.id} value={valueStr} />
                            );
                          })}
                        </datalist>
                        
                        {item.modelName && (() => {
                          const stock = getProductStockInfo(item.modelName, editingInvoiceId);
                          const total = stock ? stock.totalQty : 0;
                          const godownDetails = stock ? Object.entries(stock.byGodown)
                            .map(([gd, q]) => `${gd}: ${q} pcs`)
                            .join(', ') : '';
                          return (
                            <div className={`text-[10px] font-extrabold mt-1 uppercase tracking-wider flex flex-wrap items-center gap-1 py-1 px-2 rounded-lg border w-fit ${total > 0 ? 'text-emerald-600 bg-emerald-50/75 border-emerald-100/30' : 'text-amber-600 bg-amber-50/75 border-amber-100/30'}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${total > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                              Stock: {total} pcs {godownDetails ? `(${godownDetails})` : '(No finished goods)'}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          list={`style-options-${index}`}
                          value={item.style || ''}
                          onChange={(e) => updateLineItem(index, 'style', e.target.value)}
                          className="w-full bg-slate-50/50 hover:bg-slate-100/40 focus:bg-white text-xs font-bold text-slate-700 outline-none py-1.5 border-b border-dashed border-slate-200 rounded min-w-[90px] px-2"
                          placeholder="Select Style"
                        />
                        <datalist id={`style-options-${index}`}>
                          {styles.map((st) => (
                            <option key={st.id} value={st.name} />
                          ))}
                        </datalist>
                      </td>
                      <td className="py-2 px-4">
                        <select
                          value={item.godown || ''}
                          onChange={(e) => updateLineItem(index, 'godown', e.target.value)}
                          className="w-full bg-slate-50/50 text-xs font-bold text-slate-700 outline-none cursor-pointer py-1.5 border-b border-dashed border-slate-200 rounded min-w-[90px]"
                        >
                          <option value="">Select Godown</option>
                          {godowns.map((g) => (
                            <option key={g.id || g.name} value={g.name}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-4">
                        <input 
                          type="text" 
                          value={item.hsn || ''}
                          onChange={(e) => updateLineItem(index, 'hsn', e.target.value)}
                          className="w-full bg-slate-50/50 outline-none text-xs font-bold text-slate-500 px-2 py-1.5 border-b border-dashed border-slate-200 rounded text-center font-mono min-w-[65px]"
                          placeholder="5208..."
                        />
                      </td>
                      <td className="py-2 px-4">
                        {(() => {
                          const stock = getProductStockInfo(item.modelName, editingInvoiceId);
                          const total = stock ? stock.totalQty : 0;
                          const hasExceeded = item.modelName && item.quantity > total;
                          return (
                            <div className="flex flex-col gap-1 min-w-[60px]">
                              <input 
                                type="number" 
                                value={item.quantity}
                                onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                onWheel={(e) => e.currentTarget.blur()}
                                className={`w-full text-right font-bold px-2 py-1.5 outline-none border rounded font-mono transition-all ${
                                  hasExceeded 
                                    ? 'bg-rose-50 border-rose-400 text-rose-700 focus:bg-rose-100/50 focus:ring-1 focus:ring-rose-400' 
                                    : 'bg-slate-50/50 border-transparent border-b border-dashed border-slate-200 text-slate-800 focus:bg-white'
                                }`}
                              />
                              {hasExceeded && (
                                <span className="text-[10px] font-black text-rose-600 text-right uppercase tracking-wide">
                                  Exceeds Stock ({total} available)
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2 px-4">
                        <span className="text-xs font-bold text-slate-700">
                          Pcs
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        <input 
                          type="number" 
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full bg-slate-50/50 text-right font-bold text-slate-800 px-2 py-1.5 outline-none border-b border-dashed border-slate-200 rounded font-mono"
                        />
                      </td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-slate-800 text-sm">
                        ₹{(item.totalCost || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          disabled={billItems.length <= 1}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FINANCIAL SUMMARY BLOCK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wide">Charges & Taxes Configuration</p>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Packing & Handling (₹)</label>
                  <input 
                    type="number" 
                    value={packingCharges}
                    onChange={(e) => setPackingCharges(parseFloat(e.target.value) || 0)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-sm font-semibold font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Overall Discount (₹)</label>
                  <input 
                    type="number" 
                    value={overallDiscount}
                    onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-sm font-semibold font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Round Off adjustment (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={roundOff}
                    onChange={(e) => setRoundOff(parseFloat(e.target.value) || 0)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-sm font-semibold font-mono text-center"
                  />
                </div>
              </div>

              {!isNonGst ? (
                <div className="w-full">
                  {isTamilNadu ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">CGST (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={cgstPercent}
                          onChange={(e) => setCgstPercent(parseFloat(e.target.value) || 0)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-sm font-semibold font-mono text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">SGST (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={sgstPercent}
                          onChange={(e) => setSgstPercent(parseFloat(e.target.value) || 0)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-sm font-semibold font-mono text-center"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">IGST (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={igstPercent}
                          onChange={(e) => setIgstPercent(parseFloat(e.target.value) || 0)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-full bg-slate-50 border-none rounded-xl px-3 py-2.5 text-sm font-semibold font-mono text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-100/60 p-3 rounded-xl border border-slate-200/50 text-center">
                  <p className="text-xs font-bold text-slate-500">Non-GST Billing Mode Enabled</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Taxes (CGST, SGST, IGST) are set to 0.0%</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Items Subtotal:</span>
                  <span className="font-mono text-slate-700">₹{(billingCalculations.itemsSubtotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {overallDiscount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600">
                    <span>Overall Discount:</span>
                    <span className="font-mono">-₹{Number(overallDiscount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-600 border-t border-slate-100 pt-1.5">
                  <span>Taxable Amount:</span>
                  <span className="font-mono text-slate-800">₹{billingCalculations.taxableAmount.toLocaleString('en-IN')}</span>
                </div>
                {packingCharges > 0 && (
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Packing Charges:</span>
                    <span className="font-mono text-slate-700">₹{Number(packingCharges).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {!isNonGst && isTamilNadu && (
                  <>
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>CGST ({cgstPercent}%):</span>
                      <span className="font-mono text-slate-700">₹{billingCalculations.cgst.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>SGST ({sgstPercent}%):</span>
                      <span className="font-mono text-slate-700">₹{billingCalculations.sgst.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
                {!isNonGst && !isTamilNadu && (
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>IGST ({igstPercent}%):</span>
                    <span className="font-mono text-slate-700">₹{billingCalculations.igst.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {roundOff !== 0 && (
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Round Off:</span>
                    <span className="font-mono text-slate-700">₹{roundOff}</span>
                  </div>
                )}
                
                <div className="border-t border-dashed border-slate-200 my-2 pt-2 flex justify-between">
                  <span className="text-sm font-black text-slate-800">Net Payable Total:</span>
                  <span className="font-mono text-lg font-black text-indigo-600">₹{billingCalculations.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount in Words</p>
                <p className="text-xs font-black text-slate-600 leading-relaxed mt-0.5 italic">{billingCalculations.amountInWords}</p>
              </div>
            </div>
          </div>

          {/* GENERATE WORKSPACE ACTIONS */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={resetCreatorForm}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-all"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={handlePreviewBill}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              Preview & Edit Layout
            </button>
            <button
              type="button"
              onClick={() => handleSaveBill()}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-xs font-bold cursor-pointer transition-all shadow-lg shadow-indigo-100"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingInvoiceId ? 'Save Changes' : 'Generate & Save Bill'}
            </button>
          </div>
        </div>
      )}
      </div>
      {/* OVERLAY HIGH-FIDELITY INVOICE PREVIEW MODAL */}
      {previewInvoice && (
        <InvoicePreviewOverlay
          previewInvoice={previewInvoice}
          updatePreviewField={(key, val) => {
            setPreviewInvoice(prev => {
              if (!prev) return null;
              const updated = { ...prev, [key]: val };
              return recalculateInvoiceTotals(updated);
            });
          }}
          updatePreviewBuyerField={(key, val) => {
            setPreviewInvoice(prev => {
              if (!prev) return null;
              const updated = {
                ...prev,
                buyer: {
                  ...prev.buyer,
                  [key]: val
                }
              };
              return recalculateInvoiceTotals(updated);
            });
          }}
          updatePreviewItem={(index, key, val) => {
            setPreviewInvoice(prev => {
              if (!prev) return null;
              const updatedItems = prev.items.map((item, idx) => {
                if (idx === index) {
                  const updatedItem = { ...item, [key]: val };
                  if (key === 'quantity' || key === 'unitPrice' || key === 'discountCost' || key === 'discountPercentage') {
                    const qty = Number(key === 'quantity' ? val : updatedItem.quantity) || 0;
                    const price = Number(key === 'unitPrice' ? val : updatedItem.unitPrice) || 0;
                    let discCost = Number(key === 'discountCost' ? val : updatedItem.discountCost) || 0;
                    let discPct = Number(key === 'discountPercentage' ? val : updatedItem.discountPercentage) || 0;

                    if (key === 'discountPercentage') {
                      discCost = parseFloat(((qty * price) * (discPct / 100)).toFixed(2));
                      updatedItem.discountCost = discCost;
                    } else if (key === 'discountCost') {
                      const base = qty * price;
                      discPct = base > 0 ? parseFloat(((discCost / base) * 100).toFixed(2)) : 0;
                      updatedItem.discountPercentage = discPct;
                    } else {
                      discCost = parseFloat(((qty * price) * (discPct / 100)).toFixed(2));
                      updatedItem.discountCost = discCost;
                    }

                    updatedItem.totalCost = Math.max(0, (qty * price) - discCost);
                  }
                  return updatedItem;
                }
                return item;
              });
              return recalculateInvoiceTotals({ ...prev, items: updatedItems });
            });
          }}
          removePreviewItem={(index) => {
            setPreviewInvoice(prev => {
              if (!prev) return null;
              const updatedItems = prev.items.filter((_, idx) => idx !== index);
              return recalculateInvoiceTotals({ ...prev, items: updatedItems });
            });
          }}
          addPreviewItem={() => {
            setPreviewInvoice(prev => {
              if (!prev) return null;
              const newItem: SaleRecord = {
                id: `SALE-ADD-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                customerId: prev.buyer?.name || '',
                date: new Date().toISOString().split('T')[0],
                quantity: 1,
                discountCost: 0,
                discountPercentage: 0,
                totalCost: 100,
                batchId: 'CUSTOM',
                modelName: 'New Fabric Item',
                unitPrice: 100,
                createdAt: new Date().toISOString(),
                hsn: '52082910',
                unit: 'Pcs'
              };
              const updatedItems = [...prev.items, newItem];
              return recalculateInvoiceTotals({ ...prev, items: updatedItems });
            });
          }}
          appSettings={appSettings}
          setPreviewInvoice={setPreviewInvoice}
          finalizeInvoice={() => {
            if (previewInvoice) {
              handleSaveBill(previewInvoice);
            }
          }}
        />
      )}

      {/* PAYMENTS RECORD DIALOG */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Log Payments</p>
                <h3 className="text-base font-black text-slate-800">Bill: {paymentInvoice.invoiceNo}</h3>
              </div>
              <button 
                onClick={() => setPaymentInvoice(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1 font-semibold text-slate-700">
                <div className="flex justify-between">
                  <span>Bill Total:</span>
                  <span className="font-mono">₹{paymentInvoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Previously Paid:</span>
                  <span className="font-mono">₹{(paymentInvoice.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-indigo-700 border-t border-dashed border-indigo-200 mt-1 pt-1">
                  <span>Pending Balance:</span>
                  <span className="font-mono font-bold">₹{((paymentInvoice.totalAmount || 0) - (paymentInvoice.paidAmount || 0)).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Payment Amount (₹)</label>
                <input 
                  type="number" 
                  value={payAmount}
                  onChange={(e) => setPayAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-3 text-sm font-black text-slate-800 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Date Paid</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-3 text-sm font-bold text-slate-700 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Mode of Payment</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl px-3.5 py-3 text-sm font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Cheque">Cheque Draft</option>
                  <option value="UPI / QR">UPI / QR Scan</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION DIALOG MODAL */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-6 animate-pulse">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">
              Are you sure you want to delete Bill <span className="font-bold text-slate-700">"{invoiceToDelete?.invoiceNo}"</span>? This action will restore product stocks and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setDeleteConfirmOpen(false); setInvoiceToDelete(null); }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteInvoice}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100 text-sm"
              >
                Delete Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
