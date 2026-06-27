import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';

export default function Settings() {
  const [supplierPrefix, setSupplierPrefix] = useState('SUP');
  const [nextSupplierId, setNextSupplierId] = useState(1);
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

  useEffect(() => {
    const settings = localStorage.getItem('inven_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setSupplierPrefix(parsed.supplierPrefix || 'SUP');
        setNextSupplierId(parsed.nextSupplierId || 1);
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
                    <label htmlFor="logo-upload" className="inline-block px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-100 transition-colors">
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
                <h3 className="font-bold text-slate-800">Godown Transfer IDs</h3>
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
