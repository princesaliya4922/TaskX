"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProjectNavigation from "@/components/project/project-navigation";

interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  organization: {
    id: string;
    name: string;
  };
}

interface ProjectLayoutProps {
  children: React.ReactNode;
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const organizationId = params.id as string;
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (organizationId && projectId) {
      fetchProject();
    }
  }, [organizationId, projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
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

  if (!project) {
    return (
      <div className="p-6">
        <div className="text-white">Project not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project Navigation */}
      <ProjectNavigation
        organizationId={organizationId}
        projectId={projectId}
        projectName={project.name}
      />
      
      {/* Project Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
