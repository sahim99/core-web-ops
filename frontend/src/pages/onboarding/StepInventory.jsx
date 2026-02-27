import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { Package, ArrowRight, Layers, SkipForward } from 'lucide-react'
import api from "../../api/axios";

export default function StepInventory() {
  const navigate = useNavigate()
  const { refreshStatus } = useOutletContext()
  const [name, setName] = useState('')
  const [qty, setQty] = useState(10)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name) return
    
    setLoading(true)
    try {
      await api.post('/inventory', { 
        name, 
        quantity: parseFloat(qty),
        unit: 'units',
        low_stock_threshold: 5
      })
      await refreshStatus()
      navigate('/onboarding/staff')
    } catch (err) {
      console.error(err)
      alert('Failed to add inventory item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
           <Package className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Add Inventory</h2>
          <p className="text-[var(--text-muted)] text-sm">Track your stock levels</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Item Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]"
            placeholder="e.g. Premium Widget"
            required
          />
        </div>
        
        <div>
           <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Initial Quantity</label>
           <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
                <Layers className="h-4 w-4" />
              </div>
              <input 
                  type="number" 
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-[var(--text-primary)] pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-[var(--text-secondary)]"
                  required
              />
           </div>
           <p className="text-xs text-[var(--text-secondary)] mt-2">Default unit: "units" | Low stock alert: 5</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Add Item & Continue
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <button 
              type="button" 
              onClick={() => navigate('/onboarding/staff')}
              className="px-6 py-3 rounded-xl font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-slate-800 transition-colors flex items-center gap-2 justify-center"
            >
              Skip
              <SkipForward className="w-4 h-4" />
            </button>
        </div>
      </form>
    </div>
  )
}
