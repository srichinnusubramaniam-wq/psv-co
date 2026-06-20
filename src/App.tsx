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
      case 'purchase':
        return <Inventory />;
      case 'production':
      case 'godown transfer':
        return (
          <ProductionUnits 
            autoOpenForm={(currentView === 'production' || currentView === 'godown transfer') && (openFormOnView === 'production' || openFormOnView === 'godown transfer')} 
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
      </div>
    </div>
  );
}
