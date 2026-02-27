import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/auth/Login'
import RoleDashboard from '../pages/RoleDashboard'
import ContactsPage from '../pages/modules/ContactsPage'
import BookingsPage from '../pages/modules/BookingsPage'
import FormsPage from '../pages/modules/FormsPage'
import InventoryPage from '../pages/modules/InventoryPage'
import StaffPage from '../pages/modules/StaffPage'
import InboxPage from '../pages/modules/InboxPage'
import AlertsPage from '../pages/modules/AlertsPage'
import ContactForm from '../pages/public/ContactForm'
import BookingPage from '../pages/public/BookingPage'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import NoAccess from '../pages/auth/NoAccess'
import AutomationDashboard from '../pages/automation/AutomationDashboard'


import OnboardingLayout from '../pages/onboarding/OnboardingLayout'
import StepEmail from '../pages/onboarding/StepEmail'
import StepContacts from '../pages/onboarding/StepContacts'
import StepBooking from '../pages/onboarding/StepBooking'
import StepForms from '../pages/onboarding/StepForms'
import StepInventory from '../pages/onboarding/StepInventory'
import StepStaff from '../pages/onboarding/StepStaff'
import StepActivate from '../pages/onboarding/StepActivate'
import LandingPage from '../pages/public/LandingPage'
import PublicFormPage from '../pages/public/PublicFormPage'

import Register from '../pages/auth/Register'

// Settings Pages
import SettingsLayout from '../pages/settings/SettingsLayout'
import AccountSettings from '../pages/settings/AccountSettings'
import WorkspaceSettings from '../pages/settings/WorkspaceSettings'
import BillingSettings from '../pages/settings/BillingSettings'
import NotificationSettings from '../pages/settings/NotificationSettings'

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact" element={<ContactForm />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/forms/public/:slug" element={<PublicFormPage />} />
      <Route path="/no-access" element={<NoAccess />} />

      {/* Onboarding Routes - Protected (User only) but allow Inactive status */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireActive={false}>
            <OnboardingLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="email" replace />} />
        <Route path="email" element={<StepEmail />} />
        <Route path="contacts" element={<StepContacts />} />
        <Route path="booking" element={<StepBooking />} />
        <Route path="form" element={<StepForms />} />
        <Route path="inventory" element={<StepInventory />} />
        <Route path="staff" element={<StepStaff />} />
        <Route path="activate" element={<StepActivate />} />
      </Route>

      {/* Protected routes – Owner + Staff (Require Active Status) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <ContactsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbox"
        element={
          <ProtectedRoute requiredPermission="inbox">
            <InboxPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute requiredPermission="bookings">
            <BookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms"
        element={
          <ProtectedRoute requiredPermission="forms">
            <FormsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute requiredPermission="inventory">
            <InventoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />


      {/* Owner-only routes */}
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <StaffPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/automation"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <AutomationDashboard />
          </ProtectedRoute>
        }
      />



      {/* Settings Routes - Protected */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="account" replace />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="workspace" element={<WorkspaceSettings />} />
        <Route path="billing" element={<BillingSettings />} />
        <Route path="notifications" element={<NotificationSettings />} />
      </Route>

      {/* Default redirect to Landing Page */}
      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
