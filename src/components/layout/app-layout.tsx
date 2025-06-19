"use client";

import { useSession } from "next-auth/react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import Sidebar from "./sidebar";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Settings,
  LogOut,
  User
} from "lucide-react";
import { signOut } from "next-auth/react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  const params = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract organization ID and project ID from URL if present
  const currentOrganizationId = params?.id as string ||
    (pathname?.startsWith("/organizations/") && pathname !== "/organizations/new"
      ? pathname.split("/")[2]
      : undefined);

  const currentProjectId = params?.projectId as string ||
    (pathname?.includes("/projects/") && !pathname?.includes("/projects/new")
      ? pathname.split("/projects/")[1]?.split("/")[0]
      : undefined);

  // Check if we're on dashboard with org parameter
  const dashboardOrgId = pathname === "/dashboard"
    ? searchParams.get("org")
    : undefined;

  const effectiveOrgId = currentOrganizationId || dashboardOrgId;

  // Don't show sidebar on auth pages and organization creation page
  const isAuthPage = pathname?.startsWith("/auth") || pathname === "/" || pathname === "/organizations/new";

  if (isAuthPage || !session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0c0c0c' }}>
      {/* Sidebar */}
      <Sidebar
        currentOrganizationId={effectiveOrgId}
        currentProjectId={currentProjectId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Jira-style compact top header */}
        <header className="h-12 flex items-center justify-end px-4" style={{ backgroundColor: '#161618', borderBottom: '1px solid #2c2c34' }}>
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative h-8 w-8 p-0" style={{ color: '#8993a4' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#22222a'; e.currentTarget.style.color = '#b6c2cf'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8993a4'; }}>
              <Bell className="h-3 w-3" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" style={{ color: '#8993a4' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#22222a'; e.currentTarget.style.color = '#b6c2cf'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8993a4'; }}>
              <Settings className="h-3 w-3" />
            </Button>

            {/* User Menu - Compact */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2c2c34' }}>
                <User className="h-3 w-3" style={{ color: '#8993a4' }} />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium" style={{ color: '#b6c2cf' }}>{session.user?.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="h-8 w-8 p-0"
                style={{ color: '#8993a4' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#22222a'; e.currentTarget.style.color = '#b6c2cf'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8993a4'; }}
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto" style={{ backgroundColor: '#0c0c0c' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
