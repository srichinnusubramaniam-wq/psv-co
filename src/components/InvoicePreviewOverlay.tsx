import React from 'react';
import { 
  Download, 
  CheckCircle2, 
  X, 
  Plus 
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Local editable components inside the overlay file to keep it modular and robust
const EditableInvoiceField = ({
  value,
  onChange,
  className = "",
  placeholder = "",
  type = "text",
  as = "input",
  rows = 1
}: {
  value: string | number;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  type?: string;
  as?: 'input' | 'textarea';
  rows?: number;
}) => {
  return (
    <div className="relative group/field inline-block w-full">
      <span className="hidden print:inline font-bold text-slate-900 break-words whitespace-pre-wrap">{value}</span>
      <span className="print:hidden w-full block">
        {as === 'textarea' ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className={cn(
              "w-full bg-slate-50/50 hover:bg-slate-100/80 focus:bg-white border-b border-dashed border-slate-300 rounded px-1.5 py-1 text-sm font-bold text-slate-800 outline-none transition-all resize-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500",
              className
            )}
          />
        ) : (
          <input
            type={type}
            value={value === undefined || value === null ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            onWheel={(e) => type === 'number' && e.currentTarget.blur()}
            placeholder={placeholder}
            className={cn(
              "w-full bg-slate-50/50 hover:bg-slate-100/80 focus:bg-white border-b border-dashed border-slate-300 rounded px-1 py-0.5 text-sm font-bold text-slate-800 outline-none transition-all focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500",
              className
            )}
          />
        )}
      </span>
    </div>
  );
};

const EditableInvoiceSelect = ({
  value,
  onChange,
  options,
  className = ""
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  className?: string;
}) => {
  return (
    <div className="relative inline-block w-full">
      <span className="hidden print:inline font-bold text-slate-900">{value}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "print:hidden w-full bg-slate-50/50 hover:bg-slate-100/80 focus:bg-white border-b border-dashed border-slate-300 rounded px-1.5 py-1 text-sm font-bold text-slate-800 outline-none transition-all h-[32px] cursor-pointer focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500",
          className
        )}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
};

interface InvoicePreviewOverlayProps {
  previewInvoice: any;
  updatePreviewField: (field: string, value: any) => void;
  updatePreviewBuyerField: (field: string, value: any) => void;
  updatePreviewItem: (idx: number, field: string, value: any) => void;
  removePreviewItem: (idx: number) => void;
  addPreviewItem: () => void;
  appSettings: any;
  setPreviewInvoice: (val: any) => void;
  finalizeInvoice: () => void;
}

export const InvoicePreviewOverlay: React.FC<InvoicePreviewOverlayProps> = ({
  previewInvoice,
  updatePreviewField,
  updatePreviewBuyerField,
  updatePreviewItem,
  removePreviewItem,
  addPreviewItem,
  appSettings,
  setPreviewInvoice,
  finalizeInvoice
}) => {
  const isTamilNadu = (() => {
    if (previewInvoice.buyer?.gstin && previewInvoice.buyer.gstin.trim().length >= 2) {
      const stateCode = previewInvoice.buyer.gstin.trim().substring(0, 2);
      if (/^\d+$/.test(stateCode)) {
        return stateCode === '33';
      }
    }
    if (previewInvoice.buyer?.address) {
      const addrUpper = previewInvoice.buyer.address.toUpperCase();
      return addrUpper.includes('TAMIL') || addrUpper.includes('TN') || addrUpper.includes('33');
    }
    return true; // default to local state
  })();

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto invoice-print-parent print:static print:block print:w-full print:h-auto print:bg-white print:p-0">
      <div className="bg-white w-full max-w-[850px] shadow-2xl rounded-[10px] overflow-hidden my-8 invoice-print-container">
        {/* Action Bar (Not part of print) */}
        <div className="bg-slate-800 p-4 flex items-center justify-between no-print">
          <div className="flex flex-col">
            <h4 className="text-white font-bold text-sm">Invoice Builder & Preview</h4>
            <p className="text-slate-400 text-[11px]">Click on any field to edit directly. Recalculation is automatic.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setPreviewInvoice(null)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-600 cursor-pointer"
            >
              Close
            </button>
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-indigo-500 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button 
              onClick={finalizeInvoice}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-500 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Save Invoice
            </button>
          </div>
        </div>

        {/* Actual Invoice Content */}
        <div className="p-6 md:p-8 bg-white min-h-[920px] print:min-h-0 print:p-2 print:m-0 text-slate-900 leading-normal border-[1px] border-slate-800 m-2 md:m-4">
          <div className="border-[1.5px] border-slate-800 p-0">
            {/* Header */}
            <div className="grid grid-cols-[120px_1fr_150px] border-b-[1.5px] border-slate-800 p-4 items-center bg-white">
              {/* Left Column: Logo */}
              <div className="flex justify-start">
                <div className="w-[100px] h-[100px] bg-white flex items-center justify-center border border-slate-200 overflow-hidden">
                  {appSettings.companyLogo ? (
                    <img 
                      src={appSettings.companyLogo} 
                      alt="Logo" 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-serif italic text-3xl font-bold text-slate-800">V</span>
                  )}
                </div>
              </div>

              {/* Center Column: Company Information */}
              <div className="text-center flex flex-col items-center space-y-1">
                {/* Small symbol above 'V' in P.S.V */}
                <div className="text-xs font-bold text-slate-700 tracking-widest leading-none">
                  ≌
                </div>
                <div className="text-3xl font-black uppercase tracking-wider text-red-800 flex flex-col items-center leading-none">
                  <span className="text-center font-black text-3xl text-red-800 tracking-wider">
                    {previewInvoice.companyName || 'P.S.V & CO'}
                  </span>
                </div>
                {!((previewInvoice.companyAddress || '').toUpperCase().includes('MFRS') || (previewInvoice.companyAddress || '').toUpperCase().includes('HANDLOOM')) && (
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
                    Mfrs. & Wholesale Handloom Cloth Merchants
                  </div>
                )}
                <div className="text-[10px] font-bold text-slate-700 whitespace-pre-line leading-normal text-center uppercase">
                  {previewInvoice.companyAddress || ''}
                </div>
                <div className="bg-[#fcf8ef] border border-amber-200/60 px-4 py-0.5 mt-1 rounded-sm">
                  <div className="text-[11px] font-black tracking-wider text-slate-800 flex items-center justify-center gap-1">
                    <span>GSTIN:</span>
                    <EditableInvoiceField
                      value={previewInvoice.companyGstin || ''}
                      onChange={(val) => updatePreviewField('companyGstin', val)}
                      className="font-black text-[11px] bg-transparent p-0 border-none h-auto w-32 text-left outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Contact & Brand Box */}
              <div className="flex flex-col items-end justify-between h-full py-1 space-y-3">
                <div className="text-[12px] font-black text-slate-900 flex items-center gap-1">
                  <span className="text-slate-700 text-[14px]">Å</span>
                  <EditableInvoiceField
                    value={previewInvoice.companyPhone || ''}
                    onChange={(val) => updatePreviewField('companyPhone', val)}
                    className="font-black text-[12px] bg-transparent p-0 border-none h-auto w-28 text-right outline-none"
                  />
                </div>
                
                <div className="border-2 border-blue-900 px-4 py-1.5 text-center rounded-sm bg-white">
                  <span className="font-serif font-black text-2xl tracking-widest text-blue-900 leading-none">PSV</span>
                </div>
              </div>
            </div>

            {/* Billed To / TAX INVOICE Header Banner Grid */}
            <div className="grid grid-cols-2 border-b-[1.5px] border-slate-800">
              {/* Left column title: Billed To */}
              <div className="bg-[#eec5a8] text-slate-900 font-extrabold text-[12px] uppercase text-center py-1 tracking-wider border-r-[1.5px] border-slate-800">
                Billed To
              </div>
              {/* Right column title: TAX INVOICE */}
              <div className="bg-[#f1b3d0] text-slate-900 font-extrabold text-[12px] uppercase text-center py-1 tracking-wider">
                TAX INVOICE
              </div>
            </div>

            {/* Billed To / TAX INVOICE Details Content Grid */}
            <div className="grid grid-cols-2 border-b-[1.5px] border-slate-800">
              {/* Left Column Content: Buyer Details */}
              <div className="p-3 border-r-[1.5px] border-slate-800 flex flex-col justify-between text-[11px] space-y-1 bg-white">
                <div className="space-y-1">
                  <div className="font-black text-sm uppercase flex items-center">
                    <span className="mr-1">M/s.</span>
                    <span className="font-black text-sm uppercase">{previewInvoice.buyer?.name || ''}</span>
                  </div>
                  {previewInvoice.buyerSubHeader && (
                    <div className="text-[11px] font-bold text-slate-700 uppercase">
                      {previewInvoice.buyerSubHeader}
                    </div>
                  )}
                  <div className="text-[11px] font-bold text-slate-800 whitespace-pre-line leading-relaxed uppercase">
                    {previewInvoice.buyer?.address || ''}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1 font-black">
                    <span>GSTIN:</span>
                    <span className="font-black text-[11px] uppercase">{previewInvoice.buyer?.gstin || ''}</span>
                  </div>
                  
                  {previewInvoice.buyer?.phone && (
                    <div className="border border-slate-400 px-2 py-0.5 text-[11px] font-bold rounded-sm flex items-center gap-1 bg-white">
                      <span>Phone:</span>
                      <span className="font-bold text-[11px]">{previewInvoice.buyer?.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column Content: Invoice Details */}
              <div className="p-3 text-[12px] flex flex-col justify-center space-y-3 bg-white">
                <div className="flex items-center">
                  <span className="w-24 font-extrabold text-slate-800">Bill No.:</span>
                  <span className="font-black flex-1 flex items-center text-[13px]">
                    <EditableInvoiceField
                      value={previewInvoice.invoiceNo}
                      onChange={(val) => updatePreviewField('invoiceNo', val)}
                      className="font-black text-[13px] bg-transparent p-0 border-none h-auto outline-none"
                    />
                  </span>
                </div>
                
                <div className="flex items-center">
                  <span className="w-24 font-extrabold text-slate-800">Date:</span>
                  <span className="font-black flex-1 flex items-center">
                    <EditableInvoiceField
                      value={previewInvoice.date}
                      onChange={(val) => updatePreviewField('date', val)}
                      className="font-black bg-transparent p-0 border-none h-auto outline-none"
                    />
                  </span>
                </div>
              </div>
            </div>

            {/* Transport & Logistics Section */}
            <div className="grid grid-cols-2 border-b-[1.5px] border-slate-800 text-[11px] font-bold bg-white">
              {/* Left Block */}
              <div className="p-2 border-r-[1.5px] border-slate-800 space-y-1">
                <div className="flex items-center">
                  <span className="w-20 text-slate-700">Source</span>
                  <span className="font-black flex-1 flex items-center">
                    :&nbsp;
                    <EditableInvoiceField
                      value={previewInvoice.source || 'SALEM'}
                      onChange={(val) => updatePreviewField('source', val)}
                      className="font-black bg-transparent p-0 border-none h-auto outline-none uppercase"
                    />
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-20 text-slate-700">LR No.</span>
                  <span className="font-black flex-1 flex items-center gap-1">
                    :&nbsp;
                    <EditableInvoiceField
                      value={previewInvoice.lrNo || ''}
                      onChange={(val) => updatePreviewField('lrNo', val)}
                      placeholder="LR No"
                      className="font-black bg-transparent p-0 border-none h-auto w-24 outline-none uppercase"
                    />
                    <span className="text-slate-500 font-normal">Date:</span>
                    <EditableInvoiceField
                      value={previewInvoice.lrDate || ''}
                      onChange={(val) => updatePreviewField('lrDate', val)}
                      placeholder="LR Date"
                      className="font-black bg-transparent p-0 border-none h-auto w-24 outline-none"
                    />
                  </span>
                </div>
              </div>

              {/* Right Block */}
              <div className="p-2 space-y-1">
                <div className="flex items-center">
                  <span className="w-36 text-slate-700">Despatched Through</span>
                  <span className="font-black flex-1 flex items-center">
                    :&nbsp;
                    <EditableInvoiceField
                      value={previewInvoice.despatchedThrough || ''}
                      onChange={(val) => updatePreviewField('despatchedThrough', val)}
                      className="font-black bg-transparent p-0 border-none h-auto outline-none uppercase"
                    />
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-36 text-slate-700">No. of Bundles</span>
                  <span className="font-black flex-1 flex items-center">
                    :&nbsp;
                    <EditableInvoiceField
                      value={previewInvoice.noOfBundles || ''}
                      onChange={(val) => updatePreviewField('noOfBundles', val)}
                      placeholder="Bundles"
                      className="font-black bg-transparent p-0 border-none h-auto outline-none w-16"
                    />
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 flex flex-col min-h-[200px] print:min-h-0 border-b-[1.5px] border-slate-800 bg-white">
              <table className="w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="bg-[#f1b3d0] text-slate-900 font-extrabold text-center border-b-[1.5px] border-slate-800">
                    <th className="p-2 border-r-[1.5px] border-slate-800 w-12 text-center text-[11px]">S.No.</th>
                    <th className="p-2 border-r-[1.5px] border-slate-800 text-[11px]">Description</th>
                    <th className="p-2 border-r-[1.5px] border-slate-800 w-24 text-center text-[11px]">HSN</th>
                    <th className="p-2 border-r-[1.5px] border-slate-800 w-20 text-center text-[11px]">Qty / Pcs</th>
                    <th className="p-2 border-r-[1.5px] border-slate-800 w-16 text-center text-[11px]">Unit</th>
                    <th className="p-2 border-r-[1.5px] border-slate-800 w-24 text-center text-[11px]">Rate/Unit</th>
                    <th className="p-2 w-32 text-center text-[11px]">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {previewInvoice.items.map((item: any, idx: number) => (
                    <tr key={item.id || idx} className="border-b-[1.5px] border-slate-200">
                      <td className="p-2 border-r-[1.5px] border-slate-800 text-center font-bold">{idx + 1}</td>
                      
                      <td className="p-1 border-r-[1.5px] border-slate-800 font-black uppercase text-[11px] whitespace-normal break-words leading-tight">
                        <EditableInvoiceField
                          value={item.modelName}
                          onChange={(val) => updatePreviewItem(idx, 'modelName', val)}
                          as="textarea"
                          rows={2}
                          className="font-black text-[11px] bg-transparent p-0 border-none h-auto outline-none resize-none leading-tight whitespace-normal break-words"
                        />
                      </td>
                      
                      <td className="p-1 border-r-[1.5px] border-slate-800 text-center">
                        <EditableInvoiceField
                          value={item.hsn || '52082910'}
                          onChange={(val) => updatePreviewItem(idx, 'hsn', val)}
                          className="text-center font-bold text-[11px] bg-transparent p-0 border-none h-auto outline-none"
                        />
                      </td>
                      
                      <td className="p-1 border-r-[1.5px] border-slate-800 text-right pr-2">
                        <EditableInvoiceField
                          type="number"
                          value={item.quantity}
                          onChange={(val) => updatePreviewItem(idx, 'quantity', parseFloat(val) || 0)}
                          className="text-right font-black text-[11px] bg-transparent p-0 border-none h-auto outline-none"
                        />
                      </td>
                      
                      <td className="p-1 border-r-[1.5px] border-slate-800 text-center font-bold text-[11px] text-slate-800">
                        Pcs
                      </td>
                      
                      <td className="p-1 border-r-[1.5px] border-slate-800 text-right pr-2">
                        <EditableInvoiceField
                          type="number"
                          value={item.unitPrice}
                          onChange={(val) => updatePreviewItem(idx, 'unitPrice', parseFloat(val) || 0)}
                          className="text-right font-black text-[11px] bg-transparent p-0 border-none h-auto outline-none"
                        />
                      </td>
                      
                      <td className="p-2 text-right font-black pr-4">
                        {(item.totalCost || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  
                  {/* Filler empty rows to give natural document space */}
                  {Array.from({ length: Math.max(1, 5 - previewInvoice.items.length) }).map((_, i) => (
                    <tr key={`filler-${i}`} className="border-b-[0.5px] border-slate-100">
                      <td className="p-2 border-r-[1.5px] border-slate-800 h-8"></td>
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
                  <tr className="bg-[#fcf8ef] text-slate-900 font-black text-center border-t-[1.5px] border-b-[1.5px] border-slate-800 uppercase">
                    <td colSpan={3} className="p-2 border-r-[1.5px] border-slate-800 text-right pr-4 font-black">TOTAL :</td>
                    <td className="p-2 border-r-[1.5px] border-slate-800 text-right pr-2 font-black">{previewInvoice.totalQty}</td>
                    <td className="p-2 border-r-[1.5px] border-slate-800"></td>
                    <td className="p-2 border-r-[1.5px] border-slate-800"></td>
                    <td className="p-2 text-right pr-4 font-black">
                      {(previewInvoice.items.reduce((sum: number, s: any) => sum + (Number(s.totalCost) || 0), 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Final Section: Calculations and Bank Details */}
            <div className="grid grid-cols-[1.2fr_1fr] border-b-[1.5px] border-slate-800 bg-white">
              {/* Left Bottom Section: Bank Details */}
              <div className="border-r-[1.5px] border-slate-800 flex flex-col justify-between">
                <div className="p-3 text-[11px] font-bold space-y-1 bg-white">
                  <p className="font-extrabold underline mb-1 uppercase tracking-wider text-slate-700">BANK DETAILS</p>
                  
                  <div className="flex items-center">
                    <span className="w-24 text-slate-600">Bank Name</span>
                    <span className="font-black flex-1 flex items-center">
                      :&nbsp;
                      <EditableInvoiceField
                        value={previewInvoice.bankName || 'THE KARUR VYSYA BANK LTD'}
                        onChange={(val) => updatePreviewField('bankName', val)}
                        className="font-black text-[11px] bg-transparent p-0 border-none h-auto outline-none uppercase"
                      />
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-24 text-slate-600">Branch</span>
                    <span className="font-black flex-1 flex items-center">
                      :&nbsp;
                      <EditableInvoiceField
                        value={previewInvoice.bankBranch || 'THATHIENGARPET'}
                        onChange={(val) => updatePreviewField('bankBranch', val)}
                        className="font-black text-[11px] bg-transparent p-0 border-none h-auto outline-none uppercase"
                      />
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-24 text-slate-600">A/c No.</span>
                    <span className="font-black flex-1 flex items-center">
                      :&nbsp;
                      <EditableInvoiceField
                        value={previewInvoice.bankAccNo || '1192115000001283'}
                        onChange={(val) => updatePreviewField('bankAccNo', val)}
                        className="font-black text-[11px] bg-transparent p-0 border-none h-auto outline-none uppercase"
                      />
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-24 text-slate-600">IFSC Code</span>
                    <span className="font-black flex-1 flex items-center">
                      :&nbsp;
                      <EditableInvoiceField
                        value={previewInvoice.bankIfsc || 'KVBL0001192'}
                        onChange={(val) => updatePreviewField('bankIfsc', val)}
                        className="font-black text-[11px] bg-transparent p-0 border-none h-auto outline-none uppercase"
                      />
                    </span>
                  </div>

                  <div className="flex items-center pt-1 border-t border-slate-100">
                    <span className="w-24 text-slate-600 font-extrabold uppercase">Packing Slip No.</span>
                    <span className="font-black flex-1 flex items-center">
                      :&nbsp;
                      <EditableInvoiceField
                        value={previewInvoice.packingSlipNo || ''}
                        onChange={(val) => updatePreviewField('packingSlipNo', val)}
                        placeholder="Optional"
                        className="font-black text-[11px] bg-transparent p-0 border-none h-auto outline-none uppercase"
                      />
                    </span>
                  </div>
                </div>
                
                {/* Amount in words */}
                <div className="p-2 border-t-[1.5px] border-slate-800 bg-[#fcf8ef]/40 text-[10px] font-bold">
                  <div className="leading-relaxed text-slate-800 uppercase">
                    ( RUPEES <span className="font-black text-slate-950 italic">{previewInvoice.amountInWords}</span> ONLY. )
                  </div>
                </div>
              </div>

              {/* Right Bottom Section: Tax & Totals */}
              <div className="flex flex-col justify-between text-[11px] font-bold bg-white">
                <div className="p-3 space-y-1.5">
                  {/* Sub Total */}
                  <div className="grid grid-cols-[1fr_100px] items-center text-slate-800">
                    <span className="font-extrabold">Sub Total</span>
                    <span className="font-black text-right text-[11px]">
                      {(previewInvoice.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Packing charges */}
                  <div className="grid grid-cols-[1fr_100px] items-center text-slate-800 border-t border-dashed border-slate-200 pt-1.5">
                    <span className="font-extrabold">Packing Charges</span>
                    <div className="w-full flex justify-end">
                      <EditableInvoiceField
                        type="number"
                        value={previewInvoice.packingCharges || 0}
                        onChange={(val) => updatePreviewField('packingCharges', parseFloat(val) || 0)}
                        className="text-right font-black bg-transparent border-none p-0 h-auto outline-none text-[11px] w-20 text-right pr-0"
                      />
                    </div>
                  </div>

                  {/* CGST & SGST (In State) */}
                  {!previewInvoice.isNonGst && isTamilNadu && (
                    <>
                      {/* CGST */}
                      <div className="grid grid-cols-[1fr_100px] items-center text-slate-800">
                        <span className="flex items-center gap-1 font-bold">
                          CGST
                          <EditableInvoiceSelect
                            value={`${previewInvoice.cgstPercent !== undefined ? previewInvoice.cgstPercent : 2.5}%`}
                            onChange={(val) => updatePreviewField('cgstPercent', parseFloat(val.replace('%', '')) || 0)}
                            options={['0%', '1%', '2.5%', '5%', '6%', '9%', '12%', '14%', '18%']}
                            className="w-12 bg-transparent border-none p-0 h-auto text-slate-700 font-extrabold outline-none text-[11px]"
                          />
                        </span>
                        <span className="font-black text-right text-[11px]">
                          {(previewInvoice.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* SGST */}
                      <div className="grid grid-cols-[1fr_100px] items-center text-slate-800">
                        <span className="flex items-center gap-1 font-bold">
                          SGST
                          <EditableInvoiceSelect
                            value={`${previewInvoice.sgstPercent !== undefined ? previewInvoice.sgstPercent : 2.5}%`}
                            onChange={(val) => updatePreviewField('sgstPercent', parseFloat(val.replace('%', '')) || 0)}
                            options={['0%', '1%', '2.5%', '5%', '6%', '9%', '12%', '14%', '18%']}
                            className="w-12 bg-transparent border-none p-0 h-auto text-slate-700 font-extrabold outline-none text-[11px]"
                          />
                        </span>
                        <span className="font-black text-right text-[11px]">
                          {(previewInvoice.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  )}

                  {/* IGST (Interstate) */}
                  {!previewInvoice.isNonGst && !isTamilNadu && (
                    <div className="grid grid-cols-[1fr_100px] items-center text-slate-800">
                      <span className="flex items-center gap-1 font-bold">
                        IGST @ (
                        <EditableInvoiceSelect
                          value={`${previewInvoice.igstPercent !== undefined ? previewInvoice.igstPercent : 5.0}%`}
                          onChange={(val) => updatePreviewField('igstPercent', parseFloat(val.replace('%', '')) || 0)}
                          options={['0%', '2%', '5%', '12%', '18%', '28%']}
                          className="w-12 bg-transparent border-none p-0 h-auto text-slate-700 font-extrabold outline-none text-[11px]"
                        />
                        )
                      </span>
                      <span className="font-black text-right text-[11px]">
                        {(previewInvoice.igst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}



                  {/* Round Off */}
                  <div className="grid grid-cols-[1fr_100px] items-center text-slate-800 border-t border-dashed border-slate-200 pt-1.5">
                    <span className="font-extrabold">Rounded Off</span>
                    <div className="w-full flex justify-end">
                      <EditableInvoiceField
                        type="number"
                        value={previewInvoice.roundOff || 0}
                        onChange={(val) => updatePreviewField('roundOff', parseFloat(val) || 0)}
                        className="text-right font-black bg-transparent border-none p-0 h-auto outline-none text-[11px] w-20 text-right pr-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Final Net Amount highlighting bar */}
                <div className="border-t-[1.5px] border-slate-800 p-2 bg-[#fcf8ef] grid grid-cols-[1fr_100px] items-center">
                  <span className="text-xs font-black uppercase text-slate-800">Grand Total :</span>
                  <span className="text-sm font-black text-slate-900 text-right">
                    ₹{(previewInvoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Notes and Signature */}
            <div className="grid grid-cols-[1fr_250px] border-t-[1.5px] border-slate-800 min-h-[100px] print:min-h-0 items-stretch bg-white">
              <div className="p-3 border-r-[1.5px] border-slate-800 text-[10px] text-slate-800 font-bold leading-relaxed flex flex-col justify-end space-y-1">
                <p className="italic font-normal">Subject to Salem Jurisdiction.</p>
                <p className="italic font-bold">We are not responsible for any loss or damage in transit.</p>
              </div>
              <div className="text-center flex flex-col justify-between py-3 px-2 bg-white">
                <p className="text-[11px] font-black uppercase tracking-wider text-blue-900">
                  For {previewInvoice.companyName || 'P.S.V & CO'}
                </p>
                <div className="h-10"></div> {/* Space for signature */}
                <p className="text-[10px] font-bold italic text-blue-800">Authorised Signatory</p>
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="mt-2 print:mt-1 border-[1px] border-slate-800 text-[10px] p-2 flex items-center justify-between bg-slate-50/20">
            <p><span className="font-black">Declaration:</span> We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
            <p className="font-bold">Page No : 1 of 1</p>
          </div>

          <div className="mt-2 print:mt-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {previewInvoice.companyName || 'P.S.V & CO'}, {previewInvoice.companyAddress?.split('\n')[0] || ''}
          </div>
        </div>
      </div>
    </div>
  );
};
