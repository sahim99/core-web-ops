import { useState, useEffect } from 'react'
import { getNotificationPreferences, updateNotificationPreferences } from '../../api/settings.api'
import toast from 'react-hot-toast'
import { 
  BellIcon, 
  EnvelopeIcon, 
  MegaphoneIcon 
} from '@heroicons/react/24/outline'

function Switch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-[#0f0f1a]
        ${checked ? 'bg-indigo-600' : 'bg-white/10'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}

function NotificationSettings() {
  const [preferences, setPreferences] = useState({
    email_alerts: true,
    in_app_notifications: true,
    marketing_emails: false
  })
  const [initialPrefs, setInitialPrefs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const { data } = await getNotificationPreferences()
        setPreferences(data)
        setInitialPrefs(data)
      } catch (error) {
        console.error('Failed to load notification settings')
      } finally {
        setLoading(false)
      }
    }
    fetchPrefs()
  }, [])

  const hasChanges = initialPrefs && (
    preferences.email_alerts !== initialPrefs.email_alerts ||
    preferences.in_app_notifications !== initialPrefs.in_app_notifications ||
    preferences.marketing_emails !== initialPrefs.marketing_emails
  )

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateNotificationPreferences(preferences)
      setInitialPrefs({ ...preferences })
      toast.success('Preferences saved')
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-[var(--text-muted)]">Loading preferences...</span>
      </div>
    )
  }

  const toggleItems = [
    {
      key: 'email_alerts',
      icon: <EnvelopeIcon className="w-6 h-6" />,
      title: 'Email Alerts',
      description: 'Receive critical system alerts and important notifications via email.',
    },
    {
      key: 'in_app_notifications',
      icon: <BellIcon className="w-6 h-6" />,
      title: 'In-App Notifications',
      description: 'Show floating notifications and badges while using the app.',
    },
    {
      key: 'marketing_emails',
      icon: <MegaphoneIcon className="w-6 h-6" />,
      title: 'Product Updates',
      description: 'Receive news about new features, improvements, and product announcements.',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notification Preferences</h1>
        <p className="text-[var(--text-muted)] mt-1">Control how and when we communicate with you.</p>
      </div>

      {/* Notification Card */}
      <div className="bg-[var(--bg-glass-hover)] border border-[var(--border-default)] rounded-2xl overflow-hidden">
        {toggleItems.map((item, idx) => (
          <div 
            key={item.key}
            className={`flex items-center justify-between py-5 px-6 gap-4 ${
              idx < toggleItems.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
            }`}
          >
            <div className="flex gap-4">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 h-fit">
                {item.icon}
              </div>
              <div>
                <h3 className="text-base font-medium text-[var(--text-primary)]">{item.title}</h3>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">{item.description}</p>
              </div>
            </div>
            <Switch 
              checked={preferences[item.key]} 
              onChange={(val) => setPreferences(prev => ({ ...prev, [item.key]: val }))}
              disabled={saving} 
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

    </div>
  )
}

export default NotificationSettings
