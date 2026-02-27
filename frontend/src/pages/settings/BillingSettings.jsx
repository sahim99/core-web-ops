import { useState, useEffect } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { getBillingSettings } from '../../api/settings.api'

function BillingSettings() {
  const [billing, setBilling] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const { data } = await getBillingSettings()
        setBilling(data)
      } catch (error) {
         // Silent fail or toast
        // toast.error('Failed to load billing settings') 
        // Mock data if fails for dev preview
        setBilling({ plan: 'free', status: 'active', monthly_limit: 1000 }) 
      } finally {
        setLoading(false)
      }
    }
    fetchBilling()
  }, [])

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'Forever',
      features: [
        '1 Workspace',
        'Up to 10 Contacts',
        'Basic Forms',
        'Email Support',
      ],
      current: billing?.plan === 'free',
      button: 'Current Plan',
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      features: [
        'Unlimited Workspaces',
        'Unlimited Contacts',
        'Advanced Forms',
        'Automations',
        'Priority Support',
        'Custom Integrations',
      ],
      current: billing?.plan === 'starter' || billing?.plan === 'pro',
      button: 'Upgrade Now',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'Contact Sales',
      features: [
        'Everything in Pro',
        'Dedicated Account Manager',
        'Custom SLA',
        'Advanced Security',
        'White Label Options',
        '24/7 Phone Support',
      ],
      current: billing?.plan === 'enterprise',
      button: 'Contact Sales',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      
       {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Billing & Plans</h1>
        <p className="text-[var(--text-muted)] mt-1">Manage your subscription and payment methods.</p>
      </div>

       {/* Current Plan Card */}
       <div className="bg-[var(--bg-glass-hover)] border border-[var(--border-default)] rounded-2xl p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Current Information</h3>
                <p className="text-[var(--text-muted)] mt-1">
                  You are currently on the <span className="font-semibold text-indigo-400">
                    {loading ? 'Loading...' : billing?.plan?.charAt(0).toUpperCase() + billing?.plan?.slice(1) || 'Free'}
                  </span> plan.
                </p>
                <div className="flex items-center gap-2 mt-2">
                   <div className={`w-2 h-2 rounded-full ${billing?.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                   <span className="text-sm text-[var(--text-secondary)] capitalize">{billing?.status || 'Active'}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                 <button className="px-4 py-2 bg-[var(--bg-glass-hover)] hover:bg-white/10 text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg transition-colors text-sm font-medium">
                   Cancel Subscription
                 </button>
                 <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] rounded-lg transition-colors text-sm font-medium shadow-lg shadow-indigo-500/20">
                   Update Payment Method
                 </button>
              </div>
          </div>

          {/* Usage Stats (Mock) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[var(--border-subtle)]">
             <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Billing Email</p>
                <p className="text-[var(--text-primary)] font-medium truncate">{billing?.billing_email || 'admin@corewebops.com'}</p>
             </div>
             <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Next Invoice</p>
                <p className="text-[var(--text-primary)] font-medium">Oct 24, 2026</p>
             </div>
             <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">Monthly Usage</p>
                <p className="text-[var(--text-primary)] font-medium">{billing?.monthly_limit || 1000} requests</p>
             </div>
          </div>
       </div>

       {/* Available Plans */}
       <div>
         <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6">Available Plans</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {plans.map((plan, idx) => (
             <div
               key={idx}
               className={`relative rounded-2xl border transition-all duration-300 p-6 flex flex-col ${
                 plan.current
                   ? 'bg-indigo-600/10 border-indigo-500/50 shadow-xl shadow-indigo-900/20'
                   : 'bg-[var(--bg-glass-hover)] border-[var(--border-default)] hover:border-[var(--border-default)] hover:bg-[var(--border-subtle)]'
               }`}
             >
               {plan.current && (
                 <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                   <CheckCircleIcon className="w-3.5 h-3.5 text-indigo-400" />
                   <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Current</span>
                 </div>
               )}

               <div className="mb-4">
                 <h4 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h4>
                 <div className="flex items-baseline gap-1 mt-2">
                   <span className="text-3xl font-bold text-[var(--text-primary)]">{plan.price}</span>
                   <span className="text-[var(--text-secondary)] text-sm">{plan.period}</span>
                 </div>
               </div>

               <div className="space-y-3 mb-8 flex-1">
                 {plan.features.map((feature, i) => (
                   <div key={i} className="flex items-start gap-3">
                     <CheckCircleIcon className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                     <span className="text-[var(--text-secondary)] text-sm">{feature}</span>
                   </div>
                 ))}
               </div>

               <button
                 disabled={plan.current}
                 className={`w-full py-2.5 rounded-lg font-medium transition-all text-sm ${
                   plan.current
                     ? 'bg-indigo-500/20 text-indigo-400 cursor-default'
                     : 'bg-white text-black hover:bg-slate-200'
                 }`}
               >
                 {plan.button}
               </button>
             </div>
           ))}
         </div>
       </div>

        {/* Billing History */}
        <div className="bg-[var(--bg-glass-hover)] border border-[var(--border-default)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
             <h3 className="text-lg font-bold text-[var(--text-primary)]">Billing History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--bg-glass-hover)]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {/* Mock Data or Empty */}
                 <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-[var(--text-secondary)] italic">
                      No billing history available.
                    </td>
                 </tr>
              </tbody>
            </table>
          </div>
        </div>

    </div>
  )
}

export default BillingSettings
