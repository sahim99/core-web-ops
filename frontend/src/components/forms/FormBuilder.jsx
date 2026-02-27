import { useState } from 'react'
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  Bars3Icon, 
  XMarkIcon
} from '@heroicons/react/24/outline'
import { addField, updateField, deleteField, reorderFields } from '../../api/forms.api'
import toast from 'react-hot-toast'

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Button' },
  // { value: 'file', label: 'File Upload' } // TODO: Implement file upload handling
]

export default function FormBuilder({ form, onUpdate }) {
  const [editingField, setEditingField] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Sort fields by order
  const sortedFields = [...(form.fields || [])].sort((a, b) => a.field_order - b.field_order)

  const openFieldModal = (type = 'text') => {
    setEditingField({ 
      label: '', 
      field_type: type, 
      required: false, 
      options: [], 
      placeholder: ''
    })
    setIsModalOpen(true)
  }

  const openCreate = () => openFieldModal('text')

  const openEdit = (field) => {
    setEditingField({ ...field })
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingField.id) {
        await updateField(form.id, editingField.id, editingField)
        toast.success('Field updated')
      } else {
        await addField(form.id, { ...editingField, field_order: sortedFields.length })
        toast.success('Field added')
      }
      setIsModalOpen(false)
      onUpdate()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save field')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this field?')) return
    try {
      await deleteField(form.id, id)
      toast.success('Field deleted')
      onUpdate()
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete field')
    }
  }

  const moveField = async (index, direction) => {
    if (index + direction < 0 || index + direction >= sortedFields.length) return
    
    const newFields = [...sortedFields]
    const temp = newFields[index]
    newFields[index] = newFields[index + direction]
    newFields[index + direction] = temp
    
    // Optimistic update locally? No, simpler to just send new order IDs
    // But backend expects list of IDs in order?
    // Let's assume reorderFields takes array of IDs
    const fieldIds = newFields.map(f => f.id)
    
    try {
      await reorderFields(form.id, fieldIds)
      onUpdate() // Refresh from server to get correct order
    } catch (err) {
      toast.error('Failed to reorder')
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[var(--bg-primary)]">
      {/* LEFT COLUMN: Canvas (Header + List) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-subtle)] bg-[var(--bg-primary)]">
          {/* Header */}
          <div className="h-16 border-b border-[var(--border-subtle)] flex justify-between items-center px-6 bg-[var(--bg-secondary)]/30 shrink-0">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                {form.title}
                <span className="text-sm font-normal text-[var(--text-secondary)] px-2">Form Builder</span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Design your form layout</p>
            </div>
            {/* Mobile "Add Field" button fallback (hidden on desktop) */}
            <button 
              onClick={() => openFieldModal()}
              className="md:hidden flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] text-xs font-bold shadow-lg shadow-indigo-500/20"
            >
              <PlusIcon className="w-4 h-4" />
              Add Field
            </button>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-4">
            {sortedFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-glass-hover)] hover:bg-white/10 transition-colors cursor-pointer m-4" onClick={() => openFieldModal()}>
                <PlusIcon className="w-12 h-12 text-[var(--text-secondary)] mb-4" />
                <p className="text-[var(--text-muted)] font-medium">Click to add your first field</p>
              </div>
            ) : (
              sortedFields.map((field, idx) => (
                <div key={field.id} className="group bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-4 hover:border-indigo-500/30 transition-all flex items-start gap-4 relative">
                  {/* Drag Handle */}
                  <div className="text-[var(--text-secondary)] cursor-move flex flex-col gap-1 mt-2">
                     <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="hover:text-indigo-400 disabled:opacity-30">▲</button>
                     <Bars3Icon className="w-5 h-5 mx-auto" />
                     <button onClick={() => moveField(idx, 1)} disabled={idx === sortedFields.length - 1} className="hover:text-indigo-400 disabled:opacity-30">▼</button>
                  </div>

                  {/* Field Preview */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-[var(--text-primary)]">{field.label}</label>
                      {field.required && <span className="text-[10px] text-red-400 font-bold bg-red-400/10 px-1.5 py-0.5 rounded">REQUIRED</span>}
                    </div>
                    
                    {/* Realistic Input Preview */}
                    <div className="opacity-70 pointer-events-none">
                        {field.field_type === 'textarea' ? (
                            <textarea className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-sm" rows={3} placeholder={field.placeholder || "Long text..."} disabled />
                        ) : field.field_type === 'select' ? (
                            <select className="form-select w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-sm" disabled>
                                <option>Select an option...</option>
                                {field.options && field.options.map((opt, i) => <option key={i}>{opt}</option>)}
                            </select>
                        ) : field.field_type === 'checkbox' ? (
                            <div className="flex items-center gap-2">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-[var(--bg-primary)]" disabled />
                                <span className="text-sm text-[var(--text-muted)]">{field.label}</span>
                            </div>
                         ) : field.field_type === 'radio' ? (
                            <div className="space-y-1">
                                {(field.options && field.options.length > 0 ? field.options : ['Option 1', 'Option 2']).map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input type="radio" className="w-4 h-4 border-gray-600 bg-[var(--bg-primary)]" disabled />
                                        <span className="text-sm text-[var(--text-muted)]">{opt}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <input type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'} 
                                   className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-sm" 
                                   placeholder={field.placeholder || `Enter ${field.label}...`} 
                                   disabled 
                            />
                        )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex px-2 pt-1 gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-[var(--bg-secondary)] rounded-lg shadow-sm">
                    <button onClick={() => openEdit(field)} className="p-1.5 hover:bg-white/10 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" title="Edit">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(field.id)} className="p-1.5 hover:bg-red-500/10 rounded text-[var(--text-muted)] hover:text-red-400 transition-colors" title="Delete">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
            
            {/* Bottom padding for scrolling */}
            <div className="h-10"></div>
          </div>
      </div>

      {/* RIGHT COLUMN: Toolbox Sidebar */}
      <div className="hidden md:flex w-80 bg-[var(--bg-secondary)]/50 flex-col border-l border-[var(--border-subtle)] shrink-0">
          <div className="p-6 border-b border-[var(--border-subtle)]">
              <h3 className="font-bold text-[var(--text-primary)]">Form Elements</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Click to add a field</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                  {FIELD_TYPES.map(type => (
                      <button
                        key={type.value}
                        onClick={() => openFieldModal(type.value)}
                        className="flex flex-col items-center justify-center p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]/50 hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all group"
                      >
                         {/* Icon Placeholder - could map icons in FIELD_TYPES if we had them importable, using generic text for now or passed icon */}
                         <div className="w-8 h-8 rounded-lg bg-[var(--bg-glass-hover)] flex items-center justify-center mb-2 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-[var(--text-muted)] transition-colors">
                            <PlusIcon className="w-5 h-5" />
                         </div>
                         <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{type.label}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-[var(--text-primary)]">
          <div className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl shadow-2xl overflow-hidden animate-slide-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[var(--border-default)] flex justify-between items-center">
               <h2 className="text-lg font-bold text-[var(--text-primary)]">{editingField.id ? 'Edit Field' : `Add ${FIELD_TYPES.find(t => t.value === editingField.field_type)?.label || 'Field'}`}</h2>
               <button onClick={() => setIsModalOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {/* Label */}
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Label *</label>
                 <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" 
                   required 
                   autoFocus
                   value={editingField.label} 
                   onChange={(e) => setEditingField({ ...editingField, label: e.target.value })} 
                   placeholder="e.g. Email Address" 
                  />
              </div>

              {/* Type (Hidden for quick add, or shown to change?) Let's show it so they can still change mind */}
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Type *</label>
                 <select className="form-select w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]"
                   value={editingField.field_type}
                   onChange={(e) => setEditingField({ ...editingField, field_type: e.target.value })}
                 >
                    {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                 </select>
              </div>

              {/* Placeholder */}
              <div className="space-y-1">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Placeholder</label>
                 <input className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-[var(--text-primary)]" 
                   value={editingField.placeholder || ''} 
                   onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })} 
                   placeholder="e.g. Enter your email..." 
                  />
              </div>

              {/* Options (Conditional) */}
              {['select', 'radio', 'checkbox'].includes(editingField.field_type) && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Options (Comma separated)</label>
                  <textarea className="form-input w-full bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-[var(--text-primary)] font-mono"
                    rows={3}
                    value={Array.isArray(editingField.options) ? editingField.options.join(', ') : editingField.options || ''}
                    onChange={(e) => setEditingField({ ...editingField, options: e.target.value.split(',').map(s => s.trim()) })}
                    placeholder="Option A, Option B, Option C"
                  />
                  <p className="text-[10px] text-[var(--text-secondary)]">Separate options with commas.</p>
                </div>
              )}

              {/* Required Toggle */}
              <div className="flex items-center gap-3 pt-2">
                 <input type="checkbox" id="required" 
                   className="w-4 h-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-[var(--bg-primary)]"
                   checked={editingField.required}
                   onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                 />
                 <label htmlFor="required" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer select-none">Required Field</label>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[var(--border-default)] mt-4">
                <button type="button" className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg-glass-hover)] hover:bg-white/10 text-[var(--text-primary)] text-sm font-medium transition-colors border border-[var(--border-subtle)]" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)] text-sm font-bold transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
