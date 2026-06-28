# TaskFlow

Clean, internal ticket management web app. Employees create tickets and assign them to
developers; developers manage status; both comment. Built with React 18 + Vite, Tailwind v3,
shadcn/ui, TanStack Query v5, React Router v6, React Hook Form + Zod, and Supabase.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from the example and fill in your Supabase project credentials:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Build for production:

   ```bash
   npm run build
   ```

## Backend expectations

The Supabase database is expected to already exist with the `profiles`, `tickets`, `comments`,
`attachments`, and `notifications` tables, plus database triggers that:

- create a `profiles` row from `user_metadata` (`name`, `role`) on sign up,
- auto-generate `ticket_number` (e.g. `TK-001`) on ticket insert,
- create a notification for the assignee on ticket insert.

Row Level Security is assumed to be enabled (the client adds friendly guards on top, e.g. only the
creator or assignee can open a ticket). A public Storage bucket named `attachments` is required for
file uploads.

Users are pre-created by an admin via the Supabase dashboard (with `name` and `role` in user
metadata). There is no public sign-up.

## Project structure

```
src/
├── lib/            supabase client + shared utils (formatDate, friendlyError, ...)
├── context/        AuthContext (session + profile + role)
├── hooks/          TanStack Query hooks (tickets, comments, notifications, profiles)
├── components/
│   ├── layout/         AppLayout, Sidebar, TopBar
│   ├── tickets/        StatusBadge, PriorityBadge, TypeBadge, TicketTable, TicketCard, TicketFilters
│   ├── notifications/  NotificationPanel
│   └── ui/             shadcn/ui primitives
├── pages/          Login, Dashboard, CreateTicket, MyTickets, AssignedTickets, TicketDetail
└── App.jsx         Router + QueryClientProvider + AuthProvider
```
