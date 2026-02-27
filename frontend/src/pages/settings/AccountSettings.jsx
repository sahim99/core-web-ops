import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { updateProfile, changePassword, sendEmailOTP, verifyEmailOTP } from '../../api/settings.api'
import toast from 'react-hot-toast'
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  ShieldCheckIcon,
  KeyIcon,
  CheckCircleIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'

function AccountSettings() {
  const { user } = useAuth()
  
  // Profile State
  const [profile, setProfile] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || '',
  })
  const [loadingProfile, setLoadingProfile] = useState(false)

  // Email State
  const [email, setEmail] = useState(user?.email || '')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)

  // Password State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [loadingPassword, setLoadingPassword] = useState(false)

  // Handlers
  const handleProfileSave = async () => {
    setLoadingProfile(true)
    try {
      await updateProfile(profile)
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleEmailUpdate = async () => {
    if (!otpSent) {
      if (email === user?.email) return toast('Email is unchanged')
      setLoadingEmail(true)
      try {
        await sendEmailOTP(email)
        setOtpSent(true)
        toast.success('OTP sent to new email')
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to send OTP')
      } finally {
        setLoadingEmail(false)
      }
    } else {
      setLoadingEmail(true)
      try {
        await verifyEmailOTP(email, otp)
        toast.success('Email verified & updated')
        setOtpSent(false)
        setOtp('')
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Invalid OTP')
      } finally {
        setLoadingEmail(false)
      }
    }
  }

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      return toast.error('New passwords do not match')
    }
    if (passwords.new.length < 8) {
      return toast.error('Password must be at least 8 characters')
    }
    setLoadingPassword(true)
    try {
      await changePassword({ 
        current_password: passwords.current, 
        new_password: passwords.new 
      })
      toast.success('Password changed successfully')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password')
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-10">
      
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Account Settings</h1>
        <p className="text-[var(--text-muted)] mt-1">Manage your profile and security preferences.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-[var(--bg-glass-hover)] border border-[var(--border-default)] rounded-2xl p-8 space-y-8">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden">
                {profile.avatar_url ? (
                   <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <span className="text-2xl font-bold text-[var(--text-primary)] uppercase">{profile.full_name?.charAt(0)}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{user?.full_name}</h3>
            <p className="text-[var(--text-muted)] text-sm">{user?.role?.toUpperCase()} • {user?.workspace_id ? `Workspace #${user.workspace_id}` : 'No Workspace'}</p>
          </div>
          
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Full Name</label>
            <input 
              type="text" 
              value={profile.full_name}
              onChange={(e) => setProfile({...profile, full_name: e.target.value})}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[var(--text-secondary)]"
              placeholder="John Doe"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Phone</label>
            <div className="relative">
              <PhoneIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-3.5" />
              <input 
                type="tel" 
                value={profile.phone}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg pl-10 pr-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[var(--text-secondary)]"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Avatar URL</label>
            <input 
              type="url" 
              value={profile.avatar_url}
              onChange={(e) => setProfile({...profile, avatar_url: e.target.value})}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[var(--text-secondary)]"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-[var(--border-subtle)]">
          <button 
            onClick={handleProfileSave}
            disabled={loadingProfile}
            className="bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] px-6 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {loadingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Email & Security Card */}
      <div className="bg-[var(--bg-glass-hover)] border border-[var(--border-default)] rounded-2xl p-8 space-y-10">
        
        {/* Email Section */}
        <div className="space-y-6">
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
               <EnvelopeIcon className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-base font-medium text-[var(--text-primary)]">Email Address</h3>
               <p className="text-xs text-[var(--text-secondary)]">Managing your account access</p>
             </div>
           </div>

           <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
             <div className="flex-1 w-full">
               <div className="flex items-center gap-3 mb-1">
                 <span className="text-lg font-medium text-[var(--text-primary)]">{email}</span>
                 {email === user?.email && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-md font-medium border border-emerald-500/20">Verified</span>
                 )}
               </div>
               <p className="text-sm text-[var(--text-secondary)]">
                 {otpSent ? 'Enter the code sent to your new email.' : 'We will send a code to confirm changes.'}
               </p>
             </div>

             {otpSent ? (
               <div className="flex items-center gap-2 w-full md:w-auto">
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="CODE"
                    className="w-24 bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-lg px-3 py-2 text-center font-mono tracking-widest text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none"
                  />
                  <button onClick={handleEmailUpdate} disabled={loadingEmail} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] rounded-lg text-sm font-medium transition">
                    Verifiy
                  </button>
               </div>
             ) : (
                <button 
                  onClick={() => setOtpSent(true)} // Mocking transition to input for UX demo 
                  // In real logic:
                  // onClick={handleEmailUpdate}
                  disabled={email === user?.email}
                  className="px-4 py-2 bg-[var(--bg-glass-hover)] hover:bg-white/10 text-[var(--text-primary)] border border-[var(--border-default)] rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-transparent disabled:border-transparent"
                >
                  Update Email
                </button>
             )}
           </div>
        </div>

        {/* Security Section (with divider) */}
        <div className="pt-10 border-t border-[var(--border-subtle)] space-y-6">
           <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
               <ShieldCheckIcon className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-base font-medium text-[var(--text-primary)]">Security</h3>
               <p className="text-xs text-[var(--text-secondary)]">Password and authentication</p>
             </div>
           </div>

           <div className="space-y-6">
             <div className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Current Password</label>
                  <button 
                    onClick={() => toast('Please contact support to reset.', { icon: 'ℹ️' })}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyIcon className="w-5 h-5 text-[var(--text-secondary)] absolute left-3 top-3.5" />
                  <input 
                    type="password" 
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg pl-10 pr-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[var(--text-secondary)]"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">New Password</label>
                  <input 
                    type="password" 
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[var(--text-secondary)]"
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-[var(--text-secondary)]">Minimum 8 characters, include number & symbol</p>
               </div>
               
               <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Confirm Password</label>
                  <input 
                    type="password" 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-[var(--text-secondary)]"
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
               </div>
             </div>
           </div>

           <div className="flex justify-end pt-6">
              <button 
                onClick={handlePasswordChange}
                disabled={loadingPassword || !passwords.current || !passwords.new}
                className="bg-indigo-600 hover:bg-indigo-700 text-[var(--text-primary)] px-6 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
              >
                {loadingPassword ? 'Updating...' : 'Update Password'}
              </button>
           </div>
        </div>

      </div>

    </div>
  )
}

export default AccountSettings
