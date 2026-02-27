/**
 * DEMO MODE — Dashboard overlay data
 * Numbers match what demo_seeder.py actually inserts into the DB so the
 * dashboard summary is consistent with what users see on each module page.
 *
 * Seeded: 22 contacts · 12 bookings (4 completed, 4 confirmed, 3 pending, 1 cancelled)
 *         8 inventory items (1 low stock) · 12 conversations (8 unread) · 4 forms
 */

// Generates 7 realistic booking/confirmed data points ending today
function buildRevenueTrend() {
  const base = [
    { bookings: 2, confirmed: 1 },
    { bookings: 3, confirmed: 2 },
    { bookings: 1, confirmed: 1 },
    { bookings: 4, confirmed: 3 },
    { bookings: 2, confirmed: 2 },
    { bookings: 1, confirmed: 1 },
    { bookings: 3, confirmed: 2 },
  ]
  const today = new Date()
  return base.map((d, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - i))
    return { ...d, date: date.toISOString().split('T')[0] }
  })
}

export const DEMO_DATA = {
  kpis: {
    total_bookings:   12,
    total_contacts:   22,
    pending_bookings: 3,
    unread_alerts:    2,
  },

  growth: {
    bookings: 12,
    contacts: 8,
  },

  revenue_trend: buildRevenueTrend(),

  // Exactly matches seeded bookings: 4 completed, 4 confirmed, 3 pending, 1 cancelled
  booking_status: {
    pending:   3,
    confirmed: 4,
    completed: 4,
    cancelled: 1,
  },

  pipeline: {
    total_contacts:     22,
    new_contacts:       14,
    confirmed_bookings: 4,
    conversion_rate:    18.2,
  },

  // Exactly matches seeded inventory items
  inventory_status: {
    total_items:   8,
    low_stock:     1,
    out_of_stock:  0,
    items: [
      { id: 1, name: 'Executive Suite',         sku: 'RM-EXC-001', quantity: 4,  threshold: 2,  unit: 'rooms',  status: 'healthy'   },
      { id: 2, name: 'Conference Room A',        sku: 'RM-CNF-001', quantity: 2,  threshold: 1,  unit: 'rooms',  status: 'healthy'   },
      { id: 3, name: 'Catering – Premium Pkg',  sku: 'CAT-PRE-01', quantity: 3,  threshold: 5,  unit: 'pkgs',   status: 'low_stock' },
      { id: 4, name: 'AV Equipment Set',         sku: 'EQ-AV-001',  quantity: 6,  threshold: 2,  unit: 'sets',   status: 'healthy'   },
      { id: 5, name: 'Photography Add-on',       sku: 'SVC-PHO-01', quantity: 8,  threshold: 3,  unit: 'slots',  status: 'healthy'   },
      { id: 6, name: 'Floral Arrangement',       sku: 'DEC-FLR-001',quantity: 12, threshold: 4,  unit: 'units',  status: 'healthy'   },
      { id: 7, name: 'Valet Parking',            sku: 'SVC-VLT-01', quantity: 20, threshold: 5,  unit: 'spots',  status: 'healthy'   },
      { id: 8, name: 'Outdoor Marquee',          sku: 'EQ-MRQ-001', quantity: 1,  threshold: 1,  unit: 'units',  status: 'healthy'   },
    ],
  },

  forms_status: {
    active_forms:        4,
    recent_submissions:  9,
  },

  // 8 of 12 conversations are unread
  inbox_status: {
    unanswered:           8,
    active_conversations: 12,
  },

  health: {},
  alerts: [],
}
