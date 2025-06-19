# SprintX - Task Management Platform

A comprehensive task management platform similar to Jira, built with modern technologies including Next.js 15, TypeScript, Prisma, and PostgreSQL.

## 🚀 Features

- **Multi-tenant Organization Management** - Create and manage multiple organizations
- **Advanced Task Management** - Create, assign, and track tasks with rich descriptions
- **Sprint Planning & Agile Tools** - Plan sprints, manage backlogs, and track velocity
- **Real-time Collaboration** - Comments, mentions, and live updates
- **Kanban Board** - Drag-and-drop task management
- **Analytics & Reporting** - Burndown charts, velocity tracking, and insights
- **Modern UI/UX** - Dark/light theme, responsive design, accessibility

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **Shadcn/ui** - Beautiful component library
- **Lucide React** - Icon library

### Backend & Database
- **Prisma ORM** - Type-safe database client
- **PostgreSQL** - Robust relational database
- **NextAuth.js** - Authentication solution

### State Management & Data Fetching
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### Additional Tools
- **DnD Kit** - Drag and drop functionality
- **Recharts** - Data visualization
- **Date-fns** - Date manipulation
- **Bcrypt** - Password hashing

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** database

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd sprintx
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables

Copy the example environment file and update the values:

```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sprintx_db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 4. Set up the database

#### Option A: Quick Setup (Recommended for development)
```bash
# Run the automated setup script
./scripts/db-setup.sh
```

#### Option B: Manual Setup
```bash
# Generate Prisma client
npm run db:generate

# Push the schema to your database
npm run db:push

# Seed the database with demo data
npm run db:seed

# Or run migrations (for production)
npm run db:migrate
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 6. Verify the setup

Test the database connection and API:

```bash
# Check API health
curl http://localhost:3000/api/health

# Test database connection
curl http://localhost:3000/api/test

# Open Prisma Studio (optional)
npm run db:studio
```

## 📝 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run type-check` - Run TypeScript type checking

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/                   # Utility libraries
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Database migrations
```

## 🗄️ Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users** - User accounts and authentication
- **Organizations** - Multi-tenant organization management
- **Tickets** - Tasks, bugs, stories, and epics
- **Sprints** - Agile sprint management
- **Comments** - Ticket discussions and mentions
- **Labels** - Ticket categorization
- **Attachments** - File uploads
- **Activities** - Audit trail and activity tracking
- **Notifications** - User notifications

### Demo Data

The database comes pre-seeded with demo data for testing:

- **3 Demo Users**: Admin (john@example.com), Members (jane@example.com, mike@example.com)
- **1 Demo Organization**: "Demo Company" with ticket prefix "DEMO"
- **3 Demo Labels**: bug (red), feature (blue), urgent (orange)
- **1 Active Sprint**: "Sprint 1 - Initial Setup"

**Login Credentials**: All demo users use password `password123`

## 🔐 Authentication

The application supports multiple authentication methods:

- **Email/Password** - Traditional authentication
- **OAuth Providers** - Google, GitHub (configurable)
- **Session Management** - Secure JWT-based sessions

## 🎨 UI/UX Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Theme** - Automatic system preference detection
- **Accessibility** - WCAG compliant with keyboard navigation
- **Modern Design** - Clean, professional interface inspired by Jira

## 📊 Development Roadmap

- [x] Project setup and foundation
- [ ] Database setup and configuration
- [ ] Authentication system
- [ ] Organization management
- [ ] Ticket management
- [ ] Sprint planning
- [ ] Real-time collaboration
- [ ] Analytics and reporting
- [ ] Mobile optimization
- [ ] Performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Prisma](https://prisma.io/) - Database toolkit
- [Radix UI](https://radix-ui.com/) - UI components
- [Shadcn/ui](https://ui.shadcn.com/) - Component library
