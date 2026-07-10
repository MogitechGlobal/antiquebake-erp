// web/src/app/dashboard/inventory/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Boxes, 
  Scale,
  Loader2,
  X,
  Tag,
  ArrowUpDown,
  Calculator,
  Download,
  Filter,
  XCircle,
  Tags,
  Pencil,
  Trash2,
  Eye,
  Banknote,
  ChefHat
} from "lucide-react";

interface RecipeLink {
  id: string;
  name: string;
  quantityNeeded: number;
}

interface CatalogItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  cost?: number; 
  linkedRecipes?: RecipeLink[]; 
}

interface StockItem {
  id: string;
  itemId: string;
  branchId: string;
  quantity: number;
}

interface InventoryRow extends CatalogItem {
  quantity: number;
}

export default function InventoryDashboardPage() {
  const { user, token } = useAuthStore();
  
  // Dynamic URL evaluation matching local fallback or production environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryRow | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number | "">("");
  const [isAdjusting, setIsAdjusting] = useState(false); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    sku: "",
    category: "",
    unit: "",
    cost: ""
  });

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchInventoryData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    
    try {
      setIsLoading(true);
      
      const branchRes = await axios.get(`${API_URL}/api/v1/branches/${user.branchId}`, axiosConfig);
      const currentOrgId = branchRes.data.organizationId;
      setOrganizationId(currentOrgId);

      const [catalogRes, stockRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/inventory/catalog/${currentOrgId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/inventory/stock/${user.branchId}`, axiosConfig)
      ]);
      
      const catalog: CatalogItem[] = catalogRes.data;
      const stock: StockItem[] = stockRes.data;

      const mergedData: InventoryRow[] = catalog.map(item => {
        const stockRecord = stock.find(s => s.itemId === item.id);
        return {
          ...item,
          cost: item.cost || 0, 
          linkedRecipes: item.linkedRecipes || [], 
          quantity: stockRecord ? stockRecord.quantity : 0
        };
      });

      setInventory(mergedData.sort((a, b) => a.name.localeCompare(b.name)));
      
    } catch (err) {
      console.error("Failed to load inventory data", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL]);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // --- ACTIONS ---

  const handleCreateOrUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = { 
        name: formData.name, 
        sku: formData.sku, 
        category: formData.category, 
        unit: formData.unit,
        cost: Number(formData.cost) || 0
      };

      if (isEditMode) {
        await axios.patch(`${API_URL}/api/v1/inventory/item/${formData.id}`, payload, axiosConfig);
        setSuccess(`${formData.name} updated successfully.`);
      } else {
        await axios.post(`${API_URL}/api/v1/inventory/item`, { ...payload, organizationId }, axiosConfig);
        setSuccess(`${formData.name} added to the catalog.`);
      }
      
      fetchInventoryData();
      setTimeout(() => { closeModals(); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} item.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}? This will remove it from all branch stocks.`)) return;
    
    try {
      await axios.delete(`${API_URL}/api/v1/inventory/item/${id}`, axiosConfig);
      fetchInventoryData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete item. It might be linked to active recipes or LPOs.");
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !user?.branchId) return;
    setIsAdjusting(true);
    setError(null);
    setSuccess(null);

    try {
      await axios.patch(`${API_URL}/api/v1/inventory/stock`, { 
        itemId: selectedItem.id, branchId: user.branchId, quantity: Number(adjustQuantity) 
      }, axiosConfig);
      
      setSuccess(`Stock updated successfully.`);
      fetchInventoryData();
      setTimeout(() => { closeModals(); }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update stock levels.");
    } finally {
      setIsAdjusting(false);
    }
  };

  // --- MODAL HANDLERS ---
  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({ id: "", name: "", sku: "", category: "", unit: "", cost: "" });
    setError(null); setSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryRow) => {
    setIsEditMode(true);
    setFormData({ id: item.id, name: item.name, sku: item.sku, category: item.category, unit: item.unit, cost: item.cost?.toString() || "" });
    setError(null); setSuccess(null);
    setIsModalOpen(true);
  };

  const openAdjustModal = (item: InventoryRow) => {
    setSelectedItem(item);
    setAdjustQuantity(item.quantity);
    setError(null); setSuccess(null);
    setIsAdjustModalOpen(true);
  };

  const openUsageModal = (item: InventoryRow) => {
    setSelectedItem(item);
    setIsUsageModalOpen(true);
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsAdjustModalOpen(false);
    setIsUsageModalOpen(false);
    setSelectedItem(null);
    setSuccess(null);
    setError(null);
  };

  const exportToCSV = () => {
    const headers = ['Item Name', 'SKU', 'Category', 'Unit', 'Cost (TZS)', 'Current Quantity', 'Total Value (TZS)'];
    const csvData = filteredInventory.map(item => [
        `"${item.name}"`, 
        item.sku, 
        item.category.replace('_', ' '), 
        item.unit, 
        item.cost || 0,
        item.quantity,
        (item.cost || 0) * item.quantity
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // --- COMPUTATIONS ---
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "" || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const uniqueCategories = Array.from(new Set(inventory.map(item => item.category)));
  const lowStockCount = inventory.filter(item => item.quantity <= 10 && item.quantity > 0).length;
  const outOfStockCount = inventory.filter(item => item.quantity === 0).length;
  const totalValuation = inventory.reduce((sum, item) => sum + ((item.cost || 0) * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Syncing Master Ledger...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto space-y-8 relative pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Inventory Control</h2>
          <p className="text-zinc-500 mt-1 font-medium">Track raw materials, unit costs, and operational stock at {user?.branchName}.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={openCreateModal} className="bg-bakery-brown hover:bg-bakery-chocolate text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center">
            <Plus className="w-5 h-5 mr-2" /> Add to Catalog
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-blue-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <h6 className="text-zinc-500 font-bold uppercase mb-1 tracking-wider text-xs">Total Stock Value</h6>
            <h3 className="text-zinc-900 mb-0 text-2xl font-extrabold">TZS {totalValuation.toLocaleString()}</h3>
          </div>
          <div className="text-blue-600 bg-blue-50 p-3 rounded-2xl"><Banknote className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-emerald-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <h6 className="text-zinc-500 font-bold uppercase mb-1 tracking-wider text-xs">Active SKUs</h6>
            <h3 className="text-zinc-900 mb-0 text-2xl font-extrabold">{inventory.length}</h3>
          </div>
          <div className="text-emerald-600 bg-emerald-50 p-3 rounded-2xl"><Boxes className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-amber-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <h6 className="text-zinc-500 font-bold uppercase mb-1 tracking-wider text-xs">Low Stock Alerts</h6>
            <h3 className="text-zinc-900 mb-0 text-2xl font-extrabold">{lowStockCount}</h3>
          </div>
          <div className="text-amber-600 bg-amber-50 p-3 rounded-2xl"><AlertTriangle className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-red-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform">
          <div>
            <h6 className="text-zinc-500 font-bold uppercase mb-1 tracking-wider text-xs">Out of Stock</h6>
            <h3 className="text-zinc-900 mb-0 text-2xl font-extrabold">{outOfStockCount}</h3>
          </div>
          <div className="text-red-600 bg-red-50 p-3 rounded-2xl"><XCircle className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm">
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search by name or SKU..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select 
                className="pl-9 pr-8 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-bakery-gold appearance-none"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="RAW_MATERIAL">Raw Material</option>
                <option value="PACKAGING">Packaging</option>
                <option value="FINISHED_GOOD">Finished Good</option>
              </select>
            </div>
          </div>
          <button onClick={exportToCSV} className="w-full md:w-auto btn btn-outline-success text-sm font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-100 flex items-center justify-center transition-colors">
             <Download className="w-4 h-4 mr-2" /> Export Ledger
          </button>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4 text-right">Cost (TZS)</th>
                <th className="px-6 py-4">Current Stock</th>
                <th className="px-6 py-4">Usage (Recipes)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                    No items found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isOut = item.quantity === 0;
                  const isLow = item.quantity > 0 && item.quantity <= 10;
                  
                  return (
                    <tr key={item.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm flex-shrink-0 ${isOut ? 'bg-red-50 text-red-500 border-red-100' : isLow ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                            <Package className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 group-hover:text-bakery-gold transition-colors">{item.name}</p>
                            <p className="text-[11px] font-medium text-zinc-500 flex items-center mt-0.5 uppercase tracking-wider">
                              <Tag className="w-3 h-3 mr-1 text-zinc-400" /> {item.sku}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase tracking-wider">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-zinc-700">
                        {item.cost?.toLocaleString() || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-baseline space-x-1.5">
                          <span className={`text-xl font-extrabold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-zinc-900'}`}>
                            {item.quantity.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">{item.unit}</span>
                        </div>
                        {isOut && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-0.5 block">Out of Stock</span>}
                        {isLow && <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mt-0.5 block">Low Stock Alert</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-zinc-500 max-w-[200px] truncate" title={item.linkedRecipes?.map(r=>r.name).join(', ')}>
                           {item.linkedRecipes && item.linkedRecipes.length > 0 ? (
                             <span className="flex items-center text-blue-600 font-medium">
                               <ChefHat className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" /> {item.linkedRecipes.length} Linked Recipes
                             </span>
                           ) : (
                             <span className="opacity-50">Not Linked</span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openUsageModal(item)} title="View Usage" className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openAdjustModal(item)} title="Adjust Stock" className="p-2 text-bakery-brown bg-bakery-cream hover:bg-bakery-gold/20 rounded-lg transition-colors border border-bakery-gold/30">
                            <ArrowUpDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(item)} title="Edit Details" className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id, item.name)} title="Delete Item" className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- INLINE MODAL: STOCK ADJUSTMENT --- */}
      {isAdjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModals} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-bakery-gold/20 text-bakery-brown rounded-xl shadow-sm">
                  <Calculator className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Adjust Stock</h3>
              </div>
              <button onClick={closeModals} className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <form id="adjust-form" onSubmit={handleAdjustStock} className="space-y-5">
                {error && <div className="p-3 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
                {success && <div className="p-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">{success}</div>}

                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <p className="text-sm font-bold text-zinc-900">{selectedItem.name}</p>
                  <p className="text-xs font-medium text-zinc-500 mt-0.5">SKU: {selectedItem.sku}</p>
                  <div className="mt-3 flex justify-between items-center text-xs">
                     <span className="font-bold text-zinc-500 uppercase">Current DB Count:</span>
                     <span className="font-bold text-zinc-900">{selectedItem.quantity} {selectedItem.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">New Physical Count</label>
                  <div className="relative">
                    <input 
                      type="number" required min="0" step="0.01"
                      value={adjustQuantity} 
                      onChange={(e) => setAdjustQuantity(e.target.value === "" ? "" : Number(e.target.value))} 
                      className="w-full px-4 py-3.5 bg-white border border-zinc-300 rounded-xl text-lg font-bold text-zinc-900 focus:ring-2 focus:ring-bakery-gold shadow-sm transition-all" 
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      <span className="text-sm font-bold text-zinc-500 uppercase">{selectedItem.unit}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium">Enter the actual count currently present in the warehouse.</p>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex space-x-3">
              <button type="button" onClick={closeModals} className="flex-1 py-2.5 text-sm font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm">
                Cancel
              </button>
              <button type="submit" form="adjust-form" disabled={isAdjusting} className="flex-1 py-2.5 text-sm font-bold bg-zinc-900 hover:bg-black text-white rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-70">
                {isAdjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Adjustment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- INLINE MODAL: VIEW USAGE (RECIPES) --- */}
      {isUsageModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModals} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-zinc-900">Usage Details</h3>
                   <p className="text-xs font-medium text-zinc-500 mt-0.5">{selectedItem.name}</p>
                </div>
              </div>
              <button onClick={closeModals} className="text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 p-1.5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-0 overflow-y-auto max-h-96">
               <table className="w-full text-left">
                 <thead className="bg-zinc-50/80 border-b border-zinc-100 text-[11px] uppercase tracking-wider text-zinc-500 font-bold sticky top-0">
                   <tr>
                     <th className="px-6 py-3">Production Recipe</th>
                     <th className="px-6 py-3 text-right">Qty Needed (Per 1 Unit)</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-100">
                    {!selectedItem.linkedRecipes || selectedItem.linkedRecipes.length === 0 ? (
                       <tr>
                         <td colSpan={2} className="px-6 py-10 text-center text-zinc-500">
                            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">This raw material is not linked to any active recipes.</p>
                         </td>
                       </tr>
                    ) : (
                       selectedItem.linkedRecipes.map((recipe, idx) => (
                         <tr key={idx} className="hover:bg-zinc-50">
                           <td className="px-6 py-4 font-bold text-zinc-800 text-sm">{recipe.name}</td>
                           <td className="px-6 py-4 text-right font-medium text-zinc-700">
                             {recipe.quantityNeeded} <span className="text-xs text-zinc-400">{selectedItem.unit}</span>
                           </td>
                         </tr>
                       ))
                    )}
                 </tbody>
               </table>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button type="button" onClick={closeModals} className="px-6 py-2.5 text-sm font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SLIDE OVER MODAL: ADD/EDIT CATALOG ITEM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModals} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{isEditMode ? 'Edit Catalog Item' : 'New Catalog Item'}</h3>
                <p className="text-sm font-medium text-zinc-500">{isEditMode ? 'Update material details and pricing.' : 'Define a new material for the organization.'}</p>
              </div>
              <button onClick={closeModals} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white rounded-full shadow-sm"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="catalog-form" onSubmit={handleCreateOrUpdateItem} className="space-y-5">
                {error && <div className="p-3 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
                {success && <div className="p-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">{success}</div>}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Item Name</label>
                  <input type="text" required placeholder="e.g. White Baking Flour" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold shadow-sm transition-all" />
                </div>

                <div className="flex gap-4">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">SKU / Code</label>
                    <input type="text" required placeholder="FLR-WHT-50" value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-bakery-gold shadow-sm transition-all" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Cost (TZS)</label>
                    <input type="number" min="0" step="0.01" placeholder="e.g. 1500" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold shadow-sm transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Classification</label>
                  <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-bakery-gold shadow-sm transition-all">
                    <option value="">Select category...</option>
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="FINISHED_GOOD">Finished Good</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Unit of Measurement</label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select required value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-bakery-gold shadow-sm transition-all">
                      <option value="">Select unit...</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="g">Grams (g)</option>
                      <option value="liters">Liters (L)</option>
                      <option value="pieces">Pieces</option>
                      <option value="bags">Bags</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button type="submit" form="catalog-form" disabled={isSubmitting} className="w-full py-3.5 text-sm font-bold bg-bakery-brown hover:bg-bakery-chocolate text-white rounded-xl shadow-lg transition-all flex items-center justify-center disabled:opacity-70">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : (isEditMode ? "Save Changes" : "Publish to Master Catalog")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}