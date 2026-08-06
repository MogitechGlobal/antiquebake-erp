// web/src/app/dashboard/inventory/adjustments/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { ArrowLeftRight, CheckCircle2, AlertCircle, Search, ChevronDown } from "lucide-react";

// Updated Types matching your real Prisma Schema
interface Branch {
  id: string;
  name: string; 
}

interface Item {
  id: string; 
  name: string; 
  unit: string;
}

interface AdjustmentHistory {
  id: number;
  date: string;
  type: string;
  quantity: number;
  notes: string | null;
  item: { name: string; unit: string }; 
  sourceStore: { name: string }; 
  targetStore?: { name: string } | null;
}

export default function StockAdjustmentsPage() {
  const { user, token } = useAuthStore();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  
  // Data State
  const [stores, setStores] = useState<Branch[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<AdjustmentHistory[]>([]);

  // UI State
  const [opType, setOpType] = useState("Transfer");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Searchable Dropdown State
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch real database data on mount
  const fetchInitialData = useCallback(async () => {
    if (!token) return;
    try {
      setFetchingData(true);
      const headers = { Authorization: `Bearer ${token}` };
      
      const [storesRes, itemsRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/inventory/stores`, { headers }), 
        fetch(`${API_URL}/api/v1/inventory/items`, { headers }),  
        fetch(`${API_URL}/api/v1/inventory/adjustments`, { headers }) 
      ]);

      if (storesRes.ok) setStores(await storesRes.json());
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setFetchingData(false);
    }
  }, [API_URL, token]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Handle clicking outside the custom dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handlers
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate custom dropdown
    if (!selectedItem) {
      setMessage({ text: "Please select an item from the searchable list.", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      type: formData.get("type"),
      storeId: formData.get("storeId") as string, 
      targetStoreId: formData.get("targetStoreId") ? formData.get("targetStoreId") as string : null, 
      itemId: selectedItem.id, // Sourced directly from our custom state
      quantity: parseFloat(formData.get("quantity") as string),
      notes: formData.get("notes"),
      userId: user?.id || "1", 
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/inventory/adjustments`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Transaction failed");
      
      setMessage({ text: data.message || "Stock adjusted successfully!", type: "success" });
      (e.target as HTMLFormElement).reset();
      setOpType("Transfer");
      setSelectedItem(null);
      setSearchQuery("");
      
      fetchInitialData();
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Stock Adjustments & Transfers</h1>
        <p className="text-sm text-zinc-500">Manage internal stock movements and reconcile discrepancies.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- FORM SECTION --- */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200">
            <div className="p-4 border-b border-zinc-200 bg-zinc-50 rounded-t-xl flex items-center">
              <ArrowLeftRight className="w-5 h-5 mr-2 text-zinc-700" />
              <h2 className="font-bold text-zinc-800">Stock Operations</h2>
            </div>
            
            <div className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Operation Type</label>
                  <select 
                    name="type" 
                    className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm"
                    value={opType}
                    onChange={(e) => setOpType(e.target.value)}
                    required
                  >
                    <optgroup label="Internal Transfer">
                      <option value="Transfer">Transfer Stock (Store to Store)</option>
                    </optgroup>
                    <optgroup label="Stock Adjustments">
                      <option value="Restock">Restock / Purchase (+)</option>
                      <option value="Correction">Count Correction (+)</option>
                      <option value="Damage">Damaged / Expired (-)</option>
                      <option value="Spoilage">Spoilage / Waste (-)</option>
                      <option value="Internal Use">Internal Use (-)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">
                    {opType === "Transfer" ? "From Branch" : "Select Branch"}
                  </label>
                  <select name="storeId" className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm" required>
                    <option value="">-- Select Store --</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name || (store as any).storeName}</option>
                    ))}
                  </select>
                </div>

                {opType === "Transfer" && (
                  <div>
                    <label className="block text-sm font-bold text-bakery-brown mb-1">To Branch (Destination)</label>
                    <select name="targetStoreId" className="w-full border border-bakery-gold/50 rounded-lg p-2.5 text-sm" required>
                      <option value="">-- Select Destination --</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>{store.name || (store as any).storeName}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* --- CUSTOM SEARCHABLE ITEM DROPDOWN --- */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Item</label>
                  
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm bg-white flex justify-between items-center cursor-pointer"
                  >
                    <span className={selectedItem ? "text-zinc-900 font-medium" : "text-zinc-500"}>
                      {selectedItem ? `${selectedItem.name} (${selectedItem.unit})` : "-- Search & Select Item --"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                      
                      <div className="p-2 border-b border-zinc-100 bg-zinc-50 flex items-center sticky top-0">
                        <Search className="w-4 h-4 text-zinc-400 ml-1 mr-2 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Search items..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-transparent border-none text-sm focus:outline-none focus:ring-0 p-1"
                          autoFocus
                        />
                      </div>

                      <div className="overflow-y-auto custom-scrollbar flex-1">
                        {filteredItems.length === 0 ? (
                          <div className="p-3 text-center text-sm text-zinc-500">No items found.</div>
                        ) : (
                          filteredItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedItem(item);
                                setIsDropdownOpen(false);
                                setSearchQuery("");
                              }}
                              className="px-3 py-2 text-sm hover:bg-bakery-gold/10 cursor-pointer transition-colors border-b border-zinc-50 last:border-0"
                            >
                              <div className="font-medium text-zinc-900">{item.name}</div>
                              <div className="text-xs text-zinc-400">Unit: {item.unit}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Quantity</label>
                  <input type="number" name="quantity" step="0.01" min="0.01" className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm" required />
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Notes</label>
                  <textarea name="notes" rows={2} className="w-full border border-zinc-300 rounded-lg p-2.5 text-sm"></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || fetchingData}
                  className="w-full bg-zinc-900 text-white font-bold py-3 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Process Request"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* --- HISTORY SECTION --- */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200">
            <div className="p-4 border-b border-zinc-200 flex justify-between items-center">
              <h5 className="font-bold text-zinc-800">Recent Transactions</h5>
            </div>
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50 border-b border-zinc-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-zinc-600">Date</th>
                    <th className="px-4 py-3 font-semibold text-zinc-600">Type</th>
                    <th className="px-4 py-3 font-semibold text-zinc-600">Details</th>
                    <th className="px-4 py-3 font-semibold text-zinc-600 text-center">Location</th>
                    <th className="px-4 py-3 font-semibold text-zinc-600 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {fetchingData && history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-400">Loading history...</td>
                    </tr>
                  ) : history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-400">No recent transactions found.</td>
                    </tr>
                  ) : (
                    history.map((record) => {
                      const isAddition = ["Restock", "Correction"].includes(record.type);
                      const isTransfer = record.type === "Transfer";
                      
                      return (
                        <tr key={record.id}>
                          <td className="px-4 py-3 text-zinc-500">
                            {new Date(record.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              isTransfer ? 'bg-blue-100 text-blue-700' :
                              isAddition ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {record.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-zinc-900">{record.item?.name || (record.item as any)?.itemName}</div>
                            <div className="text-xs text-zinc-500">
                              {record.notes || "No additional notes"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isTransfer ? (
                              <>
                                <span className="font-bold">{record.sourceStore?.name || (record.sourceStore as any)?.storeName}</span>
                                <span className="text-zinc-400 mx-2">→</span>
                                <span className="font-bold">{record.targetStore?.name || (record.targetStore as any)?.storeName}</span>
                              </>
                            ) : (
                              <span className="font-bold">{record.sourceStore?.name || (record.sourceStore as any)?.storeName}</span>
                            )}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${
                            isTransfer ? 'text-blue-600' : 
                            isAddition ? 'text-green-600' : 
                            'text-red-600'
                          }`}>
                            {isTransfer ? '⇄' : isAddition ? '+' : '-'} {record.quantity.toLocaleString()} <span className="font-normal text-zinc-500 text-xs">{record.item?.unit}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}