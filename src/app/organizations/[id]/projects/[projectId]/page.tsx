"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Target, 
  Users, 
  Calendar, 
  CheckCircle,
  Plus,
  Settings,
  User,
  Crown,
  Shield,
  MoreVertical,
  Ticket,
  BarChart3,
  Clock
} from "lucide-react";
import Link from "next/link";
import { usePermissions, PermissionGate } from "@/hooks/use-permissions";
import ProjectLayout from "@/components/layout/project-layout";

interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
    ticketPrefix: string;
  };
  lead?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  members: Array<{
    id: string;
    role: "LEAD" | "MEMBER";
    joinedAt: string;
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
  userRole?: "LEAD" | "MEMBER" | null;
  isUserMember: boolean;
}

interface Organization {
  id: string;
  name: string;
  userRole: "ADMIN" | "MEMBER";
  owner: {
    id: string;
  };
}

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const organizationId = params.id as string;
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { hasPermission } = usePermissions(organization);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    fetchOrganization();
    fetchProject();
  }, [session, organizationId, projectId]);

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

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects/${projectId}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError("You don't have access to this project");
        } else if (response.status === 404) {
          setError("Project not found");
        } else {
          setError("Failed to load project");
        }
        return;
      }

      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => router.push(`/organizations/${organizationId}/projects`)} className="bg-blue-600 hover:bg-blue-700">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const isProjectLead = project.userRole === "LEAD";

  return (
    <ProjectLayout>
      <div className="p-6">
        {/* Project Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-mono text-gray-400 bg-gray-800 px-2 py-1 rounded">
                  {project.key}
                </span>
                <span className="text-gray-400 text-sm">{project._count.members} members</span>
                {project.lead && (
                  <>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center space-x-1">
                      <Crown className="h-3 w-3 text-yellow-400" />
                      <span className="text-gray-400 text-sm">{project.lead.name}</span>
                    </div>
                  </>
                )}
              </div>
              {project.description && (
                <p className="text-gray-300">{project.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <PermissionGate organization={organization} permission="canCreateTickets">
                <Button
                  onClick={() => router.push(`/organizations/${organizationId}/projects/${projectId}/tickets/new`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Button>
              </PermissionGate>
            </div>
          </div>
        </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Tickets</p>
              <p className="text-white text-2xl font-semibold">{project._count.tickets}</p>
            </div>
            <Ticket className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Sprints</p>
              <p className="text-white text-2xl font-semibold">{project._count.sprints}</p>
            </div>
            <Calendar className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Team Members</p>
              <p className="text-white text-2xl font-semibold">{project._count.members}</p>
            </div>
            <Users className="h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completion</p>
              <p className="text-white text-2xl font-semibold">0%</p>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h4 className="text-white font-medium mb-2">No recent activity</h4>
              <p className="text-gray-400 text-sm">Activity will appear here as your team works on tickets</p>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Team Members</CardTitle>
              {isProjectLead && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => router.push(`/organizations/${organizationId}/projects/${projectId}/team`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {project.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-300" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-white font-medium text-sm">{member.user.name}</h4>
                        {member.role === "LEAD" && (
                          <Crown className="h-3 w-3 text-yellow-400" />
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">
                      {member.role === "LEAD" ? "Lead" : "Member"}
                    </span>
                    {isProjectLead && member.user.id !== session?.user?.id && (
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-700">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </ProjectLayout>
  );
}
