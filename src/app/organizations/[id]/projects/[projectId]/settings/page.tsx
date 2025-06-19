"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Users, 
  Archive,
  Save,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { usePermissions, PermissionGate } from "@/hooks/use-permissions";

interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  isActive: boolean;
  organization: {
    id: string;
    name: string;
  };
  lead?: {
    id: string;
    name: string;
    email: string;
  };
  userRole?: "LEAD" | "MEMBER" | null;
}

interface Organization {
  id: string;
  name: string;
  userRole: "ADMIN" | "MEMBER";
  owner: {
    id: string;
  };
}

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const organizationId = params.id as string;
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

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
        setError("Failed to load project");
        return;
      }

      const data = await response.json();
      setProject(data);
      setFormData({
        name: data.name,
        description: data.description || "",
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update project");
      }

      const updatedProject = await response.json();
      setProject(updatedProject);
      // Show success message or redirect
    } catch (error) {
      console.error("Error updating project:", error);
      setError(error instanceof Error ? error.message : "Failed to update project");
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!project || !confirm("Are you sure you want to archive this project?")) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) {
        throw new Error("Failed to archive project");
      }

      router.push(`/organizations/${organizationId}/projects`);
    } catch (error) {
      console.error("Error archiving project:", error);
      setError("Failed to archive project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Loading project settings...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isProjectLead = project.userRole === "LEAD";
  const canManageProject = isProjectLead || hasPermission("canManageProjects");

  if (!canManageProject) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don't have permission to manage this project.</p>
          <Button onClick={() => router.back()} className="bg-blue-600 hover:bg-blue-700">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            href={`/organizations/${organizationId}/projects/${projectId}`} 
            className="flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Project
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">{project.name} Settings</h1>
            <p className="text-gray-400">Manage project configuration and settings</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">General Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Basic project information and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Project Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Project Key
                </label>
                <Input
                  value={project.key}
                  disabled
                  className="bg-gray-800 border-gray-700 text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Project key cannot be changed after creation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white resize-none"
                  rows={3}
                  placeholder="Enter project description"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-gray-900 border-red-800">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-gray-400">
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Archive Project</h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Archive this project to hide it from active projects. You can restore it later.
                  </p>
                  <Button
                    onClick={handleArchive}
                    disabled={saving}
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Project
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="text-white ml-2">
                  {new Date(project.organization.id).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Organization:</span>
                <span className="text-white ml-2">{project.organization.name}</span>
              </div>
              {project.lead && (
                <div>
                  <span className="text-gray-400">Project Lead:</span>
                  <span className="text-white ml-2">{project.lead.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:bg-gray-800"
                onClick={() => router.push(`/organizations/${organizationId}/projects/${projectId}`)}
              >
                View Project Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:bg-gray-800"
                onClick={() => router.push(`/organizations/${organizationId}/projects/${projectId}/team`)}
              >
                Manage Members
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
