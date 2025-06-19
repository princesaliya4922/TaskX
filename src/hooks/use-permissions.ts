import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export type MemberRole = "ADMIN" | "MEMBER";

export interface Permission {
  // Organization permissions
  canManageOrganization: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canChangeRoles: boolean;
  canDeleteOrganization: boolean;
  
  // Project permissions
  canCreateProjects: boolean;
  canDeleteProjects: boolean;
  canManageProjects: boolean;
  
  // Ticket permissions
  canCreateTickets: boolean;
  canEditAllTickets: boolean;
  canDeleteTickets: boolean;
  canAssignTickets: boolean;
  
  // Sprint permissions
  canCreateSprints: boolean;
  canManageSprints: boolean;
  canStartSprints: boolean;
  canCompleteSprints: boolean;
  
  // Label permissions
  canCreateLabels: boolean;
  canManageLabels: boolean;
}

/**
 * Get permissions for a user role (client-side version)
 */
export function getPermissions(role: MemberRole, isOwner: boolean = false): Permission {
  const basePermissions: Permission = {
    // Organization permissions
    canManageOrganization: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    canDeleteOrganization: false,
    
    // Project permissions
    canCreateProjects: false,
    canDeleteProjects: false,
    canManageProjects: false,
    
    // Ticket permissions
    canCreateTickets: true, // All members can create tickets
    canEditAllTickets: false,
    canDeleteTickets: false,
    canAssignTickets: false,
    
    // Sprint permissions
    canCreateSprints: false,
    canManageSprints: false,
    canStartSprints: false,
    canCompleteSprints: false,
    
    // Label permissions
    canCreateLabels: false,
    canManageLabels: false,
  };

  if (role === "ADMIN" || isOwner) {
    return {
      // Organization permissions
      canManageOrganization: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canChangeRoles: true,
      canDeleteOrganization: isOwner, // Only owner can delete
      
      // Project permissions
      canCreateProjects: true,
      canDeleteProjects: true,
      canManageProjects: true,
      
      // Ticket permissions
      canCreateTickets: true,
      canEditAllTickets: true,
      canDeleteTickets: true,
      canAssignTickets: true,
      
      // Sprint permissions
      canCreateSprints: true,
      canManageSprints: true,
      canStartSprints: true,
      canCompleteSprints: true,
      
      // Label permissions
      canCreateLabels: true,
      canManageLabels: true,
    };
  }

  return basePermissions;
}

interface OrganizationData {
  id: string;
  userRole: MemberRole;
  owner: {
    id: string;
  };
}

/**
 * Hook to get user permissions for an organization
 */
export function usePermissions(organization?: OrganizationData) {
  const { data: session } = useSession();
  const [permissions, setPermissions] = useState<Permission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization || !session?.user?.id) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    const isOwner = organization.owner.id === session.user.id;
    const userPermissions = getPermissions(organization.userRole, isOwner);
    
    setPermissions(userPermissions);
    setLoading(false);
  }, [organization, session]);

  return {
    permissions,
    loading,
    hasPermission: (permission: keyof Permission) => {
      return permissions ? permissions[permission] : false;
    },
    isAdmin: organization?.userRole === "ADMIN",
    isOwner: organization && session?.user?.id === organization.owner.id,
    isMember: !!organization,
  };
}

/**
 * Hook to check a specific permission
 */
export function useHasPermission(
  organization: OrganizationData | undefined,
  permission: keyof Permission
) {
  const { hasPermission } = usePermissions(organization);
  return hasPermission(permission);
}

/**
 * Component wrapper for permission-based rendering
 */
interface PermissionGateProps {
  organization?: OrganizationData;
  permission?: keyof Permission;
  role?: MemberRole;
  requireOwner?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  organization,
  permission,
  role,
  requireOwner,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { permissions, isOwner, isAdmin } = usePermissions(organization);

  if (!organization || !permissions) {
    return fallback as React.ReactElement;
  }

  // Check owner requirement
  if (requireOwner && !isOwner) {
    return fallback as React.ReactElement;
  }

  // Check role requirement
  if (role && organization.userRole !== role && !isOwner) {
    return fallback as React.ReactElement;
  }

  // Check specific permission
  if (permission && !permissions[permission]) {
    return fallback as React.ReactElement;
  }

  return children as React.ReactElement;
}

/**
 * Higher-order component for permission-based access
 */
export function withPermissions<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermission: keyof Permission
) {
  return function PermissionWrappedComponent(props: T & { organization?: OrganizationData }) {
    const { hasPermission } = usePermissions(props.organization);

    if (!hasPermission(requiredPermission)) {
      return React.createElement(
        "div",
        { className: "text-center py-8" },
        React.createElement("p", { className: "text-gray-400" }, "You don't have permission to access this feature.")
      );
    }

    return React.createElement(Component, props);
  };
}
