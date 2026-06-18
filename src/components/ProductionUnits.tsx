import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Factory, 
  Users,
  Trash2, 
  Edit2,
  X,
  ChevronRight,
  Monitor,
  Maximize2,
  Layers,
  Calendar,
  Settings2,
  Box,
  Truck,
  AlertCircle,
  Check,
  CreditCard
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { InventoryItem } from './Inventory';
import { ProductModel, ProductionUnitMaster } from './ProductMaster';

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
  allPiecesDelivered?: boolean;
  allMetersDelivered?: boolean;
  balancePieces?: number;
  balanceMeters?: number;
  finishedPieces?: number;
  finishedMeters?: number;
  customerId?: string;
  paidAmount?: number;
  paymentStatus?: 'Unpaid' | 'Partial' | 'Paid';
  paymentDate?: string;
}

export default function ProductionUnits({ 
  autoOpenForm, 
  onFormOpened 
}: { 
  autoOpenForm?: boolean; 
  onFormOpened?: () => void;
} = {}) {
  const [assignments, setAssignments] = useState<ProductionAssignment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [productMaster, setProductMaster] = useState<ProductModel[]>([]);
  const [unitMaster, setUnitMaster] = useState<ProductionUnitMaster[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Assigned' | 'Progressing' | 'Finished Goods' | 'Balance Pieces'>('All');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);
  
  // Payment states
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentItem, setPaymentItem] = useState<ProductionAssignment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState<any>({
    inventoryItemId: '',
    unit: '',
    size: 'XL',
    items: [{ modelName: '', quantity: 0, rate: 0, size: 'XL' }],
    status: 'Assigned',
    allPiecesDelivered: false,
    allMetersDelivered: false,
    balancePieces: 0,
    balanceMeters: 0,
    finishedPieces: 0,
    finishedMeters: 0,
    paidAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    assignedDate: new Date().toISOString().split('T')[0],
    expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (autoOpenForm) {
      setEditingId(null);
      setFormData({ 
        unit: unitMaster[0]?.name || '', 
        inventoryItemId: '',
        size: 'XL', 
        items: [{ modelName: '', quantity: 0, rate: 0, size: 'XL' }],
        status: 'Assigned',
        allPiecesDelivered: false,
        allMetersDelivered: false,
        balancePieces: 0,
        balanceMeters: 0,
        finishedPieces: 0,
        finishedMeters: 0,
        paidAmount: 0,
        assignedDate: new Date().toISOString().split('T')[0],
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setIsFormOpen(true);
      onFormOpened?.();
    }
  }, [autoOpenForm, unitMaster, onFormOpened]);

  useEffect(() => {
    // Load Assignments
    const saved = localStorage.getItem('inven_production');
    if (saved) {
      try { setAssignments(JSON.parse(saved)); } catch (e) { console.error(e); }
    }

    // Load Customers
    const savedCustomers = localStorage.getItem('inven_customers');
    if (savedCustomers) {
      try { setCustomers(JSON.parse(savedCustomers)); } catch (e) { console.error(e); }
    }

    // Load Inventory for selection
    const savedInventory = localStorage.getItem('inven_inventory');
    if (savedInventory) {
      try { setInventory(JSON.parse(savedInventory)); } catch (e) { console.error(e); }
    }

    // Load Product Master
    const savedMaster = localStorage.getItem('inven_product_master');
    if (savedMaster) {
      try {
        const parsed = JSON.parse(savedMaster);
        const dedupedByUniqueId: any[] = [];
        const seenIds = new Set<string>();
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any) => {
            if (p && p.id && !seenIds.has(p.id)) {
              seenIds.add(p.id);
              dedupedByUniqueId.push(p);
            }
          });
        }
        setProductMaster(dedupedByUniqueId);
      } catch (e) {
        console.error(e);
      }
    }

    // Load Unit Master
    const savedUnits = localStorage.getItem('inven_unit_master');
    if (savedUnits) {
       try { 
         const parsed = JSON.parse(savedUnits);
         setUnitMaster(parsed);
         if (parsed.length > 0) {
           setFormData((prev: any) => {
             if (!prev.unit && parsed[0]) return { ...prev, unit: parsed[0].name };
             return prev;
           });
         }
       } catch (e) { console.error(e); }
    }
  }, []);

  const saveToLocal = (data: ProductionAssignment[]) => {
    setAssignments(data);
    localStorage.setItem('inven_production', JSON.stringify(data));
  };

  const addItemRow = () => {
    setFormData((prev: any) => ({
      ...prev,
      items: [...prev.items, { modelName: '', quantity: 0, rate: 0, size: prev.size || 'XL' }]
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData((prev: any) => {
      if (prev.items.length > 1) {
        const newItems = prev.items.filter((_: any, i: number) => i !== index);
        return { ...prev, items: newItems };
      }
      return prev;
    });
  };

  const updateItemRow = (index: number, updates: Record<string, any>) => {
    setFormData((prev: any) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], ...updates };
      return { ...prev, items: newItems };
    });
  };

  const getMaxAvailableStock = () => {
    const selectedItem = inventory.find(i => i.id === formData.inventoryItemId);
    if (!selectedItem) return 0;

    const currentStock = selectedItem.quantity || 0;
    if (editingId) {
      const originalAssignment = assignments.find(a => a.id === editingId);
      if (originalAssignment && originalAssignment.inventoryItemId === formData.inventoryItemId) {
        return currentStock + (originalAssignment.quantity || 0);
      }
    }

    return currentStock;
  };

  const getMaxAllowedForThisRow = (index: number) => {
    const maxStock = getMaxAvailableStock();
    const otherRowsSum = formData.items.reduce((sum: number, item: any, idx: number) => {
      if (idx !== index) {
        return sum + (item.quantity || 0);
      }
      return sum;
    }, 0);
    return Math.max(0, maxStock - otherRowsSum);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const settingsStr = localStorage.getItem('inven_settings');
    const settings = settingsStr ? JSON.parse(settingsStr) : { prodPrefix: 'PRD', nextProdId: 1 };
    let currentNextId = settings.nextProdId || 1;

    const selectedItem = inventory.find(i => i.id === formData.inventoryItemId);
    const maxStock = getMaxAvailableStock();
    const totalQuantityRequested = formData.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

    // Stock Validation
    if (totalQuantityRequested > maxStock) {
      alert(`Insufficient stock! Requested: ${totalQuantityRequested}${selectedItem?.unit === 'Meters' ? 'm' : 'pcs'}, Available: ${maxStock}${selectedItem?.unit === 'Meters' ? 'm' : 'pcs'}`);
      return;
    }

    const fabricType = selectedItem ? selectedItem.fabricType : (formData.fabricType || 'Unknown');

    if (editingId) {
      // Find original assignment
      const originalAssignment = assignments.find(a => a.id === editingId);
      // For editing, we usually edit only one at a time from the table
      const item = formData.items[0];
      const updated = assignments.map(a => {
        if (a.id === editingId) {
          const totalQty = item.quantity || 0;
          const status = formData.status || 'Assigned';
          const isFGoods = status === 'Finished Goods';
          
          const finishedPieces = isFGoods ? (formData.finishedPieces !== undefined ? formData.finishedPieces : (formData.allPiecesDelivered ? totalQty : Math.max(0, totalQty - (formData.balancePieces || 0)))) : 0;
          const balancePieces = isFGoods ? (formData.balancePieces !== undefined ? formData.balancePieces : (formData.allPiecesDelivered ? 0 : totalQty)) : 0;
          const allDeliveredPieces = isFGoods ? (balancePieces === 0) : false;

          const finishedMeters = isFGoods ? (formData.finishedMeters !== undefined ? formData.finishedMeters : (formData.allMetersDelivered ? totalQty : Math.max(0, totalQty - (formData.balanceMeters || 0)))) : 0;
          const balanceMeters = isFGoods ? (formData.balanceMeters !== undefined ? formData.balanceMeters : (formData.allMetersDelivered ? 0 : totalQty)) : 0;
          const allDeliveredMeters = isFGoods ? (balanceMeters === 0) : false;

          const r = item.rate || 0;
          const totalCost = totalQty * r;
          const paidAmount = formData.paidAmount !== undefined ? parseFloat(formData.paidAmount) || 0 : (a.paidAmount || 0);
          
          let paymentStatus: 'Unpaid' | 'Partial' | 'Paid' = 'Unpaid';
          if (paidAmount >= totalCost && totalCost > 0) {
            paymentStatus = 'Paid';
          } else if (paidAmount > 0) {
            paymentStatus = 'Partial';
          }

          return { 
            ...a, 
            ...formData, 
            modelName: item.modelName, 
            quantity: item.quantity, 
            rate: item.rate,
            size: item.size || formData.size || a.size || 'XL',
            fabricType,
            status,
            allPiecesDelivered: allDeliveredPieces,
            allMetersDelivered: allDeliveredMeters,
            balancePieces: allDeliveredPieces ? 0 : balancePieces,
            balanceMeters: allDeliveredMeters ? 0 : balanceMeters,
            finishedPieces,
            finishedMeters,
            paidAmount,
            paymentStatus,
            paymentDate: paidAmount > 0 ? (formData.paymentDate || a.paymentDate || new Date().toISOString().split('T')[0]) : undefined,
          };
        }
        return a;
      });
      saveToLocal(updated);

      // Deduct or restore stock based on original edit
      if (selectedItem) {
        let finalInventory = inventory;
        if (originalAssignment) {
          if (originalAssignment.inventoryItemId === formData.inventoryItemId) {
            // Item same, just update quantity difference
            const diff = (item.quantity || 0) - (originalAssignment.quantity || 0);
            finalInventory = inventory.map(invItem => 
              invItem.id === selectedItem.id 
                ? { ...invItem, quantity: Math.max(0, invItem.quantity - diff) }
                : invItem
            );
          } else {
            // Inventory item swapped! Restore old one, deduct new one
            finalInventory = inventory.map(invItem => {
              if (invItem.id === originalAssignment.inventoryItemId) {
                return { ...invItem, quantity: invItem.quantity + (originalAssignment.quantity || 0) };
              }
              if (invItem.id === selectedItem.id) {
                return { ...invItem, quantity: Math.max(0, invItem.quantity - (item.quantity || 0)) };
              }
              return invItem;
            });
          }
        } else {
          // Fallback if no originalAssignment
          finalInventory = inventory.map(invItem => 
            invItem.id === selectedItem.id 
              ? { ...invItem, quantity: Math.max(0, invItem.quantity - (item.quantity || 0)) }
              : invItem
          );
        }
        setInventory(finalInventory);
        localStorage.setItem('inven_inventory', JSON.stringify(finalInventory));
      }
    } else {
      const newAssignments: ProductionAssignment[] = formData.items.map((item: any) => {
        const id = `${settings.prodPrefix || 'PRD'}-${currentNextId.toString().padStart(4, '0')}`;
        currentNextId++;
        const totalQty = item.quantity || 0;
        const status = formData.status || 'Assigned';
        const isFGoods = status === 'Finished Goods';
        
        const finishedPieces = isFGoods ? (formData.finishedPieces !== undefined ? formData.finishedPieces : (formData.allPiecesDelivered ? totalQty : Math.max(0, totalQty - (formData.balancePieces || 0)))) : 0;
        const balancePieces = isFGoods ? (formData.balancePieces !== undefined ? formData.balancePieces : (formData.allPiecesDelivered ? 0 : totalQty)) : 0;
        const allDeliveredPieces = isFGoods ? (balancePieces === 0) : false;

        const finishedMeters = isFGoods ? (formData.finishedMeters !== undefined ? formData.finishedMeters : (formData.allMetersDelivered ? totalQty : Math.max(0, totalQty - (formData.balanceMeters || 0)))) : 0;
        const balanceMeters = isFGoods ? (formData.balanceMeters !== undefined ? formData.balanceMeters : (formData.allMetersDelivered ? 0 : totalQty)) : 0;
        const allDeliveredMeters = isFGoods ? (balanceMeters === 0) : false;

        const r = item.rate || 0;
        const totalCost = totalQty * r;
        const paidAmount = formData.paidAmount !== undefined ? parseFloat(formData.paidAmount) || 0 : 0;
        
        let paymentStatus: 'Unpaid' | 'Partial' | 'Paid' = 'Unpaid';
        if (paidAmount >= totalCost && totalCost > 0) {
          paymentStatus = 'Paid';
        } else if (paidAmount > 0) {
          paymentStatus = 'Partial';
        }

        return {
          id,
          inventoryItemId: formData.inventoryItemId,
          customerId: formData.customerId,
          unit: formData.unit,
          size: item.size || formData.size || 'XL',
          modelName: item.modelName,
          quantity: item.quantity,
          rate: item.rate,
          fabricType,
          assignedAt: new Date().toISOString(),
          assignedDate: formData.assignedDate || new Date().toISOString().split('T')[0],
          expectedDate: formData.expectedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status,
          allPiecesDelivered: allDeliveredPieces,
          allMetersDelivered: allDeliveredMeters,
          balancePieces: allDeliveredPieces ? 0 : balancePieces,
          balanceMeters: allDeliveredMeters ? 0 : balanceMeters,
          finishedPieces,
          finishedMeters,
          paidAmount,
          paymentStatus,
          paymentDate: paidAmount > 0 ? (formData.paymentDate || new Date().toISOString().split('T')[0]) : undefined,
        };
      });

      const updated = [...newAssignments, ...assignments];
      saveToLocal(updated);
      
      // Update Next ID in settings
      localStorage.setItem('inven_settings', JSON.stringify({ ...settings, nextProdId: currentNextId }));

      // Update inventory quantity
      if (selectedItem) {
        const updatedInventory = inventory.map(item => 
          item.id === selectedItem.id 
            ? { ...item, quantity: Math.max(0, item.quantity - totalQuantityRequested) }
            : item
        );
        setInventory(updatedInventory);
        localStorage.setItem('inven_inventory', JSON.stringify(updatedInventory));
      }
    }

    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ 
      unit: unitMaster[0]?.name || '', 
      inventoryItemId: '',
      size: 'XL', 
      items: [{ modelName: '', quantity: 0, rate: 0, size: 'XL' }],
      status: 'Assigned',
      allPiecesDelivered: false,
      allMetersDelivered: false,
      balancePieces: 0,
      balanceMeters: 0,
      finishedPieces: 0,
      finishedMeters: 0,
      paidAmount: 0,
      assignedDate: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const deleteItem = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    const targetAssignment = assignments.find(a => a.id === itemToDelete.id);
    saveToLocal(assignments.filter(a => a.id !== itemToDelete.id));

    if (targetAssignment) {
      const updatedInventory = inventory.map(item => 
        item.id === targetAssignment.inventoryItemId 
          ? { ...item, quantity: item.quantity + (targetAssignment.quantity || 0) }
          : item
      );
      setInventory(updatedInventory);
      localStorage.setItem('inven_inventory', JSON.stringify(updatedInventory));
    }

    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleQuickPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentItem) return;

    const totalCost = paymentItem.quantity * paymentItem.rate;
    const currentPaid = paymentItem.paidAmount || 0;
    const addedAmount = paymentAmount;

    const newPaid = Math.min(totalCost, Math.max(0, currentPaid + addedAmount));
    
    let paymentStatus: 'Unpaid' | 'Partial' | 'Paid' = 'Unpaid';
    if (newPaid >= totalCost && totalCost > 0) {
      paymentStatus = 'Paid';
    } else if (newPaid > 0) {
      paymentStatus = 'Partial';
    }

    const updated = assignments.map(a => {
      if (a.id === paymentItem.id) {
        return {
          ...a,
          paidAmount: newPaid,
          paymentStatus,
          paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        };
      }
      return a;
    });

    saveToLocal(updated);
    setIsPaymentOpen(false);
    setPaymentItem(null);
  };

  const filtered = assignments.filter(a => {
    const matchesSearch = a.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.unit.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = false;
    if (statusFilter === 'All') {
      matchesStatus = true;
    } else if (statusFilter === 'Balance Pieces') {
      matchesStatus = a.status === 'Finished Goods' && (
        (a.balancePieces !== undefined && a.balancePieces > 0) ||
        (a.balanceMeters !== undefined && a.balanceMeters > 0)
      );
    } else {
      matchesStatus = a.status === statusFilter;
    }
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Production Assignments</h2>
          <p className="text-sm text-slate-500">Assign warehouse stock to manufacturing units.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ 
              unit: unitMaster[0]?.name || '', 
              inventoryItemId: '',
              size: 'XL', 
              items: [{ modelName: '', quantity: 0, rate: 0, size: 'XL' }],
              status: 'Assigned',
              allPiecesDelivered: false,
              allMetersDelivered: false,
              balancePieces: 0,
              balanceMeters: 0,
              finishedPieces: 0,
              finishedMeters: 0,
              paidAmount: 0,
              assignedDate: new Date().toISOString().split('T')[0],
              expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
            setIsFormOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Assign to Unit
        </button>
      </div>


      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto max-w-full scrollbar-none">
        {(['All', 'Assigned', 'Progressing', 'Finished Goods', 'Balance Pieces'] as const).map((status) => (
          <button 
            key={status}
            onClick={() => { setStatusFilter(status); setSearchQuery(''); }}
            className={cn(
              "px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
              statusFilter === status ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {status}
          </button>
        ))}
      </div>


      {/* Visual notification queue for Urgent Deadlines */}
      {(() => {
        const nowTime = new Date().getTime();
        const urgent = assignments.filter((a) => {
          if (a.status === 'Finished Goods') return false;
          const expectedTime = new Date(a.expectedDate).getTime();
          const diffMs = expectedTime - nowTime;
          const diffHours = diffMs / (1000 * 60 * 60);
          return diffHours <= 24;
        });

        if (urgent.length === 0) return null;

        return (
          <div className="bg-amber-50/50 border border-amber-200/60 p-6 rounded-[28px] space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl animate-bounce">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Active Deadline Notifications ({urgent.length})</h3>
                  <p className="text-xs text-slate-500 font-medium">Production assignments with less than 24 hours remaining or past due.</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgent.map((item) => {
                const isOverdue = new Date(item.expectedDate).getTime() < new Date().getTime();
                return (
                  <div key={item.id} className="bg-white border border-amber-100/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-mono text-indigo-600 font-extrabold uppercase bg-indigo-50/50 px-2 py-0.5 rounded-md">
                          {item.id}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isOverdue ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isOverdue ? 'Overdue!' : 'Due Soon'}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 tracking-tight">{item.modelName}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">
                        Unit: <span className="font-extrabold text-slate-600">{item.unit}</span> · Qty: <span className="font-extrabold text-slate-600">{item.quantity}</span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Expected Target:</span>
                      <span className="font-mono font-extrabold text-slate-700">
                        {new Date(item.expectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by Model or Unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                <th className="px-6 py-4">Assignment ID</th>
                <th className="px-6 py-4">Unit & Model</th>
                <th className="px-6 py-4">Size & Qty</th>
                <th className="px-6 py-4">Rate & Cost</th>
                <th className="px-6 py-4">Payment</th>
                <th className="px-6 py-4">Expected Completion</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-indigo-600">{item.id}</p>
                    <p className="text-[10px] text-slate-400">{new Date(item.assignedAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-800">{item.modelName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                        {item.unit} {item.customerId && ` • ${customers.find(c => c && c.id === item.customerId)?.name || item.customerId}`}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600 tracking-tighter">SIZE {item.size}</span>
                      <p className="text-sm font-bold text-slate-800">
                        {statusFilter === 'Balance Pieces' ? (
                          item.unit === 'Meters' ? (
                            `${item.balanceMeters || 0} m`
                          ) : (
                            `${item.balancePieces || 0} pcs`
                          )
                        ) : item.status === 'Finished Goods' ? (
                          item.unit === 'Meters' ? (
                            `${item.finishedMeters !== undefined ? item.finishedMeters : (item.quantity - (item.balanceMeters || 0))} m`
                          ) : (
                            `${item.finishedPieces !== undefined ? item.finishedPieces : (item.quantity - (item.balancePieces || 0))} pcs`
                          )
                        ) : (
                          `${item.quantity} ${item.unit === 'Meters' ? 'm' : 'pcs'}`
                        )}
                      </p>
                    </div>
                    {statusFilter !== 'Balance Pieces' && item.status === 'Finished Goods' && (
                      <div className="mt-1 flex flex-col gap-0.5">
                        {item.balancePieces !== undefined && item.balancePieces > 0 && (
                          <p className="text-[10px] font-bold text-rose-500">BAL: {item.balancePieces} pcs</p>
                        )}
                        {item.balanceMeters !== undefined && item.balanceMeters > 0 && (
                          <p className="text-[10px] font-bold text-rose-500">BAL: {item.balanceMeters}m</p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-700">₹{item.rate}</p>
                    <p className="text-[10px] font-bold text-slate-400">Total: ₹{(item.quantity * item.rate).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    {(() => {
                      const totalCost = item.quantity * item.rate;
                      const paid = item.paidAmount || 0;
                      const due = Math.max(0, totalCost - paid);
                      
                      let badgeColor = "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100/50";
                      let badgeText = "Unpaid";
                      if (paid >= totalCost && totalCost > 0) {
                        badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50";
                        badgeText = "Fully Paid";
                      } else if (paid > 0) {
                        badgeColor = "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50";
                        badgeText = "Partial";
                      }

                      return (
                        <div className="flex flex-col gap-1 items-start">
                          <button 
                            onClick={() => {
                              setPaymentItem(item);
                              setPaymentAmount(due);
                              setPaymentDate(item.paymentDate || new Date().toISOString().split('T')[0]);
                              setIsPaymentOpen(true);
                            }}
                            className={cn(
                              "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase leading-none border transition-all hover:scale-105 active:scale-95 cursor-pointer",
                              badgeColor
                            )}
                            title="Click to record payment"
                          >
                            {badgeText}
                          </button>
                          <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                            Paid: <span className="font-bold text-slate-700">₹{paid}</span>
                          </p>
                          {item.paymentDate && paid > 0 && (
                            <p className="text-[9px] text-slate-400 font-bold leading-none mt-1 whitespace-nowrap">
                              Date: {new Date(item.paymentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                          {due > 0 && (
                            <p className="text-[10px] text-rose-500 font-bold leading-none mt-1 animate-pulse">
                              Bal: ₹{due}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-700">{new Date(item.expectedDate).toLocaleDateString()}</p>
                        <p className="text-[10px] text-slate-400">Due Date</p>
                      </div>
                      {(() => {
                        if (item.status === 'Finished Goods') return null;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const expected = new Date(item.expectedDate);
                        expected.setHours(0, 0, 0, 0);
                        const diffTime = expected.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays <= 2 && diffDays >= 0) {
                          return (
                            <div className="relative group/alert">
                              <AlertCircle className="w-4 h-4 text-rose-500 animate-pulse" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/alert:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
                                Due in {diffDays} day{diffDays !== 1 ? 's' : ''}!
                              </div>
                            </div>
                          );
                        } else if (diffDays < 0) {
                          return (
                            <div className="relative group/alert">
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-rose-600 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/alert:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
                                Overdue!
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase leading-none border",
                      statusFilter === 'Balance Pieces' ? "bg-rose-50 text-rose-600 border-rose-100" :
                      item.status === 'Assigned' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : 
                      item.status === 'Progressing' ? "bg-amber-50 text-amber-600 border-amber-100" : 
                      "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      {statusFilter === 'Balance Pieces' ? 'Unfinished Goods' : item.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => {
                          const totalCost = item.quantity * item.rate;
                          const paid = item.paidAmount || 0;
                          const due = Math.max(0, totalCost - paid);
                          setPaymentItem(item);
                          setPaymentAmount(due);
                          setPaymentDate(item.paymentDate || new Date().toISOString().split('T')[0]);
                          setIsPaymentOpen(true);
                        }}
                        className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Record Payment"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingId(item.id);
                          const totalQty = item.quantity || 0;
                          const derivedFinishedPieces = item.finishedPieces !== undefined 
                            ? item.finishedPieces 
                            : (item.allPiecesDelivered ? totalQty : Math.max(0, totalQty - (item.balancePieces || 0)));
                          const derivedFinishedMeters = item.finishedMeters !== undefined 
                            ? item.finishedMeters 
                            : (item.allMetersDelivered ? totalQty : Math.max(0, totalQty - (item.balanceMeters || 0)));

                          setFormData({
                            ...item,
                            paidAmount: item.paidAmount || 0,
                            paymentDate: item.paymentDate || new Date().toISOString().split('T')[0],
                            finishedPieces: derivedFinishedPieces,
                            finishedMeters: derivedFinishedMeters,
                            items: [{ modelName: item.modelName, quantity: totalQty, rate: item.rate, size: item.size || 'XL' }]
                          });
                          setIsFormOpen(true);
                        }}
                        className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteItem(item.id, item.modelName)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No production assignments found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Assignment' : 'New Assignment'}</h3>
                <p className="text-sm text-slate-500">{editingId ? 'Modify assignment details.' : 'Fill details to start production tracking.'}</p>
              </div>
              <button 
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Section 1: Fabric & Unit Setup */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Fabric & Unit Setup</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 col-span-full">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Source Inventory Item (Fabric)</label>
                    <div className="relative">
                      <Box className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                      <select 
                        required
                        className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer appearance-none"
                        value={formData.inventoryItemId || ''}
                        onChange={(e) => setFormData({...formData, inventoryItemId: e.target.value})}
                      >
                        <option value="">Select Fabric from Stock</option>
                        {inventory.map(i => (
                          <option key={i.id} value={i.id}>{i.fabricType} ({i.quantity}{i.unit === 'Meters' ? 'm' : 'pcs'} available)</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 col-span-full">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Target Shop / Finished Goods Record</label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                      <select 
                        className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer appearance-none"
                        value={formData.customerId || ''}
                        onChange={(e) => setFormData({...formData, customerId: e.target.value})}
                      >
                        <option value="">Select Shop/Target (Optional)</option>
                        {customers.filter(c => c && c.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Production Unit</label>
                    <div className="relative">
                      <Factory className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                      <select 
                        required
                        className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer appearance-none"
                        value={formData.unit || ''}
                        onChange={(e) => {
                          const newUnitName = e.target.value;
                          const unit = unitMaster.find(u => u && u.name === newUnitName);
                          const updatedItems = formData.items.map((item: any) => {
                            const model = productMaster.find(p => p && p.name === item.modelName);
                            if (unit && model) {
                              const specificRate = unit.modelRates?.find(mr => mr && mr.modelId === model.id);
                              return { ...item, rate: specificRate ? specificRate.rate : model.basePrice };
                            }
                            return item;
                          });
                          setFormData({ ...formData, unit: newUnitName, items: updatedItems });
                        }}
                      >
                        <option value="">Select Unit</option>
                        {unitMaster.filter(u => u && u.id).map(u => (
                          <option key={u.id} value={u.name}>{u.name} ({u.location})</option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Nighty Size</label>
                    <div className="relative">
                      <Maximize2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                      <select 
                        required
                        className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 cursor-pointer appearance-none"
                        value={formData.size || 'XL'}
                        onChange={(e) => setFormData({...formData, size: e.target.value as any})}
                      >
                        {['S', 'M', 'L', 'XL', 'XXL'].map(s => <option key={s}>{s}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Models & Quantities */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Settings2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Models to Assign</h4>
                  </div>
                  {!editingId && (
                    <button 
                      type="button"
                      onClick={addItemRow}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100"
                    >
                      <Plus className="w-3 h-3" />
                      Add Model
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {formData.items.map((item: any, index: number) => (
                    <div key={index} className="bg-slate-50/50 p-6 rounded-[28px] border border-slate-100 space-y-4 relative group transition-all hover:border-indigo-100 hover:shadow-sm">
                      {formData.items.length > 1 && !editingId && (
                        <button 
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="absolute -top-3 -right-3 p-2 bg-white text-slate-400 hover:text-rose-500 rounded-full shadow-md border border-slate-100 transition-all active:scale-90"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-x-4 gap-y-4">
                        {/* Model Select */}
                        <div className="space-y-2 lg:col-span-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Model Name</label>
                          <div className="relative">
                            <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
                            <select 
                              required
                              className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm appearance-none"
                              value={item.modelName}
                              onChange={(e) => {
                                const newModelName = e.target.value;
                                const unit = unitMaster.find(u => u && u.name === formData.unit);
                                const model = productMaster.find(p => p && p.name === newModelName);
                                let newRate = item.rate || 0;
                                if (unit && model) {
                                  const specificRate = unit.modelRates?.find(mr => mr && mr.modelId === model.id);
                                  newRate = specificRate ? specificRate.rate : model.basePrice;
                                } else if (model) {
                                  newRate = model.basePrice;
                                }

                                // Parse size suffix from selected model name with high precision
                                const parseSizeFromModelName = (name: string): "S" | "M" | "L" | "XL" | "XXL" | null => {
                                  if (!name) return null;
                                  const nameUpper = name.trim().toUpperCase();
                                  
                                  // 1. Exact word matches first to avoid false positives (e.g. "Flora Summer XL")
                                  const sizes: ("XXL" | "XL" | "L" | "M" | "S")[] = ["XXL", "XL", "L", "M", "S"];
                                  for (const sz of sizes) {
                                    const rxWord = new RegExp(`\\b${sz}\\b`, "i");
                                    if (rxWord.test(nameUpper)) return sz;
                                  }
                                  
                                  // 2. Separators: dash, parenthesis, underscore, slash
                                  for (const sz of sizes) {
                                    const rxBoundary = new RegExp(`[-()_/\\s\\[\\]]${sz}([-()_/\\s\\[\\]]|$)`, "i");
                                    if (rxBoundary.test(nameUpper)) return sz;
                                  }

                                  // 3. Suffix at the end (e.g. FloraXL, SabeenaXXL)
                                  if (nameUpper.endsWith("XXL")) return "XXL";
                                  if (nameUpper.endsWith("XL")) return "XL";

                                  // 4. One letter trailing size with casing checks (e.g., AlineL, RiyaM, but not Floral or Slim)
                                  const trimmed = name.trim();
                                  const last = trimmed.slice(-1);
                                  const beforeLast = trimmed.length > 1 ? trimmed.slice(-2, -1) : "";
                                  if (["S", "M", "L", "s", "m", "l"].includes(last)) {
                                    const isCapital = last === last.toUpperCase();
                                    const isBeforeLowerOrDigit = beforeLast && /[a-z0-9]/.test(beforeLast);
                                    const isBeforeSep = beforeLast && /[-_\s/]/.test(beforeLast);
                                    if (isBeforeSep || (isCapital && isBeforeLowerOrDigit)) {
                                      return last.toUpperCase() as any;
                                    }
                                  }

                                  // 5. Inclusions with custom boundaries
                                  for (const sz of sizes) {
                                    if (nameUpper.includes(" " + sz) || nameUpper.includes("-" + sz) || nameUpper.includes("(" + sz)) {
                                      return sz;
                                    }
                                  }

                                  // 6. Substring match for XL/XXL since they are unique size names
                                  if (nameUpper.includes("XXL")) return "XXL";
                                  if (nameUpper.includes("XL")) return "XL";

                                  return null;
                                };

                                const detectedSize = parseSizeFromModelName(newModelName);

                                setFormData((prev: any) => {
                                  const newItems = [...prev.items];
                                  newItems[index] = { 
                                    ...newItems[index], 
                                    modelName: newModelName, 
                                    rate: newRate,
                                    size: detectedSize || newItems[index].size || prev.size || 'XL'
                                  };
                                  return {
                                    ...prev,
                                    items: newItems,
                                    ...(detectedSize ? { size: detectedSize } : {})
                                  };
                                });
                              }}
                            >
                              <option value="">Select a Model</option>
                              {productMaster.filter(p => p && p.name).map(p => (
                                <option key={p.id} value={p.name}>{p.name} (₹{p.basePrice})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Nighty Size dropdown per row */}
                        <div className="space-y-2 lg:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nighty Size</label>
                          <div className="relative">
                            <select 
                              required
                              className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm appearance-none cursor-pointer"
                              value={item.size || 'XL'}
                              onChange={(e) => updateItemRow(index, { size: e.target.value })}
                            >
                              {['S', 'M', 'L', 'XL', 'XXL'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2 lg:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                            Qty <span className="opacity-60">({inventory.find(i => i.id === formData.inventoryItemId)?.unit === 'Pieces' ? 'pcs' : 'm'})</span>
                          </label>
                          <input 
                            required
                            type="number"
                            min="0"
                            max={getMaxAllowedForThisRow(index)}
                            className={cn(
                              "w-full bg-white border rounded-xl py-3 px-4 text-xs outline-none transition-all font-medium shadow-sm",
                              item.quantity > getMaxAllowedForThisRow(index)
                                ? "border-rose-300 ring-2 ring-rose-500/10 text-rose-600 bg-rose-50/30" 
                                : "border-slate-100 focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                            )}
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const inputVal = e.target.value;
                              if (inputVal === '') {
                                updateItemRow(index, { quantity: '' });
                                return;
                              }
                              const val = parseFloat(inputVal) || 0;
                              const limit = getMaxAllowedForThisRow(index);
                              // Clamp to available stock limit
                              const capped = Math.min(val, limit);
                              updateItemRow(index, { quantity: capped });
                            }}
                          />
                        </div>

                        {/* Rate */}
                        <div className="space-y-2 lg:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Rate (₹)</label>
                          <div className="flex gap-2">
                            <input 
                              required
                              type="number"
                              className="flex-1 bg-white border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                              value={item.rate !== undefined && item.rate !== null && !isNaN(item.rate) ? item.rate : ''}
                              onChange={(e) => updateItemRow(index, { rate: parseFloat(e.target.value) })}
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                const unit = unitMaster.find(u => u && u.name === formData.unit);
                                const model = productMaster.find(p => p && p.name === item.modelName);
                                if (unit && model) {
                                  const specificRate = unit.modelRates?.find(mr => mr && mr.modelId === model.id);
                                  updateItemRow(index, { rate: specificRate ? specificRate.rate : model.basePrice });
                                } else if (model) {
                                  updateItemRow(index, { rate: model.basePrice });
                                }
                              }}
                              className="w-10 h-10 flex items-center justify-center text-slate-400 bg-white rounded-xl border border-slate-100 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm"
                              title="Reset to default rate"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {item.quantity > getMaxAllowedForThisRow(index) && (
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-500 font-bold px-1 bg-rose-50/50 py-1.5 rounded-lg border border-rose-100">
                          <AlertCircle className="w-3 h-3" />
                          Exceeds available stock! (Max allowed: {getMaxAllowedForThisRow(index)})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Timing & Status */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Timing & Delivery</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Assigned Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                      <input 
                        required
                        type="date" 
                        className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                        value={formData.assignedDate || ''}
                        onChange={(e) => setFormData({...formData, assignedDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Expected Date</label>
                    <div className="relative">
                      <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                      <input 
                        required
                        type="date" 
                        className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                        value={formData.expectedDate || ''}
                        onChange={(e) => setFormData({...formData, expectedDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Initial Status</label>
                    <div className="relative">
                      <Settings2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10 pointer-events-none" />
                      <select 
                        required
                        className="w-full bg-[#f8faff] border border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                        value={formData.status || 'Assigned'}
                        onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      >
                        <option value="Assigned">Assigned</option>
                        <option value="Progressing">Progressing</option>
                        <option value="Finished Goods">Finished Goods</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight className="w-4 h-4 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {formData.status === 'Finished Goods' && (() => {
                    const selectedInvItem = inventory.find(i => i.id === formData.inventoryItemId);
                    const isMeters = selectedInvItem ? selectedInvItem.unit === 'Meters' : false;
                    const totalQty = formData.items.reduce((sum: number, it: any) => sum + (parseFloat(it.quantity) || 0), 0) || parseFloat(formData.quantity) || 0;

                    if (isMeters) {
                      const computedFinishedMeters = formData.finishedMeters !== undefined ? parseFloat(formData.finishedMeters) : (formData.allMetersDelivered ? totalQty : Math.max(0, totalQty - (parseFloat(formData.balanceMeters) || 0)));
                      const curFinishedMeters = isNaN(computedFinishedMeters) ? 0 : computedFinishedMeters;
                      const computedBalanceMeters = formData.balanceMeters !== undefined ? parseFloat(formData.balanceMeters) : (formData.allMetersDelivered ? 0 : totalQty);
                      const curBalanceMeters = isNaN(computedBalanceMeters) ? 0 : computedBalanceMeters;

                      return (
                        <div className="col-span-full mt-2 p-6 bg-emerald-50/50 rounded-[28px] border border-emerald-100 space-y-4 animate-in slide-in-from-top-2 duration-350">
                          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Finished Goods Delivery Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-2xl border border-emerald-55 shadow-sm">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Finished Goods Delivered (m)</label>
                              <input 
                                type="number"
                                required
                                min="0"
                                max={totalQty}
                                className="w-full bg-emerald-50/10 border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 shadow-sm transition-all"
                                placeholder={`Max: ${totalQty} m`}
                                value={curFinishedMeters}
                                onChange={(e) => {
                                  let finishedVal = parseFloat(e.target.value);
                                  if (isNaN(finishedVal)) finishedVal = 0;
                                  finishedVal = Math.min(totalQty, Math.max(0, finishedVal));
                                  const bal = Math.max(0, totalQty - finishedVal);
                                  setFormData({
                                    ...formData,
                                    finishedMeters: finishedVal,
                                    balanceMeters: bal,
                                    allMetersDelivered: bal === 0
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Remaining Balance Meters (m)</label>
                              <input 
                                type="number"
                                required
                                min="0"
                                max={totalQty}
                                className="w-full bg-emerald-50/10 border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 shadow-sm transition-all"
                                placeholder="Enter balance meters"
                                value={curBalanceMeters}
                                onChange={(e) => {
                                  let balVal = parseFloat(e.target.value);
                                  if (isNaN(balVal)) balVal = 0;
                                  balVal = Math.min(totalQty, Math.max(0, balVal));
                                  const finished = Math.max(0, totalQty - balVal);
                                  setFormData({
                                    ...formData,
                                    balanceMeters: balVal,
                                    finishedMeters: finished,
                                    allMetersDelivered: balVal === 0
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-emerald-700 font-bold px-1 pt-1">
                            <span>Total Assigned: {totalQty} meters</span>
                            <span>{curBalanceMeters > 0 ? `⚠️ Pending Balance: ${curBalanceMeters} meters` : '✅ All Meters Delivered'}</span>
                          </div>
                        </div>
                      );
                    } else {
                      const computedFinishedPieces = formData.finishedPieces !== undefined ? parseFloat(formData.finishedPieces) : (formData.allPiecesDelivered ? totalQty : Math.max(0, totalQty - (parseFloat(formData.balancePieces) || 0)));
                      const curFinishedPieces = isNaN(computedFinishedPieces) ? 0 : computedFinishedPieces;
                      const computedBalancePieces = formData.balancePieces !== undefined ? parseFloat(formData.balancePieces) : (formData.allPiecesDelivered ? 0 : totalQty);
                      const curBalancePieces = isNaN(computedBalancePieces) ? 0 : computedBalancePieces;

                      return (
                        <div className="col-span-full mt-2 p-6 bg-emerald-50/50 rounded-[28px] border border-emerald-100 space-y-4 animate-in slide-in-from-top-2 duration-350">
                          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Finished Goods Delivery Details
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-2xl border border-emerald-55 shadow-sm">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Finished Goods Delivered (pcs)</label>
                              <input 
                                type="number"
                                required
                                min="0"
                                max={totalQty}
                                className="w-full bg-emerald-50/10 border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 shadow-sm transition-all"
                                placeholder={`Max: ${totalQty} pcs`}
                                value={curFinishedPieces}
                                onChange={(e) => {
                                  let finishedVal = parseFloat(e.target.value);
                                  if (isNaN(finishedVal)) finishedVal = 0;
                                  finishedVal = Math.min(totalQty, Math.max(0, finishedVal));
                                  const bal = Math.max(0, totalQty - finishedVal);
                                  setFormData({
                                    ...formData,
                                    finishedPieces: finishedVal,
                                    balancePieces: bal,
                                    allPiecesDelivered: bal === 0
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Remaining Balance Pieces (pcs)</label>
                              <input 
                                type="number"
                                required
                                min="0"
                                max={totalQty}
                                className="w-full bg-emerald-50/10 border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 shadow-sm transition-all"
                                placeholder="Enter balance pcs"
                                value={curBalancePieces}
                                onChange={(e) => {
                                  let balVal = parseFloat(e.target.value);
                                  if (isNaN(balVal)) balVal = 0;
                                  balVal = Math.min(totalQty, Math.max(0, balVal));
                                  const finished = Math.max(0, totalQty - balVal);
                                  setFormData({
                                    ...formData,
                                    balancePieces: balVal,
                                    finishedPieces: finished,
                                    allPiecesDelivered: balVal === 0
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-emerald-700 font-bold px-1 pt-1">
                            <span>Total Assigned: {totalQty} pcs</span>
                            <span>{curBalancePieces > 0 ? `⚠️ Pending Balance: ${curBalancePieces} pcs` : '✅ All Pieces Delivered'}</span>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Section 4: Payment Setup */}
              <div className="space-y-6 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 pb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-black">Payment Setup</h4>
                </div>

                {(() => {
                  const totalQty = formData.items?.reduce((sum: number, it: any) => sum + (parseFloat(it.quantity) || 0), 0) || 0;
                  const rate = formData.items?.[0]?.rate || 0;
                  const totalCost = totalQty * rate;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#f8faff] p-6 rounded-[28px] border border-slate-100/80 shadow-sm">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Total Assignment Cost (₹)</label>
                        <div className="h-14 bg-white border border-slate-100 rounded-2xl px-5 flex items-center justify-between text-sm font-black text-slate-800 shadow-sm">
                          <span>₹{(totalCost).toLocaleString()}</span>
                          <span className="text-[10px] font-bold text-slate-400">({totalQty} x ₹{rate})</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Amount Paid (₹)</label>
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            min="0"
                            max={totalCost}
                            className="w-full bg-white border border-slate-100 rounded-2xl h-14 px-4 text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 shadow-sm font-mono"
                            placeholder="Paid amount"
                            value={formData.paidAmount !== undefined ? formData.paidAmount : ''}
                            onChange={(e) => {
                              let val = parseFloat(e.target.value);
                              if (isNaN(val)) val = 0;
                              val = Math.min(totalCost, Math.max(0, val));
                              setFormData({ ...formData, paidAmount: val });
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => setFormData({ ...formData, paidAmount: totalCost })}
                            className="px-4 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-xl h-14 border border-emerald-100 hover:border-emerald-200 transition-all shadow-sm shrink-0 whitespace-nowrap cursor-pointer"
                          >
                            Paid Full
                          </button>
                        </div>
                        {formData.paidAmount > 0 && formData.paidAmount < totalCost && (
                          <p className="text-[10px] text-amber-600 font-bold px-1">
                            ⚠️ Remaining Balance: ₹{(totalCost - formData.paidAmount).toLocaleString()}
                          </p>
                        )}
                        {totalCost > 0 && formData.paidAmount >= totalCost && (
                          <p className="text-[10px] text-emerald-600 font-bold px-1">
                            ✅ Fully Paid!
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Date</label>
                        <input 
                          type="date"
                          disabled={!(formData.paidAmount > 0)}
                          className="h-14 w-full bg-white border border-slate-100 rounded-2xl px-4 text-xs outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 shadow-sm disabled:opacity-50 disabled:bg-slate-50/50"
                          value={formData.paymentDate || ''}
                          onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                        />
                        {!(formData.paidAmount > 0) && (
                          <p className="text-[10px] text-slate-400 font-medium px-1">
                            Enter an amount paid to set date.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all border border-slate-200/50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-2 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
                >
                  {editingId ? 'Save Changes' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Delete</h3>
            <p className="text-sm text-slate-500 mb-8 font-medium">
              Are you sure you want to delete <span className="font-bold text-slate-700">"{itemToDelete?.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setIsDeleteDialogOpen(false); setItemToDelete(null); }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Pay Modal */}
      {isPaymentOpen && paymentItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Record Payment
                </h3>
                <p className="text-xs text-slate-500 font-medium">Add payment for production assignment.</p>
              </div>
              <button 
                onClick={() => {
                  setIsPaymentOpen(false);
                  setPaymentItem(null);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleQuickPaymentSubmit} className="p-6 space-y-5">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-bold">Assignment ID:</span>
                  <span className="font-mono text-indigo-600 font-bold">{paymentItem.id}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-bold">Unit / Workshop:</span>
                  <span className="font-bold text-slate-800 uppercase tracking-wide">{paymentItem.unit}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="font-bold">Design Model:</span>
                  <span className="font-bold text-slate-800">{paymentItem.modelName}</span>
                </div>
                <div className="text-xs text-slate-400 border-t border-slate-100 my-2 pt-2 flex justify-between items-center">
                  <span>Assigned Work:</span>
                  <span className="font-semibold text-slate-600">{paymentItem.quantity} {paymentItem.unit === 'Meters' ? 'meters' : 'pcs'} @ ₹{paymentItem.rate}/unit</span>
                </div>
              </div>

              {(() => {
                const totalCost = paymentItem.quantity * paymentItem.rate;
                const paid = paymentItem.paidAmount || 0;
                const due = Math.max(0, totalCost - paid);

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-emerald-50/20 border border-emerald-100/50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Paid Amount</p>
                        <p className="text-lg font-black text-emerald-600 mt-0.5">₹{paid.toLocaleString()}</p>
                      </div>
                      <div className="bg-rose-50/20 border border-rose-100/50 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Remaining Due</p>
                        <p className="text-lg font-black text-rose-600 mt-0.5">₹{due.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 block">Payment Amount to Add (₹)</label>
                      <div className="flex gap-2">
                        <input 
                          type="number"
                          required
                          min="0.01"
                          max={due}
                          step="any"
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 font-mono shadow-inner"
                          placeholder={`Max: ₹${due}`}
                          value={paymentAmount || ''}
                          onChange={(e) => {
                            let val = parseFloat(e.target.value);
                            if (isNaN(val)) val = 0;
                            val = Math.min(due, Math.max(0, val));
                            setPaymentAmount(val);
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => setPaymentAmount(due)}
                          className="px-4 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-all shadow-sm shrink-0 uppercase tracking-wider cursor-pointer"
                        >
                          Pay Full
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1 block">Payment Date</label>
                      <input 
                        type="date"
                        required
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 font-bold text-slate-700 font-mono shadow-inner"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pb-1">
                      <button 
                        type="button"
                        onClick={() => setPaymentAmount(Math.min(due, 100))}
                        className="py-1.5 px-3 border border-slate-100 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        ₹100
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentAmount(Math.min(due, 500))}
                        className="py-1.5 px-3 border border-slate-100 text-xs font-bold rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        ₹500
                      </button>
                    </div>

                    <div className="pt-4 flex gap-3 border-t border-slate-50">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsPaymentOpen(false);
                          setPaymentItem(null);
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors cursor-pointer text-sm"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={paymentAmount <= 0}
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-100 transition-all text-sm cursor-pointer"
                      >
                        Save Payment
                      </button>
                    </div>
                  </div>
                );
              })()}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
