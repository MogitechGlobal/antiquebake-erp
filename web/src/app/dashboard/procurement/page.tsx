"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Plus, 
  Search, 
  FileText,
  UserPlus,
  Loader2,
  X,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  Wallet,
  ClipboardList,
  Box,
  Users,
  Building2,
  Phone,
  Mail,
  AlertCircle,
  RotateCcw,
  Info
} from "lucide-react";

// --- INTERFACES ---
interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
}

interface CatalogItem {
  id: string;
  name: string;
  unit: string;
  category: string;
}

interface POItem {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  item: CatalogItem;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: 'DRAFT' | 'APPROVED' | 'RECEIVED' | 'CANCELLED'; 
  totalAmount: number;
  createdAt: string;
  supplier: Supplier;
  items: POItem[];
}

export default function ProcurementDashboardPage() {
  const { user, token } = useAuthStore();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'LPO' | 'GRN' | 'SUPPLIERS'>('LPO');
  
  // Modal States
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isLpoModalOpen, setIsLpoModalOpen] = useState(false);
  const [isDirectGrnModalOpen, setIsDirectGrnModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forms
  const [supplierForm, setSupplierForm] = useState({ name: "", contactPerson: "", phone: "", email: "" });
  const [lpoForm, setLpoForm] = useState({ supplierId: "", isDirectGrn: false });
  const [lpoItems, setLpoItems] = useState([{ itemId: "", quantity: "", unitPrice: "" }]);
  const [receiveForm, setReceiveForm] = useState({ deliveryNote: "", file: null as File | null });

  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // Role-Based Control Check
  const isManager = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'StoreManager';

  const fetchProcurementData = useCallback(async () => {
    if (!user?.branchId || !token) return;
    try {
      setIsLoading(true);
      const branchRes = await axios.get(`${API_URL}/api/v1/branches/${user.branchId}`, axiosConfig);
      const currentOrgId = branchRes.data.organizationId;
      setOrganizationId(currentOrgId);

      const [ordersRes, suppliersRes, catalogRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/procurement/orders/${user.branchId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/procurement/suppliers/${currentOrgId}`, axiosConfig),
        axios.get(`${API_URL}/api/v1/inventory/catalog/${currentOrgId}`, axiosConfig)
      ]);
      
      setOrders(ordersRes.data);
      setSuppliers(suppliersRes.data);
      setCatalog(catalogRes.data);
    } catch (err) {
      console.error("Failed to load procurement data", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.branchId, token, API_URL, axiosConfig]);

  useEffect(() => {
    fetchProcurementData();
  }, [fetchProcurementData]);

  // --- ACTIONS ---

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;
    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/v1/procurement/supplier`, { ...supplierForm, organizationId }, axiosConfig);
      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "" });
      fetchProcurementData();
      setIsSupplierModalOpen(false);
    } catch (err) {
      alert("Failed to create vendor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent, isDirectGrn: boolean) => {
    e.preventDefault();
    if (!user?.branchId) return;
    setIsSubmitting(true);
    
    const validItems = lpoItems
      .filter(i => i.itemId && i.quantity && i.unitPrice)
      .map(i => ({ itemId: i.itemId, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) }));

    if (validItems.length === 0) {
      alert("Add at least one valid item.");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/v1/procurement/order`, { 
        supplierId: lpoForm.supplierId, 
        branchId: user.branchId,
        items: validItems
      }, axiosConfig);

      const newOrderId = res.data.id;

      let targetStatus = 'PENDING'; 
      if (isDirectGrn) {
        targetStatus = 'RECEIVED';
      } else if (isManager) {
        targetStatus = 'PENDING'; 
      }

      if (targetStatus !== 'PENDING') {
        try {
          await axios.patch(`${API_URL}/api/v1/procurement/order/${newOrderId}/status`, { status: targetStatus }, axiosConfig);
        } catch (patchErr: any) {
          console.error("PATCH Error Details:", patchErr.response?.data);
          alert(`Order was created, but updating the status failed.\nPlease check the allowed enum values in your procurement.dto.ts`);
        }
      }
      
      setLpoForm({ supplierId: "", isDirectGrn: false });
      setLpoItems([{ itemId: "", quantity: "", unitPrice: "" }]);
      fetchProcurementData();
      setIsLpoModalOpen(false);
      setIsDirectGrnModalOpen(false);
      setActiveTab(isDirectGrn ? 'GRN' : 'LPO');
      
    } catch (err: any) {
      console.error("Backend Error Details:", err.response?.data);
      const errorMessage = Array.isArray(err.response?.data?.message) 
        ? err.response.data.message.join('\n') 
        : err.response?.data?.message || "Failed to generate order.";
        
      alert(`Validation Error:\n${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    if (!isManager && newStatus !== 'DRAFT') {
      alert("Access Denied: Only Managers can update LPO status.");
      return;
    }
    
    let confirmMsg = `Are you sure you want to update this order to ${newStatus}?`;
    if (newStatus === 'CANCELLED') confirmMsg = "Are you sure you want to cancel this order?";
    
    if (!confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      await axios.patch(`${API_URL}/api/v1/procurement/order/${orderId}/status`, { status: newStatus }, axiosConfig);
      fetchProcurementData();
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (err) {
      alert(`Failed to update order to ${newStatus}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSubmitting(true);
    
    try {
      // Future-proofing for multipart/form-data when backend accepts file uploads[cite: 14]
      // For now, we update the status via the existing patch route
      await axios.patch(`${API_URL}/api/v1/procurement/order/${selectedOrder.id}/status`, { 
        status: 'RECEIVED',
        deliveryNote: receiveForm.deliveryNote // Ensure your backend DTO allows this if you want to store it
      }, axiosConfig);
      
      fetchProcurementData();
      setSelectedOrder({ ...selectedOrder, status: 'RECEIVED' });
      setIsReceiveModalOpen(false);
      setReceiveForm({ deliveryNote: "", file: null });
    } catch (err) {
      alert(`Failed to receive stock.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COMPUTATIONS & FILTERING ---
  const activeLPOs = orders.filter(o => o.status !== 'RECEIVED');
  const completedGRNs = orders.filter(o => o.status === 'RECEIVED');

  const getFilteredData = () => {
    let data = [];
    if (activeTab === 'LPO') data = activeLPOs;
    else if (activeTab === 'GRN') data = completedGRNs;
    else return suppliers.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (data as PurchaseOrder[]).filter(o => 
      o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const currentData = getFilteredData();

  const totalSpend = completedGRNs.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingLiabilities = activeLPOs.filter(o=>o.status === 'APPROVED' || o.status === 'DRAFT').reduce((sum, o) => sum + o.totalAmount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin mr-4 text-blue-600" />
        <span className="font-bold text-xl tracking-tight">Compiling Supply Chain...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Procurement & LPO</h2>
          <p className="text-zinc-500 mt-1 font-medium">Manage vendors, purchase orders, and goods receipts.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setLpoForm({...lpoForm, isDirectGrn: true}); setIsDirectGrnModalOpen(true); }} className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 px-4 py-2.5 rounded-xl font-bold shadow-sm transition-all flex items-center">
            <Box className="w-4 h-4 mr-2 text-emerald-600" /> Direct Stock In
          </button>
          <button onClick={() => { setLpoForm({...lpoForm, isDirectGrn: false}); setIsLpoModalOpen(true); }} className="bg-zinc-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all flex items-center">
            <FileText className="w-5 h-5 mr-2" /> Generate LPO
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-emerald-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between h-full">
          <div>
            <h6 className="text-zinc-500 small font-bold uppercase mb-1 tracking-wider text-xs">Total GRN Value</h6>
            <h3 className="text-zinc-900 mb-0 text-2xl font-extrabold">TZS {totalSpend.toLocaleString()}</h3>
          </div>
          <div className="text-emerald-600 bg-emerald-50 p-3 rounded-2xl"><Wallet className="w-8 h-8" /></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border-l-4 border-l-amber-500 border-y border-r border-zinc-200 shadow-sm flex items-center justify-between h-full">
          <div>
            <h6 className="text-zinc-500 small font-bold uppercase mb-1 tracking-wider text-xs">Pending Liabilities</h6>
            <h3 className="text-zinc-900 mb-0 text-2xl font-extrabold">TZS {pendingLiabilities.toLocaleString()}</h3>
          </div>
          <div className="text-amber-600 bg-amber-50 p-3 rounded-2xl"><Clock className="w-8 h-8" /></div>
        </div>
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 rounded-2xl shadow-lg flex items-center justify-between h-full relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="z-10">
            <h6 className="text-zinc-400 small font-bold uppercase mb-1 tracking-wider text-xs">Active Vendors</h6>
            <h3 className="text-white mb-0 text-3xl font-extrabold">{suppliers.length}</h3>
          </div>
          <div className="text-zinc-300 bg-white/10 p-3 rounded-2xl z-10"><Building2 className="w-8 h-8" /></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden print:hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/50 px-2 pt-2 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab('LPO')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'LPO' ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            <ClipboardList className="w-4 h-4 mr-2" /> Purchase Orders (LPO)
          </button>
          <button onClick={() => setActiveTab('GRN')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'GRN' ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            <Box className="w-4 h-4 mr-2" /> Goods Received (GRN)
          </button>
          <button onClick={() => setActiveTab('SUPPLIERS')} className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${activeTab === 'SUPPLIERS' ? 'border-blue-600 text-blue-700 bg-white rounded-t-xl' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}>
            <Users className="w-4 h-4 mr-2" /> Vendor Directory
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 bg-white border-b border-zinc-100">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          {activeTab === 'SUPPLIERS' && (
             <button onClick={() => setIsSupplierModalOpen(true)} className="w-full md:w-auto text-sm font-bold bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 flex items-center justify-center transition-colors">
               <UserPlus className="w-4 h-4 mr-2" /> Add New Vendor
             </button>
          )}
        </div>

        {/* Dynamic Tables */}
        <div className="overflow-x-auto">
          {activeTab === 'SUPPLIERS' ? (
            // SUPPLIER TABLE
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Contact Person</th>
                  <th className="px-6 py-4">Contact Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {currentData.length === 0 ? (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-zinc-500"><Users className="w-12 h-12 mx-auto mb-3 text-zinc-300" />No vendors found.</td></tr>
                ) : (
                  (currentData as Supplier[]).map(sup => (
                    <tr key={sup.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-zinc-900">{sup.name}</td>
                      <td className="px-6 py-4 text-zinc-700">{sup.contactPerson || '-'}</td>
                      <td className="px-6 py-4">
                        {sup.phone && <div className="text-sm font-medium text-zinc-600 flex items-center"><Phone className="w-3 h-3 mr-2 text-zinc-400"/> {sup.phone}</div>}
                        {sup.email && <div className="text-xs text-zinc-500 flex items-center mt-1"><Mail className="w-3 h-3 mr-2 text-zinc-400"/> {sup.email}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            // ORDERS TABLE (LPO & GRN)
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase tracking-wider text-zinc-500 font-bold">
                  <th className="px-6 py-4">Order Ref</th>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {currentData.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500"><FileText className="w-12 h-12 mx-auto mb-3 text-zinc-300" />No records found.</td></tr>
                ) : (
                  (currentData as PurchaseOrder[]).map(order => (
                    <tr key={order.id} className="hover:bg-zinc-50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900 text-sm">{order.poNumber}</p>
                        <p className="text-[11px] font-medium text-zinc-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-zinc-700 text-sm">{order.supplier.name}</p>
                        <p className="text-[11px] text-zinc-400">{order.items.length} Items</p>
                      </td>
                      <td className="px-6 py-4">
                        {order.status === 'DRAFT' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200"><AlertCircle className="w-3 h-3 mr-1.5" /> Draft</span>}
                        {order.status === 'APPROVED' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><Clock className="w-3 h-3 mr-1.5" /> Approved</span>}
                        {order.status === 'RECEIVED' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1.5" /> Received</span>}
                        {order.status === 'CANCELLED' && <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200"><X className="w-3 h-3 mr-1.5" /> Cancelled</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-zinc-900">
                        TZS {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => setSelectedOrder(order)} className="inline-flex items-center px-3 py-1.5 bg-white text-zinc-600 hover:bg-zinc-100 font-semibold text-xs rounded-lg transition-colors border border-zinc-200 shadow-sm">
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Document
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- FORMAL DOCUMENT MODAL (View LPO / GRN) --- */}
      {selectedOrder && !isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity print:hidden" onClick={() => setSelectedOrder(null)} />
          <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] print:rounded-none print:shadow-none print:h-auto print:max-h-none print:block">
            
            {/* Modal Header Actions (Hidden on Print) */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between print:hidden">
              <h3 className="text-xl font-bold text-zinc-800">Purchase Order Details</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            {/* Printable Document Body */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible">
              
              {/* Document Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-blue-600 mb-1">Antique Oven Ltd</h1>
                  <p className="text-sm text-zinc-700">P.O. Box 6681, Morogoro, Tanzania</p>
                  <p className="text-sm text-zinc-700">Tel: +255 23 261 4216 | Email: info@antiqueoven.co.tz</p>
                  <p className="text-sm text-zinc-700">Website: www.antiqueoven.co.tz</p>
                  <p className="text-sm text-zinc-500 mt-2">
                     {selectedOrder.status === 'RECEIVED' ? 'Goods Received Note' : 'Purchase Order'}
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-zinc-900 mb-1">{selectedOrder.poNumber}</h2>
                  <p className="text-sm text-zinc-500 mb-2">Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  <span className="inline-block px-3 py-1 bg-zinc-500 text-white text-xs font-semibold rounded-md">
                     {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>

              <hr className="border-zinc-200 mb-6" />

              {/* Vendor & Ship To */}
              <div className="flex justify-between mb-8">
                <div className="w-1/2 pr-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Vendor</p>
                  <h4 className="text-lg font-bold text-zinc-900">{selectedOrder.supplier.name}</h4>
                </div>
                <div className="w-1/2 text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Ship To</p>
                  <h4 className="text-lg font-bold text-zinc-900">Antique Oven Ltd</h4>
                  <p className="text-sm text-zinc-700">{user?.branchName || 'Main Store'}</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse border border-zinc-800 mb-8">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="py-2 px-3 border border-zinc-800 text-sm font-bold text-zinc-900">Description</th>
                    <th className="py-2 px-3 border border-zinc-800 text-sm font-bold text-zinc-900 text-center">Qty</th>
                    <th className="py-2 px-3 border border-zinc-800 text-sm font-bold text-zinc-900 text-right">Unit Price</th>
                    <th className="py-2 px-3 border border-zinc-800 text-sm font-bold text-zinc-900 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-3 px-3 border border-zinc-800">
                        <div className="text-sm font-medium text-zinc-900">{item.item.name}</div>
                        <div className="text-xs text-zinc-500">{item.item.id.substring(0, 10).toUpperCase()}</div>
                      </td>
                      <td className="py-3 px-3 border border-zinc-800 text-center text-sm text-zinc-700">
                        {item.quantity} {item.item.unit}
                      </td>
                      <td className="py-3 px-3 border border-zinc-800 text-right text-sm text-zinc-700">
                        {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 border border-zinc-800 text-right text-sm font-bold text-zinc-900">
                        {item.subtotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={3} className="py-3 px-3 border border-zinc-800 text-right font-bold text-zinc-900">TOTAL:</td>
                    <td className="py-3 px-3 border border-zinc-800 text-right font-bold text-zinc-900 text-lg">
                      {selectedOrder.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer text */}
              <div className="border-t border-dashed border-zinc-400 pt-2 text-center text-xs text-zinc-900 pb-4">
                Generated by: <strong>{user?.firstName} {user?.lastName}</strong>
              </div>

            </div>

            {/* Workflow Footer (Hidden on Print)[cite: 14] */}
            <div className="p-4 border-t border-zinc-200 bg-white flex justify-between items-center print:hidden">
              <div className="flex gap-2">
                 {/* Workflow logic mapped from legacy lpo.php[cite: 14] */}
                 {isManager && selectedOrder.status === 'APPROVED' && (
                    <button onClick={() => setIsReceiveModalOpen(true)} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-[#198754] hover:bg-[#157347] rounded shadow-sm transition-colors flex items-center">
                       <Box className="w-4 h-4 mr-2" /> Receive Stock
                    </button>
                 )}
                 {isManager && selectedOrder.status === 'DRAFT' && (
                    <button onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'APPROVED')} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors flex items-center">
                       <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                    </button>
                 )}
                 {isManager && (selectedOrder.status === 'DRAFT' || selectedOrder.status === 'APPROVED') && (
                    <button onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'CANCELLED')} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-[#dc3545] hover:bg-[#bb2d3b] rounded shadow-sm transition-colors flex items-center">
                       <X className="w-4 h-4 mr-2" /> Cancel Order
                    </button>
                 )}
                 {isManager && selectedOrder.status === 'CANCELLED' && (
                    <button onClick={() => handleOrderStatusUpdate(selectedOrder.id, 'DRAFT')} disabled={isSubmitting} className="px-4 py-2 text-sm font-bold text-white bg-zinc-500 hover:bg-zinc-600 rounded shadow-sm transition-colors flex items-center">
                       <RotateCcw className="w-4 h-4 mr-2" /> Reset to Draft
                    </button>
                 )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedOrder(null)} className="px-5 py-2 text-sm font-bold text-white bg-[#6c757d] hover:bg-[#5c636a] rounded shadow-sm transition-colors">
                  Close
                </button>
                <button onClick={() => window.print()} className="px-5 py-2 text-sm font-bold text-white bg-[#212529] hover:bg-[#1c1f23] rounded shadow-sm transition-colors flex items-center">
                  <Printer className="w-4 h-4 mr-2" /> Print PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- RECEIVE STOCK MODAL[cite: 14] --- */}
      {isReceiveModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 bg-[#198754] text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center">
                 <Box className="w-5 h-5 mr-2" /> Receive Stock
              </h3>
              <button onClick={() => setIsReceiveModalOpen(false)} className="p-1 hover:bg-[#157347] rounded-lg transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleReceiveStock}>
              <div className="p-6 space-y-4">
                
                <div className="bg-[#cff4fc] border border-[#b6effb] text-[#055160] p-4 rounded-xl flex items-start text-sm">
                  <Info className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  <p>This will mark the order as Received and update your inventory levels automatically.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-zinc-900">Delivery Note Number <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. DN-2024-001" 
                    value={receiveForm.deliveryNote} 
                    onChange={e => setReceiveForm({...receiveForm, deliveryNote: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-[#198754] outline-none" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-zinc-900">Attach Document (Optional)</label>
                  <input 
                    type="file" 
                    accept="image/*,.pdf"
                    onChange={e => setReceiveForm({...receiveForm, file: e.target.files ? e.target.files[0] : null})} 
                    className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer" 
                  />
                  <p className="text-xs text-zinc-500 mt-1">Upload a picture or PDF of the delivery note/invoice.</p>
                </div>

              </div>
              <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex justify-end gap-2">
                <button type="button" onClick={() => setIsReceiveModalOpen(false)} className="px-5 py-2 text-sm font-bold text-white bg-[#6c757d] hover:bg-[#5c636a] rounded transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting || !receiveForm.deliveryNote} className="px-6 py-2 text-sm font-bold text-white bg-[#198754] hover:bg-[#157347] rounded transition-colors flex items-center disabled:opacity-50">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Confirm Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD VENDOR MODAL --- */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSupplierModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Add New Vendor</h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <form id="vendor-form" onSubmit={handleCreateSupplier} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Vendor Name</label>
                  <input type="text" required placeholder="e.g. Bakhresa Mills" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Contact Person</label>
                  <input type="text" placeholder="e.g. John Doe" value={supplierForm.contactPerson} onChange={e => setSupplierForm({...supplierForm, contactPerson: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Phone</label>
                  <input type="text" placeholder="e.g. +255 700 000 000" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Email (Optional)</label>
                  <input type="email" placeholder="e.g. sales@vendor.com" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} className="w-full px-4 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button type="submit" form="vendor-form" disabled={isSubmitting} className="w-full py-3.5 text-sm font-bold bg-zinc-900 hover:bg-black text-white shadow-md rounded-xl transition-all flex justify-center items-center">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Save Vendor Directory"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GENERATE LPO / DIRECT GRN MODAL --- */}
      {(isLpoModalOpen || isDirectGrnModalOpen) && (
        <div className="fixed inset-0 z-50 flex justify-end print:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsLpoModalOpen(false); setIsDirectGrnModalOpen(false); }} />
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className={`px-6 py-5 border-b border-zinc-200 flex items-center justify-between ${lpoForm.isDirectGrn ? 'bg-emerald-50' : 'bg-zinc-50'}`}>
              <div>
                 <h3 className={`text-xl font-bold ${lpoForm.isDirectGrn ? 'text-emerald-900' : 'text-zinc-900'}`}>
                    {lpoForm.isDirectGrn ? 'Direct Stock Intake (GRN)' : 'Generate Purchase Order (LPO)'}
                 </h3>
                 <p className={`text-sm font-medium ${lpoForm.isDirectGrn ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {lpoForm.isDirectGrn ? 'Instantly update inventory levels.' : 'Create a new order pending delivery.'}
                 </p>
              </div>
              <button onClick={() => { setIsLpoModalOpen(false); setIsDirectGrnModalOpen(false); }} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white rounded-full shadow-sm"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <form id="lpo-form" onSubmit={(e) => handleCreateOrder(e, lpoForm.isDirectGrn)}>
                <div className="space-y-1.5 mb-8">
                  <label className="text-xs font-bold text-zinc-600 uppercase">Select Vendor / Source</label>
                  <select required value={lpoForm.supplierId} onChange={e => setLpoForm({...lpoForm, supplierId: e.target.value})} className="w-full px-4 py-3 bg-white border border-zinc-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 shadow-sm">
                    <option value="">Choose a supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-zinc-900 flex items-center">
                       <Box className="w-4 h-4 mr-2 text-blue-600"/> Order Items
                    </h4>
                    <button type="button" onClick={() => setLpoItems([...lpoItems, { itemId: "", quantity: "", unitPrice: "" }])} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 bg-blue-50 rounded-lg">+ Add Item Row</button>
                  </div>
                  {lpoItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start bg-zinc-50/50 p-4 rounded-xl border border-zinc-200 shadow-sm relative group">
                      <div className="flex-1">
                        <select required value={item.itemId} onChange={e => {
                          const newItems = [...lpoItems]; newItems[index].itemId = e.target.value; setLpoItems(newItems);
                        }} className="w-full px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-medium">
                          <option value="">Select item...</option>
                          {catalog.filter(c => c.category === 'RAW_MATERIAL' || c.category === 'PACKAGING').map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.unit})</option>
                          ))}
                        </select>
                      </div>
                      <input type="number" min="0.01" step="0.01" required placeholder="Qty" value={item.quantity} onChange={e => {
                          const newItems = [...lpoItems]; newItems[index].quantity = e.target.value; setLpoItems(newItems);
                      }} className="w-24 px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-medium" />
                      <input type="number" min="0" required placeholder="Price" value={item.unitPrice} onChange={e => {
                          const newItems = [...lpoItems]; newItems[index].unitPrice = e.target.value; setLpoItems(newItems);
                      }} className="w-28 px-3 py-2.5 bg-white border border-zinc-300 rounded-lg text-sm font-medium" />
                      
                      {lpoItems.length > 1 && (
                        <button type="button" onClick={() => setLpoItems(lpoItems.filter((_, i) => i !== index))} className="absolute -right-2 -top-2 bg-red-100 text-red-600 rounded-full p-1.5 border border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3"/>
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Dynamic Total Preview */}
                  <div className="mt-4 flex justify-end">
                    <p className="text-sm font-bold text-zinc-500">
                      Estimated Total: <span className="text-lg text-zinc-900 ml-2">TZS {lpoItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0).toLocaleString()}</span>
                    </p>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-zinc-200 bg-zinc-50">
              <button type="submit" form="lpo-form" disabled={isSubmitting} className={`w-full py-3.5 text-sm font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center disabled:opacity-70 ${lpoForm.isDirectGrn ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-zinc-900 hover:bg-black'}`}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (lpoForm.isDirectGrn ? <CheckCircle2 className="w-4 h-4 mr-2"/> : <FileText className="w-4 h-4 mr-2"/>)}
                {isSubmitting ? "Processing..." : (lpoForm.isDirectGrn ? "Process Intake (Update Inventory)" : "Issue Purchase Order")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}