"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  Target,
  Calendar,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingUp,
  FolderOpen
} from "lucide-react";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  description?: string;
  ticketPrefix: string;
  userRole: "ADMIN" | "MEMBER";
  _count: {
    members: number;
    tickets: number;
    sprints: number;
  };
}

interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  isActive: boolean;
  _count: {
    tickets: number;
    sprints: number;
    members: number;
  };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Get organization from URL params or default to first org
  const orgId = searchParams.get('org');

  useEffect(() => {
    if (!session?.user?.id) return;

    fetchOrganizations();
  }, [session]);

  useEffect(() => {
    if (organizations.length > 0) {
      const targetOrg = orgId
        ? organizations.find(org => org.id === orgId)
        : organizations[0];

      if (targetOrg) {
        setSelectedOrg(targetOrg);
        fetchProjects(targetOrg.id);

        // If no org parameter in URL, redirect to include the first organization
        if (!orgId) {
          router.replace(`/dashboard?org=${targetOrg.id}`);
        }
      }
    }
  }, [organizations, orgId, router]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleOrgSwitch = (org: Organization) => {
    setSelectedOrg(org);
    fetchProjects(org.id);
    // Update URL without page reload
    router.push(`/dashboard?org=${org.id}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  // Show organization selector if no org selected or multiple orgs
  if (!selectedOrg || organizations.length === 0) {
    return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {session?.user?.name}!
          </h1>
          <p className="text-gray-400">
            Select an organization to view its dashboard.
          </p>
        </div>

        {organizations.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <Building2 className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No organizations yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first organization to start managing projects and teams.
              </p>
              <Link href="/organizations/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Organization
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer"
                onClick={() => handleOrgSwitch(org)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">
                        {org.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                          {org.ticketPrefix}
                        </span>
                        <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                          {org.userRole}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-500" />
                  </div>
                  {org.description && (
                    <CardDescription className="text-gray-400 line-clamp-2">
                      {org.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-lg font-semibold text-white">{org._count.members}</div>
                      <div className="text-xs text-gray-400">Members</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Target className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-lg font-semibold text-white">{org._count.tickets}</div>
                      <div className="text-xs text-gray-400">Tickets</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-lg font-semibold text-white">{org._count.sprints}</div>
                      <div className="text-xs text-gray-400">Sprints</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Organization-specific dashboard
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {selectedOrg.name} Dashboard
            </h1>
            <p className="text-gray-400">
              Overview of projects, tickets, and team activity for {selectedOrg.name}.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-mono text-gray-400 bg-gray-800 px-3 py-2 rounded">
              {selectedOrg.ticketPrefix}
            </span>
            <Link href={`/organizations/${selectedOrg.id}/projects/new`}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Projects</p>
              <p className="text-white text-2xl font-semibold">{projects.length}</p>
            </div>
            <FolderOpen className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Team Members</p>
              <p className="text-white text-2xl font-semibold">{selectedOrg._count.members}</p>
            </div>
            <Users className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Tickets</p>
              <p className="text-white text-2xl font-semibold">{selectedOrg._count.tickets}</p>
            </div>
            <Target className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Sprints</p>
              <p className="text-white text-2xl font-semibold">{selectedOrg._count.sprints}</p>
            </div>
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Projects Overview */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Projects</h2>
          <Link href={`/organizations/${selectedOrg.id}/projects`}>
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              View All Projects
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <FolderOpen className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-gray-400 mb-6">
                Create your first project to start organizing work and tracking progress.
              </p>
              <Link href={`/organizations/${selectedOrg.id}/projects/new`}>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project) => (
              <Card key={project.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-1">
                        <Link
                          href={`/organizations/${selectedOrg.id}/projects/${project.id}`}
                          className="hover:text-blue-400 transition-colors"
                        >
                          {project.name}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                          {project.key}
                        </span>
                        {project.isActive && (
                          <span className="text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-500" />
                  </div>
                  {project.description && (
                    <CardDescription className="text-gray-400 line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Target className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-lg font-semibold text-white">{project._count.tickets}</div>
                      <div className="text-xs text-gray-400">Tickets</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Calendar className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-lg font-semibold text-white">{project._count.sprints}</div>
                      <div className="text-xs text-gray-400">Sprints</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center mb-1">
                        <Users className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="text-lg font-semibold text-white">{project._count.members}</div>
                      <div className="text-xs text-gray-400">Members</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription className="text-gray-400">
            Latest updates in {selectedOrg.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h4 className="text-white font-medium mb-2">No recent activity</h4>
            <p className="text-gray-400 text-sm">Activity will appear here as your team works on projects</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
