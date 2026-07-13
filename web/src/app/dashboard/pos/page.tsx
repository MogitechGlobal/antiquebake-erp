// web/src/app/dashboard/pos/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Loader2,
  CheckCircle2,
  Search,
  Package,
  Clock,
  Printer,
  BellRing,
  UtensilsCrossed,
  LayoutGrid,
  Trash2,AlertCircle,
  Receipt
} from "lucide-react";

interface StockItem {
  id: string;
  quantity: number;
  itemId: string;
  item: {
    id: string;
    name: string;
    category: string;
    unit: string;
    sku: string;
    price?: number;
  };
}

interface CartItem {
  itemId: string;
  name: string;
  unit: string;
  maxQuantity: number;
  quantity: number;
  unitPrice: number;
  isLowStock: boolean;
}

interface ParkedOrder {
  id: string;
  customerName: string;
  items: CartItem[];
  timestamp: Date;
}

export default function POSDashboardPage() {
  const { user, token } = useAuthStore();
  
  // Dynamic URL evaluation matching local fallback or production environment variable
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  // Data State
  const [stock, setStock] = useState<StockItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'ACTIVE_ORDERS'>('REGISTER');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [customerName, setCustomerName] = useState("Walk-In");
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false); // Mobile UI Toggle
  
  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "MOBILE">("CASH");
  
  // Transaction State
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);

  const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Added 'silent' parameter to prevent unmounting the UI during background refreshes
  const fetchStockData = useCallback(async (silent = false) => {
    if (!user?.branchId || !token) return;
    try {
      if (!silent) setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/v1/inventory/stock/${user.branchId}`, axiosConfig);
      
      // STRICT FILTER: Only show items in stock that are FINISHED GOODS
      const availableStock = res.data.filter((s: StockItem) => {
        const isFinishedGood = s.item.category?.replace('_', ' ').toUpperCase() === 'FINISHED GOOD';
        return s.quantity > 0 && isFinishedGood;
      });
      
      setStock(availableStock);
    } catch (err) {
      console.error("Failed to load POS stock data", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL]);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  // --- CART MANAGEMENT ---
  const addToCart = (stockItem: StockItem) => {
    setCart((prev) => {
      const existing = prev.find(i => i.itemId === stockItem.item.id);
      if (existing) {
        if (existing.quantity >= stockItem.quantity) return prev; 
        return prev.map(i => i.itemId === stockItem.item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        itemId: stockItem.item.id,
        name: stockItem.item.name,
        unit: stockItem.item.unit,
        maxQuantity: stockItem.quantity,
        quantity: 1,
        unitPrice: stockItem.item.price || 0,
        isLowStock: stockItem.quantity <= 5
      }];
    });
  };

  const updateCartItem = (itemId: string, field: "quantity" | "unitPrice", value: number) => {
    setCart(prev => prev.map(item => {
      if (item.itemId !== itemId) return item;
      if (field === "quantity" && (value < 1 || value > item.maxQuantity)) return item;
      return { ...item, [field]: value };
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.itemId !== itemId));
  };

  const clearCart = () => {
    if(confirm("Are you sure you want to clear the register?")) {
      setCart([]);
      setCustomerName("Walk-In");
    }
  };

  // --- ORDER HOLDING (KITCHEN/TABLES) ---
  const parkOrder = () => {
    if (cart.length === 0) return;
    const newOrder: ParkedOrder = {
      id: `TAB-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: customerName || "Table/Walk-In",
      items: [...cart],
      timestamp: new Date()
    };
    setParkedOrders([...parkedOrders, newOrder]);
    setCart([]);
    setCustomerName("Walk-In");
    setActiveTab('ACTIVE_ORDERS');
    setIsMobileCartOpen(false); // Return to menu on mobile
  };

  const resumeOrder = (orderId: string) => {
    if (cart.length > 0) {
      if(!confirm("You have items in the register. Resume this order and overwrite the register?")) return;
    }
    const order = parkedOrders.find(o => o.id === orderId);
    if (order) {
      setCart(order.items);
      setCustomerName(order.customerName);
      setParkedOrders(parkedOrders.filter(o => o.id !== orderId));
      setActiveTab('REGISTER');
      setIsMobileCartOpen(true); // Automatically open cart on mobile to review resumed order
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // --- CHECKOUT ---
  const handleCheckout = async () => {
    if (!user?.branchId || !user?.id || cart.length === 0) return;
    if (cart.some(item => item.unitPrice <= 0)) {
      setError("All items must have a valid unit price.");
      return;
    }

    setIsProcessing(true); setError(null);

    try {
      const payload = {
        branchId: user.branchId,
        staffId: user.id,
        paymentMethod,
        items: cart.map(i => ({
          itemId: i.itemId,
          quantity: i.quantity,
          unitPrice: i.unitPrice
        }))
      };

      const res = await axios.post(`${API_URL}/api/v1/pos/checkout`, payload, axiosConfig);
      
      const printItems = cart.map(c => ({
         itemId: c.itemId,
         name: c.name,
         quantity: c.quantity,
         subtotal: c.quantity * c.unitPrice
      }));

      setSuccessReceipt({
        ...res.data, 
        customer: customerName,
        printItems
      });
      
      setIsPaymentModalOpen(false);
      setCart([]);
      setCustomerName("Walk-In");
      setIsMobileCartOpen(false); // Return to menu on mobile
      
      // Pass 'true' to fetchStockData to refresh silently
      fetchStockData(true); 
      
      // Auto-trigger print
      setTimeout(() => { window.print(); }, 500);

    } catch (err: any) {
      setError(err.response?.data?.message || "Transaction failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- FILTERS ---
  const categories = ["All", ...Array.from(new Set(stock.map(s => s.item.category.replace('_', ' '))))];
  
  const filteredStock = stock.filter(s => {
    const matchesSearch = s.item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === "All" || s.item.category.replace('_', ' ') === activeCategory;
    return matchesSearch && matchesCat;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-bakery-gold" />
        <span className="font-bold text-xl tracking-tight">Initializing Point of Sale...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-[calc(100dvh-6rem)] lg:h-[calc(100vh-8rem)] print:m-0 print:h-auto print:gap-0">
      
      {/* --- MOBILE TOGGLE HEADER --- */}
      <div className="lg:hidden flex items-center justify-between bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm flex-shrink-0">
        <h2 className="font-extrabold text-zinc-900 ml-2 tracking-tight">Smart POS</h2>
        <button 
          onClick={() => setIsMobileCartOpen(!isMobileCartOpen)}
          className="px-4 py-2 bg-zinc-900 text-white text-sm font-bold rounded-xl flex items-center shadow-md active:scale-95 transition-all"
        >
          {isMobileCartOpen ? (
            "Back to Menu"
          ) : (
            <><ShoppingBag className="w-4 h-4 mr-2" /> View Cart ({cart.length})</>
          )}
        </button>
      </div>

      {/* LEFT PANEL: Library & Tabs */}
      <div className={`${isMobileCartOpen ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden h-full print:hidden`}>
        
        {/* Header & Tabs */}
        <div className="bg-zinc-900 pt-4 flex-shrink-0">
          <div className="px-4 pb-4 flex items-center justify-between">
             <div className="relative w-full max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
               <input 
                 type="text" 
                 placeholder="Search products..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-9 pr-3 py-2 bg-zinc-800 border-none rounded-xl text-sm text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-bakery-gold transition-all"
               />
             </div>
          </div>
          <div className="flex px-2 overflow-x-auto custom-scrollbar">
            <button onClick={() => setActiveTab('REGISTER')} className={`px-6 py-3 font-bold text-sm border-b-4 transition-colors flex items-center whitespace-nowrap ${activeTab === 'REGISTER' ? 'border-bakery-gold text-bakery-gold bg-zinc-800 rounded-t-xl' : 'border-transparent text-zinc-400 hover:text-white'}`}>
              <LayoutGrid className="w-4 h-4 mr-2" /> Menu Register
            </button>
            <button onClick={() => setActiveTab('ACTIVE_ORDERS')} className={`px-6 py-3 font-bold text-sm border-b-4 transition-colors flex items-center whitespace-nowrap ${activeTab === 'ACTIVE_ORDERS' ? 'border-bakery-gold text-bakery-gold bg-zinc-800 rounded-t-xl' : 'border-transparent text-zinc-400 hover:text-white'}`}>
              <UtensilsCrossed className="w-4 h-4 mr-2" /> Active Tables / Tabs
              {parkedOrders.length > 0 && <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{parkedOrders.length}</span>}
            </button>
          </div>
        </div>

        {/* View Panels */}
        {activeTab === 'REGISTER' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Pills (Only displays if multiple categories exist within FINISHED GOODS) */}
            {categories.length > 2 && (
              <div className="flex overflow-x-auto gap-2 p-3 bg-white border-b border-zinc-100 custom-scrollbar flex-shrink-0">
                {categories.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${activeCategory === cat ? 'bg-bakery-gold/10 text-bakery-brown border-bakery-gold/30' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            
            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStock.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-zinc-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No finished goods found in stock.</p>
                  </div>
                ) : (
                  filteredStock.map((stockItem) => {
                    const initials = stockItem.item.name.substring(0, 2).toUpperCase();
                    const color = stockItem.quantity <= 5 ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600';
                    
                    return (
                      <button
                        key={stockItem.id}
                        onClick={() => addToCart(stockItem)}
                        className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm hover:border-bakery-gold hover:shadow-md transition-all text-left group active:scale-95 flex flex-col justify-between h-36 relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-extrabold text-sm ${color} mb-2`}>
                             {initials}
                          </div>
                          {stockItem.quantity <= 5 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm animate-pulse">Low Stock</span>}
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-900 leading-tight text-sm line-clamp-2">{stockItem.item.name}</h3>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs font-extrabold text-bakery-brown">TZS {(stockItem.item.price || 0).toLocaleString()}</p>
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">{stockItem.quantity} left</span>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50">
            {parkedOrders.length === 0 ? (
               <div className="text-center text-zinc-400 py-12">
                 <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
                 <p className="font-medium">No active tables or held tabs.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {parkedOrders.map(order => (
                    <div key={order.id} onClick={() => resumeOrder(order.id)} className="bg-white p-5 rounded-2xl border-l-4 border-l-amber-500 border-y border-r border-zinc-200 shadow-sm cursor-pointer hover:bg-amber-50/30 transition-colors">
                       <div className="flex justify-between items-start mb-3">
                         <div>
                           <h4 className="font-extrabold text-zinc-900">{order.customerName}</h4>
                           <p className="text-xs font-bold text-zinc-500 mt-0.5">{order.id} • {order.items.length} Items</p>
                         </div>
                         <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded border border-amber-200">
                           <Clock className="w-3 h-3 inline mr-1"/>
                           {Math.floor((new Date().getTime() - order.timestamp.getTime()) / 60000)}m ago
                         </span>
                       </div>
                       <div className="flex justify-between items-end border-t border-zinc-100 pt-3">
                         <p className="text-xs text-zinc-400 truncate pr-4">{order.items.map(i=>i.name).join(', ')}</p>
                         <h3 className="font-extrabold text-bakery-brown">TZS {order.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString()}</h3>
                       </div>
                    </div>
                 ))}
               </div>
            )}
          </div>
        )}

      </div>

      {/* RIGHT PANEL: Current Ticket (Cart) */}
      <div className={`${isMobileCartOpen ? 'flex' : 'hidden lg:flex'} w-full lg:w-[400px] flex-col bg-white rounded-2xl border border-zinc-200 shadow-xl overflow-hidden h-full flex-shrink-0 z-10 print:hidden`}>
        
        {/* Ticket Header */}
        <div className="p-4 border-b border-zinc-200 bg-red-50/50 flex flex-col gap-3 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-zinc-900">Current Order</h2>
            <button onClick={clearCart} className="text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 bg-white px-2 py-1 rounded shadow-sm transition-colors">
               <Trash2 className="w-3 h-3 inline mr-1"/> Clear
            </button>
          </div>
          <div className="relative">
             <input type="text" placeholder="Table No. or Customer Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm font-bold text-zinc-800 focus:ring-2 focus:ring-bakery-gold" />
          </div>
        </div>

        {/* Ticket Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-zinc-50">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">Register is empty.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.itemId} className={`bg-white p-3 rounded-xl border shadow-sm ${item.isLowStock ? 'border-red-200 bg-red-50/30' : 'border-zinc-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-zinc-900 text-sm leading-tight pr-4">{item.name}</h4>
                    {item.isLowStock && <p className="text-[10px] font-bold text-red-500 mt-0.5"><AlertCircle className="w-3 h-3 inline mr-0.5"/> Low Stock Warning</p>}
                  </div>
                  <button onClick={() => removeFromCart(item.itemId)} className="text-zinc-400 hover:text-red-500 bg-zinc-100 rounded-full p-1 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between gap-2 border-t border-zinc-100 pt-2 mt-1">
                  <div className="flex items-center bg-zinc-100 rounded-lg border border-zinc-200">
                    <button onClick={() => updateCartItem(item.itemId, "quantity", item.quantity - 1)} className="p-1 hover:bg-white rounded text-zinc-600 transition-colors"><Minus className="w-4 h-4" /></button>
                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => updateCartItem(item.itemId, "quantity", item.quantity + 1)} className="p-1 hover:bg-white rounded text-zinc-600 transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <input 
                      type="number" min="0" value={item.unitPrice || ""} onChange={(e) => updateCartItem(item.itemId, "unitPrice", Number(e.target.value))}
                      className="w-20 px-1 py-1 bg-transparent border-b border-dashed border-zinc-300 text-sm font-bold focus:outline-none focus:border-bakery-gold text-right"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 font-bold">TZS {(item.quantity * item.unitPrice).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Summary & Action Buttons */}
        <div className="border-t border-zinc-200 bg-white flex-shrink-0">
          <div className="p-4 bg-zinc-100 border-b border-zinc-200 flex justify-between items-end">
            <span className="text-sm font-bold text-zinc-600 uppercase tracking-wider">Total</span>
            <span className="text-3xl font-extrabold text-zinc-900 tracking-tighter">
              TZS {cartTotal.toLocaleString()}
            </span>
          </div>

          <div className="p-4 flex gap-3">
            <button 
              onClick={parkOrder}
              disabled={cart.length === 0}
              className="flex-1 py-3.5 flex flex-col items-center justify-center text-sm font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl transition-all disabled:opacity-50"
            >
              <BellRing className="w-5 h-5 mb-1" />
              Hold / Kitchen
            </button>
            <button 
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="flex-1 py-3.5 flex flex-col items-center justify-center text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5 mb-1" />
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* --- PAYMENT MODAL --- */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isProcessing && setIsPaymentModalOpen(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Settle Order</h3>
              <button onClick={() => !isProcessing && setIsPaymentModalOpen(false)} className="text-zinc-400 hover:text-zinc-900"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              <h1 className="text-center text-4xl font-extrabold text-emerald-600 mb-6 tracking-tighter">
                 {cartTotal.toLocaleString()} <span className="text-sm text-emerald-600/60 uppercase ml-1">TZS</span>
              </h1>
              
              {error && <div className="mb-4 p-3 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => setPaymentMethod("CASH")} className={`py-4 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}>
                  <Banknote className="w-6 h-6 mb-2" />
                  <span className="text-sm font-bold">Cash</span>
                </button>
                <button onClick={() => setPaymentMethod("MOBILE")} className={`py-4 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${paymentMethod === 'MOBILE' ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}>
                  <Smartphone className="w-6 h-6 mb-2" />
                  <span className="text-sm font-bold">M-Pesa</span>
                </button>
                <button onClick={() => setPaymentMethod("CARD")} className={`col-span-2 py-4 flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${paymentMethod === 'CARD' ? 'border-bakery-gold bg-bakery-gold/10 text-bakery-brown shadow-sm' : 'border-zinc-200 text-zinc-500 hover:bg-zinc-50'}`}>
                  <CreditCard className="w-6 h-6 mb-2" />
                  <span className="text-sm font-bold">Card / POS</span>
                </button>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full py-3.5 text-sm font-bold bg-zinc-900 hover:bg-black text-white rounded-xl shadow-lg transition-all flex items-center justify-center disabled:opacity-70"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                {isProcessing ? "Processing..." : "Process & Print Receipt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINTABLE RECEIPT & CSS STYLES --- */}
      {successReceipt && (
        <>
          {/* On-Screen Success Confirmation */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-center p-8">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-900 mb-2">Payment Successful</h3>
              <p className="text-zinc-500 font-medium mb-6">Receipt is printing...</p>
              <button 
                onClick={() => setSuccessReceipt(null)}
                className="w-full py-3.5 text-sm font-bold bg-bakery-brown hover:bg-bakery-chocolate text-white rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Next Customer
              </button>
            </div>
          </div>

          {/* Strong Global CSS block to completely strip application shell during print */}
          <style type="text/css" media="print">
            {`
              @page { margin: 0; size: auto; }
              html, body { background: white !important; height: 100% !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
              body * { visibility: hidden; }
              /* Force hide Next.js layout wrappers */
              header, nav, aside, [data-testid="sidebar"], [data-testid="header"] { display: none !important; }
              #printable-receipt, #printable-receipt * { visibility: visible; }
              #printable-receipt { 
                position: absolute; 
                left: 0; 
                top: 0; 
                width: 100%; 
                max-width: 80mm; 
                margin: 0; 
                padding: 10px;
              }
            `}
          </style>

          {/* Actual Print Layout */}
          <div id="printable-receipt" className="hidden print:block absolute top-0 left-0 w-full bg-white text-black p-4 font-mono text-sm max-w-[80mm] mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold uppercase">AntiqueBake</h2>
              <p className="text-xs">Branch: {user?.branchName}</p>
              <p className="text-xs">P.O. Box 1234, Local City</p>
              <p className="text-xs">Tel: +255 700 000 000</p>
            </div>

            <div className="border-y border-dashed border-black py-2 mb-4 text-xs">
              <p>Receipt: {successReceipt.receiptNumber}</p>
              <p>Date: {new Date(successReceipt.createdAt).toLocaleString()}</p>
              <p>Cashier: {user?.firstName} {user?.lastName}</p>
              <p>Customer: {successReceipt.customer}</p>
            </div>

            <table className="w-full text-xs mb-4">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="text-left pb-1">Item</th>
                  <th className="text-right pb-1">Qty</th>
                  <th className="text-right pb-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {successReceipt.printItems.map((item: any) => (
                  <tr key={item.itemId}>
                    <td className="py-1 pr-2">{item.name}</td>
                    <td className="py-1 text-right">{item.quantity}</td>
                    <td className="py-1 text-right">{item.subtotal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-black pt-2 mb-4">
              <div className="flex justify-between font-bold text-base">
                <span>TOTAL</span>
                <span>TZS {successReceipt.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>Paid via {successReceipt.paymentMethod}</span>
                <span>TZS {successReceipt.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-xs mt-8 font-bold">
              <p>*** THANK YOU ***</p>
              <p>PLEASE COME AGAIN</p>
              <p className="mt-4">------------------------</p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}