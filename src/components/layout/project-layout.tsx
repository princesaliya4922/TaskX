"use client";

import { useEffect, useState, useMemo, createContext, useContext } from "react";
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

// Project context to share project data with child components
interface ProjectContextType {
  project: Project | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectLayout');
  }
  return context;
};

// Simple cache to prevent re-fetching the same project data
const projectCache = new Map<string, { data: Project; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function ProjectLayout({ children }: ProjectLayoutProps) {
  const params = useParams();
  const organizationId = params.id as string;
  const projectId = params.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a stable cache key
  const cacheKey = useMemo(() =>
    `${organizationId}-${projectId}`,
    [organizationId, projectId]
  );

  useEffect(() => {
    if (organizationId && projectId) {
      fetchProject();
    }
  }, [organizationId, projectId]);

  // Memoize the navigation component to prevent unnecessary re-renders
  // This must be called before any conditional returns to follow Rules of Hooks
  const navigationComponent = useMemo(() => (
    <ProjectNavigation
      organizationId={organizationId}
      projectId={projectId}
      projectName={project?.name || ''}
    />
  ), [organizationId, projectId, project?.name]);

  const fetchProject = async () => {
    // Check cache first
    const cached = projectCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setProject(cached.data);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
        setError(null);

        // Cache the result
        projectCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      } else {
        const errorMessage = response.status === 404 ? 'Project not found' : 'Failed to load project';
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setError('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Create refetch function for context
  const refetch = () => {
    setLoading(true);
    setError(null);
    // Clear cache for this project
    projectCache.delete(cacheKey);
    fetchProject();
  };

  // Create context value
  const contextValue = useMemo(() => ({
    project,
    loading,
    error,
    refetch
  }), [project, loading, error]);

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
        <div className="text-white">{error || 'Project not found'}</div>
      </div>
    );
  }

  return (
    <ProjectContext.Provider value={contextValue}>
      <div className="flex flex-col h-full">
        {/* Project Navigation */}
        {navigationComponent}

        {/* Project Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </ProjectContext.Provider>
  );
}
