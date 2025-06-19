"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Target, 
  Users, 
  Calendar, 
  CheckCircle,
  User,
  Crown,
  MoreVertical,
  Archive
} from "lucide-react";
import Link from "next/link";
import { usePermissions, PermissionGate } from "@/hooks/use-permissions";

interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lead?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  members: Array<{
    id: string;
    role: "LEAD" | "MEMBER";
    user: {
      id: string;
      name: string;
      email: string;
      avatarUrl?: string;
    };
  }>;
  _count: {
    tickets: number;
    sprints: number;
    members: number;
  };
}

interface Organization {
  id: string;
  name: string;
  userRole: "ADMIN" | "MEMBER";
  owner: {
    id: string;
  };
}

export default function ProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const organizationId = params.id as string;
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { hasPermission } = usePermissions(organization);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    fetchOrganization();
    fetchProjects();
  }, [session, organizationId, showInactive]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization(data);
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const url = new URL(`/api/organizations/${organizationId}/projects`, window.location.origin);
      if (showInactive) {
        url.searchParams.set("includeInactive", "true");
      }
      
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProjects = filteredProjects.filter(p => p.isActive);
  const inactiveProjects = filteredProjects.filter(p => !p.isActive);

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
            <p className="text-gray-400">Manage and organize your team's projects.</p>
          </div>
          <PermissionGate organization={organization} permission="canCreateProjects">
            <Button 
              onClick={() => router.push(`/organizations/${organizationId}/projects/new`)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </PermissionGate>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className={showInactive ? "bg-gray-700 text-white" : "border-gray-700 text-gray-300 hover:bg-gray-800"}
          >
            <Archive className="h-4 w-4 mr-2" />
            {showInactive ? "Hide Archived" : "Show Archived"}
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {activeProjects.length === 0 && inactiveProjects.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-12 text-center">
            <Target className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first project to start organizing your team's work.
            </p>
            <PermissionGate organization={organization} permission="canCreateProjects">
              <Button 
                onClick={() => router.push(`/organizations/${organizationId}/projects/new`)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Active Projects */}
          {activeProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Active Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeProjects.map((project) => (
                  <Card key={project.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white text-lg mb-1">
                            <Link 
                              href={`/organizations/${organizationId}/projects/${project.id}`}
                              className="hover:text-blue-400 transition-colors"
                            >
                              {project.name}
                            </Link>
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                              {project.key}
                            </span>
                            {project.lead && (
                              <div className="flex items-center space-x-1">
                                <Crown className="h-3 w-3 text-yellow-400" />
                                <span className="text-xs text-gray-400">{project.lead.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
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
                            <CheckCircle className="h-4 w-4 text-gray-500" />
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
            </div>
          )}

          {/* Inactive Projects */}
          {showInactive && inactiveProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Archived Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inactiveProjects.map((project) => (
                  <Card key={project.id} className="bg-gray-900 border-gray-800 opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white text-lg mb-1">
                            <Link 
                              href={`/organizations/${organizationId}/projects/${project.id}`}
                              className="hover:text-blue-400 transition-colors"
                            >
                              {project.name}
                            </Link>
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                              {project.key}
                            </span>
                            <span className="text-xs text-orange-400 bg-orange-900/20 px-2 py-1 rounded">
                              Archived
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
