# TaskFlow — Claude Code Prompt

## 🎯 Project Overview

Build **TaskFlow**, a clean and professional internal ticket management web app.
Employees create tickets and assign them directly to developers. Developers manage and update those tickets. No approval flows, no managers, no complexity.

---

## ⚡ Tech Stack (Strict — Do Not Change)

| Layer | Tool |
|---|---|
| Framework | React 18 + Vite |
| Language | JavaScript (JSX) |
| Styling | Tailwind CSS v3 |
| UI Components | shadcn/ui |
| Routing | React Router v6 |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Backend | Supabase (Auth + DB + Realtime + Storage) |
| Icons | Lucide React |

---

## 🗄️ Supabase Database Schema

The database is already created. Use these exact table and column names:

### `profiles`
```
id          uuid (PK, references auth.users)
name        varchar
role        varchar  -- 'employee' | 'developer'
created_at  timestamptz
```

### `tickets`
```
id             uuid (PK)
ticket_number  varchar  -- e.g. 'TK-001'
title          varchar
description    text
type           varchar  -- 'Bug' | 'Task' | 'Request'
priority       varchar  -- 'Low' | 'Medium' | 'High'
status         varchar  -- 'Open' | 'In Progress' | 'Done' | 'Cancelled' | 'Reopened'
created_by     uuid (FK → profiles.id)
assigned_to    uuid (FK → profiles.id)
created_at     timestamptz
updated_at     timestamptz
closed_at      timestamptz
```

### `comments`
```
id          uuid (PK)
ticket_id   uuid (FK → tickets.id)
user_id     uuid (FK → profiles.id)
message     text
created_at  timestamptz
```

### `attachments`
```
id           uuid (PK)
ticket_id    uuid (FK → tickets.id)
file_url     varchar
file_name    varchar
uploaded_by  uuid (FK → profiles.id)
created_at   timestamptz
```

### `notifications`
```
id          uuid (PK)
user_id     uuid (FK → profiles.id)
ticket_id   uuid (FK → tickets.id)
message     varchar
is_read     boolean
created_at  timestamptz
```

---

## 🔐 Authentication

- Use **Supabase Auth** with email + password only
- On sign up: pass `name` and `role` as `user_metadata` so the DB trigger auto-creates the profile
- After login: fetch the user's profile from `profiles` table to get their `role`
- Store user + profile in a global `AuthContext`
- Protect all routes — redirect unauthenticated users to `/login`
- Redirect authenticated users away from `/login`

### Auth Flow
```
/login
  → on success → fetch profile → redirect based on role:
      employee  → /dashboard
      developer → /dashboard
```

---

## 📁 Project Structure

```
src/
├── lib/
│   └── supabase.js           ← Supabase client (use env vars)
│
├── context/
│   └── AuthContext.jsx       ← Global auth state + profile
│
├── hooks/
│   ├── useTickets.js         ← All ticket queries/mutations
│   ├── useComments.js        ← Comment queries/mutations
│   ├── useNotifications.js   ← Notifications + realtime
│   └── useProfiles.js        ← Fetch developers list
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx     ← Sidebar + topbar wrapper
│   │   ├── Sidebar.jsx       ← Navigation sidebar
│   │   └── TopBar.jsx        ← Header with notifications bell + user menu
│   │
│   ├── tickets/
│   │   ├── TicketCard.jsx    ← Ticket summary card
│   │   ├── TicketTable.jsx   ← Tickets in table format
│   │   ├── StatusBadge.jsx   ← Colored status pill
│   │   ├── PriorityBadge.jsx ← Colored priority pill
│   │   └── TypeBadge.jsx     ← Bug / Task / Request badge
│   │
│   ├── notifications/
│   │   └── NotificationPanel.jsx ← Slide-in panel with notifications list
│   │
│   └── ui/                   ← shadcn/ui components (auto-generated)
│
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── CreateTicket.jsx
│   ├── TicketDetail.jsx
│   ├── MyTickets.jsx         ← (employee) tickets I created
│   └── AssignedTickets.jsx   ← (developer) tickets assigned to me
│
└── App.jsx                   ← Router setup + QueryClientProvider + AuthProvider
```

---

## 📄 Pages — Full Specification

---

### 1. `/login` — Login Page

**Layout:** Centered card on a dark/neutral background with the TaskFlow logo + tagline.

**Form fields:**
- Email (input, required, email validation)
- Password (input, required, min 8 chars)
- Submit button: "Sign In"

**Behavior:**
- Show inline field errors (React Hook Form + Zod)
- Show a toast or alert on wrong credentials
- On success → redirect based on role

**Note:** No sign-up page. Users are pre-created by admin via Supabase dashboard.

---

### 2. `/dashboard` — Dashboard

**For Employee:**
- Stats row (4 cards):
  - Total tickets I created
  - Open tickets
  - In Progress tickets
  - Done tickets
- Recent tickets table (last 5), with a "View All" link to `/my-tickets`

**For Developer:**
- Stats row (4 cards):
  - Total assigned to me
  - Open
  - In Progress
  - Done
- Recent assigned tickets table (last 5), with "View All" link to `/assigned`

Both roles see the same layout — data differs based on role.

---

### 3. `/create-ticket` — Create Ticket (Employee only)

**Form fields:**
| Field | Type | Validation |
|---|---|---|
| Title | text input | required, min 5 chars |
| Description | textarea | required, min 10 chars |
| Type | select | Bug / Task / Request |
| Priority | select | Low / Medium / High |
| Assign To | select (developers only) | required |

**Assign To dropdown:**
- Fetch all users where `role = 'developer'` from `profiles`
- Show their name in the dropdown

**On submit:**
- Insert into `tickets` table
- The DB trigger auto-sends a notification to the selected developer
- Show success toast: "Ticket #TK-XXX created successfully"
- Redirect to `/my-tickets`

**Validation:** Use Zod schema + React Hook Form. Show errors under each field.

---

### 4. `/my-tickets` — My Tickets (Employee only)

**Features:**
- Table of all tickets the logged-in employee created
- Columns: `#`, `Title`, `Type`, `Priority`, `Status`, `Assigned To`, `Created At`, `Actions`
- Filter bar at the top:
  - Filter by Status (All / Open / In Progress / Done / Cancelled)
  - Filter by Priority (All / Low / Medium / High)
  - Filter by Type (All / Bug / Task / Request)
  - Search by title (debounced)
- Each row has a "View" button → goes to `/tickets/:id`
- Employee can cancel their own Open tickets (show "Cancel" button only if status is Open)
- Empty state: show a friendly message + "Create your first ticket" button

---

### 5. `/assigned` — Assigned Tickets (Developer only)

**Features:**
- Stats bar at top: `Open (n)` | `In Progress (n)` | `Done (n)`
- Table of all tickets assigned to the logged-in developer
- Columns: `#`, `Title`, `Type`, `Priority`, `Status`, `Created By`, `Created At`, `Actions`
- Same filter bar as `/my-tickets`
- Each row has a "View" button → goes to `/tickets/:id`
- Empty state: "No tickets assigned to you yet"

---

### 6. `/tickets/:id` — Ticket Detail

This is the most important page. Split into two columns:

**Left column (2/3 width):**
- Ticket header: `#TK-001 — Title`
- Badges row: `TypeBadge` + `PriorityBadge` + `StatusBadge`
- Meta info: Created by, Assigned to, Created at, Updated at
- Full description (formatted text)
- Attachments section:
  - Show list of uploaded files (filename + download link)
  - Upload button (only visible to ticket creator or assignee)
  - On upload: upload file to Supabase Storage bucket `attachments`, then insert row into `attachments` table
- Comments section:
  - List of all comments (avatar/initials + name + date + message), oldest first
  - Comment input box at the bottom (textarea + "Add Comment" button)
  - Both employee and developer can comment

**Right column (1/3 width) — Action Panel:**
- Show current status prominently

**If logged-in user is the Developer (assigned_to):**
  - Status update buttons:
    - If Open → "Start Working" (sets to In Progress)
    - If In Progress → "Mark as Done" (sets to Done)
    - If Done → "Reopen" (sets to Reopened)

**If logged-in user is the Employee (created_by):**
  - If status is Open or Reopened → "Cancel Ticket" button (with confirmation dialog)

- Ticket info card:
  - Type, Priority, Created at, Closed at (if applicable)

---

## 🔔 Notifications System

### NotificationBell (in TopBar)
- Bell icon with a red badge showing unread count
- On click: opens `NotificationPanel` (slide-in from right, or dropdown)

### NotificationPanel
- List of all notifications for the logged-in user
- Each item shows: message + ticket number + time ago
- Click on notification → navigate to `/tickets/:id` + mark as read
- "Mark all as read" button at the top

### Realtime
Use Supabase Realtime to listen for new notifications:
```javascript
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    // Invalidate notifications query + show toast
  })
  .subscribe()
```
Show a toast popup when a new notification arrives (use shadcn/ui Toaster).

---

## 🎨 Design System

### Visual Direction
- **Style:** Clean, professional, minimal — like Linear or Plane.so
- **Background:** `#0F1117` (near black) for sidebar, `#F8F9FA` (off-white) for main content area — dark sidebar + light content
- **Accent color:** `#6366F1` (indigo-500) for primary actions, active states, badges
- **Font:** Inter (import from Google Fonts)

### Colors
```
Background (main):  #F8F9FA
Background (sidebar): #0F1117
Sidebar text:       #A1A1AA
Sidebar active:     #FFFFFF
Accent:             #6366F1
Success:            #22C55E
Warning:            #F59E0B
Danger:             #EF4444
Border:             #E4E4E7
Text primary:       #111827
Text secondary:     #6B7280
```

### Status Badge Colors
```
Open:        bg-blue-100   text-blue-700
In Progress: bg-yellow-100 text-yellow-700
Done:        bg-green-100  text-green-700
Cancelled:   bg-red-100    text-red-700
Reopened:    bg-purple-100 text-purple-700
```

### Priority Badge Colors
```
Low:    bg-gray-100  text-gray-600
Medium: bg-orange-100 text-orange-600
High:   bg-red-100   text-red-600
```

### Type Badge Colors
```
Bug:     bg-red-50   text-red-500
Task:    bg-blue-50  text-blue-500
Request: bg-green-50 text-green-500
```

### Sidebar Navigation

**Employee:**
```
Dashboard       /dashboard
Create Ticket   /create-ticket
My Tickets      /my-tickets
```

**Developer:**
```
Dashboard       /dashboard
Assigned to Me  /assigned
```

---

## 🧩 Supabase Queries Reference

### Fetch tickets created by current user:
```javascript
supabase
  .from('tickets')
  .select(`*, assigned_profile:profiles!assigned_to(name)`)
  .eq('created_by', user.id)
  .order('created_at', { ascending: false })
```

### Fetch tickets assigned to current user:
```javascript
supabase
  .from('tickets')
  .select(`*, creator_profile:profiles!created_by(name)`)
  .eq('assigned_to', user.id)
  .order('created_at', { ascending: false })
```

### Fetch single ticket with all relations:
```javascript
supabase
  .from('tickets')
  .select(`
    *,
    creator:profiles!created_by(id, name),
    assignee:profiles!assigned_to(id, name),
    comments(*, commenter:profiles!user_id(name)),
    attachments(*)
  `)
  .eq('id', ticketId)
  .single()
```

### Fetch all developers (for assign dropdown):
```javascript
supabase
  .from('profiles')
  .select('id, name')
  .eq('role', 'developer')
```

---

## 🔒 Route Protection Rules

| Route | Who can access |
|---|---|
| `/login` | Unauthenticated only |
| `/dashboard` | Both roles |
| `/create-ticket` | Employee only |
| `/my-tickets` | Employee only |
| `/assigned` | Developer only |
| `/tickets/:id` | Creator or Assignee only |

Redirect unauthorized role access to `/dashboard`.

---

## 🌍 Environment Variables

Create a `.env` file:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use in `src/lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## ✅ Quality Requirements

- All forms must have proper loading states (disable button + show spinner while submitting)
- All data fetching must show loading skeletons (use shadcn/ui Skeleton)
- All errors must show user-friendly messages (not raw Supabase errors)
- All destructive actions (Cancel ticket) must show a confirmation dialog (shadcn/ui AlertDialog)
- The app must be fully responsive (works on mobile and desktop)
- Use TanStack Query for all data fetching — no raw useEffect for fetching
- Invalidate relevant queries after every mutation
- All dates must be formatted as: `Jun 25, 2026 · 3:42 PM`
- Use `date-fns` for date formatting

---

## 🚀 Setup Commands

```bash
npm create vite@latest taskflow -- --template react
cd taskflow
npm install
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install react-router-dom
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react
npm install date-fns
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init
npx shadcn@latest add button input label textarea select badge card table dialog alert-dialog toast skeleton separator avatar dropdown-menu
```

---

## 📦 Deliverables

Build the complete application with all pages, components, hooks, and context as specified. The app should be fully functional and ready to connect to the Supabase backend with just the environment variables.

Start with:
1. `src/lib/supabase.js`
2. `src/context/AuthContext.jsx`
3. `src/App.jsx` (routes)
4. `src/pages/Login.jsx`
5. Then build all remaining pages and components.
