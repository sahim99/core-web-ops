import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getWorkspace, updateWorkspace, deleteWorkspace } from '../../api/settings.api'
import toast from 'react-hot-toast'
import { 
  BuildingOfficeIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

function WorkspaceSettings() {
  const { isOwner, logout } = useAuth()
  
  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const { data } = await getWorkspace()
        setWorkspace(data)
      } catch (error) {
        // Silent fail — will show empty state
        console.error('Failed to load workspace:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchWorkspace()
  }, [])

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await updateWorkspace({ name: workspace.name, logo_url: workspace.logo_url })
      toast.success('Workspace updated')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update workspace')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmName !== workspace.name) return
    setDeleting(true)
    try {
      await deleteWorkspace()
      toast.success('Workspace deleted')
      logout()
    } catch (error) {
       toast.error(error.response?.data?.detail || 'Failed to delete workspace')
       setDeleting(false)
       setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-[var(--text-muted)]">Loading workspace settings...</span>
      </div>
    )
  }

  // Owner-only UI — clean, professional gate
  if (!isOwner) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Workspace Settings</h1>
          <p className="text-[var(--text-muted)] mt-1">Manage your workspace identity and configuration.</p>
        </div>

        <div className="bg-[var(--bg-glass-hover)] border border-[var(--border-default)] rounded-2xl p-12 text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-amber-500/10 text-amber-400">
            <LockClosedIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">Owner Access Required</h3>
          <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">
            Workspace settings can only be managed by the workspace owner. 
            Contact your administrator to make changes.
          </p>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="bg-[var(--bg-glass-hover)] border border-[var(--border-default)] rounded-2xl p-12 text-center">
        <p className="text-[var(--text-muted)]">Unable to load workspace details. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Workspace Settings</h1>
        <p className="text-[var(--text-muted)] mt-1">Manage your workspace identity and danger zone.</p>
      </div>

      {/* Workspace Info Card */}
      <div className="bg-[var(--bg-glass-hover)] border border-[var(--border-default)] rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
             <BuildingOfficeIcon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">General Information</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Workspace Name</label>
            <input 
              type="text" 
              value={workspace.name}
              onChange={(e) => setWorkspace({...workspace, name: e.target.value})}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[var(--text-secondary)]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Workspace ID</label>
              <div className="flex items-center gap-2">
                <code className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded px-3 py-2 text-[var(--text-muted)] font-mono text-sm">
                  {workspace.id}
                </code>
                <span className="text-xs text-[var(--text-secondary)]">Read-only</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Slug</label>
              <div className="flex items-center gap-2">
                <code className="bg-[var(--bg-primary)] border border-[var(--border-default)] rounded px-3 py-2 text-[var(--text-muted)] font-mono text-sm">
                  {workspace.slug}
                </code>
                <span className="text-xs text-[var(--text-secondary)]">Read-only</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]">
           <button 
             onClick={handleUpdate}
             disabled={saving}
             className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
             {saving ? 'Saving...' : 'Save Changes'}
           </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-12 border border-red-500/30 bg-red-500/5 rounded-2xl p-8 space-y-6">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Danger Zone</h3>
        </div>
        
        <p className="text-[var(--text-muted)] text-sm">
           Deleting your workspace is irreversible. All data, including contacts, bookings, and team members, will be permanently removed.
        </p>

        <div className="flex justify-end">
           <button 
             onClick={() => setShowDeleteModal(true)}
             className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
           >
             <TrashIcon className="w-4 h-4" />
             Delete Workspace
           </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Delete Workspace?</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">
                This action cannot be undone. Please type <span className="text-[var(--text-primary)] font-bold select-all">{workspace.name}</span> to confirm.
              </p>

              <input 
                type="text" 
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                className="w-full bg-black/50 border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] mb-6 focus:border-red-500 focus:outline-none"
                placeholder="Type workspace name"
                autoFocus
              />

              <div className="flex items-center justify-end gap-3">
                 <button 
                   onClick={() => { setShowDeleteModal(false); setDeleteConfirmName(''); }}
                   className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                 >
                   Cancel
                 </button>
                 <button 
                   onClick={handleDelete}
                   disabled={deleteConfirmName !== workspace.name || deleting}
                   className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[var(--text-primary)] rounded-lg font-medium shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                 >
                   {deleting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                   {deleting ? 'Deleting...' : 'Delete Workspace'}
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  )
}

export default WorkspaceSettings
