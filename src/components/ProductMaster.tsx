import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Tag, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Trash2, 
  Edit2, 
  X, 
  ChevronRight, 
  Monitor, 
  Factory,
  Users,
  Warehouse,
  Download
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { STATES_AND_DISTRICTS } from '@/src/data/indiaData';

export interface ProductModel {
  id: string;
  name: string;
  code: string;
  description: string;
  productGroupName: string;
  hsn: string;
  createdAt: string;
 
}

export interface ProductionUnitMaster {
  id: string;
  name: string;
  location?: string;
 
  modelRates?: { modelId: string; rate: number }[];
}

export interface SupplierMaster {
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
  relationType?: 'supplier' | 'both';
  createdAt: string;
}

export interface ExpenseMaster {
  id: string;
  name: string;
  createdAt: string;
}

export interface IncomeMaster {
  id: string;
  name: string;
  createdAt: string;
}

export interface TransportMaster {
  id: string;
  name: string;
  gstin?: string;
  mode?: string;
  createdAt: string;
}

export interface StyleMaster {
  id: string;
  name: string;
  createdAt: string;
}

export interface CustomerMaster {
  id: string;
  name: string;
  phone?: string;
  mobileNumber?: string;
  email?: string;
  address: string;
  pincode?: string;
  state?: string;
  district?: string;
  gstNumber: string;
  tcsApplicable?: 'YES' | 'NO';
  openingBalance?: number;
  createdAt: string;
}

export default function ProductMaster() {
  const [activeTab, setActiveTabState] = useState<'models' | 'units' | 'suppliers' | 'expenses' | 'income' | 'customers' | 'transports' | 'styles'>(() => {
    const saved = localStorage.getItem('inven_master_active_tab');
    if (saved && ['models', 'units', 'suppliers', 'expenses', 'income', 'customers', 'transports', 'styles'].includes(saved)) {
      return saved as any;
    }
    return 'models';
  });

  const setActiveTab = (tab: 'models' | 'units' | 'suppliers' | 'expenses' | 'income' | 'customers' | 'transports' | 'styles') => {
    setActiveTabState(tab);
    localStorage.setItem('inven_master_active_tab', tab);
  };
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [units, setUnits] = useState<ProductionUnitMaster[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierMaster[]>([]);
  const [expenses, setExpenses] = useState<ExpenseMaster[]>([]);
  const [incomes, setIncomes] = useState<IncomeMaster[]>([]);
  const [customers, setCustomers] = useState<CustomerMaster[]>([]);
  const [transports, setTransports] = useState<TransportMaster[]>([]);
  const [styles, setStyles] = useState<StyleMaster[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);
  const [productFormData, setProductFormData] = useState<Partial<ProductModel>>({});
  const [unitFormData, setUnitFormData] = useState<Partial<ProductionUnitMaster>>({ modelRates: [] });
  const [supplierFormData, setSupplierFormData] = useState<Partial<SupplierMaster>>({ relationType: 'supplier' });
  const [expenseFormData, setExpenseFormData] = useState<Partial<ExpenseMaster>>({});
  const [incomeFormData, setIncomeFormData] = useState<Partial<IncomeMaster>>({});
  const [customerFormData, setCustomerFormData] = useState<Partial<CustomerMaster>>({});
  const [customerMobileError, setCustomerMobileError] = useState('');
  const [supplierMobileError, setSupplierMobileError] = useState('');
  const [transportFormData, setTransportFormData] = useState<Partial<TransportMaster>>({});
  const [styleFormData, setStyleFormData] = useState<Partial<StyleMaster>>({});

  useEffect(() => {
    const deduplicateByIdLocal = <T extends { id: string }>(items: T[]): T[] => {
      const seen = new Set<string>();
      return items.filter(item => {
        if (!item || !item.id) return false;
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    };

    const savedProducts = localStorage.getItem('inven_product_master');
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        const deduped = deduplicateByIdLocal(parsed);
        setProducts(deduped);
        if (deduped.length !== parsed.length) {
          localStorage.setItem('inven_product_master', JSON.stringify(deduped));
        }
      } catch (e) { console.error(e); }
    } else {
      const demo: ProductModel[] = [
        { id: 'MOD-001', name: 'FLORA SUMMER XL', code: 'CLR BASKANAS', description: '14*30 ALL CLRS', productGroupName: 'COLOUR BASANA', hsn: '00005407', createdAt: new Date().toISOString() },
        
      ];
      setProducts(demo);
      localStorage.setItem('inven_product_master', JSON.stringify(demo));
    }

    const savedUnits = localStorage.getItem('inven_unit_master');
    if (savedUnits) {
       try {
         const parsed = JSON.parse(savedUnits);
         const deduped = deduplicateByIdLocal(parsed);
         setUnits(deduped);
         if (deduped.length !== parsed.length) {
           localStorage.setItem('inven_unit_master', JSON.stringify(deduped));
         }
       } catch (e) { console.error(e); }
    } else {
      const demoUnits = [
        { id: 'U-001', name: 'UNIT-1', location: 'Floor A', supervisor: 'Rahul Sharma', capacity: '500 pcs/day' },
        { id: 'U-002', name: 'UNIT-2', location: 'Floor B', supervisor: 'Sriya Patel', capacity: '300 pcs/day' },
        { id: 'U-003', name: 'UNIT-3', location: 'Annex 1', supervisor: 'Amit Kumar', capacity: '450 pcs/day' }
      ];
      setUnits(demoUnits);
      localStorage.setItem('inven_unit_master', JSON.stringify(demoUnits));
    }

    const savedSuppliers = localStorage.getItem('inven_suppliers');
    if (savedSuppliers) {
      try {
        const parsed = JSON.parse(savedSuppliers);
        const deduped = deduplicateByIdLocal(parsed);
        setSuppliers(deduped);
        if (deduped.length !== parsed.length) {
          localStorage.setItem('inven_suppliers', JSON.stringify(deduped));
        }
      } catch (e) { console.error(e); }
    } else {
      const demoSuppliers = [
        {
          id: 'SUP-0001',
          name: 'Janice Miller',
          companyName: 'TechFlow Solutions',
          contactPerson: 'Janice Miller',
          phone: '+91 98765 43210',
          email: 'janice@techflow.io',
          address: '42 Textile Park, Surat',
          gstNumber: '24AAAAA0000A1Z5',
          paymentTerms: 'Net 15',
          notes: 'Main fabric vendor',
          createdAt: new Date().toISOString()
        }
      ];
      setSuppliers(demoSuppliers);
      localStorage.setItem('inven_suppliers', JSON.stringify(demoSuppliers));
    }

    const savedExpenses = localStorage.getItem('inven_expense_master');
    if (savedExpenses) {
      try {
        const parsed = JSON.parse(savedExpenses);
        const deduped = deduplicateByIdLocal(parsed);
        setExpenses(deduped);
        if (deduped.length !== parsed.length) {
          localStorage.setItem('inven_expense_master', JSON.stringify(deduped));
        }
      } catch (e) { console.error(e); }
    } else {
      const demoExpenses = [
        { id: 'EXP-001', name: 'Machine Maintenance', createdAt: new Date().toISOString() }
      ];
      setExpenses(demoExpenses);
      localStorage.setItem('inven_expense_master', JSON.stringify(demoExpenses));
    }

    const savedIncomes = localStorage.getItem('inven_income_master');
    if (savedIncomes) {
      try {
        const parsed = JSON.parse(savedIncomes);
        const deduped = deduplicateByIdLocal(parsed);
        setIncomes(deduped);
        if (deduped.length !== parsed.length) {
          localStorage.setItem('inven_income_master', JSON.stringify(deduped));
        }
      } catch (e) { console.error(e); }
    } else {
      const demoIncomes = [
        { id: 'INC-CAT-001', name: 'Product Sales', createdAt: new Date().toISOString() },
        { id: 'INC-CAT-002', name: 'Service Fee', createdAt: new Date().toISOString() },
        { id: 'INC-CAT-003', name: 'Investments', createdAt: new Date().toISOString() }
      ];
      setIncomes(demoIncomes);
      localStorage.setItem('inven_income_master', JSON.stringify(demoIncomes));
    }

    const savedCustomers = localStorage.getItem('inven_customers');
    if (savedCustomers) {
      try {
        const parsed = JSON.parse(savedCustomers);
        const deduped = deduplicateByIdLocal(parsed);
        const migrated = deduped.map((c: any) => ({
          ...c,
          mobileNumber: c.mobileNumber || c.phone || '',
          tcsApplicable: c.tcsApplicable || 'NO'
        }));
        setCustomers(migrated);
        localStorage.setItem('inven_customers', JSON.stringify(migrated));
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
          gstNumber: '27AAAAA0000A1Z5',
          tcsApplicable: 'NO' as const,
          createdAt: new Date().toISOString()
        }
      ];
      setCustomers(demoCustomers);
      localStorage.setItem('inven_customers', JSON.stringify(demoCustomers));
    }

    const savedTransports = localStorage.getItem('inven_transports');
    if (savedTransports) {
      try {
        const parsed = JSON.parse(savedTransports);
        const deduped = deduplicateByIdLocal(parsed);
        setTransports(deduped);
        if (deduped.length !== parsed.length) {
          localStorage.setItem('inven_transports', JSON.stringify(deduped));
        }
      } catch (e) { console.error(e); }
    } else {
      const demoTransports = [
        { id: 'TRN-001', name: 'Jothi andavar', createdAt: new Date().toISOString() },
        { id: 'TRN-002', name: 'V-Xpress', createdAt: new Date().toISOString() }
      ];
      setTransports(demoTransports);
      localStorage.setItem('inven_transports', JSON.stringify(demoTransports));
    }

    const savedStyles = localStorage.getItem('inven_style_master');
    if (savedStyles) {
      try {
        const parsed = JSON.parse(savedStyles);
        const deduped = deduplicateByIdLocal(parsed);
        setStyles(deduped);
        if (deduped.length !== parsed.length) {
          localStorage.setItem('inven_style_master', JSON.stringify(deduped));
        }
      } catch (e) { console.error(e); }
    } else {
      const demoStyles: StyleMaster[] = [
        { id: 'ST-001', name: 'A-LINE KNIT', createdAt: new Date().toISOString() },
        { id: 'ST-002', name: 'ROUND NECK COMFORT', createdAt: new Date().toISOString() }
      ];
      setStyles(demoStyles);
      localStorage.setItem('inven_style_master', JSON.stringify(demoStyles));
    }
  }, []);

  const saveProducts = (data: ProductModel[]) => {
    setProducts(data);
    localStorage.setItem('inven_product_master', JSON.stringify(data));
  };

  const saveUnits = (data: ProductionUnitMaster[]) => {
    setUnits(data);
    localStorage.setItem('inven_unit_master', JSON.stringify(data));
  };

  const saveSuppliers = (data: SupplierMaster[]) => {
    setSuppliers(data);
    localStorage.setItem('inven_suppliers', JSON.stringify(data));
  };

  const saveExpenses = (data: ExpenseMaster[]) => {
    setExpenses(data);
    localStorage.setItem('inven_expense_master', JSON.stringify(data));
  };

  const saveIncomes = (data: IncomeMaster[]) => {
    setIncomes(data);
    localStorage.setItem('inven_income_master', JSON.stringify(data));
  };

  const saveCustomers = (data: CustomerMaster[]) => {
    setCustomers(data);
    localStorage.setItem('inven_customers', JSON.stringify(data));
  };

  const saveTransports = (data: TransportMaster[]) => {
    setTransports(data);
    localStorage.setItem('inven_transports', JSON.stringify(data));
  };

  const saveStyles = (data: StyleMaster[]) => {
    setStyles(data);
    localStorage.setItem('inven_style_master', JSON.stringify(data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'models') {
      const modelData = {
        ...productFormData,
        name: (productFormData.description || '').toUpperCase()
      };
      if (editingId) {
        const updated = products.map(p => p.id === editingId ? { ...p, ...modelData as ProductModel } : p);
        saveProducts(updated);
      } else {
        // ID Generation from Settings for Product Model
        const settingsRaw = localStorage.getItem('inven_settings');
        let generatedId = '';
        let settingsParsed: any = null;
        if (settingsRaw) {
          try { settingsParsed = JSON.parse(settingsRaw); } catch (e) {}
        }
        
        const prefix = settingsParsed?.modelPrefix || 'MOD';
        let nextId = settingsParsed?.nextModelId || 1;
        
        let exists = true;
        while (exists) {
          generatedId = `${prefix}-${nextId.toString().padStart(3, '0')}`;
          exists = products.some(p => p && p.id === generatedId);
          if (exists) {
            nextId++;
          }
        }
        
        if (settingsParsed) {
          localStorage.setItem('inven_settings', JSON.stringify({
            ...settingsParsed,
            nextModelId: nextId + 1
          }));
        }

        const newProduct: ProductModel = {
          ...modelData as ProductModel,
          id: generatedId,
          createdAt: new Date().toISOString(),
        };
        saveProducts([newProduct, ...products]);
      }
    } else if (activeTab === 'units') {
      if (editingId) {
        const updated = units.map(u => u.id === editingId ? { ...u, ...unitFormData as ProductionUnitMaster } : u);
        saveUnits(updated);
      } else {
        let generatedId = '';
        let exists = true;
        while (exists) {
          generatedId = `U-${Math.floor(100 + Math.random() * 900)}`;
          exists = units.some(u => u && u.id === generatedId);
        }

        const newUnit: ProductionUnitMaster = {
          ...unitFormData as ProductionUnitMaster,
          id: generatedId,
        };
        saveUnits([newUnit, ...units]);
      }
    } else if (activeTab === 'suppliers') {
      const mobVal = supplierFormData.mobileNumber || '';
      const cleanMob = mobVal.replace(/\D/g, '');
      let isValid = true;
      if (cleanMob.length > 0) {
        isValid = cleanMob.length === 10 && /^[6-9]\d{9}$/.test(cleanMob);
      }
      
      if (!isValid) {
        setSupplierMobileError('Please enter a valid 10-digit Indian Mobile Number (must start with 6-9)');
        return;
      }

      const updatedData = {
        ...supplierFormData as SupplierMaster,
        name: (supplierFormData.name || '').toUpperCase().trim(),
        gstNumber: (supplierFormData.gstNumber || '').toUpperCase().trim(),
        address: (supplierFormData.address || '').toUpperCase().trim(),
        state: (supplierFormData.state || '').toUpperCase().trim(),
        district: (supplierFormData.district || '').toUpperCase().trim(),
        pincode: (supplierFormData.pincode || '').trim(),
        mobileNumber: cleanMob || undefined,
        phone: cleanMob || undefined
      };

      if (editingId) {
        const updated = suppliers.map(s => s.id === editingId ? { ...s, ...updatedData } : s);
        saveSuppliers(updated);

        // Sync to Customer if both is selected
        if (updatedData.relationType === 'both') {
          const nameMatch = (updatedData.name || '').trim().toUpperCase();
          const gstMatch = (updatedData.gstNumber || '').trim().toUpperCase();
          const phoneMatch = (updatedData.mobileNumber || '').trim();

          let customerFound = false;
          const updatedCustomers = customers.map(c => {
            if (c && (
              (gstMatch && c.gstNumber?.trim().toUpperCase() === gstMatch) ||
              (nameMatch && c.name?.trim().toUpperCase() === nameMatch) ||
              (phoneMatch && c.mobileNumber?.trim() === phoneMatch)
            )) {
              customerFound = true;
              return {
                ...c,
                name: updatedData.name,
                phone: updatedData.phone || updatedData.mobileNumber || '',
                mobileNumber: updatedData.mobileNumber || '',
                address: updatedData.address,
                pincode: updatedData.pincode,
                state: updatedData.state,
                district: updatedData.district,
                gstNumber: updatedData.gstNumber,
              };
            }
            return c;
          });

          if (customerFound) {
            saveCustomers(updatedCustomers);
          } else {
            const settingsRaw = localStorage.getItem('inven_settings');
            let customerId = '';
            let settingsParsed: any = null;
            if (settingsRaw) {
              try { settingsParsed = JSON.parse(settingsRaw); } catch (e) {}
            }
            
            const custPrefix = settingsParsed?.customerPrefix || 'CUS';
            let custNextId = settingsParsed?.nextCustomerId || 1;
            
            let exists = true;
            while (exists) {
              customerId = `${custPrefix}-${custNextId.toString().padStart(4, '0')}`;
              exists = customers.some(c => c && c.id === customerId);
              if (exists) {
                custNextId++;
              }
            }
            
            if (settingsParsed) {
              localStorage.setItem('inven_settings', JSON.stringify({
                ...settingsParsed,
                nextCustomerId: custNextId + 1
              }));
            } else {
              localStorage.setItem('inven_settings', JSON.stringify({
                customerPrefix: 'CUS',
                nextCustomerId: custNextId + 1
              }));
            }

            const newCustomer: CustomerMaster = {
              id: customerId,
              name: updatedData.name,
              phone: updatedData.phone || updatedData.mobileNumber || '',
              mobileNumber: updatedData.mobileNumber || '',
              address: updatedData.address,
              pincode: updatedData.pincode,
              state: updatedData.state,
              district: updatedData.district,
              gstNumber: updatedData.gstNumber,
              tcsApplicable: 'NO',
              createdAt: new Date().toISOString()
            };
            saveCustomers([newCustomer, ...customers]);
          }
        }
      } else {
        // ID Generation from Settings
        const settingsRaw = localStorage.getItem('inven_settings');
        let generatedId = '';
        let settingsParsed: any = null;
        if (settingsRaw) {
          try { settingsParsed = JSON.parse(settingsRaw); } catch (e) {}
        }
        
        const prefix = settingsParsed?.supplierPrefix || 'SUP';
        let nextId = settingsParsed?.nextSupplierId || 1;
        
        let exists = true;
        while (exists) {
          generatedId = `${prefix}-${nextId.toString().padStart(4, '0')}`;
          exists = suppliers.some(s => s && s.id === generatedId);
          if (exists) {
            nextId++;
          }
        }
        
        if (settingsParsed) {
          localStorage.setItem('inven_settings', JSON.stringify({
            ...settingsParsed,
            nextSupplierId: nextId + 1
          }));
        }

        const newSupplier: SupplierMaster = {
          ...updatedData,
          id: generatedId,
          createdAt: new Date().toISOString(),
        };
        saveSuppliers([newSupplier, ...suppliers]);

        // Sync to Customer if both is selected
        if (updatedData.relationType === 'both') {
          const nameMatch = (updatedData.name || '').trim().toUpperCase();
          const gstMatch = (updatedData.gstNumber || '').trim().toUpperCase();
          const phoneMatch = (updatedData.mobileNumber || '').trim();

          let customerFound = false;
          const updatedCustomers = customers.map(c => {
            if (c && (
              (gstMatch && c.gstNumber?.trim().toUpperCase() === gstMatch) ||
              (nameMatch && c.name?.trim().toUpperCase() === nameMatch) ||
              (phoneMatch && c.mobileNumber?.trim() === phoneMatch)
            )) {
              customerFound = true;
              return {
                ...c,
                name: updatedData.name,
                phone: updatedData.phone || updatedData.mobileNumber || '',
                mobileNumber: updatedData.mobileNumber || '',
                address: updatedData.address,
                pincode: updatedData.pincode,
                state: updatedData.state,
                district: updatedData.district,
                gstNumber: updatedData.gstNumber,
              };
            }
            return c;
          });

          if (customerFound) {
            saveCustomers(updatedCustomers);
          } else {
            const settingsRaw = localStorage.getItem('inven_settings');
            let customerId = '';
            let settingsParsed: any = null;
            if (settingsRaw) {
              try { settingsParsed = JSON.parse(settingsRaw); } catch (e) {}
            }
            
            const custPrefix = settingsParsed?.customerPrefix || 'CUS';
            let custNextId = settingsParsed?.nextCustomerId || 1;
            
            let exists = true;
            while (exists) {
              customerId = `${custPrefix}-${custNextId.toString().padStart(4, '0')}`;
              exists = customers.some(c => c && c.id === customerId);
              if (exists) {
                custNextId++;
              }
            }
            
            if (settingsParsed) {
              localStorage.setItem('inven_settings', JSON.stringify({
                ...settingsParsed,
                nextCustomerId: custNextId + 1
              }));
            } else {
              localStorage.setItem('inven_settings', JSON.stringify({
                customerPrefix: 'CUS',
                nextCustomerId: custNextId + 1
              }));
            }

            const newCustomer: CustomerMaster = {
              id: customerId,
              name: updatedData.name,
              phone: updatedData.phone || updatedData.mobileNumber || '',
              mobileNumber: updatedData.mobileNumber || '',
              address: updatedData.address,
              pincode: updatedData.pincode,
              state: updatedData.state,
              district: updatedData.district,
              gstNumber: updatedData.gstNumber,
              tcsApplicable: 'NO',
              createdAt: new Date().toISOString()
            };
            saveCustomers([newCustomer, ...customers]);
          }
        }
      }
    } else if (activeTab === 'expenses') {
      if (editingId) {
        const updated = expenses.map(e => e.id === editingId ? { ...e, ...expenseFormData as ExpenseMaster } : e);
        saveExpenses(updated);
      } else {
        let generatedId = '';
        let exists = true;
        while (exists) {
          generatedId = `EXP-${Math.floor(100 + Math.random() * 900)}`;
          exists = expenses.some(e => e && e.id === generatedId);
        }

        const newExpense: ExpenseMaster = {
          ...expenseFormData as ExpenseMaster,
          id: generatedId,
          createdAt: new Date().toISOString(),
        };
        saveExpenses([newExpense, ...expenses]);
      }
    } else if (activeTab === 'income') {
      if (editingId) {
         const updated = incomes.map(b => b.id === editingId ? { ...b, ...incomeFormData as IncomeMaster } : b);
         saveIncomes(updated);
      } else {
        let generatedId = '';
        let exists = true;
        while (exists) {
          generatedId = `INC-CAT-${Math.floor(100 + Math.random() * 900)}`;
          exists = incomes.some(b => b && b.id === generatedId);
        }

        const newIncome: IncomeMaster = {
          ...incomeFormData as IncomeMaster,
          id: generatedId,
          createdAt: new Date().toISOString(),
        };
        saveIncomes([newIncome, ...incomes]);
      }
    } else if (activeTab === 'customers') {
      const mobVal = customerFormData.mobileNumber || '';
      const cleanMob = mobVal.replace(/\D/g, '');
      const isValid = cleanMob.length === 10 && /^[6-9]\d{9}$/.test(cleanMob);
      
      if (!isValid) {
        setCustomerMobileError('Please enter a valid 10-digit Indian Mobile Number (must start with 6-9)');
        return;
      }

      const updatedData = {
        ...customerFormData as CustomerMaster,
        mobileNumber: cleanMob,
        phone: customerFormData.phone || '',
        tcsApplicable: customerFormData.tcsApplicable || 'NO'
      };

      if (editingId) {
        const updated = customers.map(c => c.id === editingId ? { ...c, ...updatedData } : c);
        saveCustomers(updated);
      } else {
        const settingsRaw = localStorage.getItem('inven_settings');
        let generatedId = '';
        let settingsParsed: any = null;
        if (settingsRaw) {
          try { settingsParsed = JSON.parse(settingsRaw); } catch (e) {}
        }
        
        const prefix = settingsParsed?.customerPrefix || 'CUS';
        let nextId = settingsParsed?.nextCustomerId || 1;
        
        let exists = true;
        while (exists) {
          generatedId = `${prefix}-${nextId.toString().padStart(4, '0')}`;
          exists = customers.some(c => c && c.id === generatedId);
          if (exists) {
            nextId++;
          }
        }
        
        if (settingsParsed) {
          localStorage.setItem('inven_settings', JSON.stringify({
            ...settingsParsed,
            nextCustomerId: nextId + 1
          }));
        } else {
          localStorage.setItem('inven_settings', JSON.stringify({
            customerPrefix: 'CUS',
            nextCustomerId: nextId + 1
          }));
        }

        const newCustomer: CustomerMaster = {
          ...updatedData,
          id: generatedId,
          createdAt: new Date().toISOString(),
        };
        saveCustomers([newCustomer, ...customers]);
      }
    } else if (activeTab === 'transports') {
      if (editingId) {
        const updated = transports.map(t => t.id === editingId ? { ...t, ...transportFormData as TransportMaster } : t);
        saveTransports(updated);
      } else {
        let generatedId = '';
        let exists = true;
        while (exists) {
          generatedId = `TRN-${Math.floor(100 + Math.random() * 900)}`;
          exists = transports.some(t => t && t.id === generatedId);
        }

        const newTransport: TransportMaster = {
          ...transportFormData as TransportMaster,
          id: generatedId,
          createdAt: new Date().toISOString(),
        };
        saveTransports([newTransport, ...transports]);
      }
    } else if (activeTab === 'styles') {
      const styleData = {
        ...styleFormData,
        name: (styleFormData.name || '').toUpperCase().trim()
      };
      if (editingId) {
        const updated = styles.map(s => s.id === editingId ? { ...s, ...styleData as StyleMaster } : s);
        saveStyles(updated);
      } else {
        let generatedId = '';
        let exists = true;
        let nextId = styles.length + 1;
        while (exists) {
          generatedId = `ST-${nextId.toString().padStart(3, '0')}`;
          exists = styles.some(s => s && s.id === generatedId);
          if (exists) {
            nextId++;
          }
        }

        const newStyle: StyleMaster = {
          ...styleData as StyleMaster,
          id: generatedId,
          createdAt: new Date().toISOString(),
        };
        saveStyles([newStyle, ...styles]);
      }
    }

    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setProductFormData({});
    setUnitFormData({});
    setSupplierFormData({ relationType: 'supplier' });
    setExpenseFormData({});
    setIncomeFormData({});
    setCustomerFormData({});
    setCustomerMobileError('');
    setSupplierMobileError('');
    setTransportFormData({});
    setStyleFormData({});
  };

  const deleteItem = (id: string, name: string) => {
    setItemToDelete({ id, name });
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    
    const id = itemToDelete.id;
    if (activeTab === 'models') {
      saveProducts(products.filter(p => p.id !== id));
    } else if (activeTab === 'units') {
      saveUnits(units.filter(u => u.id !== id));
    } else if (activeTab === 'suppliers') {
      saveSuppliers(suppliers.filter(s => s.id !== id));
    } else if (activeTab === 'customers') {
      saveCustomers(customers.filter(c => c.id !== id));
    } else if (activeTab === 'transports') {
      saveTransports(transports.filter(t => t.id !== id));
    } else if (activeTab === 'income') {
      saveIncomes(incomes.filter(b => b.id !== id));
    } else if (activeTab === 'styles') {
      saveStyles(styles.filter(s => s.id !== id));
    } else {
      saveExpenses(expenses.filter(e => e.id !== id));
    }
    
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleExportMaster = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    const filename = `Master_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'models') {
      headers = ['Model ID', 'Model Name', 'Code', 'Description', 'Product Group', 'HSN Code'];
      rows = products.map(p => [
        p.id || '',
        p.name || '',
        p.code || '',
        p.description || '',
        p.productGroupName || '',
        p.hsn || ''
      ]);
    } else if (activeTab === 'styles') {
      headers = ['Style ID', 'Style Name'];
      rows = styles.map(s => [
        s.id || '',
        s.name || ''
      ]);
    } else if (activeTab === 'units') {
      headers = ['Godown ID', 'Godown Name', 'Location', 'Supervisor', 'Capacity'];
      rows = units.map(u => [
        u.id || '',
        u.name || '',
        u.location || ''
      ]);
    } else if (activeTab === 'suppliers') {
      headers = ['Supplier ID', 'Supplier Name', 'Company Name', 'Contact Person', 'Phone', 'Mobile', 'Email', 'Address', 'GSTIN', 'Pincode', 'State', 'District', 'Opening Balance'];
      rows = suppliers.map(s => [
        s.id || '',
        s.name || '',
        s.companyName || '',
        s.contactPerson || '',
        s.phone || '',
        s.mobileNumber || '',
        s.email || '',
        s.address || '',
        s.gstNumber || '',
        s.pincode || '',
        s.state || '',
        s.district || '',
        s.opBalance !== undefined ? String(s.opBalance) : '0'
      ]);
    } else if (activeTab === 'customers') {
      headers = ['Customer ID', 'Customer Name', 'Phone', 'Mobile', 'Email', 'Address', 'Pincode', 'State', 'District', 'GSTIN', 'TCS Applicable', 'Opening Balance'];
      rows = customers.map(c => [
        c.id || '',
        c.name || '',
        c.phone || '',
        c.mobileNumber || '',
        c.email || '',
        c.address || '',
        c.pincode || '',
        c.state || '',
        c.district || '',
        c.gstNumber || '',
        c.tcsApplicable || 'NO',
        c.openingBalance !== undefined ? String(c.openingBalance) : '0'
      ]);
    } else if (activeTab === 'transports') {
      headers = ['Transport ID', 'Transport Name', 'GSTIN', 'Mode'];
      rows = transports.map(t => [
        t.id || '',
        t.name || '',
        t.gstin || '',
        t.mode || ''
      ]);
    } else if (activeTab === 'income') {
      headers = ['Category ID', 'Category Name'];
      rows = incomes.map(inc => [
        inc.id || '',
        inc.name || ''
      ]);
    } else if (activeTab === 'expenses') {
      headers = ['Category ID', 'Category Name'];
      rows = expenses.map(e => [
        e.id || '',
        e.name || ''
      ]);
    }

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','), 
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredItems = activeTab === 'models' 
    ? products.filter(p => p && (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p?.id || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : activeTab === 'units' 
      ? units.filter(u => u && (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (u?.id || '').toLowerCase().includes(searchQuery.toLowerCase()))
      : activeTab === 'suppliers'
        ? suppliers.filter(s => s && ((s.companyName || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.id || '').toLowerCase().includes(searchQuery.toLowerCase())))
        : activeTab === 'customers'
          ? customers.filter(c => c && ((c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.id || '').toLowerCase().includes(searchQuery.toLowerCase())))
          : activeTab === 'transports'
            ? transports.filter(t => t && ((t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.id || '').toLowerCase().includes(searchQuery.toLowerCase())))
            : activeTab === 'income'
              ? incomes.filter(b => b && ((b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (b.id || '').toLowerCase().includes(searchQuery.toLowerCase())))
              : activeTab === 'styles'
                ? styles.filter(s => s && ((s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.id || '').toLowerCase().includes(searchQuery.toLowerCase())))
                : expenses.filter(e => e && ((e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (e.id || '').toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Master Data Management</h2>
          <p className="text-sm text-slate-500">Configure core product models and godowns.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsFormOpen(true); }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus className="w-4 h-4" />
          Add {activeTab === 'models' ? 'Model' : activeTab === 'units' ? 'Godown' : activeTab === 'suppliers' ? 'Supplier' : activeTab === 'customers' ? 'Customer' : activeTab === 'transports' ? 'Transport' : activeTab === 'income' ? 'Income Category' : activeTab === 'styles' ? 'Style' : 'Expense'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
        <button 
          onClick={() => { setActiveTab('models'); setSearchQuery(''); }}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'models' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Product Models
        </button>
        <button 
          onClick={() => { setActiveTab('styles'); setSearchQuery(''); }}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'styles' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Styles
        </button>
        <button 
          onClick={() => { setActiveTab('units'); setSearchQuery(''); }}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'units' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Godowns
        </button>
        <button 
          onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'suppliers' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Suppliers
        </button>
        <button 
          onClick={() => { setActiveTab('customers'); setSearchQuery(''); }}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'customers' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Customers
        </button>
        <button 
          onClick={() => { setActiveTab('transports'); setSearchQuery(''); }}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'transports' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Transports
        </button>
        <button 
          onClick={() => { setActiveTab('income'); setSearchQuery(''); }}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'income' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Income
        </button>
        <button 
          onClick={() => { setActiveTab('expenses'); setSearchQuery(''); }}
          className={cn(
            "px-6 py-2 rounded-xl text-sm font-bold transition-all",
            activeTab === 'expenses' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Expenses
        </button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <button
          onClick={handleExportMaster}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 transition-all border border-slate-200/60 shadow-sm"
          title={`Export ${activeTab} data to Excel/CSV`}
        >
          <Download className="w-4 h-4" />
          <span>Export {activeTab === 'models' ? 'Models' : activeTab === 'styles' ? 'Styles' : activeTab === 'units' ? 'Godowns' : activeTab === 'suppliers' ? 'Suppliers' : activeTab === 'customers' ? 'Customers' : activeTab === 'transports' ? 'Transports' : activeTab === 'income' ? 'Income Categories' : activeTab === 'expenses' ? 'Expense Categories' : 'Data'}</span>
        </button>
      </div>

      <div className={activeTab === 'models' ? "flex flex-col gap-5 max-w-4xl mx-auto w-full" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"}>
        {activeTab === 'models' ? (
          (filteredItems as ProductModel[]).filter(p => p && p.name).map((product) => (
            <div key={product.id} className="bg-white p-7 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <div className="flex gap-1.5 bg-white/95 backdrop-blur shadow-sm border border-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => { setEditingId(product.id); setProductFormData(product); setIsFormOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteItem(product.id, product.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Tag className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{product.id}</p>
                    {product.code && (
                      <span className="px-2.5 py-1 bg-indigo-50/70 text-indigo-700 rounded-lg text-[10px] font-extrabold tracking-wider uppercase">
                        {product.code}
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-black text-slate-800 uppercase mt-0.5" title={product.name}>{product.name}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    {product.productGroupName && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Group: <span className="text-indigo-600 font-extrabold">{product.productGroupName}</span>
                      </p>
                    )}
                    {product.hsn && (
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        HSN: <span className="text-emerald-600 font-extrabold">{product.hsn}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {product.description && (
                <div className="mt-4 bg-[#f8faff] p-4 rounded-2xl border border-dashed border-slate-100">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">Description</p>
                  <p className="text-xs text-slate-700 font-bold uppercase leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : activeTab === 'styles' ? (
          (filteredItems as StyleMaster[]).filter(s => s && s.name).map((style) => (
            <div key={style.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="flex gap-1">
                    <button 
                      onClick={() => { setEditingId(style.id); setStyleFormData(style); setIsFormOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteItem(style.id, style.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 mt-1">
                  <Tag className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{style.id}</p>
                  <h4 className="text-lg font-bold text-slate-800 uppercase truncate" title={style.name}>{style.name}</h4>
                </div>
              </div>
            </div>
          ))
        ) : activeTab === 'units' ? (
          (filteredItems as ProductionUnitMaster[]).filter(u => u && u.name).map((unit) => (
              <div key={unit.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="flex gap-1">
                      <button 
                        onClick={() => { setEditingId(unit.id); setUnitFormData(unit); setIsFormOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteItem(unit.id, unit.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{unit.id}</p>
                    <h4 className="text-lg font-bold text-slate-800 uppercase">{unit.name}</h4>
                  </div>
                </div>
              </div>
            ))
        ) : activeTab === 'suppliers' ? (
          (filteredItems as SupplierMaster[]).filter(Boolean).map((supplier) => (
            <div key={supplier.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                  <Building2 className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{supplier.id}</p>
                  <h4 className="text-xl font-extrabold text-[#111827] truncate leading-tight uppercase">{supplier.name || supplier.companyName || 'UNNAMED SUPPLIER'}</h4>
                  {(supplier.state || supplier.district) && (
                    <p className="text-xs text-indigo-600 font-extrabold uppercase mt-1">
                      {supplier.district ? `${supplier.district}, ` : ''}{supplier.state}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                   <span className="text-slate-400">GST: {supplier.gstNumber || 'N/A'}</span>
                   {supplier.pincode && (
                     <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-mono">PIN: {supplier.pincode}</span>
                   )}
                </div>
                
                <div className="space-y-2.5">
                  {supplier.opBalance !== undefined && supplier.opBalance > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#059669] font-black bg-emerald-50/50 px-3 py-1.5 rounded-xl border border-emerald-100/50 w-fit">
                      <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">OP. Balance:</span>
                      ₹{supplier.opBalance.toLocaleString('en-IN')}
                    </div>
                  )}
                  {(supplier.mobileNumber || supplier.phone) && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                      <Phone className="w-4 h-4 text-slate-400 font-bold" />
                      {supplier.mobileNumber || supplier.phone}
                    </div>
                  )}
                  <div className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2 leading-relaxed uppercase">{supplier.address}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => { setEditingId(supplier.id); setSupplierFormData(supplier); setIsFormOpen(true); }}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#f0f4ff] text-indigo-600 text-sm font-bold hover:bg-opacity-80 transition-all active:scale-95 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => deleteItem(supplier.id, supplier.name || supplier.companyName || '')}
                  className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#fff0f0] text-rose-600 text-sm font-bold hover:bg-opacity-80 transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : activeTab === 'customers' ? (
          (filteredItems as CustomerMaster[]).filter(c => c && c.name).map((customer) => (
            <div key={customer.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex items-start gap-4 mb-6">
                 <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Users className="w-7 h-7" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{customer.id}</p>
                    <h4 className="text-xl font-extrabold text-slate-800 truncate leading-tight">{customer.name}</h4>
                    <p className="text-sm text-slate-500 font-medium">Customer</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">GST: {customer.gstNumber || 'N/A'}</span>
                    {customer.openingBalance !== undefined && customer.openingBalance !== null && (
                      <span className="text-slate-500 font-mono">OB: ₹{customer.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    )}
                 </div>
                 
                 <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                       <Phone className="w-4 h-4 text-slate-400" />
                       {customer.mobileNumber || customer.phone || 'N/A'}
                       {customer.tcsApplicable === 'YES' && (
                         <span className="bg-rose-50 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded ml-auto">TCS APPLICABLE</span>
                       )}
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                         <Mail className="w-4 h-4 text-slate-400" />
                         <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                       <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                       <div className="flex-1 min-w-0">
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

              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-50">
                 <button 
                    onClick={() => { setEditingId(customer.id); setCustomerFormData(customer); setIsFormOpen(true); }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#f0f4ff] text-indigo-600 text-sm font-bold hover:bg-opacity-80 transition-all active:scale-95"
                 >
                    <Edit2 className="w-4 h-4" />
                    Edit
                 </button>
                 <button 
                    onClick={() => deleteItem(customer.id, customer.name)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#fff0f0] text-rose-600 text-sm font-bold hover:bg-opacity-80 transition-all active:scale-95"
                 >
                    <Trash2 className="w-4 h-4" />
                    Delete
                 </button>
              </div>
            </div>
          ))
        ) : activeTab === 'transports' ? (
          (filteredItems as TransportMaster[]).filter(t => t && t.name).map((transport) => (
            <div key={transport.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="flex gap-1">
                    <button 
                      onClick={() => { setEditingId(transport.id); setTransportFormData(transport); setIsFormOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteItem(transport.id, transport.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 mt-1">
                  <Monitor className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{transport.id}</p>
                  <h4 className="text-lg font-bold text-slate-800 uppercase truncate">{transport.name}</h4>
                  {(transport.gstin || transport.mode) && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {transport.gstin && (
                        <div className="flex flex-col bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">GSTIN</span>
                          <span className="text-xs font-extrabold text-slate-700 uppercase leading-normal tracking-wide">{transport.gstin}</span>
                        </div>
                      )}
                      {transport.mode && (
                        <div className="flex flex-col bg-indigo-50/50 px-3 py-1 rounded-xl border border-indigo-100/50">
                          <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider">MODE</span>
                          <span className="text-xs font-extrabold text-indigo-600 uppercase leading-normal tracking-wide">{transport.mode}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : activeTab === 'income' ? (
          (filteredItems as IncomeMaster[]).filter(b => b && b.name).map((income) => (
            <div key={income.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="flex gap-1">
                    <button 
                      onClick={() => { setEditingId(income.id); setIncomeFormData(income); setIsFormOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteItem(income.id, income.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 italic font-black text-xl">
                  ₹
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{income.id}</p>
                  <h4 className="text-lg font-bold text-slate-800">{income.name}</h4>
                </div>
              </div>
            </div>
          ))
        ) : (
          (filteredItems as ExpenseMaster[]).filter(e => e && e.name).map((expense) => (
            <div key={expense.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="flex gap-1">
                    <button 
                      onClick={() => { setEditingId(expense.id); setExpenseFormData(expense); setIsFormOpen(true); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteItem(expense.id, expense.name)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 italic font-black text-xl">
                  ₹
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{expense.id}</p>
                  <h4 className="text-lg font-bold text-slate-800">{expense.name}</h4>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit' : 'Add New'} {activeTab === 'models' ? 'Model' : activeTab === 'units' ? 'Godown' : activeTab === 'suppliers' ? 'Supplier' : activeTab === 'customers' ? 'Customer' : activeTab === 'transports' ? 'Transport' : activeTab === 'styles' ? 'Style' : activeTab === 'income' ? 'Income Category' : 'Expense Category'}
                </h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {activeTab === 'models' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                      Code <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm uppercase"
                      value={productFormData.code || ''}
                      onChange={(e) => setProductFormData({...productFormData, code: e.target.value.toUpperCase()})}
                      placeholder="E.G. CLR BASKANAS"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm uppercase"
                      value={productFormData.description || ''}
                      onChange={(e) => setProductFormData({...productFormData, description: e.target.value.toUpperCase()})}
                      placeholder="E.G. 14*30 ALL CLRS"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                      Product Group Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm uppercase"
                      value={productFormData.productGroupName || ''}
                      onChange={(e) => setProductFormData({...productFormData, productGroupName: e.target.value.toUpperCase()})}
                      placeholder="E.G. COLOUR BASKANAS"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                      HSN <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                      value={productFormData.hsn || ''}
                      onChange={(e) => {
                        const numericOnly = e.target.value.replace(/\D/g, '');
                        setProductFormData({...productFormData, hsn: numericOnly});
                      }}
                      placeholder="E.G. 00005407"
                    />
                  </div>
                </>
              ) : activeTab === 'styles' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">
                      Style Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm uppercase"
                      value={styleFormData.name || ''}
                      onChange={(e) => setStyleFormData({...styleFormData, name: e.target.value.toUpperCase()})}
                      placeholder="E.G. A-LINE KNIT"
                    />
                  </div>
                </>
              ) : activeTab === 'units' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Godown Name</label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. EDAPADY"
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm uppercase"
                      value={unitFormData.name || ''}
                      onChange={(e) => setUnitFormData({...unitFormData, name: e.target.value.toUpperCase()})}
                    />
                  </div>
                </>
              ) : activeTab === 'suppliers' ? (
                <>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Supplier Entity Type</label>
                    <div className="flex flex-col sm:flex-row gap-6 bg-[#f8faff] p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer select-none">
                        <input 
                          type="radio" 
                          name="relationType" 
                          value="supplier"
                          checked={(supplierFormData.relationType || 'supplier') === 'supplier'}
                          onChange={() => setSupplierFormData({...supplierFormData, relationType: 'supplier'})}
                          className="w-4.5 h-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <span>Supplier Only</span>
                      </label>
                      <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer select-none">
                        <input 
                          type="radio" 
                          name="relationType" 
                          value="both"
                          checked={supplierFormData.relationType === 'both'}
                          onChange={() => setSupplierFormData({...supplierFormData, relationType: 'both'})}
                          className="w-4.5 h-4.5 text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <span>Both Supplier & Customer</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">GST Number</label>
                    <input 
                      type="text" 
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm uppercase"
                      value={supplierFormData.gstNumber || ''}
                      onChange={(e) => setSupplierFormData({...supplierFormData, gstNumber: e.target.value.toUpperCase()})}
                      placeholder="E.G. 24AAAAA0000A1Z5"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Supplier Name <span className="text-rose-500">*</span></label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm uppercase"
                      value={supplierFormData.name || ''}
                      onChange={(e) => setSupplierFormData({...supplierFormData, name: e.target.value.toUpperCase()})}
                      placeholder="E.G. BHARATH EXPORT"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Opening Balance</label>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm"
                      value={supplierFormData.opBalance === undefined ? '' : supplierFormData.opBalance}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setSupplierFormData({...supplierFormData, opBalance: val ? parseInt(val, 10) : undefined});
                      }}
                      placeholder="E.G. 5000 (NUMBERS ONLY)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Mobile Number</label>
                      <input 
                        type="text" 
                        maxLength={10}
                        className={`w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 font-bold text-slate-700 shadow-sm ${supplierMobileError ? 'ring-2 ring-rose-500/20 focus:ring-rose-500/20' : 'focus:ring-indigo-500/10'}`}
                        value={supplierFormData.mobileNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setSupplierFormData({...supplierFormData, mobileNumber: val, phone: val});
                          
                          if (val.trim() === '') {
                            setSupplierMobileError('');
                          } else if (val.length < 10) {
                            setSupplierMobileError('Must be exactly 10 digits');
                          } else if (!/^[6-9]/.test(val)) {
                            setSupplierMobileError('Must start with 6, 7, 8, or 9');
                          } else {
                            setSupplierMobileError('');
                          }
                        }}
                        placeholder="E.G. 9876543210"
                      />
                      {supplierMobileError && (
                        <p className="text-[10px] text-rose-500 font-bold pl-1 animate-pulse">{supplierMobileError}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Pincode</label>
                      <input 
                        type="text" 
                        maxLength={6}
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm text-center tracking-widest font-mono"
                        value={supplierFormData.pincode || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setSupplierFormData({...supplierFormData, pincode: val});
                        }}
                        placeholder="600001"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Choose State</label>
                      <select 
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                        value={supplierFormData.state || ''}
                        onChange={(e) => {
                          setSupplierFormData({
                            ...supplierFormData, 
                            state: e.target.value,
                            district: ''
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
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Choose District</label>
                      <select 
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                        value={supplierFormData.district || ''}
                        disabled={!supplierFormData.state}
                        onChange={(e) => setSupplierFormData({...supplierFormData, district: e.target.value})}
                      >
                        <option value="">CHOOSE DISTRICT</option>
                        {supplierFormData.state && STATES_AND_DISTRICTS[supplierFormData.state]?.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Address</label>
                    <textarea 
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm resize-none uppercase"
                      rows={2}
                      value={supplierFormData.address || ''}
                      onChange={(e) => setSupplierFormData({...supplierFormData, address: e.target.value.toUpperCase()})}
                      placeholder="E.G. 42 TEXTILE PARK"
                    />
                  </div>
                </>
              ) : activeTab === 'customers' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Customer Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm uppercase"
                      value={customerFormData.name || ''}
                      onChange={(e) => setCustomerFormData({...customerFormData, name: e.target.value.toUpperCase()})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Mobile Number</label>
                      <input 
                        required
                        type="text" 
                        maxLength={10}
                        className={`w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 font-medium text-slate-700 shadow-sm ${customerMobileError ? 'ring-2 ring-rose-500/20 focus:ring-rose-500/20' : 'focus:ring-indigo-500/10'}`}
                        value={customerFormData.mobileNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setCustomerFormData({...customerFormData, mobileNumber: val});
                          
                          if (val.trim() === '') {
                            setCustomerMobileError('Mobile number is required');
                          } else if (val.length < 10) {
                            setCustomerMobileError('Must be exactly 10-digit Indian Mobile Number');
                          } else if (!/^[6-9]/.test(val)) {
                            setCustomerMobileError('Must start with 6, 7, 8, or 9');
                          } else {
                            setCustomerMobileError('');
                          }
                        }}
                        placeholder="E.G. 9876543210"
                      />
                      {customerMobileError && (
                        <p className="text-[10px] text-rose-500 font-bold pl-1 animate-pulse">{customerMobileError}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                       <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Phone</label>
                       <input 
                         type="text" 
                         className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                         value={customerFormData.phone || ''}
                         onChange={(e) => setCustomerFormData({...customerFormData, phone: e.target.value})}
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
                        value={customerFormData.tcsApplicable || 'NO'}
                        onChange={(e) => setCustomerFormData({...customerFormData, tcsApplicable: e.target.value as 'YES' | 'NO'})}
                      >
                        <option value="NO">NO</option>
                        <option value="YES">YES</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Opening Balance (₹)</label>
                      <input 
                        type="number" 
                        step="any" onWheel={(e) => e.currentTarget.blur()}
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                        value={customerFormData.openingBalance !== undefined ? customerFormData.openingBalance : ''}
                        onChange={(e) => setCustomerFormData({...customerFormData, openingBalance: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0})}
                        placeholder="E.G. 5000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">State</label>
                      <select 
                        required
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm appearance-none cursor-pointer"
                        value={customerFormData.state || ''}
                        onChange={(e) => {
                          const selectedState = e.target.value;
                          setCustomerFormData({
                            ...customerFormData, 
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
                        value={customerFormData.district || ''}
                        disabled={!customerFormData.state}
                        onChange={(e) => setCustomerFormData({...customerFormData, district: e.target.value})}
                      >
                        <option value="">CHOOSE DISTRICT</option>
                        {customerFormData.state && STATES_AND_DISTRICTS[customerFormData.state]?.map(dist => (
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
                        value={customerFormData.pincode || ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setCustomerFormData({...customerFormData, pincode: val});
                        }}
                        placeholder="600001"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">GST Number</label>
                      <input 
                        type="text" 
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm uppercase"
                        value={customerFormData.gstNumber || ''}
                        onChange={(e) => setCustomerFormData({...customerFormData, gstNumber: e.target.value.toUpperCase()})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Address</label>
                    <textarea 
                      required
                      className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm resize-none uppercase"
                      rows={2}
                      value={customerFormData.address || ''}
                      onChange={(e) => setCustomerFormData({...customerFormData, address: e.target.value.toUpperCase()})}
                    />
                  </div>
                </>
              ) : activeTab === 'transports' ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Transport Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. JOTHI ANDAVAR"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm uppercase"
                        value={transportFormData.name || ''}
                        onChange={(e) => setTransportFormData({...transportFormData, name: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Transport ID (GSTIN)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 33AAAAA1111A1Z1"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm uppercase"
                        value={transportFormData.gstin || ''}
                        onChange={(e) => setTransportFormData({...transportFormData, gstin: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Mode</label>
                      <input 
                        type="text" 
                        placeholder="e.g. ROAD"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-slate-700 shadow-sm uppercase"
                        value={transportFormData.mode || ''}
                        onChange={(e) => setTransportFormData({...transportFormData, mode: e.target.value.toUpperCase()})}
                      />
                    </div>
                  </div>
                </>
              ) : activeTab === 'income' ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Income Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Service Fee"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                        value={incomeFormData.name || ''}
                        onChange={(e) => setIncomeFormData({...incomeFormData, name: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Expense Name</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Machine Maintenance"
                        className="w-full bg-[#f8faff] border-none rounded-2xl py-4 px-6 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 font-medium text-slate-700 shadow-sm"
                        value={expenseFormData.name || ''}
                        onChange={(e) => setExpenseFormData({...expenseFormData, name: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                >
                  Save {activeTab === 'models' ? 'Model' : activeTab === 'units' ? 'Godown' : activeTab === 'suppliers' ? 'Supplier' : activeTab === 'customers' ? 'Customer' : activeTab === 'transports' ? 'Transport' : activeTab === 'styles' ? 'Style' : activeTab === 'income' ? 'Income Category' : 'Expense'}
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
    </div>
  );
}
