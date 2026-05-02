---
name: CarShare Family — project state
description: Full-stack Hebrew RTL car-sharing app; MVP complete with all screens, calendar, and localStorage backend
type: project
---

Hebrew RTL family car-scheduling MVP built with Next.js 14 App Router + TypeScript + Tailwind CSS.

**Why:** Multiple kids sharing one family car need a shared, conflict-aware calendar.

**How to apply:** All UI must stay Hebrew-only (RTL). Data service layer is abstracted so Supabase/Firebase can replace localStorage without touching components.

## Current state (as of 2026-05-01)
All routes compile cleanly. Dev server runs on port 3001.

### Routes
- `/` — redirect splash (checks auth → /auth/login | /setup | /dashboard)
- `/auth/login` — email+password login
- `/auth/signup` — signup with emoji & color picker
- `/setup` — choose: create group vs join group
- `/group/create` — name the car, get a join code
- `/group/join` — enter 6-char code to join
- `/dashboard` — car status (free/busy now), members, join code, upcoming bookings
- `/calendar` — full calendar (week/month views), inline booking create/edit/delete
- `/profile` — edit name/emoji/color, leave group, logout

### Key files
- `types/index.ts` — User, CarGroup, Booking, CalendarView, LayoutBooking
- `services/authService.ts` — signup/login/logout/updateUser (localStorage)
- `services/groupService.ts` — createGroup/joinGroup/leaveGroup (max 9 users)
- `services/bookingService.ts` — CRUD + layoutBookingsForDay (overlap column algorithm)
- `contexts/AppContext.tsx` — currentUser, group, members, bookings, refreshAll
- `contexts/ToastContext.tsx` — toast(message, type) hook
- `components/calendar/CalendarView.tsx` — week/month toggle, FAB, modals
- `components/calendar/WeekView.tsx` — time grid (6am–11pm), click-to-create, overlap layout
- `components/calendar/BookingModal.tsx` — create/edit form with conflict warning + quick options
- `components/calendar/BookingDetailsModal.tsx` — read-only or owner edit/delete

### localStorage keys
- `carshare_users`, `carshare_groups`, `carshare_bookings`, `carshare_current_user_id`

### Color palette
- Brand: brand-50 → brand-700 (light green)
- Mint: mint-50 → mint-300 (emerald-tinted)
- User colors: 9 options in lib/colors.ts USER_COLORS array
