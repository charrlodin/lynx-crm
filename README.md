# LynxCRM

> A minimal, keyboard-first CRM for small teams. Built with Next.js, Convex, and Clerk.

## Features

### Pipeline Management
- Kanban board with drag-and-drop
- Customizable stages (reorder, rename, add/delete)
- Lead cards showing value, company, days in stage
- Won/Lost stage tracking with analytics

### Leads
- Create, edit, delete leads
- Attach notes and view activity history
- Assign to lists for organization
- Tags, value, contact info tracking
- Bulk actions (move to stage, delete)
- CSV import with downloadable template
- One-click CSV export

### Tasks & Reminders
- Priority levels (high/medium/low)
- Status workflow (To Do → In Progress → Done)
- Due dates with overdue tracking
- Link tasks to leads or lists

### Lists
- Group leads and tasks into collections
- Color-coded for visual organization
- View all items in a list at a glance

### Dashboard
- Key metrics (total leads, pipeline, won, lost, win rate)
- Pipeline value breakdown (open, won, lost)
- Task summary with status counts
- Recent activity feed

### Keyboard-First UX
- Command palette (`/` or `⌘K`) - search leads, navigate, take actions
- Global shortcuts: `N` new lead, `G D` dashboard, `G P` pipeline, etc.
- Visual shortcut indicator when pressing `G`

### Settings
- Pipeline stage management with drag-to-reorder
- Currency selection (USD, GBP, EUR, JPY, and more)
- Usage tracking and limits display

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Clerk
- **Drag & Drop**: @dnd-kit

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account ([convex.dev](https://convex.dev))
- Clerk account ([clerk.com](https://clerk.com))

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repo-url>
   cd lynx-crm
   npm install
   ```

2. **Set up Clerk:**
   - Create a new application at [clerk.com](https://clerk.com)
   - Copy your API keys

3. **Set up Convex:**
   - Run `npx convex dev`
   - Follow the prompts to create a new project
   - Configure the Clerk JWT template per [Convex auth docs](https://docs.convex.dev/auth/clerk)

4. **Configure environment variables:**
   
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
   CLERK_SECRET_KEY=<your-clerk-secret-key>
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` or `⌘K` | Open command palette |
| `N` | Create new lead |
| `Esc` | Close modal/palette |
| `G D` | Go to Dashboard |
| `G P` | Go to Pipeline |
| `G L` | Go to Leads |
| `G T` | Go to Tasks |
| `G O` | Go to Lists |
| `G I` | Go to Import |
| `G S` | Go to Settings |

## Free Tier Limits

- 1,000 leads
- 1 pipeline
- 10 stages
- 3 imports per day
- 500 rows per import

## Project Structure

```
├── app/                    # Next.js app router
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── dashboard/      # Overview page
│   │   ├── pipeline/       # Kanban board
│   │   ├── leads/          # Leads table
│   │   ├── tasks/          # Tasks management
│   │   ├── lists/          # Lists management
│   │   ├── import/         # CSV import
│   │   └── settings/       # Configuration
│   └── page.tsx            # Landing page
├── components/
│   └── dashboard/          # Dashboard components
├── convex/                 # Convex backend
│   ├── schema.ts           # Database schema
│   ├── leads.ts            # Lead mutations/queries
│   ├── tasks.ts            # Task mutations/queries
│   ├── lists.ts            # List mutations/queries
│   └── ...
└── public/                 # Static assets
```

## License

MIT
