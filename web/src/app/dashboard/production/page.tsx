// web/src/app/dashboard/production/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Factory, 
  Plus, 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  Loader2,
  X,
  FileText,
  AlertCircle,
  ChefHat,
  Search,
  Eye,
  Download,
  Calculator,
  Utensils,
  ArrowRight,
  ClipboardList,
  Pencil,
  Trash2
} from "lucide-react";

interface CatalogItem {
  id: string;
  name: string;
  unit: string;
  category: string;
  cost?: number;
  price?: number; 
}

interface RecipeIngredient {
  id?: string;
  itemId: string;
  quantity: number;
  item: CatalogItem;
}

interface Recipe {
  id: string;
  name: string;
  targetItemId: string;
  targetItem: CatalogItem;
  ingredients?: RecipeIngredient[];
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  targetQty: number;
  status: string;
  recipe: Recipe;
  createdAt: string;
}

export default function ProductionDashboardPage() {
  const { user, token } = useAuthStore();

  // Dynamic URL evaluation matching local fallback or production environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'MENU'>('QUEUE');
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal States
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Forms State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [orderForm, setOrderForm] = useState({ recipeId: "", targetQty: "" });
  
  // Unified Menu/Recipe Builder State
  const [recipeForm, setRecipeForm] = useState({ id: "", name: "", price: "", targetItemId: "" });
  const [ingredients, setIngredients] = useState([{ itemId: "", quantity: "" }]);

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  const fetchProductionData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    
    try {
      setIsLoading(true);
      const branchRes = await axios.get(`${API_URL}/api/v1/branches/${user.branchId}`, axiosConfig);
      const currentOrgId = branchRes.data.organizationId;
      setOrganizationId(currentOrgId);

      const [ordersRes, recipesRes, catalogRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/production/orders/${user.branchId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/production/recipes/${currentOrgId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/inventory/catalog/${currentOrgId}`, axiosConfig)
      ]);
      
      setOrders(ordersRes.data);
      setRecipes(recipesRes.data);
      setCatalog(catalogRes.data);
    } catch (err) {
      console.error("Failed to load production data", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL]);

  useEffect(() => {
    fetchProductionData();
  }, [fetchProductionData]);

  // --- ACTIONS ---

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.branchId) return;
    setIsSubmitting(true); setError(null); setSuccess(null);

    try {
      await axios.post(`${API_URL}/api/v1/production/order`, { 
        recipeId: orderForm.recipeId, branchId: user.branchId, targetQty: Number(orderForm.targetQty) 
      }, axiosConfig);
      
      setSuccess("Production batch queued successfully.");
      setOrderForm({ recipeId: "", targetQty: "" });
      fetchProductionData();
      setTimeout(() => { setIsOrderModalOpen(false); setSuccess(null); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrUpdateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    setIsSubmitting(true); setError(null);

    const validIngredients = ingredients
      .filter(i => i.itemId !== "" && i.quantity !== "")
      .map(i => ({ itemId: i.itemId, quantity: Number(i.quantity) }));

    try {
      // 1. Create or Update the Finished Good Item in Inventory Catalog
      const itemPayload = {
        name: recipeForm.name,
        sku: isEditMode ? undefined : `FG-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'FINISHED_GOOD',
        unit: 'pieces',
        price: Number(recipeForm.price) || 0,
        organizationId
      };

      let targetId = recipeForm.targetItemId;

      if (isEditMode && targetId) {
        await axios.patch(`${API_URL}/api/v1/inventory/item/${targetId}`, itemPayload, axiosConfig);
      } else {
        const itemRes = await axios.post(`${API_URL}/api/v1/inventory/item`, itemPayload, axiosConfig);
        targetId = itemRes.data.id;
      }

      // 2. Create or Update the Recipe
      const recipePayload = {
        name: `${recipeForm.name} Recipe`,
        targetItemId: targetId,
        organizationId,
        ingredients: validIngredients
      };

      if (isEditMode) {
        await axios.patch(`${API_URL}/api/v1/production/recipe/${recipeForm.id}`, recipePayload, axiosConfig);
        setSuccess("Menu Item updated successfully.");
      } else {
        await axios.post(`${API_URL}/api/v1/production/recipe`, recipePayload, axiosConfig);
        setSuccess("Menu Item created successfully.");
      }
      
      fetchProductionData();
      setTimeout(() => { setIsRecipeModalOpen(false); setSuccess(null); }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await axios.delete(`${API_URL}/api/v1/production/recipe/${id}`, axiosConfig);
      fetchProductionData();
    } catch (err: any) {
      alert("Failed to delete recipe. It may be linked to past production orders.");
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await axios.patch(`${API_URL}/api/v1/production/order/${orderId}/status`, { status: newStatus }, axiosConfig);
      fetchProductionData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update status. Check inventory levels.");
    }
  };

  // --- MODAL HANDLERS ---
  const openCreateRecipeModal = () => {
    setIsEditMode(false);
    setRecipeForm({ id: "", name: "", price: "", targetItemId: "" });
    setIngredients([{ itemId: "", quantity: "" }]);
    setError(null); setSuccess(null);
    setIsRecipeModalOpen(true);
  };

  const openEditRecipeModal = (recipe: Recipe) => {
    setIsEditMode(true);
    setRecipeForm({ 
      id: recipe.id, 
      name: recipe.targetItem.name, 
      price: recipe.targetItem.price?.toString() || "0", 
      targetItemId: recipe.targetItemId 
    });
    
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      setIngredients(recipe.ingredients.map(ing => ({ itemId: ing.itemId, quantity: ing.quantity.toString() })));
    } else {
      setIngredients([{ itemId: "", quantity: "" }]);
    }
    
    setError(null); setSuccess(null);
    setIsRecipeModalOpen(true);
  };

  // --- COMPUTATIONS & EXPORTS ---
  const calculateLiveRecipeCost = () => {
    let total = 0;
    ingredients.forEach(ing => {
      if (ing.itemId && ing.quantity) {
        const catItem = catalog.find(c => c.id === ing.itemId);
        if (catItem && catItem.cost) {
          total += catItem.cost * Number(ing.quantity);
        }
      }
    });
    return total;
  };

  const getRecipeTotalCost = (recipe: Recipe) => {
    if (!recipe.ingredients) return 0;
    return recipe.ingredients.reduce((sum, ing) => sum + ((ing.item.cost || 0) * ing.quantity), 0);
  };

  const filteredOrders = orders.filter(o => 
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecipes = recipes.filter(r => 
    r.targetItem.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const inProgressCount = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const completedToday = orders.filter(o => o.status === 'COMPLETED' && new Date(o.createdAt).toDateString() === new Date().toDateString()).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Syncing Manufacturing Floor...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto space-y-8 relative pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Production & Menu</h2>
          <p className="text-zinc-500 mt-1 font-medium">Manage daily baking batches and Master Menu Items.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={openCreateRecipeModal} className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center">
            <Plus className="w-4 h-4 mr-2 text-blue-600" /> Add Menu Item
          </button>
          <button onClick={() => setIsOrderModalOpen(true)} className="bg-bakery-brown hover:bg-bakery-chocolate text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center">
            <Factory className="w-5 h-5 mr-2" /> Queue Batch
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-amber-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <h6 className="text-zinc-500 font-bold uppercase mb-1 tracking-wider text-xs">Ovens Running</h6>
            <h3 className="text-amber-900 mb-0 text-3xl font-extrabold">{inProgressCount}</h3>
          </div>
          <div className="text-amber-600 bg-amber-100 p-3 rounded-2xl animate-pulse"><Factory className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-zinc-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <h6 className="text-zinc-500 font-bold uppercase mb-1 tracking-wider text-xs">Pending Batches</h6>
            <h3 className="text-zinc-900 mb-0 text-3xl font-extrabold">{pendingCount}</h3>
          </div>
          <div className="text-zinc-600 bg-zinc-100 p-3 rounded-2xl"><Clock className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-emerald-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <h6 className="text-zinc-500 font-bold uppercase mb-1 tracking-wider text-xs">Today's Yield</h6>
            <h3 className="text-zinc-900 mb-0 text-3xl font-extrabold">{completedToday}</h3>
          </div>
          <div className="text-emerald-600 bg-emerald-50 p-3 rounded-2xl"><CheckCircle2 className="w-6 h-6" /></div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 rounded-2xl shadow-lg flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="z-10">
            <h6 className="text-zinc-400 font-bold uppercase mb-1 tracking-wider text-xs">Menu Items</h6>
            <h3 className="text-white mb-0 text-3xl font-extrabold">{recipes.length}</h3>
          </div>
          <div className="text-zinc-300 bg-white/10 p-3 rounded-2xl z-10"><Utensils className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/50 px-2 pt-2 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab('QUEUE')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'QUEUE' ? 'border-bakery-gold text-bakery-brown bg-white rounded-t-xl' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            <ClipboardList className="w-4 h-4 mr-2" /> Live Production Queue
          </button>
          <button onClick={() => setActiveTab('MENU')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'MENU' ? 'border-bakery-gold text-bakery-brown bg-white rounded-t-xl' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            <ChefHat className="w-4 h-4 mr-2" /> Menu Management (Recipes)
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white border-b border-zinc-100">
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold transition-all"
              />
            </div>
          </div>
        </div>

        {/* --- DYNAMIC TABLES --- */}
        <div className="overflow-x-auto">
          {activeTab === 'QUEUE' ? (
            // LIVE QUEUE TABLE
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                  <th className="px-6 py-4">Batch Details</th>
                  <th className="px-6 py-4">Target Output</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500"><Factory className="w-12 h-12 text-zinc-300 mx-auto mb-3" />No active production orders.</td></tr>
                ) : (
                  filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <h4 className="font-bold text-zinc-900">{order.recipe.targetItem.name}</h4>
                        <div className="flex items-center text-[11px] font-medium text-zinc-500 mt-1 space-x-2">
                          <span className="uppercase tracking-wider">{order.orderNumber}</span>
                          <span>•</span>
                          <span>{new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold border shadow-sm ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : order.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                            {order.targetQty}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.status === 'PENDING' && <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-md text-[10px] font-bold border border-zinc-200 uppercase tracking-wider">Queued</span>}
                        {order.status === 'IN_PROGRESS' && <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-md text-[10px] font-bold border border-amber-200 animate-pulse uppercase tracking-wider">Baking</span>}
                        {order.status === 'COMPLETED' && <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-200 uppercase tracking-wider">Completed</span>}
                        {order.status === 'CANCELLED' && <span className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-[10px] font-bold border border-red-200 uppercase tracking-wider">Cancelled</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {order.status === 'PENDING' && (
                            <button onClick={() => updateStatus(order.id, 'IN_PROGRESS')} className="flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold transition-colors">
                              <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Start
                            </button>
                          )}
                          {order.status === 'IN_PROGRESS' && (
                            <button onClick={() => updateStatus(order.id, 'COMPLETED')} className="flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Finish
                            </button>
                          )}
                          {order.status === 'PENDING' && (
                             <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors" title="Cancel">
                                <X className="w-4 h-4" />
                             </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            // MENU MANAGEMENT TABLE (Master Recipes)
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4 hidden md:table-cell">Recipe</th>
                  <th className="px-6 py-4 text-right">Selling Price</th>
                  <th className="px-6 py-4 text-right">Unit Cost</th>
                  <th className="px-6 py-4 text-right">Margin</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRecipes.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-zinc-500"><ChefHat className="w-12 h-12 text-zinc-300 mx-auto mb-3" />No menu items defined.</td></tr>
                ) : (
                  filteredRecipes.map(recipe => {
                    const price = recipe.targetItem.price || 0;
                    const cost = getRecipeTotalCost(recipe);
                    const profit = price - cost;
                    const margin = price > 0 ? Math.round((profit / price) * 100) : 0;
                    
                    const marginColor = (margin < 30 && cost > 0) ? 'bg-red-100 text-red-700 border-red-200' : (margin >= 50 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200');

                    return (
                      <tr key={recipe.id} className="hover:bg-zinc-50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-900 truncate max-w-[200px]">{recipe.targetItem.name}</p>
                          <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase tracking-wider">
                            {recipe.targetItem.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          {recipe.ingredients && recipe.ingredients.length > 0 ? (
                             <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                               {recipe.ingredients.length} Ingred.
                             </span>
                          ) : (
                             <span className="text-xs text-zinc-400">No Recipe</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-zinc-900">
                          {price > 0 ? price.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-zinc-600">
                          {cost > 0 ? cost.toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {cost > 0 ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${marginColor}`}>
                              {margin}%
                            </span>
                          ) : <span className="text-zinc-400 text-xs">-</span>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setSelectedRecipe(recipe)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200" title="Dish Analytics">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setOrderForm({ recipeId: recipe.id, targetQty: "1" }); setIsOrderModalOpen(true); }} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200" title="Quick Queue">
                              <Factory className="w-4 h-4" />
                            </button>
                            <button onClick={() => openEditRecipeModal(recipe)} className="p-2 text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors border border-zinc-200" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteRecipe(recipe.id, recipe.targetItem.name)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- MODAL: RECIPE ANALYTICS (Dish Breakdown) --- */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedRecipe(null)} />
          <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm"><Calculator className="w-5 h-5" /></div>
                <div><h3 className="text-lg font-bold text-zinc-900">Dish Analytics</h3><p className="text-xs font-medium text-zinc-500 mt-0.5">BOM & Profitability</p></div>
              </div>
              <button onClick={() => setSelectedRecipe(null)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
               <div className="text-center mb-6">
                 <h2 className="text-3xl font-extrabold text-blue-600">{selectedRecipe.targetItem.name}</h2>
                 <span className="inline-block mt-2 px-3 py-1 bg-zinc-100 text-zinc-600 text-xs font-bold rounded uppercase">{selectedRecipe.targetItem.category}</span>
               </div>

               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Selling Price</p>
                    <h3 className="text-2xl font-extrabold text-zinc-900">TZS {(selectedRecipe.targetItem.price || 0).toLocaleString()}</h3>
                 </div>
                 <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Total Cost</p>
                    <h3 className="text-2xl font-extrabold text-red-700">TZS {getRecipeTotalCost(selectedRecipe).toLocaleString()}</h3>
                 </div>
               </div>

               <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-200 pb-2 mb-3">Recipe Breakdown</h4>
               <table className="w-full text-left mb-6">
                 <tbody className="divide-y divide-zinc-100">
                   {selectedRecipe.ingredients?.length === 0 ? (
                      <tr><td className="py-4 text-center text-zinc-400 italic text-sm">No linked ingredients.</td></tr>
                   ) : (
                     selectedRecipe.ingredients?.map((ing, idx) => (
                       <tr key={idx}>
                         <td className="py-3 pr-4"><p className="font-bold text-zinc-800 text-sm">{ing.item.name}</p></td>
                         <td className="py-3 px-4 text-center"><span className="font-semibold text-zinc-600 text-sm">{ing.quantity} {ing.item.unit}</span></td>
                         <td className="py-3 pl-4 text-right"><p className="font-bold text-zinc-900 text-sm">TZS {((ing.item.cost || 0) * ing.quantity).toLocaleString()}</p></td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>

               {(() => {
                 const price = selectedRecipe.targetItem.price || 0;
                 const cost = getRecipeTotalCost(selectedRecipe);
                 const margin = price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
                 const bgClass = margin >= 50 ? 'bg-emerald-600' : (margin >= 30 ? 'bg-amber-500' : 'bg-red-600');
                 return (
                   <div className={`${bgClass} p-5 rounded-2xl shadow-lg flex justify-between items-center text-white`}>
                     <span className="text-sm font-bold uppercase tracking-wider">Profit Margin</span>
                     <h3 className="text-3xl font-extrabold">{margin}%</h3>
                   </div>
                 );
               })()}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: MENU ITEM SETUP (Dual Column) --- */}
      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsRecipeModalOpen(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-900 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{isEditMode ? 'Edit Menu Item' : 'Menu Item Setup'}</h3>
              <button onClick={() => setIsRecipeModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="menu-form" onSubmit={handleCreateOrUpdateRecipe}>
                {error && <div className="mb-4 p-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
                
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Left Column: Basic Info */}
                  <div className="flex-1 space-y-5 md:pr-8 md:border-r border-zinc-200">
                    <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-xs border-b border-zinc-100 pb-2">Basic Info</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-600 uppercase">Menu Name</label>
                      <input type="text" required value={recipeForm.name} onChange={e => setRecipeForm({...recipeForm, name: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500" placeholder="e.g. Standard White Bread" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-600 uppercase">Selling Price (TZS)</label>
                      <input type="number" required min="0" value={recipeForm.price} onChange={e => setRecipeForm({...recipeForm, price: e.target.value})} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-xl text-lg font-extrabold text-zinc-900 focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
                    </div>
                  </div>

                  {/* Right Column: Recipe/Ingredients */}
                  <div className="flex-[1.5] space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-xs">Ingredients / Recipe</h4>
                      <button type="button" onClick={() => setIngredients([...ingredients, { itemId: "", quantity: "" }])} className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 bg-blue-50 rounded-lg transition-colors">+ Add</button>
                    </div>
                    
                    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                      {ingredients.length === 0 ? (
                        <div className="text-center text-zinc-400 text-sm py-4">No linked items. Click "Add" to define recipe.</div>
                      ) : (
                        ingredients.map((ing, index) => (
                          <div key={index} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-zinc-100 shadow-sm">
                            <select required value={ing.itemId} onChange={e => {
                              const newIng = [...ingredients]; newIng[index].itemId = e.target.value; setIngredients(newIng);
                            }} className="flex-1 px-2 py-1.5 bg-transparent border-none text-sm font-medium focus:ring-0 outline-none">
                              <option value="">Select Item...</option>
                              {catalog.filter(c => c.category !== 'FINISHED_GOOD').map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                              ))}
                            </select>
                            <input type="number" required min="0.001" step="0.001" value={ing.quantity} onChange={e => {
                              const newIng = [...ingredients]; newIng[index].quantity = e.target.value; setIngredients(newIng);
                            }} className="w-24 px-2 py-1.5 bg-zinc-50 border border-zinc-200 rounded text-sm text-center font-bold" placeholder="Qty" />
                            <button type="button" onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))} className="p-2 text-zinc-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="flex justify-end pt-2">
                      <p className="text-sm font-bold text-zinc-500">
                        Est. Cost: <span className="text-lg text-zinc-900 font-extrabold ml-2">{calculateLiveRecipeCost().toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-3">
              <button onClick={() => setIsRecipeModalOpen(false)} className="px-6 py-2.5 text-sm font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors shadow-sm">
                Cancel
              </button>
              <button type="submit" form="menu-form" disabled={isSubmitting} className="px-8 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center disabled:opacity-70">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {isSubmitting ? "Saving..." : "Save Menu Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: QUEUE BATCH --- */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOrderModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Queue Production Batch</h3>
                <p className="text-sm font-medium text-zinc-500">Send an order to the baking floor.</p>
              </div>
              <button onClick={() => setIsOrderModalOpen(false)} className="text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <form id="order-form" onSubmit={handleCreateOrder} className="space-y-4">
                {error && <div className="p-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
                {success && <div className="p-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">{success}</div>}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Select Master Recipe</label>
                  <select required value={orderForm.recipeId} onChange={e => setOrderForm({...orderForm, recipeId: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold">
                    <option value="">Choose...</option>
                    {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Target Output Quantity</label>
                  <input type="number" required min="1" value={orderForm.targetQty} onChange={e => setOrderForm({...orderForm, targetQty: e.target.value})} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-bakery-gold" placeholder="e.g. 100" />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-zinc-100 bg-zinc-50">
              <button type="submit" form="order-form" disabled={isSubmitting} className="w-full py-2.5 text-sm font-bold bg-bakery-brown hover:bg-bakery-chocolate text-white rounded-xl shadow-md transition-all flex items-center justify-center disabled:opacity-70">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Factory className="w-4 h-4 mr-2"/>}
                {isSubmitting ? "Queueing..." : "Send to Baking Floor"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}