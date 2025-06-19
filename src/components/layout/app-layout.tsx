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
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <Sidebar
        currentOrganizationId={effectiveOrgId}
        currentProjectId={currentProjectId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Jira-style compact top header */}
        <header className="bg-gray-900 border-b border-gray-700 h-12 flex items-center justify-end px-4">
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800 relative h-8 w-8 p-0">
              <Bell className="h-3 w-3" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0">
              <Settings className="h-3 w-3" />
            </Button>

            {/* User Menu - Compact */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-gray-300" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-white">{session.user?.name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-gray-400 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}
