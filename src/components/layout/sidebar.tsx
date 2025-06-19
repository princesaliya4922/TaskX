"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import OrganizationSwitcher from "@/components/organization/organization-switcher";
import {
  Home,
  Users,
  Ticket,
  Calendar,
  BarChart3,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Building2,
  Zap,
  Target,
  ChevronDown,
  ChevronUp,
  FolderOpen
} from "lucide-react";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
}

interface SidebarProps {
  currentOrganizationId?: string;
  currentProjectId?: string;
}

export default function Sidebar({ currentOrganizationId, currentProjectId }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsExpanded, setProjectsExpanded] = useState(false);

  // Handle organization change from switcher
  const handleOrganizationChange = (organizationId: string) => {
    // Navigate to dashboard with new organization context
    router.push(`/dashboard?org=${organizationId}`);
  };

  // Fetch projects when organization changes
  useEffect(() => {
    if (currentOrganizationId) {
      fetchProjects();
    } else {
      setProjects([]);
    }
  }, [currentOrganizationId]);

  // Auto-expand projects if we're in a project context
  useEffect(() => {
    if (currentProjectId) {
      setProjectsExpanded(true);
    }
  }, [currentProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/organizations/${currentOrganizationId}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data.filter((p: Project) => p.isActive));
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const navigationItems = [
    {
      name: "Dashboard",
      href: currentOrganizationId ? `/dashboard?org=${currentOrganizationId}` : "/dashboard",
      icon: Home,
      active: pathname === "/dashboard",
    },
    {
      name: "Tickets",
      href: currentOrganizationId ? `/organizations/${currentOrganizationId}/tickets` : "#",
      icon: Ticket,
      active: pathname.includes("/tickets") && !pathname.includes("/projects/"),
      disabled: !currentOrganizationId,
    },
    {
      name: "Sprints",
      href: currentOrganizationId ? `/organizations/${currentOrganizationId}/sprints` : "#",
      icon: Calendar,
      active: pathname.includes("/sprints") && !pathname.includes("/projects/"),
      disabled: !currentOrganizationId,
    },
    {
      name: "Team",
      href: currentOrganizationId ? `/organizations/${currentOrganizationId}` : "#",
      icon: Users,
      active: pathname === `/organizations/${currentOrganizationId}`,
      disabled: !currentOrganizationId,
    },
    {
      name: "Reports",
      href: currentOrganizationId ? `/organizations/${currentOrganizationId}/reports` : "#",
      icon: BarChart3,
      active: pathname.includes("/reports"),
      disabled: !currentOrganizationId,
    },
  ];

  // Quick actions only shown when NOT in project context
  const quickActions = currentProjectId ? [] : [
    {
      name: "New Project",
      href: currentOrganizationId ? `/organizations/${currentOrganizationId}/projects/new` : "#",
      icon: Plus,
      disabled: !currentOrganizationId,
    },
  ];

  return (
    <div className={`flex flex-col transition-all duration-300 ${
      isCollapsed ? "w-16" : "w-64"
    }`} style={{ backgroundColor: '#161618', borderRight: '1px solid #2c2c34' }}>
      {/* Header - Compact */}
      <div className="p-3" style={{ borderBottom: '1px solid #2c2c34' }}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ backgroundColor: '#579dff' }}>
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 className="text-sm font-semibold" style={{ color: '#b6c2cf' }}>SprintX</h1>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0"
            style={{ color: '#8993a4' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#22222a'; e.currentTarget.style.color = '#b6c2cf'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8993a4'; }}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Organization Switcher */}
      <div className="p-3" style={{ borderBottom: '1px solid #2c2c34' }}>
        {!isCollapsed ? (
          <OrganizationSwitcher
            currentOrganizationId={currentOrganizationId}
            onOrganizationChange={handleOrganizationChange}
          />
        ) : (
          <div className="flex justify-center">
            <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ backgroundColor: '#579dff' }}>
              <Building2 className="h-3 w-3 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Project Context */}
      {currentProjectId && !isCollapsed && (
        <div className="p-3" style={{ borderBottom: '1px solid #2c2c34' }}>
          <div className="flex items-center space-x-2 text-xs">
            <Target className="h-3 w-3" style={{ color: '#579dff' }} />
            <span style={{ color: '#8993a4' }}>Project:</span>
            <span className="font-medium" style={{ color: '#b6c2cf' }}>Current Project</span>
          </div>
        </div>
      )}

      {/* Navigation - Compact */}
      <nav className="flex-1 p-3">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.disabled ? "#" : item.href}
                className={`flex items-center space-x-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                  item.active
                    ? "text-white"
                    : item.disabled
                    ? "cursor-not-allowed"
                    : ""
                }`}
                style={{
                  backgroundColor: item.active ? '#579dff' : 'transparent',
                  color: item.active ? '#ffffff' : item.disabled ? '#6b778c' : '#8993a4'
                }}
                onMouseEnter={(e) => {
                  if (!item.active && !item.disabled) {
                    e.currentTarget.style.backgroundColor = '#22222a';
                    e.currentTarget.style.color = '#b6c2cf';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!item.active && !item.disabled) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#8993a4';
                  }
                }}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault();
                  }
                }}
              >
                <Icon className="h-3 w-3" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Projects Section */}
          {currentOrganizationId && !isCollapsed && (
            <div className="mt-4">
              <button
                onClick={() => setProjectsExpanded(!projectsExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: '#8993a4' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#22222a'; e.currentTarget.style.color = '#b6c2cf'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8993a4'; }}
              >
                <div className="flex items-center space-x-3">
                  <Target className="h-4 w-4" />
                  <span>Projects</span>
                </div>
                {projectsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {projectsExpanded && (
                <div className="mt-2 ml-6 space-y-1">
                  <Link
                    href={`/organizations/${currentOrganizationId}/projects`}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      backgroundColor: pathname === `/organizations/${currentOrganizationId}/projects` ? '#579dff' : 'transparent',
                      color: pathname === `/organizations/${currentOrganizationId}/projects` ? '#ffffff' : '#8993a4'
                    }}
                    onMouseEnter={(e) => {
                      if (pathname !== `/organizations/${currentOrganizationId}/projects`) {
                        e.currentTarget.style.backgroundColor = '#22222a';
                        e.currentTarget.style.color = '#b6c2cf';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (pathname !== `/organizations/${currentOrganizationId}/projects`) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#8993a4';
                      }
                    }}
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>All Projects</span>
                  </Link>

                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/organizations/${currentOrganizationId}/projects/${project.id}`}
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors"
                      style={{
                        backgroundColor: currentProjectId === project.id ? '#579dff' : 'transparent',
                        color: currentProjectId === project.id ? '#ffffff' : '#8993a4'
                      }}
                      onMouseEnter={(e) => {
                        if (currentProjectId !== project.id) {
                          e.currentTarget.style.backgroundColor = '#22222a';
                          e.currentTarget.style.color = '#b6c2cf';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentProjectId !== project.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#8993a4';
                        }
                      }}
                    >
                      <div className="w-4 h-4 rounded-sm flex items-center justify-center" style={{ backgroundColor: '#2c2c34' }}>
                        <span className="text-xs font-mono text-white">
                          {project.key.charAt(0)}
                        </span>
                      </div>
                      <span className="truncate">{project.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {!isCollapsed && quickActions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#6b778c' }}>
              Quick Actions
            </h3>
            <div className="space-y-1">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.name}
                    href={action.disabled ? "#" : action.href}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      color: action.disabled ? '#6b778c' : '#8993a4',
                      cursor: action.disabled ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      if (!action.disabled) {
                        e.currentTarget.style.backgroundColor = '#22222a';
                        e.currentTarget.style.color = '#b6c2cf';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!action.disabled) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#8993a4';
                      }
                    }}
                    onClick={(e) => {
                      if (action.disabled) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{action.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Settings */}
      <div className="p-4" style={{ borderTop: '1px solid #2c2c34' }}>
        <Link
          href="/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ color: '#8993a4' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#22222a'; e.currentTarget.style.color = '#b6c2cf'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8993a4'; }}
        >
          <Settings className="h-4 w-4" />
          {!isCollapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  );
}
