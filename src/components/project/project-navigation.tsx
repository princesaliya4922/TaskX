"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard,
  List,
  Kanban,
  Calendar,
  Users,
  Settings,
  BarChart3
} from "lucide-react";

interface ProjectNavigationProps {
  organizationId: string;
  projectId: string;
  projectName: string;
}

export default function ProjectNavigation({ 
  organizationId, 
  projectId, 
  projectName 
}: ProjectNavigationProps) {
  const pathname = usePathname();

  const navigationTabs = [
    {
      name: "Backlog",
      href: `/organizations/${organizationId}/projects/${projectId}/backlog`,
      icon: List,
      active: pathname.includes("/backlog"),
    },
    {
      name: "List",
      href: `/organizations/${organizationId}/projects/${projectId}/list`,
      icon: List,
      active: pathname.includes("/list"),
    },
    {
      name: "Board",
      href: `/organizations/${organizationId}/projects/${projectId}/board`,
      icon: Kanban,
      active: pathname.includes("/board"),
    },
    {
      name: "Dashboard",
      href: `/organizations/${organizationId}/projects/${projectId}`,
      icon: LayoutDashboard,
      active: pathname === `/organizations/${organizationId}/projects/${projectId}`,
    },
    {
      name: "Sprints",
      href: `/organizations/${organizationId}/projects/${projectId}/sprints`,
      icon: Calendar,
      active: pathname.includes("/sprints"),
    },
    {
      name: "Team",
      href: `/organizations/${organizationId}/projects/${projectId}/team`,
      icon: Users,
      active: pathname.includes("/team"),
    },
    {
      name: "Reports",
      href: `/organizations/${organizationId}/projects/${projectId}/reports`,
      icon: BarChart3,
      active: pathname.includes("/reports"),
    },
    {
      name: "Settings",
      href: `/organizations/${organizationId}/projects/${projectId}/settings`,
      icon: Settings,
      active: pathname.includes("/settings"),
    },
  ];

  return (
    <div className="bg-gray-900 border-b border-gray-700">
      <div className="px-4 py-1">
        {/* Jira-style compact navigation tabs */}
        <nav className="flex space-x-0">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${
                  tab.active
                    ? "border-blue-500 text-blue-400 bg-gray-800"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
