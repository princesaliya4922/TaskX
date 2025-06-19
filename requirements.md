# Task Management Application Development Prompts

## Project Overview
Build a comprehensive task management application similar to Jira using Next.js 14+ with App Router, TypeScript, Prisma ORM, PostgreSQL, and modern UI libraries.

---

## Prompt 1: Initial Project Setup & Authentication

### Requirements:
Create a Next.js application with complete authentication system including:

**Technical Stack:**
- Next.js 14+ with App Router and TypeScript
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication
- Tailwind CSS for styling
- Shadcn/ui for UI components
- React Hook Form + Zod for form validation
- TanStack Query for data fetching

**Authentication Features:**
1. **Sign Up Page** (`/signup`):
   - Email, password, full name fields
   - Password strength indicator
   - Email validation
   - Terms of service checkbox
   - Redirect to onboarding after signup

2. **Sign In Page** (`/signin`):
   - Email and password fields
   - "Remember me" checkbox
   - "Forgot password" link
   - OAuth options (Google, GitHub)
   - Rate limiting for failed attempts

3. **Security Implementation:**
   - Bcrypt for password hashing
   - JWT tokens with refresh token rotation
   - Session management with NextAuth
   - Protected API routes using middleware
   - CSRF protection

4. **User Profile Management** (`/settings/profile`):
   - Update name, email, avatar
   - Change password with current password verification
   - Upload avatar with image cropping
   - Delete account option

**API Routes Required:**
```
POST   /api/auth/signup
POST   /api/auth/signin
POST   /api/auth/signout
GET    /api/auth/session
POST   /api/auth/refresh
PUT    /api/users/profile
POST   /api/users/avatar
DELETE /api/users/account
```

---

## Prompt 2: Organization Management System

### Requirements:
Implement a complete organization management system:

**Features:**
1. **Create Organization** (`/organizations/new`):
   - Organization name (unique slug auto-generated)
   - Ticket prefix (3-4 uppercase letters)
   - Description (optional)
   - Logo upload
   - Automatically set creator as admin

2. **Organization Dashboard** (`/org/[slug]`):
   - Overview statistics (total tickets, active sprints, members)
   - Recent activity feed
   - Quick actions (create ticket, invite member)
   - Organization settings (admin only)

3. **Member Management** (`/org/[slug]/members`):
   - List all members with roles and join dates
   - Invite members via email
   - Bulk invite via CSV upload
   - Change member roles (admin only)
   - Remove members (admin only)
   - Resend invitations
   - Copy invitation link

4. **Invitation System**:
   - Email invitations with secure tokens
   - Invitation expiry (7 days)
   - Accept invitation page (`/invitations/[token]`)
   - Track invitation status
   - Automatic organization access after acceptance

**API Routes Required:**
```
POST   /api/organizations
GET    /api/organizations
GET    /api/organizations/[slug]
PUT    /api/organizations/[slug]
DELETE /api/organizations/[slug]
POST   /api/organizations/[slug]/members/invite
GET    /api/organizations/[slug]/members
PUT    /api/organizations/[slug]/members/[userId]/role
DELETE /api/organizations/[slug]/members/[userId]
POST   /api/invitations/accept
GET    /api/invitations/[token]
```

---

## Prompt 3: Ticket Management Core System

### Requirements:
Build the complete ticket creation and management system:

**Features:**
1. **Create Ticket Modal/Page**:
   - Quick create modal (title + type only)
   - Full create page with all fields
   - Rich text editor for description:
     - Text formatting (bold, italic, underline, strikethrough)
     - Headers (H1-H3)
     - Lists (ordered, unordered, checklist)
     - Code blocks with syntax highlighting
     - Image upload with drag-and-drop
     - Mention users with @
     - Link tickets with #
   - Auto-generate ticket ID (PREFIX-NUMBER)
   - Set all ticket properties (priority, area, assignee, etc.)

2. **Ticket Detail View** (`/org/[slug]/tickets/[ticketId]`):
   - **Header Section:**
     - Ticket ID and title (inline editable)
     - Type badge with icon
     - Status dropdown
     - Action buttons (assign to me, watch, share, more)
   
   - **Main Content:**
     - Description with rich text display
     - Edit mode for description
     - Attachment section with preview
     - Activity timeline
   
   - **Right Sidebar:**
     - Status workflow
     - Assignee selector with avatar
     - Reporter info
     - Priority selector with colors
     - Sprint selector
     - Story points input
     - Due date picker
     - Labels with add/remove
     - Parent epic link
     - Area selector
     - Created/Updated timestamps

3. **Ticket List Views**:
   - **Table View** (`/org/[slug]/tickets`):
     - Sortable columns
     - Inline editable fields
     - Bulk actions toolbar
     - Advanced filters
     - Column customization
     - Export to CSV
   
   - **Board View** (`/org/[slug]/board`):
     - Kanban board by status
     - Drag and drop between columns
     - Swimlanes by assignee/sprint
     - Card preview with key info
     - Quick edit on hover

4. **Epic Management**:
   - Epic roadmap view
   - Child tickets listing
   - Progress tracking
   - Burndown chart

**API Routes Required:**
```
POST   /api/organizations/[slug]/tickets
GET    /api/organizations/[slug]/tickets
GET    /api/organizations/[slug]/tickets/[ticketId]
PUT    /api/organizations/[slug]/tickets/[ticketId]
DELETE /api/organizations/[slug]/tickets/[ticketId]
POST   /api/organizations/[slug]/tickets/[ticketId]/attachments
GET    /api/organizations/[slug]/tickets/[ticketId]/activity
POST   /api/organizations/[slug]/tickets/bulk-update
GET    /api/organizations/[slug]/tickets/export
```

---

## Prompt 4: Sprint Management & Agile Features

### Requirements:
Implement comprehensive sprint management:

**Features:**
1. **Sprint Planning** (`/org/[slug]/sprints`):
   - Create sprint with name, dates, and goal
   - Sprint backlog with drag-and-drop from product backlog
   - Capacity planning based on story points
   - Auto-calculate team velocity
   - Sprint timeline visualization

2. **Active Sprint View** (`/org/[slug]/sprints/active`):
   - Sprint board with swim lanes
   - Burndown/Burnup charts
   - Sprint progress metrics
   - Daily standup helper
   - Sprint health indicators

3. **Sprint Operations**:
   - Start sprint (move to active)
   - Complete sprint with retrospective
   - Move incomplete tickets dialog
   - Sprint reports generation
   - Historical sprint data

4. **Backlog Management** (`/org/[slug]/backlog`):
   - Prioritized list with drag-and-drop
   - Quick filters by assignee
   - Bulk operations
   - Story point estimation
   - Epic grouping view

**API Routes Required:**
```
POST   /api/organizations/[slug]/sprints
GET    /api/organizations/[slug]/sprints
GET    /api/organizations/[slug]/sprints/[sprintId]
PUT    /api/organizations/[slug]/sprints/[sprintId]
POST   /api/organizations/[slug]/sprints/[sprintId]/start
POST   /api/organizations/[slug]/sprints/[sprintId]/complete
POST   /api/organizations/[slug]/sprints/[sprintId]/tickets
DELETE /api/organizations/[slug]/sprints/[sprintId]/tickets/[ticketId]
GET    /api/organizations/[slug]/sprints/[sprintId]/metrics
```

---

## Prompt 5: Comments, Mentions & Collaboration

### Requirements:
Build real-time collaboration features:

**Features:**
1. **Comment System**:
   - Rich text editor matching ticket description
   - @ mentions with autocomplete
   - Edit/delete own comments
   - Comment threading
   - Reactions (👍 👎 ❤️ 🎉)
   - Pin important comments

2. **Mention System**:
   - User search while typing @
   - Notification on mention
   - Highlight mentions in text
   - Click to view user profile

3. **Real-time Updates**:
   - WebSocket connection for live updates
   - Show when others are viewing/editing
   - Real-time comment updates
   - Live ticket status changes
   - Presence indicators

4. **Notifications** (`/notifications`):
   - In-app notification center
   - Email notifications (configurable)
   - Push notifications (optional)
   - Mark as read/unread
   - Notification preferences

**API Routes Required:**
```
POST   /api/organizations/[slug]/tickets/[ticketId]/comments
GET    /api/organizations/[slug]/tickets/[ticketId]/comments
PUT    /api/organizations/[slug]/comments/[commentId]
DELETE /api/organizations/[slug]/comments/[commentId]
POST   /api/organizations/[slug]/comments/[commentId]/reactions
GET    /api/users/search?q=[query]
GET    /api/notifications
PUT    /api/notifications/[id]/read
POST   /api/notifications/mark-all-read
```

---

## Prompt 6: Search, Filters & Analytics

### Requirements:
Implement advanced search and analytics:

**Features:**
1. **Global Search** (Cmd/Ctrl + K):
   - Instant search across tickets, comments, users
   - Search syntax support (status:open assignee:me)
   - Recent searches
   - Search filters
   - Keyboard navigation

2. **Advanced Filters**:
   - Save custom filters
   - Share filters with team
   - Complex query builder
   - JQL-like syntax support

3. **Dashboard & Analytics** (`/org/[slug]/analytics`):
   - Velocity charts
   - Burn down/up charts
   - Cycle time metrics
   - Team performance
   - Custom report builder
   - Export reports as PDF

4. **Personal Dashboard** (`/dashboard`):
   - My assigned tickets
   - Watched tickets
   - Recent activity
   - Upcoming due dates
   - Personal productivity metrics

**API Routes Required:**
```
GET    /api/search?q=[query]
POST   /api/organizations/[slug]/filters
GET    /api/organizations/[slug]/filters
GET    /api/organizations/[slug]/analytics/velocity
GET    /api/organizations/[slug]/analytics/burndown
GET    /api/organizations/[slug]/analytics/cycle-time
GET    /api/dashboard/assigned
GET    /api/dashboard/activity
```

---

## Prompt 7: UI/UX Requirements

### Design Requirements:
1. **Theme System**:
   - Light/dark mode toggle
   - System preference detection
   - Custom theme colors per organization
   - Accessible color contrasts

2. **Responsive Design**:
   - Mobile-first approach
   - Touch-friendly interfaces
   - Responsive tables → cards on mobile
   - Mobile app-like navigation

3. **Keyboard Shortcuts**:
   - `c` - Create ticket
   - `/` - Focus search
   - `g + b` - Go to board
   - `g + t` - Go to tickets
   - `?` - Show shortcuts modal

4. **Performance**:
   - Optimistic UI updates
   - Skeleton loaders
   - Infinite scroll for lists
   - Image lazy loading
   - Code splitting by route

5. **Accessibility**:
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader support
   - Focus management
   - High contrast mode

---

## Prompt 8: Additional Features

### Extra Features to Implement:
1. **Time Tracking**:
   - Log work on tickets
   - Time estimates vs actual
   - Timesheet reports

2. **Integrations**:
   - GitHub/GitLab integration
   - Slack notifications
   - Google Calendar sync
   - Webhook system

3. **Automation**:
   - Auto-assign based on rules
   - Status transition triggers
   - Scheduled reports
   - SLA tracking

4. **Mobile App Considerations**:
   - PWA configuration
   - Push notifications
   - Offline support with sync
   - Native app-like feel

---

## Technical Implementation Notes

### State Management:
- Use Zustand for global state (current org, user)
- TanStack Query for server state
- Local state for UI components

### Database Optimization:
- Implement pagination on all list endpoints
- Use database indexes effectively
- Implement caching strategy
- Use database transactions for complex operations

### Security Best Practices:
- Input validation on all endpoints
- Rate limiting on public endpoints
- SQL injection prevention with Prisma
- XSS prevention in rich text
- CORS configuration

### Testing Requirements:
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows
- Performance testing

### Deployment Configuration:
- Environment variables setup
- Database migrations strategy
- CI/CD pipeline
- Monitoring and logging
- Error tracking (Sentry)

---

## Development Sequence
1. Setup project with authentication
2. Organization management
3. Basic ticket CRUD
4. Sprint functionality
5. Comments and collaboration
6. Search and filters
7. Analytics and reporting
8. Performance optimization
9. Mobile responsiveness
10. Additional features