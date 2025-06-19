import { prisma } from "@/lib/prisma";

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
 * Get permissions for a user role
 */
export function getPermissions(role: MemberRole): Permission {
  const basePermissions: Permission = {
    // Organization permissions
    canManageOrganization: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canChangeRoles: false,
    canDeleteOrganization: false,
    
    // Project permissions
    canCreateProjects: false, // Only ADMINs can create projects
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

  if (role === "ADMIN") {
    return {
      // Organization permissions
      canManageOrganization: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canChangeRoles: true,
      canDeleteOrganization: false, // Only owner can delete
      
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

/**
 * Check if user has permission to perform an action in an organization
 */
export async function hasPermission(
  userId: string,
  organizationId: string,
  permission: keyof Permission
): Promise<boolean> {
  try {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        organization: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!membership) {
      return false;
    }

    // Organization owner has all permissions except deletion (handled separately)
    const isOwner = membership.organization.ownerId === userId;

    if (isOwner && permission !== "canDeleteOrganization") {
      return true;
    }

    // Special case: only owner can delete organization
    if (permission === "canDeleteOrganization") {
      return isOwner;
    }

    const permissions = getPermissions(membership.role);
    return permissions[permission];
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Get user's role in an organization
 */
export async function getUserRole(
  userId: string,
  organizationId: string
): Promise<MemberRole | null> {
  try {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return membership?.role || null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Check if user is a member of an organization
 */
export async function isMember(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return !!membership;
  } catch (error) {
    console.error("Error checking membership:", error);
    return false;
  }
}

/**
 * Check if user is an admin of an organization
 */
export async function isAdmin(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const role = await getUserRole(userId, organizationId);
  return role === "ADMIN";
}

/**
 * Check if user is the owner of an organization
 */
export async function isOwner(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });

    return organization?.ownerId === userId;
  } catch (error) {
    console.error("Error checking ownership:", error);
    return false;
  }
}

/**
 * Middleware helper to check permissions in API routes
 */
export async function requirePermission(
  userId: string,
  organizationId: string,
  permission: keyof Permission
): Promise<void> {
  const hasAccess = await hasPermission(userId, organizationId, permission);
  
  if (!hasAccess) {
    throw new Error(`Insufficient permissions: ${permission}`);
  }
}

/**
 * Middleware helper to require membership in API routes
 */
export async function requireMembership(
  userId: string,
  organizationId: string
): Promise<void> {
  const membershipExists = await isMember(userId, organizationId);
  
  if (!membershipExists) {
    throw new Error("User is not a member of this organization");
  }
}
