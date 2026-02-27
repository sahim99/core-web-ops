import { createContext, useState, useEffect, useCallback, useContext } from 'react'
import { getMe, loginUser, loginStaff, logoutUser, demoLoginUser } from '../api/auth.api'

export const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on mount (via cookie)
  const loadUser = useCallback(async () => {
    try {
      const { data } = await getMe()
      setUser(data)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Owner login (email + password)
  const login = async (email, password) => {
    try {
      setLoading(true)
      await loginUser(email, password)
      await loadUser()
      return { success: true }
    } catch (error) {
      console.error("Login failed", error)
      const msg = error.response?.data?.error?.message || error.response?.data?.detail || "Login failed"
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  // Staff login (staff_id + email + password)
  const loginAsStaff = async (staffId, email, password) => {
    try {
      setLoading(true)
      await loginStaff(staffId, email, password)
      await loadUser()
      return { success: true }
    } catch (error) {
      console.error("Staff login failed", error)
      const msg = error.response?.data?.error?.message || error.response?.data?.detail || "Staff login failed"
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await logoutUser()
    } catch (error) {
       console.error("Logout failed", error)
    } finally {
      setUser(null)
    }
  }

  const demoLogin = async () => {
    try {
      setLoading(true)
      await demoLoginUser()
      await loadUser()
      return { success: true }
    } catch (error) {
      console.error("Demo login failed", error)
      const msg = error.response?.data?.error?.message || error.response?.data?.detail || "Demo login failed"
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const isOwner = user?.role === 'owner'
  const isDemo = user?.is_demo === true

  return (
    <AuthContext.Provider value={{ user, loading, login, loginAsStaff, logout, demoLogin, loadUser, isOwner, isDemo }}>
      {children}
    </AuthContext.Provider>
  )
}
