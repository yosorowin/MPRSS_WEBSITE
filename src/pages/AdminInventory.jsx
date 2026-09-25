import { useState } from 'react';
import AdminLayout from './AdminLayout';
import { Plus, Search, Edit, Package, AlertCircle, Filter } from 'lucide-react';
import { mockInventory } from './mockData';

function AdminInventory() {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('umes_inventory');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('umes_inventory', JSON.stringify(mockInventory));
    return mockInventory;
  });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    minStock: '',
    price: '',
    compatibleModels: '',
    safetyNotes: '',
    visibleToCustomers: true
  });

  const lowStockItems = inventory.filter(item => item.quantity < item.minStock);
  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const categories = ['All', ...Array.from(new Set(inventory.map(item => item.category)))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSavePart = () => {
    let updatedInventory;
    if (isEditing && editingId) {
      updatedInventory = inventory.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            name: formData.name,
            category: formData.category || 'General',
            quantity: Number(formData.quantity) || 0,
            minStock: Number(formData.minStock) || 0,
            price: Number(formData.price) || 0,
            compatibleModels: formData.compatibleModels ? formData.compatibleModels.split(',').map(s => s.trim()) : ['All Models'],
            safetyNotes: formData.safetyNotes,
            visibleToCustomers: formData.visibleToCustomers
          };
        }
        return item;
      });
    } else {
      const part = {
        id: `part-${Date.now()}`,
        name: formData.name,
        category: formData.category || 'General',
        quantity: Number(formData.quantity) || 0,
        minStock: Number(formData.minStock) || 0,
        price: Number(formData.price) || 0,
        compatibleModels: formData.compatibleModels ? formData.compatibleModels.split(',').map(s => s.trim()) : ['All Models'],
        safetyNotes: formData.safetyNotes,
        visibleToCustomers: formData.visibleToCustomers
      };
      updatedInventory = [...inventory, part];
    }
    setInventory(updatedInventory);
    localStorage.setItem('umes_inventory', JSON.stringify(updatedInventory));
    closeModal();
  };

  const openAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', category: '', quantity: '', minStock: '', price: '', compatibleModels: '', safetyNotes: '', visibleToCustomers: true });
    setShowModal(true);
  };

  const openEditModal = (part) => {
    setIsEditing(true);
    setEditingId(part.id);
    setFormData({
      name: part.name,
      category: part.category,
      quantity: part.quantity.toString(),
      minStock: part.minStock.toString(),
      price: part.price.toString(),
      compatibleModels: part.compatibleModels.join(', '),
      safetyNotes: part.safetyNotes || '',
      visibleToCustomers: part.visibleToCustomers
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <AdminLayout title="Inventory">

      {/* ── INVENTORY OVERVIEW ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Featured: Inventory Value */}
        <div className="lg:col-span-2 bg-[#0a0f1a] text-white rounded-xl p-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-slate-400 mb-3 font-semibold">
              Total Inventory Value
            </p>
            <p className="text-4xl font-bold leading-none mb-1">
              ₱{(totalValue * 50).toLocaleString()}
            </p>
            <p className="text-sm text-slate-400 mt-2">{inventory.length} parts in stock</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <Package size={20} className="text-white" />
          </div>
        </div>

        {/* Low Stock status */}
        <div className={`rounded-xl border p-6 ${lowStockItems.length > 0 ? 'bg-white border-amber-200' : 'bg-white border-gray-100 shadow-sm'}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-amber-50' : 'bg-gray-100'}`}>
              <AlertCircle size={16} className={lowStockItems.length > 0 ? 'text-amber-600' : 'text-gray-400'} />
            </div>
            {lowStockItems.length > 0 && (
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                Reorder Needed
              </span>
            )}
          </div>
          <p className={`text-4xl font-bold leading-none ${lowStockItems.length > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {lowStockItems.length}
          </p>
          <p className="text-xs text-gray-400 mt-1.5">Low stock items</p>
        </div>
      </div>

      {/* ── LOW STOCK ALERT SECTION ────────────────────────────────────── */}
      {lowStockItems.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm mb-6">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-2.5">
            <AlertCircle size={15} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-800">Items Requiring Reorder</h3>
            <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
              {lowStockItems.length} items
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {lowStockItems.map(item => {
              const deficit = item.minStock - item.quantity;
              const fillPct = Math.min((item.quantity / item.minStock) * 100, 100);
              return (
                <div key={item.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                      <span className="text-[10px] text-gray-400 shrink-0">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-amber-600 font-medium shrink-0">
                        {item.quantity}/{item.minStock}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500">Need {deficit} more</p>
                  </div>
                  <button
                    onClick={() => openEditModal(item)}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TOOLBAR ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search parts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
            />
          </div>
          <div className="relative min-w-40">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 appearance-none text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a0f1a] text-white rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Part
        </button>
      </div>

      {/* ── INVENTORY TABLE (Desktop) ───────────────────────────────────── */}
      <div className="hidden lg:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Part Name</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Visible</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredInventory.map(part => {
              const isLow = part.quantity < part.minStock;
              return (
                <tr key={part.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-900">{part.name}</p>
                    {part.safetyNotes && (
                      <p className="text-xs text-gray-500 mt-0.5">⚠ {part.safetyNotes}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{part.category}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isLow ? 'text-amber-600' : 'text-gray-800'}`}>
                        {part.quantity}
                      </span>
                      <span className="text-xs text-gray-400">/ {part.minStock} min</span>
                      {isLow && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">LOW</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-800 font-medium">₱{(part.price * 50).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      part.visibleToCustomers
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-gray-50 text-gray-400'
                    }`}>
                      {part.visibleToCustomers ? 'Visible' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => openEditModal(part)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── INVENTORY CARDS (Mobile) ────────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {filteredInventory.map(part => {
          const isLow = part.quantity < part.minStock;
          return (
            <div key={part.id} className={`bg-white rounded-xl border shadow-sm p-4 ${isLow ? 'border-amber-100' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-sm text-gray-900 truncate">{part.name}</h3>
                    {isLow && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold shrink-0">LOW</span>}
                  </div>
                  <p className="text-xs text-gray-400">{part.category}</p>
                </div>
                <button onClick={() => openEditModal(part)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-2">
                  <Edit size={15} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-400 mb-0.5">Stock</p>
                  <p className={`font-medium ${isLow ? 'text-amber-600' : 'text-gray-800'}`}>{part.quantity} / {part.minStock}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Price</p>
                  <p className="font-medium text-gray-800">₱{(part.price * 50).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Visible</p>
                  <p className="font-medium text-gray-700">{part.visibleToCustomers ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {part.safetyNotes && (
                <p className="text-xs text-gray-500 mt-2.5 pt-2.5 border-t border-gray-100">⚠ {part.safetyNotes}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── PART MODAL ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 mb-5">{isEditing ? 'Edit Part' : 'Add New Part'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Part Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
                <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Quantity *</label>
                <input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Minimum Stock *</label>
                <input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Price (₱) *</label>
                <input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Compatible Models</label>
                <input type="text" value={formData.compatibleModels} onChange={(e) => setFormData({ ...formData, compatibleModels: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm"
                  placeholder="e.g., All Models" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Safety Notes</label>
                <textarea value={formData.safetyNotes} onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm" rows={2} />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.visibleToCustomers}
                    onChange={(e) => setFormData({ ...formData, visibleToCustomers: e.target.checked })}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Visible to Customers</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSavePart}
                className="flex-1 bg-[#0a0f1a] text-white py-2.5 rounded-lg hover:bg-[#1e293b] text-sm font-medium transition-colors">
                {isEditing ? 'Save Changes' : 'Save Part'}
              </button>
              <button onClick={closeModal}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}


export default AdminInventory;
