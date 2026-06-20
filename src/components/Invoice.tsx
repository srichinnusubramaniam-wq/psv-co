import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Filter, 
  Download,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  ChevronRight,
  Calendar,
  X,
  History,
  Truck,
  Box,
  Layers,
  Edit,
  Trash2,
  RotateCcw,
  Coins,
  Printer
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ProductionAssignment {
  id: string;
  inventoryItemId: string;
  fabricType: string;
  unit: string;
  size: 'XL' | 'XXL' | 'L' | 'M' | 'S';
  modelName: string;
  quantity: number;
  rate: number;
  assignedAt: string;
  assignedDate: string;
  expectedDate: string;
  status: 'Assigned' | 'Progressing' | 'Finished Goods' | 'Sold';
  customerId?: string;
}

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
}

const parseSafeDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  if (dateStr.includes('/')) {
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

export default function Invoice({
  autoOpenSaleForm,
  onFormOpened
}: {
  autoOpenSaleForm?: boolean;
  onFormOpened?: () => void;
} = {}) {
  const [activeTab, setActiveTab] = useState<'sale_goods' | 'pending' | 'pending_payments' | 'generated'>('sale_goods');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reportFormat, setReportFormat] = useState<'excel' | 'pdf'>('excel');

  const handleInvoiceExcelExport = () => {
    const headers = [
      "Invoice No",
      "Date",
      "Buyer Name",
      "Buyer Phone",
      "Buyer GSTIN",
      "Payment Term",
      "Total Quantity",
      "Taxable Amount (INR)",
      "CGST (INR)",
      "SGST (INR)",
      "IGST (INR)",
      "Round Off (INR)",
      "Total Amount (INR)",
      "Paid Amount (INR)",
      "Balance Due (INR)",
      "Status",
      "Transport"
    ];

    const rows = generatedInvoices.map(inv => {
      const paid = Number(inv.paidAmount) || 0;
      const total = Number(inv.totalAmount) || 0;
      const balance = Math.max(0, total - paid);
      return [
        inv.invoiceNo || "N/A",
        inv.date ? parseSafeDate(inv.date).toLocaleDateString() : "N/A",
        inv.buyer?.name || "N/A",
        inv.buyer?.phone || "N/A",
        inv.buyer?.gstin || "N/A",
        inv.term || "Credit",
        inv.totalQty || 0,
        inv.taxableAmount || 0,
        inv.cgst || 0,
        inv.sgst || 0,
        inv.igst || 0,
        inv.roundOff || 0,
        total,
        paid,
        balance,
        inv.status || "Unpaid",
        inv.transport || "None"
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `INVEN_Invoice_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportModalOpen(false);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [finishedAssignments, setFinishedAssignments] = useState<ProductionAssignment[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [generatedInvoices, setGeneratedInvoices] = useState<GeneratedInvoice[]>([]);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<GeneratedInvoice | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [isInvoiceDetailsDialogOpen, setIsInvoiceDetailsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<GeneratedInvoice | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    notes: '',
    amountToPay: 0,
    isFullPayment: true
  });
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'revoke_invoice' | 'delete_invoice' | 'revoke_sale' | 'no_finished_batches';
    targetId?: string;
    targetData?: any;
  } | null>(null);
  const [invoiceFormData, setInvoiceFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    transport: '',
    lrDate: new Date().toISOString().split('T')[0],
    buyerName: '',
    buyerAddress: '',
    buyerPhone: '',
    buyerGstin: '',
    shipToName: '',
    shipToAddress: '',
    discount: 0
  });
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [activeBatch, setActiveBatch] = useState<ProductionAssignment | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [selectedTransport, setSelectedTransport] = useState<string>('');
  const [saleFormData, setSaleFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    quantity: 0,
    discountCost: 0,
    discountPercentage: 0,
    totalCost: 0
  });

  useEffect(() => {
    if (autoOpenSaleForm) {
      setActiveTab('sale_goods');
      // Load current finished assignments from localStorage
      const saved = localStorage.getItem('inven_production');
      let finished: ProductionAssignment[] = [];
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          finished = parsed.filter((a: any) => a.status === 'Finished Goods');
        } catch (e) {
          console.error(e);
        }
      }

      if (finished.length > 0) {
        openSaleDialog(finished[0]);
      } else {
        setConfirmationModal({
          isOpen: true,
          title: 'No Finished Batches',
          message: "There are no active finished goods batches ready to record a sale. Let's assign and complete manufacturing assignments first!",
          type: 'no_finished_batches'
        });
      }
      onFormOpened?.();
    }
  }, [autoOpenSaleForm, onFormOpened]);

  useEffect(() => {
    // Load Assignments
    const saved = localStorage.getItem('inven_production');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        setFinishedAssignments(parsed.filter((a: any) => a.status === 'Finished Goods'));
      } catch (e) { console.error(e); }
    }

    // Load Customers
    const savedCustomers = localStorage.getItem('inven_customers');
    if (savedCustomers) {
      try { setCustomers(JSON.parse(savedCustomers)); } catch (e) { console.error(e); }
    }

    // Load Transports
    const savedTransports = localStorage.getItem('inven_transports');
    if (savedTransports) {
      try { 
        const parsed = JSON.parse(savedTransports);
        const validTransports = Array.isArray(parsed) ? parsed.filter(t => t && t.id) : [];
        setTransports(validTransports); 
        if (validTransports.length > 0 && !selectedTransport) {
          setSelectedTransport(validTransports[0]?.name || '');
        }
      } catch (e) { console.error(e); }
    }

    // Load Sales
    const savedSales = localStorage.getItem('inven_sales');
    if (savedSales) {
      try { setSales(JSON.parse(savedSales)); } catch (e) { console.error(e); }
    }

    // Load Generated Invoices
    const savedInvoices = localStorage.getItem('inven_generated_invoices');
    if (savedInvoices) {
      try { setGeneratedInvoices(JSON.parse(savedInvoices)); } catch (e) { console.error(e); }
    }
  }, [activeTab]);

  const toggleSaleSelection = (id: string) => {
    setSelectedSales(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

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
    return `${words} Rupees Only`;
  };

  const updatePreviewDiscount = (newDiscount: number) => {
    if (!previewInvoice) return;
    
    const itemsTotal = previewInvoice.items.reduce((sum, s) => sum + s.totalCost, 0);
    const newTaxableAmount = Math.max(0, itemsTotal - newDiscount);
    const newCgst = newTaxableAmount * 0.025;
    const newSgst = newTaxableAmount * 0.025;
    const newTotalAmount = Math.round(newTaxableAmount + newCgst + newSgst);
    
    setPreviewInvoice({
      ...previewInvoice,
      discount: newDiscount,
      taxableAmount: newTaxableAmount,
      cgst: newCgst,
      sgst: newSgst,
      totalAmount: newTotalAmount,
      amountInWords: numberToWords(newTotalAmount)
    });
  };

  const openInvoiceDialog = () => {
    if (selectedSales.length === 0) return;
    setEditingInvoiceId(null);
    const selectedSalesData = sales.filter(s => selectedSales.includes(s.id));
    const firstSale = selectedSalesData[0];
    const firstCustomer = firstSale ? customers.find(c => c && c.id === firstSale.customerId) : null;
    
    if (firstCustomer) {
      setInvoiceFormData({
        date: new Date().toISOString().split('T')[0],
        transport: selectedTransport || (transports.length > 0 && transports[0] ? transports[0].name : 'JayanthiTransport'),
        lrDate: new Date().toISOString().split('T')[0],
        buyerName: firstCustomer.name || '',
        buyerAddress: firstCustomer.address || 'Chennai, Tamil Nadu',
        buyerPhone: firstCustomer.mobileNumber || firstCustomer.phone || '9585596359',
        buyerGstin: firstCustomer.gstNumber || firstCustomer.gstin || '33BZHPM8630D1ZH',
        shipToName: firstCustomer.name || '',
        shipToAddress: firstCustomer.address || 'Chennai, Tamil Nadu',
        discount: 0
      });
    } else {
      setInvoiceFormData({
        date: new Date().toISOString().split('T')[0],
        transport: selectedTransport || (transports.length > 0 && transports[0] ? transports[0].name : 'JayanthiTransport'),
        lrDate: new Date().toISOString().split('T')[0],
        buyerName: '',
        buyerAddress: '',
        buyerPhone: '',
        buyerGstin: '',
        shipToName: '',
        shipToAddress: '',
        discount: 0
      });
    }
    setIsInvoiceDetailsDialogOpen(true);
  };

  const openEditInvoiceDialog = (invoice: GeneratedInvoice) => {
    setEditingInvoiceId(invoice.id);
    
    // Parse date from DD/MM/YYYY to YYYY-MM-DD
    const dateParts = invoice.date.split('/');
    const formattedDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : new Date().toISOString().split('T')[0];

    setInvoiceFormData({
      date: formattedDate,
      transport: invoice.transport || '',
      lrDate: invoice.lrDate || new Date().toISOString().split('T')[0],
      buyerName: invoice.buyer?.name || '',
      buyerAddress: invoice.buyer?.address || '',
      buyerPhone: invoice.buyer?.phone || '',
      buyerGstin: invoice.buyer?.gstin || '',
      shipToName: invoice.shipToName || invoice.buyer?.name || '',
      shipToAddress: invoice.shipToAddress || invoice.buyer?.address || '',
      discount: invoice.discount
    });
    setSelectedSales(invoice.items.map(s => s.id));
    // When editing, we need the items to be in the "sales" list temporarily if they aren't there
    // Actually, it's easier to just temporarily add them if we are editing.
    // But sales is already loaded from localStorage.
    setIsInvoiceDetailsDialogOpen(true);
  };

  const generateInvoice = () => {
    // If editing, the items might not be in the 'sales' state because they were moved to 'generatedInvoices'
    // We need to look in both places.
    const allPossibleSales = [...sales, ...(editingInvoiceId ? (generatedInvoices.find(inv => inv.id === editingInvoiceId)?.items || []) : [])];
    const selectedSalesData = allPossibleSales.filter(s => selectedSales.includes(s.id));
    
    // Load Settings for Invoice Number
    const settings = JSON.parse(localStorage.getItem('inven_settings') || '{}');
    const prefix = settings.invoicePrefix || 'GT';
    const year = settings.invoiceYear || '25-26';
    const nextId = settings.nextInvoiceId || 1;

    const itemsTotal = selectedSalesData.reduce((sum, s) => sum + s.totalCost, 0);
    const taxableAmount = Math.max(0, itemsTotal - invoiceFormData.discount);
    const cgst = taxableAmount * 0.025;
    const sgst = taxableAmount * 0.025;
    const totalAmount = Math.round(taxableAmount + cgst + sgst);
    const totalQty = selectedSalesData.reduce((sum, s) => sum + s.quantity, 0);

    const existingInv = editingInvoiceId ? generatedInvoices.find(inv => inv.id === editingInvoiceId) : null;

    const newInvoice: GeneratedInvoice = {
      id: editingInvoiceId || `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      invoiceNo: existingInv ? existingInv.invoiceNo : `${prefix}/${year}/${nextId.toString().padStart(2, '0')}`,
      date: new Date(invoiceFormData.date).toLocaleDateString('en-GB'),
      term: 'Credit',
      buyer: {
        name: invoiceFormData.buyerName,
        address: invoiceFormData.buyerAddress,
        phone: invoiceFormData.buyerPhone,
        gstin: invoiceFormData.buyerGstin
      },
      items: selectedSalesData,
      totalQty,
      discount: invoiceFormData.discount,
      taxableAmount,
      cgst,
      sgst,
      igst: 0,
      roundOff: 0,
      totalAmount,
      amountInWords: numberToWords(totalAmount),
      transport: invoiceFormData.transport,
      shipToName: invoiceFormData.shipToName,
      shipToAddress: invoiceFormData.shipToAddress,
      lrDate: invoiceFormData.lrDate,
      status: existingInv ? (existingInv.status || 'Unpaid') : 'Unpaid',
      paidAmount: existingInv ? (existingInv.paidAmount || 0) : 0
    };

    setPreviewInvoice(newInvoice);
    setIsInvoiceDetailsDialogOpen(false);
  };

  const finalizeInvoice = () => {
    if (!previewInvoice) return;

    // 1. Update Invoices
    const savedInvoicesRaw = localStorage.getItem('inven_generated_invoices') || '[]';
    const currentInvoices = JSON.parse(savedInvoicesRaw);
    
    let updatedInvoices;
    if (editingInvoiceId) {
      updatedInvoices = currentInvoices.map((inv: any) => inv.id === editingInvoiceId ? previewInvoice : inv);
    } else {
      updatedInvoices = [...currentInvoices, previewInvoice];
      
      // Increment nextInvoiceId in settings ONLY if it's a new invoice
      const settings = JSON.parse(localStorage.getItem('inven_settings') || '{}');
      settings.nextInvoiceId = (settings.nextInvoiceId || 1) + 1;
      localStorage.setItem('inven_settings', JSON.stringify(settings));
    }

    setGeneratedInvoices(updatedInvoices);
    localStorage.setItem('inven_generated_invoices', JSON.stringify(updatedInvoices));

    // 2. Update Sales (Remove items that were invoiced)
    const savedSalesRaw = localStorage.getItem('inven_sales') || '[]';
    const currentSales: SaleRecord[] = JSON.parse(savedSalesRaw);
    const remainingSales = currentSales.filter(s => !selectedSales.includes(s.id));
    setSales(remainingSales);
    localStorage.setItem('inven_sales', JSON.stringify(remainingSales));

    setSelectedSales([]);
    setPreviewInvoice(null);
    setEditingInvoiceId(null);
    setActiveTab('generated');
  };

  const revokeInvoice = (invoice: GeneratedInvoice) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Revoke Invoice',
      message: `Are you sure you want to revoke invoice ${invoice.invoiceNo || invoice.id}? Items will return to Pending Invoices list.`,
      type: 'revoke_invoice',
      targetData: invoice
    });
  };

  const deleteGeneratedInvoice = (id: string) => {
    const inv = generatedInvoices.find(i => i.id === id);
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Invoice',
      message: `Are you sure you want to delete invoice ${inv?.invoiceNo || id}? This will not restore the pending sales.`,
      type: 'delete_invoice',
      targetId: id
    });
  };

  const revokeSale = (sale: SaleRecord) => {
    if (!sale) return;
    setConfirmationModal({
      isOpen: true,
      title: 'Revoke Sale Record',
      message: `Revoke sale ${sale.id}? Units will return to ${sale.modelName} stock.`,
      type: 'revoke_sale',
      targetData: sale
    });
  };

  const handleConfirmAction = () => {
    if (!confirmationModal) return;
    
    if (confirmationModal.type === 'revoke_invoice') {
      const invoice = confirmationModal.targetData as GeneratedInvoice;
      if (invoice) {
        // 1. Update Invoices
        const savedInvoicesRaw = localStorage.getItem('inven_generated_invoices') || '[]';
        const currentInvoices: GeneratedInvoice[] = JSON.parse(savedInvoicesRaw);
        const updatedInvoices = currentInvoices.filter(inv => inv.id !== invoice.id);
        setGeneratedInvoices(updatedInvoices);
        localStorage.setItem('inven_generated_invoices', JSON.stringify(updatedInvoices));

        // 2. Update Sales
        const savedSalesRaw = localStorage.getItem('inven_sales') || '[]';
        const currentSales: SaleRecord[] = JSON.parse(savedSalesRaw);
        const updatedSales = [...currentSales, ...invoice.items];
        setSales(updatedSales);
        localStorage.setItem('inven_sales', JSON.stringify(updatedSales));
        
        // 3. Clear selections
        setSelectedSales(prev => prev.filter(id => !invoice.items.some(item => item.id === id)));
      }
    } else if (confirmationModal.type === 'delete_invoice') {
      const id = confirmationModal.targetId;
      if (id) {
        const updatedInvoices = generatedInvoices.filter(inv => inv.id !== id);
        setGeneratedInvoices(updatedInvoices);
        localStorage.setItem('inven_generated_invoices', JSON.stringify(updatedInvoices));
      }
    } else if (confirmationModal.type === 'revoke_sale') {
      const sale = confirmationModal.targetData as SaleRecord;
      if (sale) {
        // 1. Update Sales List using latest storage
        const savedSalesRaw = localStorage.getItem('inven_sales') || '[]';
        const currentSales: SaleRecord[] = JSON.parse(savedSalesRaw);
        const updatedSales = currentSales.filter(s => s.id !== sale.id);
        
        setSales(updatedSales);
        localStorage.setItem('inven_sales', JSON.stringify(updatedSales));
        
        // 2. Clear from selection
        setSelectedSales(prev => prev.filter(id => id !== sale.id));

        // 3. Add quantity back to production batch
        const savedProduction = localStorage.getItem('inven_production') || '[]';
        const allAssignments: ProductionAssignment[] = JSON.parse(savedProduction);
        
        let batchFound = false;
        const updatedAssignments = allAssignments.map((a: ProductionAssignment) => {
          if (a.id === sale.batchId) {
            batchFound = true;
            const currentQty = Number(a.quantity) || 0;
            const saleQty = Number(sale.quantity) || 0;
            return { 
              ...a, 
              quantity: currentQty + saleQty,
              status: 'Finished Goods' as const
            };
          }
          return a;
        });

        if (batchFound) {
          localStorage.setItem('inven_production', JSON.stringify(updatedAssignments));
          setFinishedAssignments(updatedAssignments.filter((a: ProductionAssignment) => a.status === 'Finished Goods'));
        } else {
          // If batch was somehow deleted, we still removed the sale record above, 
          // but units can't return to a non-existent batch.
          console.warn('Production batch not found for revocation:', sale.batchId);
        }
      }
    }

    setConfirmationModal(null);
  };

  const openPaymentDialog = (inv: GeneratedInvoice) => {
    const previousPaid = Number(inv.paidAmount) || 0;
    const remainingPending = Math.max(0, (inv.totalAmount || 0) - previousPaid);
    setPaymentInvoice(inv);
    setPaymentDetails({
      date: new Date().toISOString().split('T')[0],
      paymentMode: inv.term === 'Cash' ? 'Cash' : 'Bank Transfer',
      notes: `Payment for Invoice ${inv.invoiceNo || inv.id}`,
      amountToPay: remainingPending,
      isFullPayment: true
    });
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    const previousPaid = Number(paymentInvoice.paidAmount) || 0;
    const amountToPay = Number(paymentDetails.amountToPay) || 0;
    const newTotalPaid = Math.min(Number(paymentInvoice.totalAmount) || 0, previousPaid + amountToPay);
    const isFullyPaid = newTotalPaid >= (Number(paymentInvoice.totalAmount) || 0);
    const newStatus = isFullyPaid ? 'Paid' as const : 'Partially Paid' as const;

    // Update payment status on the invoice
    const updatedInvoices = generatedInvoices.map(inv => {
      if (inv.id === paymentInvoice.id) {
        return { 
          ...inv, 
          status: newStatus,
          paidAmount: newTotalPaid
        };
      }
      return inv;
    });
    setGeneratedInvoices(updatedInvoices);
    localStorage.setItem('inven_generated_invoices', JSON.stringify(updatedInvoices));

    // Record an income entry under 'Product Sales' category
    const savedIncomesRaw = localStorage.getItem('inven_income_records') || '[]';
    let currentIncomes: any[] = [];
    try {
      currentIncomes = JSON.parse(savedIncomesRaw);
    } catch (err) {
      console.error(err);
    }

    const savedCategoriesRaw = localStorage.getItem('inven_income_master') || '[]';
    let categoriesList: any[] = [];
    try {
      categoriesList = JSON.parse(savedCategoriesRaw);
    } catch (err) {
      console.error(err);
    }

    let targetCategory = categoriesList.find(c => c && c.name === 'Product Sales');
    if (!targetCategory) {
      targetCategory = {
        id: 'INC-CAT-001',
        name: 'Product Sales',
        createdAt: new Date().toISOString()
      };
      categoriesList.push(targetCategory);
      localStorage.setItem('inven_income_master', JSON.stringify(categoriesList));
    }

    const firstItem = paymentInvoice.items && paymentInvoice.items[0];
    const customerId = firstItem?.customerId || '';

    const newIncomeRecord = {
      id: `INC-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      categoryId: targetCategory.id,
      categoryName: targetCategory.name,
      amount: amountToPay,
      date: paymentDetails.date,
      paymentMode: paymentDetails.paymentMode,
      notes: paymentDetails.notes || `Payment for Invoice ${paymentInvoice.invoiceNo || paymentInvoice.id}`,
      createdAt: new Date().toISOString(),
      customerId: customerId,
      customerName: paymentInvoice.buyer.name || 'Unknown Buyer'
    };

    const updatedIncomes = [newIncomeRecord, ...currentIncomes];
    localStorage.setItem('inven_income_records', JSON.stringify(updatedIncomes));

    setIsPaymentDialogOpen(false);
    setPaymentInvoice(null);
  };

  const handleUnmarkPaid = () => {
    if (!paymentInvoice) return;

    // Unmark as Paid (set status back to Unpaid and reset paidAmount)
    const updatedInvoices = generatedInvoices.map(inv => {
      if (inv.id === paymentInvoice.id) {
        return { ...inv, status: 'Unpaid' as const, paidAmount: 0 };
      }
      return inv;
    });
    setGeneratedInvoices(updatedInvoices);
    localStorage.setItem('inven_generated_invoices', JSON.stringify(updatedInvoices));

    setIsPaymentDialogOpen(false);
    setPaymentInvoice(null);
  };

  const handleSaleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBatch || !saleFormData.customerId) return;

    const newSale = {
      ...saleFormData,
      id: `SALE-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      batchId: activeBatch.id,
      modelName: activeBatch.modelName,
      unitPrice: activeBatch.rate,
      createdAt: new Date().toISOString()
    };

    // Save sale record
    const savedSalesRaw = localStorage.getItem('inven_sales') || '[]';
    const currentSales = JSON.parse(savedSalesRaw);
    const updatedSalesList = [...currentSales, newSale];
    localStorage.setItem('inven_sales', JSON.stringify(updatedSalesList));
    setSales(updatedSalesList); // Update state!

    // Update assignment quantity or status
    const allAssignmentsRaw = localStorage.getItem('inven_production') || '[]';
    const allAssignments = JSON.parse(allAssignmentsRaw);
    const updatedAssignments = allAssignments.map((a: any) => {
      if (a.id === activeBatch.id) {
        const remaining = a.quantity - saleFormData.quantity;
        return { 
          ...a, 
          quantity: remaining,
          status: remaining <= 0 ? 'Sold' : 'Finished Goods'
        };
      }
      return a;
    });
    localStorage.setItem('inven_production', JSON.stringify(updatedAssignments));

    // Refresh UI
    setFinishedAssignments(updatedAssignments.filter((a: any) => a.status === 'Finished Goods'));
    setIsSaleDialogOpen(false);
    setActiveBatch(null);
  };

  useEffect(() => {
    if (activeBatch) {
      const subtotal = saleFormData.quantity * activeBatch.rate;
      const discount = saleFormData.discountPercentage > 0 
        ? (subtotal * saleFormData.discountPercentage) / 100 
        : saleFormData.discountCost;
      setSaleFormData(prev => ({ ...prev, totalCost: subtotal - discount }));
    }
  }, [saleFormData.quantity, saleFormData.discountPercentage, saleFormData.discountCost, activeBatch]);

  const openSaleDialog = (batch: ProductionAssignment) => {
    setActiveBatch(batch);
    setSaleFormData({
      customerId: '',
      date: new Date().toISOString().split('T')[0],
      quantity: batch.quantity,
      discountCost: 0,
      discountPercentage: 0,
      totalCost: batch.quantity * batch.rate
    });
    setIsSaleDialogOpen(true);
  };

  const groupedByModel = (finishedAssignments || []).reduce((acc: Record<string, ProductionAssignment[]>, curr) => {
    if (!curr.modelName) return acc;
    if (!acc[curr.modelName]) acc[curr.modelName] = [];
    acc[curr.modelName].push(curr);
    return acc;
  }, {});

  const modelNames = Object.keys(groupedByModel).filter(name => 
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedModelData = selectedModel ? (groupedByModel[selectedModel] || []) : [];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sale_goods':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modelNames.map((name) => {
              const items = groupedByModel[name];
              const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
              const latestDate = new Date(Math.max(...items.map(i => new Date(i.assignedAt).getTime())));

              return (
                <div 
                  key={name}
                  onClick={() => setSelectedModel(name)}
                  className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[100px] -mr-16 -mt-16 transition-all group-hover:bg-indigo-100/50 group-hover:scale-110"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                        <Package className="w-7 h-7" />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Batches</p>
                        <p className="text-lg font-black text-slate-800">{items.length}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-xl font-black text-slate-800 leading-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{name}</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Finished Goods Modal</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stock</p>
                        <p className="text-sm font-black text-slate-700">{totalQty} pcs</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Update</p>
                        <p className="text-sm font-black text-slate-700">{latestDate.toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-2xl text-indigo-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      View Details
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}

            {modelNames.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No finished goods found.</p>
                <p className="text-xs text-slate-300 mt-1">Items move here when marked as 'Finished Goods' in Godown Transfer.</p>
              </div>
            )}
          </div>
        );
      case 'pending':
        const filteredSales = sales.filter(s => 
          s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (customers.find(c => c && c.id === s.customerId)?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
          <div className="space-y-4 relative pb-24">
            {filteredSales.map((sale, idx) => (
              <div 
                key={sale.id} 
                onClick={() => toggleSaleSelection(sale.id)}
                className={cn(
                  "bg-white p-6 rounded-[32px] border transition-all flex flex-wrap items-center justify-between gap-6 cursor-pointer group shadow-sm",
                  selectedSales.includes(sale.id) ? "border-indigo-600 ring-2 ring-indigo-500/10 shadow-md" : "border-slate-100 hover:border-indigo-200"
                )}
              >
                <div className="flex items-center gap-6">
                  {/* Custom Checkbox */}
                  <div className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    selectedSales.includes(sale.id) ? "bg-indigo-600 border-indigo-600" : "border-slate-200 group-hover:border-indigo-400"
                  )}>
                    {selectedSales.includes(sale.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{sale.id}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sale.batchId}</p>
                      </div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{sale.modelName}</h3>
                      <p className="text-xs font-bold text-slate-500">Sold to: <span className="text-indigo-600">{customers.find(c => c && c.id === sale.customerId)?.name || sale.customerId}</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
                    <p className="text-sm font-black text-slate-800">{sale.quantity} pcs</p>
                    <p className="text-[10px] text-slate-400 font-bold tracking-tight">₹{sale.unitPrice}/pc</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Discount</p>
                    <p className="text-sm font-black text-rose-500">
                      {sale.discountPercentage > 0 ? `${sale.discountPercentage}%` : `₹${(sale.discountCost || 0).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="text-center bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Bill</p>
                    <p className="text-lg font-black text-indigo-600">₹{(sale.totalCost || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        revokeSale(sale);
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors flex flex-col items-center relative z-30 cursor-pointer min-w-[55px]"
                      title="Revoke Sale"
                    >
                       <RotateCcw className="w-4 h-4 pointer-events-none" />
                       <span className="text-[7px] font-black mt-0.5 pointer-events-none tracking-tighter">REVOKE</span>
                    </button>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-slate-400 mb-1">
                        <Calendar className="w-3 h-3" />
                        <span className="text-[8px] font-bold uppercase tracking-wider">Sale Date</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">{new Date(sale.date).toLocaleDateString()}</p>
                      <div className="flex items-center justify-end gap-1.5 text-amber-500 mt-2">
                         <Clock className="w-3 h-3" />
                         <span className="text-[10px] font-black uppercase tracking-tighter">PENDING</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredSales.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium">No pending invoices found.</p>
                <p className="text-xs text-slate-300 mt-1">Record a sale from 'Sale Goods' to see it here.</p>
              </div>
            )}

            {/* Ready to Invoice Floating Button */}
            {selectedSales.length > 0 && (
              <div className="fixed bottom-10 right-10 z-[80] animate-in slide-in-from-right-10 duration-500 flex flex-col items-end gap-4">
                <button 
                  className="bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-300 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3"
                  onClick={openInvoiceDialog}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Ready to Invoice ({selectedSales.length})
                </button>
              </div>
            )}
          </div>
        );
      case 'pending_payments': {
        const pendingInvoices = generatedInvoices.filter(inv => {
          const isPending = (inv.status !== 'Paid');
          const query = searchQuery.toLowerCase();
          const matchesSearch = (inv.invoiceNo || '').toLowerCase().includes(query) ||
                               (inv.buyer?.name || '').toLowerCase().includes(query);
          return isPending && matchesSearch;
        });

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingInvoices.map((inv) => (
              <div 
                key={inv.id}
                onClick={() => setPreviewInvoice(inv)}
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/10 rounded-bl-[100px] -mr-16 -mt-16 transition-all group-hover:bg-amber-100/20 group-hover:scale-110"></div>
                
                <div className="relative z-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                        <Coins className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openPaymentDialog(inv);
                          }}
                          className={cn(
                            "p-2 rounded-xl transition-colors",
                            inv.status === 'Partially Paid' 
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200 animate-pulse" 
                              : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          )}
                          title={inv.status === 'Partially Paid' ? "Collect Outstanding Payment" : "Collect Payment"}
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            revokeInvoice(inv);
                          }}
                          className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors"
                          title="Revoke to Pending"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditInvoiceDialog(inv);
                          }}
                          className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                        <p className="text-lg font-black text-slate-800">₹{(inv.totalAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{inv.invoiceNo}</p>
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider",
                          inv.status === 'Partially Paid' 
                            ? "bg-blue-50 text-blue-700 border-blue-100" 
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                          {inv.status || 'Unpaid'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate">{inv?.buyer?.name || 'Unknown Buyer'}</h3>
                      <div className="flex items-center gap-2 mt-2 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{inv.date}</span>
                      </div>
                    </div>

                    {/* Paid vs Pending stats breakdown */}
                    <div className="mt-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex justify-between items-center text-[11px] font-bold tracking-tight">
                      <div>
                        <span className="text-slate-400 block mb-0.5 uppercase text-[9px] tracking-wider">Paid Amount</span>
                        <span className="text-emerald-700">₹{(inv.paidAmount || 0).toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block mb-0.5 uppercase text-[9px] tracking-wider">Pending Amount</span>
                        <span className="text-rose-600 font-extrabold">
                          ₹{(inv.totalAmount - (inv.paidAmount || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.items.length} Items</p>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}

            {pendingInvoices.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">All payments fully collected!</p>
                <p className="text-xs text-slate-300 mt-1">There are no outstanding invoices with pending balances.</p>
              </div>
            )}
          </div>
        );
      }
      case 'generated': {
        const filteredInvoices = generatedInvoices.filter(inv => {
          const query = searchQuery.toLowerCase();
          return (inv.invoiceNo || '').toLowerCase().includes(query) ||
                 (inv.buyer?.name || '').toLowerCase().includes(query);
        });

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((inv) => (
              <div 
                key={inv.id}
                onClick={() => setPreviewInvoice(inv)}
                className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openPaymentDialog(inv);
                      }}
                      className={cn(
                        "p-2 rounded-xl transition-colors",
                        inv.status === 'Paid' 
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 animate-pulse" 
                          : inv.status === 'Partially Paid'
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200 animate-pulse"
                          : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      )}
                      title={inv.status === 'Paid' ? "Payment Collected" : inv.status === 'Partially Paid' ? "Collect Outstanding Payment" : "Collect Payment"}
                    >
                      <Coins className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        revokeInvoice(inv);
                      }}
                      className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-colors"
                      title="Revoke to Pending"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditInvoiceDialog(inv);
                      }}
                      className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                      title="Edit Invoice"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGeneratedInvoice(inv.id);
                      }}
                      className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                    <p className="text-lg font-black text-slate-800">₹{(inv.totalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{inv.invoiceNo}</p>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider",
                      inv.status === 'Paid' 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : inv.status === 'Partially Paid'
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    )}>
                      {inv.status || 'Unpaid'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight truncate">{inv?.buyer?.name || 'Unknown Buyer'}</h3>
                  <div className="flex items-center gap-2 mt-2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{inv.date}</span>
                  </div>
                </div>

                {/* Paid vs Pending stats breakdown */}
                <div className="mt-4 p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50 flex justify-between items-center text-[11px] font-bold tracking-tight">
                  <div>
                    <span className="text-slate-400 block mb-0.5 uppercase text-[9px] tracking-wider">Paid Amount</span>
                    <span className="text-emerald-700">₹{(inv.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block mb-0.5 uppercase text-[9px] tracking-wider">Pending Amount</span>
                    <span className={cn(
                      (inv.totalAmount - (inv.paidAmount || 0)) > 0 ? "text-rose-600 font-extrabold" : "text-slate-500"
                    )}>
                      ₹{(inv.totalAmount - (inv.paidAmount || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.items.length} Items</p>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </div>
            ))}

            {filteredInvoices.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">No invoices matching search criteria.</p>
              </div>
            )}
          </div>
        );
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Invoice Management</h2>
          <p className="text-sm text-slate-500">Manage sales, pending payments and generated invoices.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-2xl font-semibold hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Export Hub
          </button>
          <button className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('sale_goods')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'sale_goods' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Sale Goods
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'pending' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Pending Invoices
        </button>
        <button 
          onClick={() => setActiveTab('pending_payments')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'pending_payments' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Pending Payments
        </button>
        <button 
          onClick={() => setActiveTab('generated')}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'generated' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Invoice
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4">
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
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {renderTabContent()}

      {/* Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#f8faff] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-[85vh]">
            {/* Left Sidebar: Context */}
            <div className="w-full md:w-80 bg-white p-8 border-r border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Package className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setSelectedModel(null)}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="mb-8">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">MODEL PROFILE</p>
                <h3 className="text-3xl font-black text-slate-800 leading-tight mb-2 uppercase">{selectedModel}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
                  <Layers className="w-4 h-4" />
                  <span>Finished Goods Inventory</span>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100">
                  <p className="text-3xl font-black text-indigo-600">
                    {selectedModelData.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Total Stock Available</p>
                </div>

                <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100">
                  <p className="text-3xl font-black text-emerald-600">
                    {selectedModelData.length}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Completed Batches</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedModel(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 mt-6"
              >
                Close View
              </button>
            </div>

            {/* Right Side: Assignments List */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-black text-slate-800">Available Stock Batches</h4>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                  <History className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">Inventory Log</span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {selectedModelData.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm border-l-4 border-l-indigo-600 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                          <Box className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.id}</p>
                          <h5 className="text-lg font-black text-slate-800">{item.unit}</h5>
                          <p className="text-xs font-bold text-slate-500">
                            {item.fabricType} • SIZE {item.size}
                            {item.customerId && ` • ${customers.find(c => c && c.id === item.customerId)?.name || item.customerId}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Batch Qty</p>
                          <p className="text-lg font-black text-slate-800">{item.quantity} pcs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit Rate</p>
                          <p className="text-lg font-black text-slate-800">₹{item.rate}</p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <button 
                            onClick={() => openSaleDialog(item)}
                            className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 mb-3"
                          >
                            Sale to Customer
                          </button>
                          <div className="flex items-center justify-end gap-1.5 text-slate-400">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[8px] font-bold uppercase tracking-wider">Finished On</span>
                          </div>
                          <p className="text-xs font-bold text-slate-700">{new Date(item.assignedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Sale Dialog */}
      {isSaleDialogOpen && activeBatch && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Record Sale</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Batch: {activeBatch.id} • {activeBatch.modelName}
                </p>
              </div>
              <button 
                onClick={() => setIsSaleDialogOpen(false)}
                className="p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Customer / Shop</label>
                <select 
                  required
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 appearance-none cursor-pointer"
                  value={saleFormData.customerId || ''}
                  onChange={(e) => setSaleFormData({...saleFormData, customerId: e.target.value})}
                >
                  <option value="">Select Customer</option>
                  {customers.filter(c => c && c.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Sale Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700"
                    value={saleFormData.date || ''}
                    onChange={(e) => setSaleFormData({...saleFormData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Quantity (Max {activeBatch.quantity})</label>
                  <input 
                    type="number"
                    max={activeBatch.quantity}
                    min={1}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700"
                    value={saleFormData.quantity || ''}
                    onChange={(e) => setSaleFormData({...saleFormData, quantity: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Discount (%)</label>
                  <input 
                    type="number"
                    step="0.01"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700"
                    placeholder="0"
                    value={saleFormData.discountPercentage || ''}
                    onChange={(e) => setSaleFormData({...saleFormData, discountPercentage: parseFloat(e.target.value) || 0, discountCost: 0})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">OR Flat Discount (₹)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700"
                    placeholder="0"
                    value={saleFormData.discountCost || ''}
                    onChange={(e) => setSaleFormData({...saleFormData, discountCost: parseFloat(e.target.value) || 0, discountPercentage: 0})}
                  />
                </div>
              </div>

              <div className="bg-indigo-600 rounded-[32px] p-8 text-white flex items-center justify-between shadow-xl shadow-indigo-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Total Receivable</p>
                  <h4 className="text-3xl font-black">₹{(saleFormData.totalCost || 0).toLocaleString()}</h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Subtotal</p>
                  <p className="text-sm font-black opacity-90 leading-none">₹{((saleFormData.quantity || 0) * (activeBatch?.rate || 0)).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsSaleDialogOpen(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                  Record Sale & Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details Dialog */}
      {isInvoiceDetailsDialogOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Finalize Invoice Details</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Specify transport and address information</p>
              </div>
              <button onClick={() => setIsInvoiceDetailsDialogOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Invoice Date</label>
                  <input 
                    type="date"
                    value={invoiceFormData.date || ''}
                    onChange={(e) => setInvoiceFormData({...invoiceFormData, date: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">LR Date</label>
                  <input 
                    type="date"
                    value={invoiceFormData.lrDate || ''}
                    onChange={(e) => setInvoiceFormData({...invoiceFormData, lrDate: e.target.value})}
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Discount (₹)</label>
                  <input 
                    type="number"
                    value={invoiceFormData.discount || 0}
                    onChange={(e) => setInvoiceFormData({...invoiceFormData, discount: parseFloat(e.target.value) || 0})}
                    placeholder="Enter discount amount"
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
                  />
                </div>
                <div className="space-y-2 col-span-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Transport Name</label>
                    <select 
                      value={invoiceFormData.transport || ''}
                      onChange={(e) => setInvoiceFormData({...invoiceFormData, transport: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 appearance-none"
                    >
                      {transports.filter(t => t && t.id).map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                      {transports.length === 0 && <option value="JayanthiTransport">JayanthiTransport (Default)</option>}
                    </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center justify-between">
                  Buyer Details (Bill To)
                  <select 
                    className="bg-indigo-50 border-none rounded-lg py-1 px-3 text-[10px] font-bold text-indigo-600 outline-none cursor-pointer"
                    onChange={(e) => {
                      const selected = customers.find(c => c && c.id === e.target.value);
                      if (selected) {
                        setInvoiceFormData(prev => ({
                          ...prev,
                          buyerName: (selected.name || '').toUpperCase(),
                          buyerAddress: (selected.address || '').toUpperCase(),
                          buyerPhone: selected.mobileNumber || selected.phone || '',
                          buyerGstin: (selected.gstNumber || selected.gstin || '').toUpperCase()
                        }));
                      }
                    }}
                  >
                    <option value="">Select from Master</option>
                    {customers.filter(c => c && c.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400">Buyer Name</p>
                      <input 
                        type="text"
                        value={invoiceFormData.buyerName || ''}
                        onChange={(e) => setInvoiceFormData({...invoiceFormData, buyerName: e.target.value.toUpperCase()})}
                        className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 text-sm font-medium outline-none uppercase"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400">GSTIN</p>
                      <input 
                        type="text"
                        value={invoiceFormData.buyerGstin || ''}
                        onChange={(e) => setInvoiceFormData({...invoiceFormData, buyerGstin: e.target.value.toUpperCase()})}
                        className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 text-sm font-medium outline-none uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400">Address</p>
                    <textarea 
                      value={invoiceFormData.buyerAddress || ''}
                      onChange={(e) => setInvoiceFormData({...invoiceFormData, buyerAddress: e.target.value.toUpperCase()})}
                      rows={2}
                      className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 text-sm font-medium outline-none resize-none uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center justify-between">
                  Ship To Details
                  <select 
                    className="bg-indigo-50 border-none rounded-lg py-1 px-3 text-[10px] font-bold text-indigo-600 outline-none cursor-pointer"
                    onChange={(e) => {
                      const selected = customers.find(c => c && c.id === e.target.value);
                      if (selected) {
                        setInvoiceFormData(prev => ({
                          ...prev,
                          shipToName: (selected.name || '').toUpperCase(),
                          shipToAddress: (selected.address || '').toUpperCase()
                        }));
                      }
                    }}
                  >
                    <option value="">Select from Master</option>
                    {customers.filter(c => c && c.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </h4>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400">Recipient Name</p>
                    <input 
                      type="text"
                      value={invoiceFormData.shipToName || ''}
                      onChange={(e) => setInvoiceFormData({...invoiceFormData, shipToName: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 text-sm font-medium outline-none uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400">Shipping Address</p>
                    <textarea 
                      value={invoiceFormData.shipToAddress || ''}
                      onChange={(e) => setInvoiceFormData({...invoiceFormData, shipToAddress: e.target.value.toUpperCase()})}
                      rows={2}
                      className="w-full bg-slate-50 border-none rounded-xl py-2 px-4 text-sm font-medium outline-none resize-none uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 flex gap-4">
              <button 
                onClick={() => setIsInvoiceDetailsDialogOpen(false)}
                className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={generateInvoice}
                className="flex-[2] px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
              >
                Generate Invoice Preview
              </button>
            </div>
          </div>
        </div>
      )}
      {previewInvoice && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-[850px] shadow-2xl rounded-[10px] overflow-hidden my-8 invoice-print-container">
            {/* Action Bar (Not part of print) */}
            <div className="bg-slate-800 p-4 flex items-center justify-between no-print">
              <h4 className="text-white font-bold text-sm">Invoice Preview</h4>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPreviewInvoice(null)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-600"
                >
                  Close
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-500"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download / Print
                </button>
                {!generatedInvoices.find(inv => inv.id === previewInvoice.id) && (
                  <button 
                    onClick={finalizeInvoice}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-500"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Finalize & Save
                  </button>
                )}
              </div>
            </div>

            {/* Actual Invoice Content */}
            <div className="p-10 bg-white min-h-[1100px] text-slate-900 leading-normal border-[1px] border-slate-800 m-4">
              <div className="border-[1.5px] border-slate-800 p-0">
                {/* Header */}
                <div className="text-center border-b-[1.5px] border-slate-800 py-4 relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="w-22 h-22 bg-white flex items-center justify-center border border-slate-50 overflow-hidden">
                      {JSON.parse(localStorage.getItem('inven_settings') || '{}').companyLogo ? (
                        <img 
                          src={JSON.parse(localStorage.getItem('inven_settings') || '{}').companyLogo} 
                          alt="Logo" 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="font-serif italic text-2xl font-bold">V</span>
                      )}
                    </div>
                  </div>
                  <h1 className="text-2xl font-black uppercase tracking-tight">Tax Invoice</h1>
                  <p className="text-[10px] font-medium italic mt-0.5">Subject to Jurisdiction</p>
                  <h2 className="text-xl font-black mt-1 uppercase tracking-wider">
                    {JSON.parse(localStorage.getItem('inven_settings') || '{}').companyName || 'GAYATHRI TEXTILES'}
                  </h2>
                  <div className="text-[11px] font-bold mx-auto max-w-[500px] whitespace-pre-line">
                    {JSON.parse(localStorage.getItem('inven_settings') || '{}').companyAddress || 'No.25B, South Vaniyar Street\nNear TDCC BANK, Thathiengarpet, Trichy, Tamil Nadu - 621214'}
                  </div>
                  <p className="text-[11px] font-black mt-1">GSTIN : 33CKBPP4366D1ZC</p>
                </div>

                {/* Metadata Row */}
                <div className="grid grid-cols-2 border-b-[1.5px] border-slate-800 text-[12px]">
                  <div className="p-3 border-r-[1.5px] border-slate-800 space-y-1">
                    <div className="flex">
                      <span className="w-24 font-bold">Invoice No</span>
                      <span className="font-black">: {previewInvoice.invoiceNo}</span>
                    </div>
                    <div className="flex">
                      <span className="w-24 font-bold">Invoice Date</span>
                      <span className="font-black">: {previewInvoice.date}</span>
                    </div>
                    
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="flex">
                      <span className="w-24 font-bold">Transport</span>
                      <span className="font-black">: {previewInvoice.transport || 'JayanthiTransport'}</span>
                    </div>
                   
                    <div className="flex">
                      <span className="w-24 font-bold">LR Date</span>
                      <span className="font-black">: {new Date(invoiceFormData.lrDate).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Row */}
                <div className="grid grid-cols-2 border-b-[1.5px] border-slate-800 text-[12px]">
                  <div className="p-3 border-r-[1.5px] border-slate-800 bg-slate-50/10">
                    <p className="text-[11px] font-bold underline mb-2">Buyer (Bill To)</p>
                    <p className="font-black text-sm">{previewInvoice?.buyer?.name || 'Unknown Buyer'}</p>
                    <p className="text-[11px] font-medium leading-relaxed max-w-[250px]">{previewInvoice?.buyer?.address || ''}</p>
                    <p className="text-[11px] font-bold mt-2">Ph : {previewInvoice?.buyer?.phone || ''} </p>
                    <p className="text-[11px] font-bold mt-2"> GSTIN : {previewInvoice?.buyer?.gstin || ''}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-[11px] font-bold underline mb-2">Ship To</p>
                    <p className="font-black text-sm">{invoiceFormData.shipToName || previewInvoice?.buyer?.name || ''}</p>
                    <p className="text-[11px] font-medium leading-relaxed max-w-[250px]">{invoiceFormData.shipToAddress || previewInvoice?.buyer?.address || ''}</p>
                  </div>
                </div>

                {/* Table */}
                <div className="flex-1 flex flex-col min-h-[550px] border-b-[1.5px] border-slate-800">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-slate-700 text-white font-black text-center border-b-[1.5px] border-slate-800">
                        <th className="p-2 border-r-[1.5px] border-slate-800 w-12 text-center">S.No</th>
                        <th className="p-2 border-r-[1.5px] border-slate-800">Particulars</th>
                        <th className="p-2 border-r-[1.5px] border-slate-800 w-24 text-center">HSN Code</th>
                        <th className="p-2 border-r-[1.5px] border-slate-800 w-24 text-center">No. of Qty</th>
                        <th className="p-2 border-r-[1.5px] border-slate-800 w-24 text-center">Rate</th>
                        <th className="p-2 w-32 text-center">Taxable Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewInvoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b-[0.5px] border-slate-100">
                          <td className="p-2 border-r-[1.5px] border-slate-800 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border-r-[1.5px] border-slate-800 font-black uppercase text-[11px] leading-tight">{item.modelName}</td>
                          <td className="p-2 border-r-[1.5px] border-slate-800"></td>
                          <td className="p-2 border-r-[1.5px] border-slate-800 text-right font-black pr-4">{item.quantity} Pc</td>
                          <td className="p-2 border-r-[1.5px] border-slate-800 text-right font-black pr-4">{item.unitPrice.toFixed(2)}</td>
                          <td className="p-2 text-right font-black pr-4">{item.totalCost.toFixed(2)}</td>
                        </tr>
                      ))}
                      {/* Fill empty space with multiple rows to ensure lines reach bottom */}
                      {Array.from({ length: Math.max(1, 15 - previewInvoice.items.length) }).map((_, i) => (
                        <tr key={`filler-${i}`} className={i === Math.max(1, 15 - previewInvoice.items.length) - 1 ? "" : "border-none"}>
                          <td className="p-2 border-r-[1.5px] border-slate-800 h-8"></td>
                          <td className="p-2 border-r-[1.5px] border-slate-800 h-8"></td>
                          <td className="p-2 border-r-[1.5px] border-slate-800 h-8"></td>
                          <td className="p-2 border-r-[1.5px] border-slate-800 h-8"></td>
                          <td className="p-2 border-r-[1.5px] border-slate-800 h-8"></td>
                          <td className="p-2 h-8"></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-700 text-white font-black text-center border-t-[1.5px] border-slate-800 uppercase">
                        <td colSpan={3} className="p-2 border-r-[1.5px] border-slate-800 text-right pr-4 font-black">TOTAL :</td>
                        <td className="p-2 border-r-[1.5px] border-slate-800 text-center">{previewInvoice.totalQty}</td>
                        <td className="p-2 border-r-[1.5px] border-slate-800"></td>
                        <td className="p-2 text-right pr-4">{( (previewInvoice.taxableAmount || 0) + (previewInvoice.discount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Final Section */}
                <div className="grid grid-cols-2">
                  {/* Left Bottom */}
                  <div className="border-r-[1.5px] border-slate-800 flex flex-col">
                    <div className="p-3 border-b-[1.5px] border-slate-800 text-[11px]">
                      <p className="font-bold underline mb-1">Bank details</p>
                      <div className="flex">
                        <span className="w-24 font-bold">Bank & Branch</span>
                        <span className="font-black">: KARUR VYSYA BANK, THATHIENGARPET</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 font-bold">A/C No</span>
                        <span className="font-black">: 1192135000002586</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 font-bold">IFSC Code</span>
                        <span className="font-black">: KVBL0001192</span>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex items-end">
                      <p className="text-[11px] font-bold">Total Amount in words : <span className="font-black italic ml-2">{previewInvoice.amountInWords}</span></p>
                    </div>
                  </div>
                  {/* Right Bottom (Calculations) */}
                  <div className="flex flex-col text-[12px] font-bold">
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-center h-6">
                        <span className="w-40 text-right pr-8">Discount :</span>
                        <div className="w-32 text-right">
                          <input 
                            type="number" 
                            step="0.01"
                            value={previewInvoice.discount || 0}
                            onChange={(e) => updatePreviewDiscount(parseFloat(e.target.value) || 0)}
                            className="w-24 text-right font-black bg-slate-50 border border-slate-200 rounded px-1 outline-none focus:ring-1 focus:ring-indigo-500/30 text-[12px]"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="w-40 text-right pr-8">Taxable Amount :</span>
                        <span className="w-32 text-right font-black">{(previewInvoice.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between opacity-60">
                        <span className="w-40 text-right pr-8">CGST Value @ 2.5% :</span>
                        <span className="w-32 text-right font-black">{(previewInvoice.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between opacity-60">
                        <span className="w-40 text-right pr-8">SGST Value @ 2.5% :</span>
                        <span className="w-32 text-right font-black">{(previewInvoice.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between opacity-60">
                        <span className="w-40 text-right pr-8">IGST Value @ 5% :</span>
                        <span className="w-32 text-right font-black">0.00</span>
                      </div>
                      <div className="flex justify-between opacity-60">
                        <span className="w-40 text-right pr-8">Round Off :</span>
                        <span className="w-32 text-right font-black">0.00</span>
                      </div>
                    </div>
                    <div className="border-t-[1.5px] border-slate-800 p-3 flex justify-between bg-slate-50/30">
                      <span className="w-40 text-right pr-8 text-sm font-black uppercase">Invoice Total :</span>
                      <span className="w-32 text-right text-sm font-black">{(previewInvoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Signature */}
                <div className="grid grid-cols-2 border-t-[1.5px] border-slate-800 min-h-[100px]">
                  <div className="border-r-[1.5px] border-slate-800"></div>
                  <div className="text-center flex flex-col justify-between py-2">
                    <p className="text-[12px] font-black uppercase tracking-widest">
                      For {JSON.parse(localStorage.getItem('inven_settings') || '{}').companyName || 'GAYATHRI TEXTILES'}
                    </p>
                    <p className="text-[10px] font-bold">Authorised Signature</p>
                  </div>
                </div>
              </div>

              {/* Declaration */}
              <div className="mt-4 border-[1px] border-slate-800 text-[10px] p-1 flex items-center justify-between">
                <p><span className="font-black">Declaration:</span> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                <p>Page No : 1 of 1</p>
              </div>

              <div className="mt-4 text-center text-[10px] font-bold text-slate-500">
                {JSON.parse(localStorage.getItem('inven_settings') || '{}').companyName || 'GAYATHRI TEXTILES'}, {JSON.parse(localStorage.getItem('inven_settings') || '{}').companyAddress?.split('\n')[0] || 'No.25B, South Vaniyar Street, Near TDCC BANK, Thathiengarpet, Trichy - 621214'}
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmationModal?.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center">
            {confirmationModal.type === 'no_finished_batches' ? (
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                <FileText className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-6">
                <Trash2 className="w-8 h-8" />
              </div>
            )}
            <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmationModal.title}</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
              {confirmationModal.message}
            </p>
            <div className="flex gap-3">
              {confirmationModal.type !== 'no_finished_batches' && (
                <button 
                  onClick={() => setConfirmationModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleConfirmAction}
                className={cn(
                  "flex-1 py-3 px-4 rounded-xl font-bold transition-all shadow-lg cursor-pointer",
                  confirmationModal.type === 'no_finished_batches'
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
                    : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-100"
                )}
              >
                {confirmationModal.type === 'no_finished_batches' ? 'Okay' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPaymentDialogOpen && paymentInvoice && (
        <div className="fixed inset-0 z-[185] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar animate-in zoom-in-95 duration-200 p-8 flex flex-col relative">
            <button 
              onClick={() => {
                setIsPaymentDialogOpen(false);
                setPaymentInvoice(null);
              }}
              className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <Coins className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-slate-800">Invoice Payment</h3>
                <p className="text-xs text-slate-500 font-semibold">Record payment for invoice</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 mb-6 border border-slate-100/50 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Invoice No</span>
                <span className="font-black text-indigo-600 uppercase">{paymentInvoice.invoiceNo}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Customer</span>
                <span className="font-black text-slate-700 truncate max-w-[200px]">{paymentInvoice.buyer?.name || 'Unknown Buyer'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Paid So Far</span>
                <span className="font-black text-emerald-600">₹{(paymentInvoice.paidAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-200/50">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Gross total</span>
                <span className="text-xs font-black text-slate-500">₹{(paymentInvoice.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Outstanding balance</span>
                <span className="text-lg font-black text-slate-800">
                  ₹{Math.max(0, (paymentInvoice.totalAmount || 0) - (paymentInvoice.paidAmount || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            {paymentInvoice.status === 'Paid' ? (
              <div className="space-y-6">
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                  <p className="text-emerald-700 font-bold text-sm">✓ This invoice is already fully marked as Paid.</p>
                  <p className="text-[10px] text-emerald-500 font-semibold mt-1 uppercase tracking-wider">Indexed to product sales incomes</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsPaymentDialogOpen(false);
                      setPaymentInvoice(null);
                    }}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
                  >
                    Close
                  </button>
                  <button 
                    type="button"
                    onClick={handleUnmarkPaid}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors text-sm"
                  >
                    Unmark as Paid
                  </button>
                </div>
              </div>
            ) : (() => {
              const previousPaid = Number(paymentInvoice.paidAmount) || 0;
              const remainingPending = Math.max(0, (paymentInvoice.totalAmount || 0) - previousPaid);
              return (
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Date</label>
                    <input 
                      required
                      type="date" 
                      value={paymentDetails.date}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, date: e.target.value })}
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentDetails({ 
                          ...paymentDetails, 
                          isFullPayment: true, 
                          amountToPay: remainingPending 
                        })}
                        className={cn(
                          "py-3 px-4 rounded-xl font-bold border-2 transition-all text-[11px] uppercase tracking-wider",
                          paymentDetails.isFullPayment 
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm shadow-indigo-50/50" 
                            : "bg-[#f8faff] border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        Full (₹{remainingPending.toLocaleString()})
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentDetails({ 
                          ...paymentDetails, 
                          isFullPayment: false 
                        })}
                        className={cn(
                          "py-3 px-4 rounded-xl font-bold border-2 transition-all text-[11px] uppercase tracking-wider",
                          !paymentDetails.isFullPayment 
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm shadow-indigo-50/50" 
                            : "bg-[#f8faff] border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        )}
                      >
                        Partial Payment
                      </button>
                    </div>
                  </div>

                  {!paymentDetails.isFullPayment && (
                    <div className="space-y-2 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Amount to Pay (₹)</label>
                      <input 
                        required
                        type="number" 
                        min={1}
                        max={remainingPending}
                        value={paymentDetails.amountToPay || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPaymentDetails({ ...paymentDetails, amountToPay: val });
                        }}
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                        placeholder={`Max ₹${remainingPending.toLocaleString()}`}
                      />
                    </div>
                  )}

                  <div className="space-y-2 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Mode</label>
                    <select 
                      required
                      value={paymentDetails.paymentMode}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentMode: e.target.value })}
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm cursor-pointer"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash animate-pulse">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="space-y-2 text-left">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Remarks / Notes</label>
                    <textarea 
                      value={paymentDetails.notes}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, notes: e.target.value })}
                      placeholder="e.g. Received via NEFT / GPay"
                      rows={2}
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-3.5 px-5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm resize-none"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150/50 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-500 uppercase tracking-[0.05em]">Remaining Balance after payment</span>
                    <span className="font-extrabold text-indigo-700">
                      ₹{Math.max(0, remainingPending - (Number(paymentDetails.amountToPay) || 0)).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsPaymentDialogOpen(false);
                        setPaymentInvoice(null);
                      }}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all text-sm"
                    >
                      Save Payment
                    </button>
                  </div>
                </form>
              );
            })() /* End of render content */}
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
                  Generate professional Invoice and Ledger reports. Choose your export format to download or review.
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
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">Compatible with Excel, Sheets, & business ledgers.</p>
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
                    onClick={handleInvoiceExcelExport}
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
                      <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mt-1">Invoice Book Ledger & Accounts Report</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-1">Documented: {new Date().toLocaleString()}</p>
                    </div>
                    <div className="text-right text-[10px] font-medium text-slate-500">
                      <p className="font-extrabold text-slate-800">Ledger No: #LGR-SLS-{Math.floor(Date.now() / 1000)}</p>
                      <p>Agent ID: jyadevi14@gmail.com</p>
                      <p>Scope: Sales & Receivables</p>
                    </div>
                  </div>

                  {/* Summary Metric Boxes */}
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Invoices</p>
                      <p className="text-xl font-black text-slate-800 mt-1">{generatedInvoices.length}</p>
                    </div>
                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Items Sold</p>
                      <p className="text-xl font-black text-slate-800 mt-1">
                        {generatedInvoices.reduce((sum, i) => sum + (i.totalQty || 0), 0).toLocaleString()}
                        <span className="text-xs font-medium text-slate-400 ml-1">pcs</span>
                      </p>
                    </div>
                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Collected Capital</p>
                      <p className="text-xl font-black text-emerald-700 mt-1">
                        ₹{generatedInvoices.reduce((sum, i) => sum + (Number(i.paidAmount) || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Receivables Bal.</p>
                      <p className="text-xl font-black text-rose-600 mt-1">
                        ₹{generatedInvoices.reduce((sum, i) => sum + Math.max(0, (Number(i.totalAmount) || 0) - (Number(i.paidAmount) || 0)), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Invoices List Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-300 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold pb-2">
                          <th className="py-2.5">Invoice No</th>
                          <th className="py-2.5">Date</th>
                          <th className="py-2.5">Buyer</th>
                          <th className="py-2.5 text-right">Items Qty</th>
                          <th className="py-2.5 text-right">Total Amount</th>
                          <th className="py-2.5 text-right">Collected</th>
                          <th className="py-2.5 text-right">Outstanding</th>
                          <th className="py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {generatedInvoices.map((inv) => {
                          const total = Number(inv.totalAmount) || 0;
                          const paid = Number(inv.paidAmount) || 0;
                          const balance = Math.max(0, total - paid);
                          return (
                            <tr key={inv.id} className="text-slate-700 hover:bg-slate-50/50">
                              <td className="py-2.5 font-mono text-[10px] font-bold">{inv.invoiceNo}</td>
                              <td className="py-2.5 text-slate-500">{inv.date ? parseSafeDate(inv.date).toLocaleDateString() : 'N/A'}</td>
                              <td className="py-2.5 font-extrabold text-slate-800">{inv.buyer?.name}</td>
                              <td className="py-2.5 text-right font-bold">{inv.totalQty || 0} pcs</td>
                              <td className="py-2.5 text-right font-extrabold">₹{total.toLocaleString()}</td>
                              <td className="py-2.5 text-right text-emerald-600 font-bold">₹{paid.toLocaleString()}</td>
                              <td className="py-2.5 text-right font-mono text-rose-500 font-bold">
                                {balance > 0 ? `₹${balance.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-2.5 text-right">
                                <span className={cn(
                                  "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                                  inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : inv.status === 'Partially Paid' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                                )}>
                                  {inv.status || 'Unpaid'}
                                </span>
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
    </div>
  );
}
