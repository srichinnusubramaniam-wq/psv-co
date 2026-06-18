import React, { useState, useEffect } from 'react';
import StatCard from '@/src/components/dashboard/StatCard';
import SalesChart from '@/src/components/dashboard/SalesChart';
import TopProducts from '@/src/components/dashboard/TopProducts';
import LowStockTable from '@/src/components/dashboard/LowStockTable';
import AccountReceivable from '@/src/components/dashboard/AccountReceivable';
import UsersDonut from '@/src/components/dashboard/UsersDonut';
import { ShoppingBag, IndianRupee, CheckCircle, AlertOctagon, TrendingDown, Users } from 'lucide-react';

export default function Dashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [threshold, setThreshold] = useState<number>(10);

  useEffect(() => {
    try {
      const savedInvoices = JSON.parse(localStorage.getItem('inven_generated_invoices') || '[]');
      const savedExpenses = JSON.parse(localStorage.getItem('inven_expense_records') || '[]');
      const savedIncomes = JSON.parse(localStorage.getItem('inven_income_records') || '[]');
      const savedInventory = JSON.parse(localStorage.getItem('inven_inventory') || '[]');
      const savedCustomers = JSON.parse(localStorage.getItem('inven_customers') || '[]');
      const savedSettings = JSON.parse(localStorage.getItem('inven_settings') || '{}');

      setInvoices(savedInvoices);
      setExpenses(savedExpenses);
      setIncomes(savedIncomes);
      setInventory(savedInventory);
      setCustomers(savedCustomers);
      setThreshold(Number(savedSettings.lowStockThreshold) || 10);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, []);

  // Compute metrics
  const totalSalesVal = invoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const totalCollectedInvoices = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalOtherIncome = incomes.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
  const totalRevenueVal = totalCollectedInvoices + totalOtherIncome;

  const totalDeliveredOrdersCount = invoices.length;
  const outstandingDeliveredVal = invoices.reduce((sum, inv) => {
    const total = Number(inv.totalAmount) || 0;
    const paid = Number(inv.paidAmount) || 0;
    return sum + Math.max(0, total - paid);
  }, 0);

  const totalExpensesVal = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const customerCountVal = customers.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Row: Mini Stats - High-Fidelity Multi-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard 
          label="Total Sales" 
          value={`₹${totalSalesVal.toLocaleString()}`} 
          change={`${invoices.length > 0 ? '+12%' : '0%'}`} 
          isPositive={true} 
          index={0}
          icon={<ShoppingBag className="w-4 h-4" />}
        />
        <StatCard 
          label="Total Revenue" 
          value={`₹${totalRevenueVal.toLocaleString()}`} 
          change={`${totalRevenueVal > 0 ? '+8%' : '0%'}`} 
          isPositive={true} 
          index={1}
          icon={<IndianRupee className="w-4 h-4" />}
        />
        <StatCard 
          label="Delivered Order" 
          value={String(totalDeliveredOrdersCount)} 
          change={`${totalDeliveredOrdersCount > 0 ? '+5' : '---'}`} 
          isPositive={totalDeliveredOrdersCount > 0} 
          index={2}
          icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
        />
        <StatCard 
          label="Outstanding Dues" 
          value={`₹${outstandingDeliveredVal.toLocaleString()}`} 
          change={`${outstandingDeliveredVal > 0 ? 'Action Reqd' : 'Healthy'}`} 
          isPositive={outstandingDeliveredVal === 0} 
          index={3}
          icon={<AlertOctagon className="w-4 h-4 text-rose-500" />}
        />
        <StatCard 
          label="Expenses" 
          value={`₹${totalExpensesVal.toLocaleString()}`} 
          change={`${totalExpensesVal > 0 ? 'Expenditure' : '0'}`} 
          isPositive={false} 
          index={4}
          icon={<TrendingDown className="w-4 h-4 text-amber-500" />}
        />
        <StatCard 
          label="No. of Customers" 
          value={String(customerCountVal)} 
          change={`${customerCountVal > 0 ? 'Active' : 'Empty'}`} 
          isPositive={customerCountVal > 0} 
          index={5}
          icon={<Users className="w-4 h-4 text-indigo-500" />}
        />
      </div>

      {/* Middle Row: Main Charts and Top Selling */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <SalesChart />
        </div>
        <TopProducts />
      </div>

      {/* Bottom Grid: Tables and Small Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <LowStockTable />
        <AccountReceivable />
        <UsersDonut />
      </div>
    </div>
  );
}
