import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import Topbar from '../../components/layout/Topbar'
import { listInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../../api/inventory.api'
import toast from 'react-hot-toast'
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ArchiveBoxArrowDownIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  XMarkIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'

function InventoryPage() {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all') // all, healthy, low, out
  const [sortBy, setSortBy] = useState('name') // name, stock-high, stock-low
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', sku: '', quantity: 0, unit: '', low_stock_threshold: '' })
  const [loading, setLoading] = useState(true)
  const [adjustModal, setAdjustModal] = useState(null) // { item, type: 'add' | 'reduce' }
  const [adjustQty, setAdjustQty] = useState('')

  const fetchItems = async () => {
    try {
      const isLowOnly = statusFilter === 'low' || statusFilter === 'out' || lowStockOnly
      const res = await listInventory(search, isLowOnly)
      setItems(res.data)
    } catch (err) {
      console.error('Failed to fetch inventory', err)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [search, lowStockOnly, statusFilter])

  // ── Computed stats ──
  const totalItems = items.length
  const totalUnits = items.reduce((sum, i) => sum + (i.quantity || 0), 0)
  const lowStockItems = items.filter(i => i.is_low_stock && i.quantity > 0)
  const outOfStockItems = items.filter(i => i.quantity === 0)
  const healthyItems = items.filter(i => !i.is_low_stock && i.quantity > 0)

  // ── Filtered + sorted items ──
  const displayItems = [...items]
    .filter(i => {
      if (statusFilter === 'healthy') return !i.is_low_stock && i.quantity > 0
      if (statusFilter === 'low') return i.is_low_stock && i.quantity > 0
      if (statusFilter === 'out') return i.quantity === 0
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'stock-high') return b.quantity - a.quantity
      if (sortBy === 'stock-low') return a.quantity - b.quantity
      return a.name.localeCompare(b.name)
    })

  // ── Handlers ──
  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', sku: '', quantity: 0, unit: '', low_stock_threshold: '' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name,
      sku: item.sku || '',
      quantity: item.quantity,
      unit: item.unit || '',
      low_stock_threshold: item.low_stock_threshold ?? '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        quantity: parseFloat(form.quantity),
        low_stock_threshold: form.low_stock_threshold !== '' ? parseFloat(form.low_stock_threshold) : null,
      }
      if (editing) {
        await updateInventoryItem(editing.id, payload)
        toast.success('Item updated')
      } else {
        await createInventoryItem(payload)
        toast.success('Item added to inventory')
      }
      setShowModal(false)
      fetchItems()
    } catch (err) {
      console.error('Save failed', err)
      toast.error('Failed to save item')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this item permanently?')) return
    try {
      await deleteInventoryItem(id)
      toast.success('Item removed')
      fetchItems()
    } catch (err) {
      console.error('Delete failed', err)
      toast.error('Failed to delete')
    }
  }

  const handleAdjust = async () => {
    if (!adjustModal || !adjustQty) return
    const { item, type } = adjustModal
    const delta = parseFloat(adjustQty)
    if (isNaN(delta) || delta <= 0) { toast.error('Enter a valid quantity'); return }
    
    const newQty = type === 'add' ? item.quantity + delta : Math.max(0, item.quantity - delta)
    try {
      await updateInventoryItem(item.id, { ...item, quantity: newQty })
      toast.success(`${type === 'add' ? 'Added' : 'Removed'} ${delta} ${item.unit || 'units'}`)
      setAdjustModal(null)
      setAdjustQty('')
      fetchItems()
    } catch (err) {
      console.error('Adjust failed', err)
      toast.error('Failed to adjust stock')
    }
  }

  const getItemStatus = (item) => {
    if (item.quantity === 0) return 'out'
    if (item.is_low_stock) return 'low'
    return 'healthy'
  }

  const getStatusBadge = (item) => {
    const status = getItemStatus(item)
    if (status === 'out') return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-red-500/15 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
        <XCircleIcon className="w-3 h-3" /> Out of Stock
      </span>
    )
    if (status === 'low') return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)] animate-pulse">
        <ExclamationTriangleIcon className="w-3 h-3" /> Low Stock
      </span>
    )
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <CheckCircleIcon className="w-3 h-3" /> Healthy
      </span>
    )
  }

  const getRowBorder = (item) => {
    if (item.quantity === 0) return 'border-l-4 border-l-red-500/60 bg-red-500/[0.02]'
    if (item.is_low_stock) return 'border-l-4 border-l-amber-500/60 bg-amber-500/[0.02]'
    return 'border-l-4 border-l-transparent'
  }

  const getBarColor = (item) => {
    if (item.quantity === 0) return 'bg-red-500'
    if (item.is_low_stock) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
             
             {/* Header */}
             <div className="flex justify-between items-end">
                <div>
                   <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Inventory</h1>
                   <p className="text-sm text-[var(--text-muted)] mt-1">Track stock levels, set alerts, and manage inventory.</p>
                </div>
                <button 
                   onClick={openCreate}
                   className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg shadow-lg shadow-indigo-500/20 transition-colors font-medium"
                >
                   <PlusIcon className="w-5 h-5" />
                   Add Stock
                </button>
             </div>

             {/* ── KPI Cards ── */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-[var(--border-default)] transition-colors group">
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Items</span>
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                         <CubeIcon className="w-4 h-4" />
                      </div>
                   </div>
                   <p className="text-3xl font-bold text-[var(--text-primary)]">{totalItems}</p>
                   <p className="text-xs text-[var(--text-secondary)] mt-1">in inventory</p>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-[var(--border-default)] transition-colors group">
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Total Units</span>
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                         <ArchiveBoxIcon className="w-4 h-4" />
                      </div>
                   </div>
                   <p className="text-3xl font-bold text-[var(--text-primary)]">{totalUnits}</p>
                   <p className="text-xs text-[var(--text-secondary)] mt-1">across all items</p>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-amber-500/20 transition-colors group cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}>
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Low Stock</span>
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                         <ArrowTrendingDownIcon className="w-4 h-4" />
                      </div>
                   </div>
                   <p className={`text-3xl font-bold ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-[var(--text-primary)]'}`}>{lowStockItems.length}</p>
                   <p className="text-xs text-[var(--text-secondary)] mt-1">need attention</p>
                </div>

                <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl p-5 hover:border-red-500/20 transition-colors group cursor-pointer" onClick={() => setStatusFilter(statusFilter === 'out' ? 'all' : 'out')}>
                   <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Out of Stock</span>
                      <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                         <XCircleIcon className="w-4 h-4" />
                      </div>
                   </div>
                   <p className={`text-3xl font-bold ${outOfStockItems.length > 0 ? 'text-red-400' : 'text-[var(--text-primary)]'}`}>{outOfStockItems.length}</p>
                   <p className="text-xs text-[var(--text-secondary)] mt-1">depleted</p>
                </div>
             </div>

             {/* ── Toolbar ── */}
             <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                   <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-secondary)]" />
                   <input 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 placeholder-slate-500 transition-colors"
                      placeholder="Search items..."
                   />
                </div>
                {/* Status Filter */}
                <div className="relative">
                   <FunnelIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-secondary)]" />
                   <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-8 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-[var(--bg-glass-hover)] transition-colors"
                   >
                      <option value="all">All Status</option>
                      <option value="healthy">Healthy</option>
                      <option value="low">Low Stock</option>
                      <option value="out">Out of Stock</option>
                   </select>
                </div>
                {/* Sort */}
                <div className="relative">
                   <ArrowsUpDownIcon className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-secondary)]" />
                   <select 
                      value={sortBy} 
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-8 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer hover:bg-[var(--bg-glass-hover)] transition-colors"
                   >
                      <option value="name">Name A→Z</option>
                      <option value="stock-high">Stock High→Low</option>
                      <option value="stock-low">Stock Low→High</option>
                   </select>
                </div>
             </div>

             {/* ── Table ── */}
             <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl overflow-hidden shadow-xl">
               <table className="w-full text-left border-collapse table-fixed">
                  <thead className="bg-[#1a1a2e] border-b border-[var(--border-subtle)] text-xs uppercase text-[var(--text-muted)] font-bold tracking-wider">
                     <tr>
                        <th className="px-6 py-4 w-[22%]">Item</th>
                        <th className="px-6 py-4 w-[10%]">SKU</th>
                        <th className="px-6 py-4 w-[28%]">Stock Level</th>
                        <th className="px-6 py-4 w-[10%]">Threshold</th>
                        <th className="px-6 py-4 w-[14%]">Status</th>
                        <th className="px-6 py-4 text-center w-[16%]">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {loading ? (
                        <tr><td colSpan="6" className="p-8 text-center text-[var(--text-secondary)]">
                          <div className="flex items-center justify-center gap-2">
                             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                             Loading inventory...
                          </div>
                        </td></tr>
                     ) : displayItems.length === 0 ? (
                        <tr>
                           <td colSpan="6" className="p-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="p-4 rounded-2xl bg-[var(--bg-glass-hover)] mb-4">
                                   <ArchiveBoxIcon className="w-12 h-12 text-[var(--text-secondary)]" />
                                </div>
                                <p className="text-lg font-semibold text-[var(--text-muted)] mb-1">No inventory items yet</p>
                                <p className="text-sm text-[var(--text-secondary)] mb-4">Start by adding your first stock item.</p>
                                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                                   <PlusIcon className="w-4 h-4" /> Add Stock
                                </button>
                              </div>
                           </td>
                        </tr>
                     ) : displayItems.map(item => {
                        const threshold = item.low_stock_threshold || 0
                        const max = threshold > 0 ? threshold * 2 : Math.max(item.quantity * 2, 10)
                        const percentage = Math.min((item.quantity / max) * 100, 100)
                        const pctOfThreshold = threshold > 0 ? Math.round((item.quantity / threshold) * 100) : null
                        
                        return (
                           <tr key={item.id} className={`hover:bg-[var(--bg-glass)] transition-all duration-200 group ${getRowBorder(item)}`}>
                              {/* Item */}
                              <td className="px-6 py-4">
                                 <p className="font-bold text-[var(--text-primary)] text-sm">{item.name}</p>
                                 <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{item.unit || 'units'}</p>
                              </td>
                              {/* SKU */}
                              <td className="px-6 py-4">
                                 <span className="font-mono text-xs text-[var(--text-secondary)] bg-[var(--bg-glass-hover)] px-2 py-0.5 rounded">{item.sku || '—'}</span>
                              </td>
                              {/* Stock Level */}
                              <td className="px-6 py-4">
                                 <div className="space-y-1.5">
                                    <div className="flex items-baseline gap-2">
                                       <span className="text-lg font-bold text-[var(--text-primary)]">{item.quantity}</span>
                                       <span className="text-[11px] text-[var(--text-secondary)]">{item.unit || 'units'}</span>
                                       {pctOfThreshold !== null && (
                                          <span className={`text-[10px] font-semibold ml-auto ${pctOfThreshold > 100 ? 'text-emerald-400' : pctOfThreshold > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                             {pctOfThreshold}% of threshold
                                          </span>
                                       )}
                                    </div>
                                    <div className="h-2 w-full bg-[var(--bg-glass-hover)] rounded-full overflow-hidden">
                                       <div 
                                          className={`h-full rounded-full ${getBarColor(item)} transition-all duration-700 ease-out`} 
                                          style={{ width: `${percentage}%` }}
                                       ></div>
                                    </div>
                                 </div>
                              </td>
                              {/* Threshold */}
                              <td className="px-6 py-4 text-sm text-[var(--text-muted)] font-mono">
                                 {threshold > 0 ? threshold : <span className="text-[var(--text-secondary)]">—</span>}
                              </td>
                              {/* Status */}
                              <td className="px-6 py-4">
                                 {getStatusBadge(item)}
                              </td>
                              {/* Actions */}
                              <td className="px-6 py-4">
                                 <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title="Edit item">
                                       <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setAdjustModal({ item, type: 'add' }); setAdjustQty('') }} className="p-2 rounded-lg hover:bg-emerald-500/15 text-[var(--text-secondary)] hover:text-emerald-400 transition-colors" title="Add stock">
                                       <PlusCircleIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => { setAdjustModal({ item, type: 'reduce' }); setAdjustQty('') }} className="p-2 rounded-lg hover:bg-amber-500/15 text-[var(--text-secondary)] hover:text-amber-400 transition-colors" title="Reduce stock">
                                       <MinusCircleIcon className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-500/15 text-[var(--text-secondary)] hover:text-red-400 transition-colors" title="Delete item">
                                       <TrashIcon className="w-4 h-4" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        )
                     })}
                  </tbody>
               </table>
             </div>

          </div>
        </main>
      </div>

      {/* ── Stock Adjust Modal ── */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden text-[var(--text-primary)]">
              <div className="p-6 border-b border-[var(--border-default)] flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${adjustModal.type === 'add' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {adjustModal.type === 'add' ? <PlusCircleIcon className="w-5 h-5" /> : <MinusCircleIcon className="w-5 h-5" />}
                 </div>
                 <div>
                    <h2 className="text-lg font-bold">{adjustModal.type === 'add' ? 'Add Stock' : 'Reduce Stock'}</h2>
                    <p className="text-xs text-[var(--text-muted)]">{adjustModal.item.name} • Current: {adjustModal.item.quantity} {adjustModal.item.unit || 'units'}</p>
                 </div>
              </div>
              <div className="p-6">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Quantity to {adjustModal.type}</label>
                 <input 
                    type="number" 
                    min="1" 
                    step="any"
                    autoFocus
                    value={adjustQty} 
                    onChange={(e) => setAdjustQty(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdjust()}
                    className="w-full mt-2 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-xl font-bold text-center focus:border-indigo-500 focus:outline-none"
                    placeholder="0"
                 />
                 {adjustQty && !isNaN(adjustQty) && parseFloat(adjustQty) > 0 && (
                    <p className="text-xs text-[var(--text-secondary)] text-center mt-2">
                       New total: <span className="text-[var(--text-primary)] font-bold">
                          {adjustModal.type === 'add' 
                             ? adjustModal.item.quantity + parseFloat(adjustQty) 
                             : Math.max(0, adjustModal.item.quantity - parseFloat(adjustQty))
                          }
                       </span> {adjustModal.item.unit || 'units'}
                    </p>
                 )}
              </div>
              <div className="p-6 pt-0 flex gap-3">
                 <button onClick={() => setAdjustModal(null)} className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-sm font-medium transition-colors border border-[var(--border-subtle)]">Cancel</button>
                 <button onClick={handleAdjust} className={`flex-1 px-4 py-2.5 rounded-lg text-[var(--text-primary)] text-sm font-bold transition-all shadow-lg ${adjustModal.type === 'add' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20'}`}>
                    {adjustModal.type === 'add' ? '+ Add Stock' : '− Reduce Stock'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-[var(--text-primary)]">
          <div className="w-full max-w-md bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-[var(--border-default)] flex items-center justify-between">
               <h2 className="text-lg font-bold">{editing ? 'Edit Item' : 'Add New Item'}</h2>
               <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <XMarkIcon className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Name *</label>
                <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Aspirin 500mg" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">SKU</label>
                <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g., MED-0042" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Quantity *</label>
                     <input type="number" step="any" className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Unit</label>
                     <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none" placeholder="pcs, kg, boxes..." value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                   <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                   Low Stock Alert Threshold
                </label>
                <input type="number" step="any" className="form-input w-full bg-[var(--bg-primary)] border border-amber-500/20 rounded-lg px-4 py-2.5 text-sm focus:border-amber-500/50 focus:outline-none" placeholder="Alert when stock falls below" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-sm font-medium transition-colors border border-[var(--border-subtle)]" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20">{editing ? 'Update Item' : 'Add to Inventory'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default InventoryPage
