export const DASHBOARD_CONFIG = {
  // Global Features
  autoRefreshInterval: 30000,
  showLiveIndicator: true,

  // Widget Toggles (Modular Framework)
  widgets: {
    kpiGrid: true,
    alertStrip: true,
    revenueChart: true,
    bookingTrend: true,
    pipelineFunnel: true,
    healthScore: true,
    formsStatus: true,
    inventoryStatus: true,
    inboxHealth: true,
  },

  // Color Mapping System (No dynamic tailwind interpolation)
  colors: {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400',
    info: 'text-blue-400',
    primary: 'text-indigo-400',
  }
}
