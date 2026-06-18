import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  Building2,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  mobileNumber?: string;
  email?: string;
  address: string;
  gstNumber: string;
  paymentTerms?: string;
  notes?: string;
  pincode?: string;
  state?: string;
  district?: string;
  opBalance?: number;
  createdAt: string;
}

interface AppSettings {
  supplierPrefix: string;
  nextSupplierId: number;
}

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<Supplier>>({
    paymentTerms: 'Net 30',
  });
  const [settings, setSettings] = useState<AppSettings>({
    supplierPrefix: 'SUP',
    nextSupplierId: 1
  });

  // Load data and settings
  useEffect(() => {
    const savedSuppliers = localStorage.getItem('inven_suppliers');
    if (savedSuppliers) {
      try { setSuppliers(JSON.parse(savedSuppliers)); } catch (e) { console.error(e); }
    } else {
      const demo = [
        {
          id: 'SUP-0001',
          name: 'Janice Miller',
          companyName: 'TechFlow Solutions',
          contactPerson: 'Janice Miller',
          phone: '+1 (555) 0123',
          email: 'janice@techflow.io',
          address: '742 Evergreen Terrace, Springfield',
          gstNumber: 'GSTIN123456789',
          paymentTerms: 'Net 15',
          notes: 'Primary laptop supplier',
          createdAt: new Date().toISOString()
        }
      ];
      setSuppliers(demo);
      localStorage.setItem('inven_suppliers', JSON.stringify(demo));
    }

    const savedSettings = localStorage.getItem('inven_settings');
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveToLocal = (data: Supplier[]) => {
    setSuppliers(data);
    localStorage.setItem('inven_suppliers', JSON.stringify(data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      const updated = suppliers.map(s => 
        s.id === editingId ? { ...s, ...formData as Supplier } : s
      );
      saveToLocal(updated);
    } else {
      const newId = `${settings.supplierPrefix}-${settings.nextSupplierId.toString().padStart(4, '0')}`;
      const newSupplier: Supplier = {
        ...formData as Supplier,
        id: newId,
        createdAt: new Date().toISOString(),
      };
      
      const updated = [newSupplier, ...suppliers];
      saveToLocal(updated);

      // Increment ID in settings
      const updatedSettings = {
        ...settings,
        nextSupplierId: settings.nextSupplierId + 1
      };
      setSettings(updatedSettings);
      localStorage.setItem('inven_settings', JSON.stringify(updatedSettings));
    }

    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ paymentTerms: 'Net 30' });
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData(supplier);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({ paymentTerms: 'Net 30' });
    setIsFormOpen(true);
  };

  const deleteSupplier = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      const updated = suppliers.filter(s => s.id !== deleteId);
      saveToLocal(updated);
      setDeleteId(null);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s && (
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.id || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Suppliers</h2>
          <p className="text-sm text-slate-500">Manage your product vendors and contact details.</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Add Supplier
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, company or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Suppliers Grid/Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredSuppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{supplier.companyName}</h4>
                  <p className="text-xs text-slate-400 font-mono">{supplier.id}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(supplier)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => deleteSupplier(supplier.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Contact Person</p>
                <p className="text-sm font-semibold text-slate-700">{supplier.contactPerson}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">GST Number</p>
                <p className="text-sm font-semibold text-slate-700">{supplier.gstNumber}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone className="w-3.5 h-3.5" />
                {supplier.phone}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Mail className="w-3.5 h-3.5" />
                {supplier.email}
              </div>
              <div className="col-span-full flex items-start gap-2 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {supplier.address}
              </div>
            </div>

            {supplier.notes && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 italic">
                "{supplier.notes}"
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Supplier?</h3>
            <p className="text-sm text-slate-500 mb-8">This action cannot be undone. All data for this vendor will be permanently removed.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
              >
                No, Keep
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <p className="text-sm text-slate-500">
                  {editingId ? 'Modify vendor details.' : 'Fill in the details to register a new vendor.'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                  setFormData({ paymentTerms: 'Net 30' });
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Supplier Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-[#f8faff] border-none rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm shadow-indigo-500/5"
                    placeholder="e.g. John Doe"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Company Name</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-[#f8faff] border-none rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm shadow-indigo-500/5"
                    placeholder="e.g. Global Tech Inc."
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Contact Person</label>
                  <input 
                    required
                    type="text" 
                    className="w-full bg-[#f8faff] border-none rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm shadow-indigo-500/5"
                    placeholder="e.g. Jane Smith"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Phone Number</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full bg-[#f8faff] border-none rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm shadow-indigo-500/5"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    required
                    type="email" 
                    className="w-full bg-[#f8faff] border-none rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm shadow-indigo-500/5"
                    placeholder="vendor@company.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">GST Number</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#f8faff] border-none rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm shadow-indigo-500/5"
                    placeholder="Optional"
                    value={formData.gstNumber || ''}
                    onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Address</label>
                  <textarea 
                    required
                    rows={2}
                    className="w-full bg-[#f8faff] border-none rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm shadow-indigo-500/5 resize-none h-24"
                    placeholder="Full business address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Payment Terms</label>
                  <select 
                    className="w-full bg-[#f8faff] border-none rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 appearance-none shadow-sm shadow-indigo-500/5 cursor-pointer"
                    onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                    value={formData.paymentTerms || 'Net 30'}
                  >
                    <option>Immediate</option>
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 60</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Notes</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#f8faff] border-none rounded-[20px] py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm shadow-indigo-500/5"
                    placeholder="Any specific instructions..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingId(null);
                    setFormData({ paymentTerms: 'Net 30' });
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  {editingId ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
