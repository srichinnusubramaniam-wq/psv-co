import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Database, CheckCircle, AlertTriangle, Copy, ExternalLink, HelpCircle, Cloud } from 'lucide-react';
import { 
  subscribeToSyncStatus, 
  getSyncStatus, 
  pullFromSupabase, 
  pushAllToSupabase,
  verifySupabaseSetup,
  SyncStatus
} from '../lib/supabase';

export default function Settings() {
  const [supplierPrefix, setSupplierPrefix] = useState('SUP');
  const [nextSupplierId, setNextSupplierId] = useState(1);
  const [customerPrefix, setCustomerPrefix] = useState('CUS');
  const [nextCustomerId, setNextCustomerId] = useState(1);
  const [modelPrefix, setModelPrefix] = useState('MOD');
  const [nextModelId, setNextModelId] = useState(1);
  const [prodPrefix, setProdPrefix] = useState('PRD');
  const [nextProdId, setNextProdId] = useState(1);
  const [purchasePrefix, setPurchasePrefix] = useState('PUR');

  const [nextPurchaseId, setNextPurchaseId] = useState(1);
  const [invoicePrefix, setInvoicePrefix] = useState('GT');
  const [invoiceYear, setInvoiceYear] = useState('25-26');
  const [nextInvoiceId, setNextInvoiceId] = useState(1);
  const [companyName, setCompanyName] = useState('P.S.V & CO');
  const [companyAddress, setCompanyAddress] = useState('189/92, P.V.IYER STREET, NEAR SINGAMETHAI, AMMAPET MAIN ROAD, SALEM - 636001 TAMILNADU');
  const [companyLogo, setCompanyLogo] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [isSaved, setIsSaved] = useState(false);

  // Supabase states
  const [syncState, setSyncState] = useState<SyncStatus>(getSyncStatus());
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [syncEnabled, setSyncEnabled] = useState(() => {
    return localStorage.getItem('inven_supabase_sync_enabled') !== 'false';
  });
  const [customSupabaseUrl, setCustomSupabaseUrl] = useState(() => {
    return localStorage.getItem('inven_supabase_url') || '';
  });
  const [customSupabaseAnonKey, setCustomSupabaseAnonKey] = useState(() => {
    return localStorage.getItem('inven_supabase_anon_key') || '';
  });

  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((status) => {
      setSyncState(status);
    });
    return () => unsubscribe();
  }, []);

  const handleVerifySetup = async () => {
    setActionResult(null);
    const ok = await verifySupabaseSetup();
    if (ok) {
      setActionResult({ type: 'success', message: 'Connection verified successfully! Table exists.' });
    } else {
      setActionResult({ type: 'error', message: 'Table local_storage_sync not found. See setup instructions below.' });
    }
  };

  const handlePullFromCloud = async () => {
    setActionResult(null);
    const ok = await pullFromSupabase();
    if (ok) {
      setActionResult({ type: 'success', message: 'Successfully pulled and restored all data from Supabase Cloud!' });
    } else {
      setActionResult({ type: 'error', message: 'Failed to pull. Ensure the table is created and populated.' });
    }
  };

  const handlePushToCloud = async () => {
    setActionResult(null);
    const ok = await pushAllToSupabase();
    if (ok) {
      setActionResult({ type: 'success', message: 'Successfully pushed and backed up all local data into Supabase Cloud!' });
    } else {
      setActionResult({ type: 'error', message: 'Failed to push data. Please check connection or your Supabase SQL schema.' });
    }
  };

  const copySQL = () => {
    const sql = `-- Dynamic Table Creation queries for all inventory management models
-- You can run these in your Supabase SQL editor to ensure all tables are created.

create table if not exists inven_users (username text primary key, password text not null, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_customers (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_expense_master (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_expense_records (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_generated_invoices (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_income_master (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_income_records (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_inventory (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_product_master (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_production (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_sales (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_settings (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_style_master (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_suppliers (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_transports (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);
create table if not exists inven_unit_master (id text primary key, value jsonb, updated_at timestamp with time zone default timezone('utc'::text, now()) not null);

-- Disable Row Level Security (RLS) so that public clients can write to these tables:
alter table inven_users disable row level security;
alter table inven_customers disable row level security;
alter table inven_expense_master disable row level security;
alter table inven_expense_records disable row level security;
alter table inven_generated_invoices disable row level security;
alter table inven_income_master disable row level security;
alter table inven_income_records disable row level security;
alter table inven_inventory disable row level security;
alter table inven_product_master disable row level security;
alter table inven_production disable row level security;
alter table inven_sales disable row level security;
alter table inven_settings disable row level security;
alter table inven_style_master disable row level security;
alter table inven_suppliers disable row level security;
alter table inven_transports disable row level security;
alter table inven_unit_master disable row level security;

-- Enable replica identity full for real-time updates:
alter table inven_users replica identity full;
alter table inven_customers replica identity full;
alter table inven_expense_master replica identity full;
alter table inven_expense_records replica identity full;
alter table inven_generated_invoices replica identity full;
alter table inven_income_master replica identity full;
alter table inven_income_records replica identity full;
alter table inven_inventory replica identity full;
alter table inven_product_master replica identity full;
alter table inven_production replica identity full;
alter table inven_sales replica identity full;
alter table inven_settings replica identity full;
alter table inven_style_master replica identity full;
alter table inven_suppliers replica identity full;
alter table inven_transports replica identity full;
alter table inven_unit_master replica identity full;

-- Enable realtime updates publication:
alter publication supabase_realtime add table inven_users, inven_customers, inven_expense_master, inven_expense_records, inven_generated_invoices, inven_income_master, inven_income_records, inven_inventory, inven_product_master, inven_production, inven_sales, inven_settings, inven_style_master, inven_suppliers, inven_transports, inven_unit_master;`;
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const settings = localStorage.getItem('inven_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setSupplierPrefix(parsed.supplierPrefix || 'SUP');
        setNextSupplierId(parsed.nextSupplierId || 1);
        setCustomerPrefix(parsed.customerPrefix || 'CUS');
        setNextCustomerId(parsed.nextCustomerId || 1);
        setModelPrefix(parsed.modelPrefix || 'MOD');
        setNextModelId(parsed.nextModelId || 1);
        setProdPrefix(parsed.prodPrefix || 'PRD');
        setNextProdId(parsed.nextProdId || 1);
        setPurchasePrefix(parsed.purchasePrefix || 'PUR');
        
        setNextPurchaseId(parsed.nextPurchaseId !== undefined && parsed.nextPurchaseId !== '' ? Number(parsed.nextPurchaseId) : 1);
        setInvoicePrefix(parsed.invoicePrefix || 'GT');
        setInvoiceYear(parsed.invoiceYear || '25-26');
        setNextInvoiceId(parsed.nextInvoiceId || 1);
        setCompanyName(parsed.companyName || 'P.S.V & CO');
        setCompanyAddress(parsed.companyAddress || '189/92, P.V.IYER STREET, NEAR SINGAMETHAI, AMMAPET MAIN ROAD, SALEM - 636001 TAMILNADU');
        setCompanyLogo(parsed.companyLogo || '');
        setLowStockThreshold(parsed.lowStockThreshold || 10);
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    const settings = {
      supplierPrefix,
      nextSupplierId,
      customerPrefix,
      nextCustomerId,
      modelPrefix,
      nextModelId,
      prodPrefix,
      nextProdId,
      purchasePrefix,
      nextPurchaseId,
      invoicePrefix,
      invoiceYear,
      nextInvoiceId,
      companyName,
      companyAddress,
      companyLogo,
      lowStockThreshold
    };
    localStorage.setItem('inven_settings', JSON.stringify(settings));
    
    // Save Supabase Sync parameters
    localStorage.setItem('inven_supabase_sync_enabled', syncEnabled ? 'true' : 'false');
    if (customSupabaseUrl.trim()) {
      localStorage.setItem('inven_supabase_url', customSupabaseUrl.trim());
    } else {
      localStorage.removeItem('inven_supabase_url');
    }
    if (customSupabaseAnonKey.trim()) {
      localStorage.setItem('inven_supabase_anon_key', customSupabaseAnonKey.trim());
    } else {
      localStorage.removeItem('inven_supabase_anon_key');
    }
    
    // Trigger cross-view synchronization load updates
    window.dispatchEvent(new Event('inven_localstorage_sync'));
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500">Configure application preferences and ID patterns.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Company Section */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Company Profile</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Branding & Contact Info</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center group relative">
                  {companyLogo ? (
                    <>
                      <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label htmlFor="logo-upload" className="cursor-pointer text-white text-[10px] font-bold uppercase">Change</label>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">No Logo</p>
                    </div>
                  )}
                  <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</p>
                    <input 
                      type="text" 
                      value={companyName || ''}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                    />
                  </div>
                  {!companyLogo && (
                    <label htmlFor="logo-upload" className="inline-block px-4 py-2 bg-indigo-150 text-indigo-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
                      Upload Company Logo
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Address & Details</p>
                <textarea 
                  value={companyAddress || ''}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium resize-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inventory & Production IDs */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <h3 className="font-bold text-slate-800">Entity Prefix & Starting IDs</h3>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier ID Prefix</p>
                    <input 
                      type="text" 
                      value={supplierPrefix || ''}
                      onChange={(e) => setSupplierPrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starting ID</p>
                    <input 
                      type="number" 
                      value={nextSupplierId || ''}
                      onChange={(e) => setNextSupplierId(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer ID Prefix</p>
                    <input 
                      type="text" 
                      value={customerPrefix || ''}
                      onChange={(e) => setCustomerPrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starting ID</p>
                    <input 
                      type="number" 
                      value={nextCustomerId || ''}
                      onChange={(e) => setNextCustomerId(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model ID Prefix</p>
                    <input 
                      type="text" 
                      value={modelPrefix || ''}
                      onChange={(e) => setModelPrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starting ID</p>
                    <input 
                      type="number" 
                      value={nextModelId || ''}
                      onChange={(e) => setNextModelId(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Godown Transfer Prefix</p>
                    <input 
                      type="text" 
                      value={prodPrefix || ''}
                      onChange={(e) => setProdPrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starting ID</p>
                    <input 
                      type="number" 
                      value={nextProdId || ''}
                      onChange={(e) => setNextProdId(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial & Invoice Sections */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <h3 className="font-bold text-slate-800">Purchase (PUR) IDs</h3>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchase Prefix</p>
                    <input 
                      type="text" 
                      value={purchasePrefix || ''}
                      onChange={(e) => setPurchasePrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Starting ID</p>
                    <input 
                      type="number" 
                      value={nextPurchaseId || ''}
                      onChange={(e) => setNextPurchaseId(parseInt(e.target.value) || 1)}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                </div>


              </div>
            </div>

            {/* Financial & Invoice Sections */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <h3 className="font-bold text-slate-800">Invoicing IDs</h3>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Prefix</p>
                    <input 
                      type="text" 
                      value={invoicePrefix || ''}
                      onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year Part</p>
                    <input 
                      type="text" 
                      value={invoiceYear || ''}
                      onChange={(e) => setInvoiceYear(e.target.value)}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Sequence Number</p>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={nextInvoiceId || ''}
                      onChange={(e) => setNextInvoiceId(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                    <button onClick={() => setNextInvoiceId(1)} className="p-3 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock Warning Threshold</p>
                    <input 
                      type="number" 
                      value={lowStockThreshold || ''}
                      onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border-none rounded-2xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supabase Sync Settings Card */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-50 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Supabase Cloud Database</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Cloud Synchronization</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  !syncEnabled
                    ? 'bg-slate-50 text-slate-500 border-slate-100'
                    : syncState.connected && syncState.tableExists
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : syncState.connected 
                    ? 'bg-amber-50 text-amber-600 border-amber-100'
                    : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    !syncEnabled ? 'bg-slate-400' : syncState.connected && syncState.tableExists ? 'bg-emerald-500 animate-pulse' : syncState.connected ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  {!syncEnabled ? 'Offline Mode' : syncState.connected && syncState.tableExists ? 'Active Sync' : syncState.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Sync Toggle Switch */}
            <div className="flex items-center justify-between p-4 bg-emerald-50/40 rounded-2xl border border-emerald-50">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block">Automatic Cloud Synchronization</span>
                <span className="text-[11px] text-slate-500 block">
                  {syncEnabled 
                    ? 'All local data updates are automatically pushed and synchronized with your Supabase database in real-time.' 
                    : 'Sync is suspended. App is running in Local Offline-Only mode safely.'
                  }
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={syncEnabled} 
                  onChange={(e) => setSyncEnabled(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Sync Info / Custom Credentials Input Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Connection Endpoint</span>
                  <span className="font-mono font-bold text-slate-700 truncate block">
                    {customSupabaseUrl || 'https://tvzsircmxoneoghsecyz.supabase.co'}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Last Cloud Sync</span>
                  <span className="font-bold text-slate-700 block">
                    {syncState.lastSyncedAt 
                      ? syncState.lastSyncedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : 'No sync completed yet'
                    }
                  </span>
                </div>
              </div>

              {/* Custom Database Config (Expandable or always visible) */}
              <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Use Your Own Custom Supabase Instance</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Supabase URL</label>
                    <input 
                      type="text"
                      placeholder="https://your-project-id.supabase.co"
                      value={customSupabaseUrl}
                      onChange={(e) => setCustomSupabaseUrl(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Custom Anon Key</label>
                    <input 
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                      value={customSupabaseAnonKey}
                      onChange={(e) => setCustomSupabaseAnonKey(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-normal">
                  * Leave these blank to use the default database. Note: Changing credentials or toggling sync state requires clicking the general <strong>Save Settings</strong> button at the top right of this section to apply, followed by a page refresh.
                </p>
              </div>
            </div>

            {/* Action Feedback Notification */}
            {actionResult && (
              <div className={`p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 border ${
                actionResult.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                  : 'bg-rose-50 text-rose-800 border-rose-100'
              }`}>
                {actionResult.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <p>{actionResult.message}</p>
              </div>
            )}

            {/* Real-time Sync Error Notification */}
            {syncState.error && (
              <div className="p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 border bg-rose-50 text-rose-800 border-rose-100">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 font-bold" />
                <div className="space-y-1 text-left w-full">
                  <p className="font-bold">Database Sync Warning/Error:</p>
                  <p className="font-mono text-[11px] bg-white/60 p-2.5 rounded-xl border border-rose-100/60 max-h-24 overflow-y-auto select-all">{syncState.error}</p>
                  <p className="text-[11px] text-rose-700 mt-1 font-sans leading-relaxed">
                    <strong>Solution:</strong> Open your <strong>Supabase Dashboard</strong>, navigate to the <strong>SQL Editor</strong>, click <strong>"New query"</strong>, paste the complete schema/RLS SQL setup queries below, and click <strong>"Run"</strong>. This will automatically disable Row Level Security policies so clients can write, and enable real-time updates.
                  </p>
                </div>
              </div>
            )}

             {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleVerifySetup}
                disabled={syncState.syncing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer min-w-[140px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncState.syncing ? 'animate-spin' : ''}`} />
                Verify Database
              </button>
              <button 
                onClick={handlePushToCloud}
                disabled={syncState.syncing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer min-w-[140px]"
              >
                <Cloud className="w-3.5 h-3.5" />
                Push to Cloud
              </button>
              <button 
                onClick={handlePullFromCloud}
                disabled={syncState.syncing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer min-w-[140px]"
              >
                <Database className="w-3.5 h-3.5" />
                Restore from Cloud
              </button>
            </div>

            {/* SQL Instructions Accordion */}
            <div className="pt-2">
              <button 
                onClick={() => setShowSQL(!showSQL)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                {showSQL ? 'Hide Setup Instructions' : 'View Supabase Setup Guide & SQL Queries'}
              </button>

              {showSQL && (
                <div className="mt-4 p-5 bg-slate-900 text-slate-100 rounded-2xl border border-slate-850 space-y-4 font-sans text-xs animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-1">
                    <p className="font-bold text-indigo-400">Database Schema Setup Status</p>
                    <p className="text-slate-400 leading-relaxed">
                      Your database has matching tables for each models (e.g. <strong className="text-white font-medium">inven_product_master</strong>, <strong className="text-white font-medium">inven_style_master</strong>, etc.) with columns <code className="text-emerald-400 font-mono">id (text primary key)</code>, <code className="text-emerald-400 font-mono">value (jsonb)</code>, and <code className="text-emerald-400 font-mono">updated_at (timestamptz)</code>.
                    </p>
                  </div>

                  <div className="relative">
                    <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] overflow-x-auto text-slate-300 max-h-48 border border-white/5">
{`-- SQL to create any of your tables (e.g. inven_product_master):
create table if not exists inven_product_master (
  id text primary key,
  value jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime replication:
alter table inven_product_master replica identity full;
alter publication supabase_realtime add table inven_product_master;`}
                    </pre>
                    <button 
                      onClick={copySQL}
                      className="absolute right-3 top-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="text-slate-400 space-y-1 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="font-semibold text-slate-200">How real-time synchronization works:</p>
                    <ul className="list-disc list-inside space-y-1 ml-1 text-slate-300">
                      <li>Overrides default local state updates to write to cloud instantly</li>
                      <li>Implements database replication triggers to update other clients in real-time</li>
                      <li>Ensures zero-latency offline loading using local-first storage fallback</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {isSaved ? 'Preferences Saved Successfully' : 'Apply Settings & Update Formats'}
          </button>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Format Preview</h3>
              <p className="text-xs text-slate-400 font-bold">Live preview of generated IDs</p>
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'Supplier ID', val: `${supplierPrefix}-${nextSupplierId.toString().padStart(4, '0')}` },
                { label: 'Model ID', val: `${modelPrefix}-${nextModelId.toString().padStart(3, '0')}` },
                { label: 'Production ID', val: `${prodPrefix}-${nextProdId.toString().padStart(4, '0')}` },
                { label: 'Purchase ID', val: `${purchasePrefix}-${nextPurchaseId.toString().padStart(3, '0')}` },
                { label: 'Invoice No', val: `${invoicePrefix}/${invoiceYear}/${nextInvoiceId.toString().padStart(2, '0')}` }
              ].map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-[24px] backdrop-blur-sm">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-xl font-mono font-black tracking-tighter">{item.val}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-indigo-600/20 rounded-[24px] border border-indigo-500/30 relative z-10">
            <p className="text-xs font-bold leading-relaxed text-indigo-200">
              Patterns update as you type. These formats will be applied to all new records created across the system.
            </p>
          </div>

          {/* Abstract blobs */}
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute -left-20 top-40 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
