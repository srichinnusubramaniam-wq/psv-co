import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Trash2, 
  Edit2, 
  X,
  UserPlus,
  Package,
  Calendar,
  History
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { STATES_AND_DISTRICTS } from '@/src/data/indiaData';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  mobileNumber?: string;
  email?: string;
  address: string;
  pincode?: string;
  state?: string;
  district?: string;
  gstNumber?: string;
  tcsApplicable?: 'YES' | 'NO';
  createdAt: string;
}


export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [mobileError, setMobileError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);

  const validateMobile = (num: string): boolean => {
    const clean = num.replace(/\D/g, '');
    return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
  };

  useEffect(() => {
    const savedCustomers = localStorage.getItem('inven_customers');
    if (savedCustomers) {
      try { 
        const parsed = JSON.parse(savedCustomers);
        // Ensure legacy customers have mobileNumber populated from phone if missing
        const mig = parsed.map((c: any) => ({
          ...c,
          mobileNumber: c.mobileNumber || c.phone || '',
          tcsApplicable: c.tcsApplicable || 'NO'
        }));
        setCustomers(mig.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())); 
      } catch (e) { console.error(e); }
    } else {
      const demoCustomers = [
        {
          id: 'CUS-0001',
          name: 'Anjali Sharma',
          phone: '',
          mobileNumber: '9123456789',
          email: 'anjali@demo.com',
          address: '101 Rose Gardens, Mumbai',
          tcsApplicable: 'NO' as const,
          createdAt: new Date().toISOString()
        }
      ];
      setCustomers(demoCustomers);
      localStorage.setItem('inven_customers', JSON.stringify(demoCustomers));
    }
  }, []);

  const saveCustomers = (data: Customer[]) => {
    setCustomers(data);
    localStorage.setItem('inven_customers', JSON.stringify(data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mobVal = formData.mobileNumber || '';
    if (!validateMobile(mobVal)) {
      setMobileError('Please enter a valid 10-digit Indian Mobile Number (must start with 6-9)');
      return;
    }
    
    const updatedData = {
      ...formData,
      mobileNumber: mobVal,
      phone: formData.phone || '', // phone is optional now
      tcsApplicable: formData.tcsApplicable || 'NO'
    };

    if (editingId) {
      const updated = customers.map(c => c.id === editingId ? { ...c, ...updatedData as Customer } : c);
      saveCustomers(updated);
    } else {
      const newCustomer: Customer = {
        ...updatedData as Customer,
        id: `CUS-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        createdAt: new Date().toISOString(),
      };
      saveCustomers([newCustomer, ...customers]);
    }
    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({});
    setMobileError('');
  };

  const deleteCustomer = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete record: ${name}?`)) {
      saveCustomers(customers.filter(c => c.id !== id));
    }
  };

  const openCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    const allAssignments = localStorage.getItem('inven_production');
    if (allAssignments) {
      const parsed = JSON.parse(allAssignments);
      const filtered = parsed.filter((a: any) => a.customerId === customer.id && a.status === 'Finished Goods');
      setFinishedGoods(filtered);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c && (
      (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery)
    )
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Finished Goods</h2>
          <p className="text-sm text-slate-500">Manage your finished products and delivery tracking.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <div 
            key={customer.id} 
            onClick={() => openCustomerDetails(customer)}
            className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative cursor-pointer"
          >
            <div className="flex items-start gap-4 mb-6">
               <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Users className="w-7 h-7" />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{customer.id}</p>
                  <h4 className="text-xl font-extrabold text-slate-800 truncate leading-tight">{customer.name}</h4>
                  {customer.email && <p className="text-sm text-slate-500 font-medium line-clamp-1">{customer.email}</p>}
               </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                     <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                     {customer.mobileNumber || customer.phone}
                     {customer.tcsApplicable === 'YES' && (
                       <span className="bg-rose-50 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded ml-auto">TCS APPLICABLE</span>
                     )}
                  </div>
                  <div className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                     <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                     <div className="flex-1">
                        <span className="line-clamp-2 leading-relaxed">{customer.address}</span>
                        {(customer.district || customer.state || customer.pincode) && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                             {customer.district && (
                               <span className="bg-indigo-50 text-indigo-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                 {customer.district}
                               </span>
                             )}
                             {customer.state && (
                               <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                                 {customer.state}
                               </span>
                             )}
                             {customer.pincode && (
                               <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
                                 PIN: {customer.pincode}
                               </span>
                             )}
                          </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex-1 text-center">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Click to View Details</p>
               </div>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No records found.</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit' : 'Add New'} Record
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Customer Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm uppercase"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                  placeholder="E.G. SARATHAS SHOP"
                />
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Mobile Number</label>
                  <input 
                    required
                    type="text" 
                    maxLength={10}
                    className={cn(
                      "w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 font-medium text-slate-700 shadow-sm",
                      mobileError ? "ring-2 ring-rose-500/20 focus:ring-rose-500/20" : "focus:ring-indigo-500/10"
                    )}
                    value={formData.mobileNumber || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, mobileNumber: val});
                      if (val.trim() === '') {
                        setMobileError('Mobile number is required');
                      } else if (val.length < 10) {
                        setMobileError('Must be exactly 10-digit Indian Mobile Number');
                      } else if (!/^[6-9]/.test(val)) {
                        setMobileError('Must start with 6, 7, 8, or 9');
                      } else {
                        setMobileError('');
                      }
                    }}
                    placeholder="E.G. 9876543210"
                  />
                  {mobileError && (
                    <p className="text-[10px] text-rose-500 font-bold pl-1 animate-pulse">{mobileError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Phone</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="E.G. 044-245678"
                  />
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">TCS Applicable</label>
                   <select 
                     required
                     className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                     value={formData.tcsApplicable || 'NO'}
                     onChange={(e) => setFormData({...formData, tcsApplicable: e.target.value as 'YES' | 'NO'})}
                   >
                     <option value="NO">NO</option>
                     <option value="YES">YES</option>
                   </select>
                 </div>
               </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">State</label>
                  <select 
                    required
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                    value={formData.state || ''}
                    onChange={(e) => {
                      const selectedState = e.target.value;
                      setFormData({
                        ...formData, 
                        state: selectedState,
                        district: '' // Reset district when state changes
                      });
                    }}
                  >
                    <option value="">CHOOSE STATE</option>
                    {Object.keys(STATES_AND_DISTRICTS).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">District</label>
                  <select 
                    required
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                    value={formData.district || ''}
                    disabled={!formData.state}
                    onChange={(e) => setFormData({...formData, district: e.target.value})}
                  >
                    <option value="">CHOOSE DISTRICT</option>
                    {formData.state && STATES_AND_DISTRICTS[formData.state]?.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Pincode</label>
                  <input 
                    required
                    type="text" 
                    maxLength={6}
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm text-center tracking-widest font-mono"
                    value={formData.pincode || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, pincode: val});
                    }}
                    placeholder="600001"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">GSTIN</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm text-indigo-600 uppercase"
                    value={formData.gstNumber || ''}
                    onChange={(e) => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})}
                    placeholder="33XXXXX0000X0Z0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Address</label>
                <textarea 
                  required
                  className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm resize-none uppercase"
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value.toUpperCase()})}
                  placeholder="FULL BUSINESS ADDRESS..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-4 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#f8faff] w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row h-[85vh]">
            {/* Left Sidebar: Customer Context */}
            <div className="w-full md:w-80 bg-white p-8 border-r border-slate-100 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Package className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="mb-8">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">{selectedCustomer.id}</p>
                <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2">{selectedCustomer.name}</h3>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </div>
                )}
              </div>

               <div className="space-y-6 flex-1">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Financial Details</p>
                    <div className="bg-slate-50 rounded-2xl p-4 font-bold space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">GSTIN</span>
                        <span className="text-indigo-600 uppercase">{selectedCustomer.gstNumber || 'Not Provided'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/40">
                        <span className="text-slate-400">TCS APPLICABLE</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] uppercase font-bold",
                          (selectedCustomer.tcsApplicable === 'YES') 
                            ? "bg-rose-50 text-rose-600" 
                            : "bg-slate-100 text-slate-600"
                        )}>
                          {selectedCustomer.tcsApplicable || 'NO'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contact Details</p>
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-3 font-bold">
                      <div className="flex items-center gap-3 text-[11px] text-slate-700">
                        <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-[10px] text-slate-400 font-medium">MOB:</span>
                        <span>{selectedCustomer.mobileNumber || selectedCustomer.phone || 'N/A'}</span>
                      </div>
                      {selectedCustomer.phone && selectedCustomer.phone !== selectedCustomer.mobileNumber && (
                        <div className="flex items-center gap-3 text-[11px] text-slate-700">
                          <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="text-[10px] text-slate-400 font-medium font-sans">PH:</span>
                          <span>{selectedCustomer.phone}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-3 text-[11px] text-slate-700">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed text-left">{selectedCustomer.address}</span>
                      </div>
                      {(selectedCustomer.district || selectedCustomer.state || selectedCustomer.pincode) && (
                        <div className="pt-2 border-t border-slate-200/60 text-[10px] text-slate-600 space-y-1">
                          {selectedCustomer.state && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-medium font-sans">STATE:</span>
                              <span className="font-extrabold uppercase font-sans">{selectedCustomer.state}</span>
                            </div>
                          )}
                          {selectedCustomer.district && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-medium font-sans">DISTRICT:</span>
                              <span className="font-extrabold uppercase font-sans">{selectedCustomer.district}</span>
                            </div>
                          )}
                          {selectedCustomer.pincode && (
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400 font-medium font-sans">PINCODE:</span>
                              <span className="font-mono font-extrabold">{selectedCustomer.pincode}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Summary</p>
                  <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100">
                    <p className="text-2xl font-black text-indigo-600">{finishedGoods.length}</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Total Batches Delivered</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95 mt-6"
              >
                Close View
              </button>
            </div>

            {/* Right Side: Goods List */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-black text-slate-800">Delivered Finished Goods</h4>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                  <History className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-600">History Log</span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                {finishedGoods.map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm border-l-4 border-l-emerald-500 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.id}</p>
                          <h5 className="text-lg font-black text-slate-800">{item.modelName}</h5>
                          <p className="text-xs font-bold text-slate-500">{item.fabricType} • SIZE {item.size}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Delivered Qty</p>
                          <p className="text-lg font-black text-slate-800">{item.quantity} pcs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-black underline decoration-emerald-200 underline-offset-2">
                             DELIVERED
                          </div>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="flex items-center justify-end gap-1.5 text-slate-400 mb-1">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[8px] font-bold uppercase tracking-wider">Date</span>
                          </div>
                          <p className="text-xs font-bold text-slate-700">{new Date(item.assignedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {finishedGoods.length === 0 && (
                  <div className="py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center">
                    <History className="w-12 h-12 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">No delivery records found for this shop.</p>
                    <p className="text-xs text-slate-300 mt-1">Items move here after being marked as 'Finished Goods' in Production.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
