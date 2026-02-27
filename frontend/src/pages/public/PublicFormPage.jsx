import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicForm, submitPublicForm } from '../../api/forms.api'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

export default function PublicFormPage() {
  const { slug } = useParams()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadForm = async () => {
      try {
        const res = await getPublicForm(slug)
        setForm(res.data)
        // Initialize fields if needed
      } catch (err) {
        console.error(err)
        setError('Form not found or unavailable.')
      } finally {
        setLoading(false)
      }
    }
    loadForm()
  }, [slug])

  const handleChange = (fieldId, value) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitPublicForm(slug, { answers })
      setSubmitted(true)
      toast.success('Form submitted successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)]">
      <div className="animate-pulse">Loading form...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--bg-secondary)] border border-red-500/20 rounded-2xl p-8 text-center">
        <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Unavailable</h1>
        <p className="text-[var(--text-muted)]">{error}</p>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[var(--bg-secondary)] border border-emerald-500/20 rounded-2xl p-8 text-center animate-fade-in shadow-2xl shadow-emerald-900/20">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Thank You!</h1>
        <p className="text-[var(--text-muted)] mb-8">Your submission for <strong className="text-[var(--text-primary)]">{form.title}</strong> has been received.</p>
        <button onClick={() => window.close()} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          Close this window
        </button>
      </div>
    </div>
  )

  const sortedFields = [...(form.fields || [])].sort((a, b) => a.field_order - b.field_order)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        
        {/* Header */}
        <div className="text-center">
           <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">{form.title}</h1>
           {form.description && <p className="mt-2 text-[var(--text-muted)]">{form.description}</p>}
        </div>

        {/* Form Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl shadow-xl overflow-hidden">
           {/* Progress bar / Brand strip */}
           <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
           
           <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {sortedFields.map(field => (
                 <div key={field.id} className="space-y-1">
                    <label className="block text-sm font-bold text-[var(--text-secondary)]">
                       {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    <p className="text-xs text-[var(--text-secondary)] mb-1.5">{field.placeholder}</p>
                    
                    {/* Render inputs based on type */}
                    {field.field_type === 'textarea' ? (
                       <textarea 
                          className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-[var(--text-secondary)]"
                          rows={4}
                          required={field.required}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                       />
                    ) : field.field_type === 'select' ? (
                       <div className="relative">
                          <select 
                             className="form-select w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none appearance-none transition-all"
                             required={field.required}
                             onChange={(e) => handleChange(field.id, e.target.value)}
                             defaultValue=""
                          >
                             <option value="" disabled>Select an option...</option>
                             {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--text-secondary)]">
                             <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                          </div>
                       </div>
                    ) : field.field_type === 'radio' ? (
                       <div className="space-y-2 mt-2">
                          {field.options?.map((opt, i) => (
                             <label key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:bg-[var(--bg-glass-hover)] cursor-pointer transition-colors group">
                                <input 
                                   type="radio" 
                                   name={`field_${field.id}`} 
                                   value={opt}
                                   required={field.required}
                                   onChange={(e) => handleChange(field.id, e.target.value)}
                                   className="h-4 w-4 text-indigo-600 border-slate-600 focus:ring-indigo-500 bg-[var(--bg-primary)]" 
                                />
                                <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">{opt}</span>
                             </label>
                          ))}
                       </div>
                    ) : field.field_type === 'checkbox' ? (
                       <div className="space-y-2 mt-2">
                           {/* TODO: Handle multi-select checkbox arrays properly. For now treating single checkbox? 
                               Actually checkbox usually allows multiple selections. 
                               Simplifying for single "check to agree" style or list.
                               Let's assume generic checkbox group for now.
                           */}
                           {field.options && field.options.length > 0 ? (
                              field.options.map((opt, i) => (
                                 <label key={i} className="flex items-center gap-3">
                                    <input type="checkbox" className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-[var(--bg-primary)]" 
                                       // Logic for array update would be needed here
                                       onChange={(e) => {
                                          const current = answers[field.id] || [];
                                          const newVal = e.target.checked 
                                             ? [...current, opt]
                                             : current.filter(x => x !== opt);
                                          handleChange(field.id, newVal)
                                       }}
                                    />
                                    <span className="text-sm text-[var(--text-secondary)]">{opt}</span>
                                 </label>
                              ))
                           ) : (
                              <label className="flex items-center gap-3">
                                 <input type="checkbox" required={field.required} className="rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-[var(--bg-primary)]" 
                                    onChange={(e) => handleChange(field.id, e.target.checked ? 'Yes' : 'No')}
                                 />
                                 <span className="text-sm text-[var(--text-secondary)]">Yes</span>
                              </label>
                           )}
                       </div>
                    ) : field.field_type === 'DATE' || field.field_type === 'date' ? (
                       <input 
                          type="date" 
                          className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-[var(--text-secondary)]"
                          required={field.required}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                       />
                    ) : (
                       <input 
                          type={(field.field_type === 'EMAIL' || field.field_type === 'email') ? 'email' : (field.field_type === 'PHONE' || field.field_type === 'phone') ? 'tel' : 'text'} 
                          className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-[var(--text-secondary)]"
                          required={field.required}
                          placeholder={field.label === 'Preferred Time' ? 'e.g. 2:00 PM or 14:00' : ''}
                          onChange={(e) => handleChange(field.id, e.target.value)}
                       />
                    )}
                 </div>
              ))}

              <div className="pt-6">
                 <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-[var(--text-primary)] bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-indigo-500/30"
                 >
                    {submitting ? 'Submitting...' : 'Submit Form'}
                 </button>
              </div>
           </form>
        </div>
        
        <div className="text-center">
           <p className="text-xs text-[var(--text-secondary)]">Powered by CoreWebOps</p>
        </div>

      </div>
    </div>
  )
}
