/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from '@/src/components/Sidebar';
import Header from '@/src/components/Header';
import Dashboard from '@/src/components/Dashboard';
import Inventory from '@/src/components/Inventory';
import ProductionUnits from '@/src/components/ProductionUnits';
import ProductMaster from '@/src/components/ProductMaster';
import Invoice from '@/src/components/Invoice';
import Expenses from '@/src/components/Expenses';
import Income from '@/src/components/Income';
import Reports from '@/src/components/Reports';
import Settings from '@/src/components/Settings';
import { Plus, X, FileText, Receipt, Factory } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [openFormOnView, setOpenFormOnView] = useState<string | null>(null);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const handleSync = () => {
      setReloadKey(prev => prev + 1);
    };
    window.addEventListener('inven_localstorage_sync', handleSync);
    return () => window.removeEventListener('inven_localstorage_sync', handleSync);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'production':
        return (
          <ProductionUnits 
            autoOpenForm={currentView === 'production' && openFormOnView === 'production'} 
            onFormOpened={() => setOpenFormOnView(null)} 
          />
        );
      case 'master':
        return <ProductMaster />;
      case 'invoice':
        return (
          <Invoice 
            autoOpenSaleForm={currentView === 'invoice' && openFormOnView === 'invoice'} 
            onFormOpened={() => setOpenFormOnView(null)} 
          />
        );
      case 'record expense':
        return (
          <Expenses 
            autoOpenForm={currentView === 'record expense' && openFormOnView === 'record expense'} 
            onFormOpened={() => setOpenFormOnView(null)} 
          />
        );
      case 'record income':
        return <Income />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-lg font-medium">Coming Soon</p>
            <p className="text-sm">The {currentView} feature is currently under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      <div className="flex-1 ml-64 min-h-screen flex flex-col relative">
        <Header onViewChange={setCurrentView} />

        <main className="flex-1 p-8 space-y-8 max-w-[1600px] overflow-x-hidden" key={reloadKey}>
          {renderView()}
        </main>

        <footer className="py-6 px-8 text-center text-slate-400 text-[10px]">
          © 2026 INVEN Inventory Systems. All rights reserved.
        </footer>

        {/* Floating Action Button (FAB) and menu */}
        <div id="fab-container" className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
          {/* Backdrop dimming layer to help guide focus to open action items */}
          {isFabOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] z-[99]" 
              onClick={() => setIsFabOpen(false)} 
            />
          )}

          {/* Expanded FAB Menu items */}
          {isFabOpen && (
            <div className="mb-4 flex flex-col gap-3.5 items-end relative z-[101] animate-in fade-in slide-in-from-bottom-5 duration-200">
              {/* Record Sale Action */}
              <div className="flex items-center gap-3 group">
                <span className="text-[11px] font-extrabold text-slate-600 bg-white px-3.5 py-2 rounded-2xl border border-slate-100 shadow-md transition-all group-hover:scale-105 select-none whitespace-nowrap">
                  Record Sale
                </span>
                <button
                  onClick={() => {
                    setCurrentView('invoice');
                    setOpenFormOnView('invoice');
                    setIsFabOpen(false);
                  }}
                  className="w-12 h-12 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                  title="Record Sale"
                >
                  <FileText className="w-5 h-5" />
                </button>
              </div>

              {/* Record Expense Action */}
              <div className="flex items-center gap-3 group">
                <span className="text-[11px] font-extrabold text-slate-600 bg-white px-3.5 py-2 rounded-2xl border border-slate-100 shadow-md transition-all group-hover:scale-105 select-none whitespace-nowrap">
                  Record Expense
                </span>
                <button
                  onClick={() => {
                    setCurrentView('record expense');
                    setOpenFormOnView('record expense');
                    setIsFabOpen(false);
                  }}
                  className="w-12 h-12 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                  title="Record Expense"
                >
                  <Receipt className="w-5 h-5" />
                </button>
              </div>

              {/* Assign Production Action */}
              <div className="flex items-center gap-3 group">
                <span className="text-[11px] font-extrabold text-slate-600 bg-white px-3.5 py-2 rounded-2xl border border-slate-100 shadow-md transition-all group-hover:scale-105 select-none whitespace-nowrap">
                  Assign Production
                </span>
                <button
                  onClick={() => {
                    setCurrentView('production');
                    setOpenFormOnView('production');
                    setIsFabOpen(false);
                  }}
                  className="w-12 h-12 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
                  title="Assign Production"
                >
                  <Factory className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Trigger Button */}
          <button
            id="fab-trigger"
            onClick={() => setIsFabOpen(!isFabOpen)}
            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 relative z-[101] cursor-pointer hover:scale-105 active:scale-95"
          >
            {isFabOpen ? (
              <X className="w-6 h-6 transition-transform duration-300 rotate-90" />
            ) : (
              <Plus className="w-6 h-6 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
