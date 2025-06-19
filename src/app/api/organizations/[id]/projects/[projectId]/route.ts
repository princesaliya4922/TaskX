import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireMembership, requirePermission } from "@/lib/permissions";

// Validation schema for project updates
const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long").optional(),
  description: z.string().optional(),
  leadId: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Helper function to check if user is project member
async function isProjectMember(userId: string, projectId: string): Promise<boolean> {
  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
  });
  
  return !!membership;
}

// Helper function to check if user is project lead
async function isProjectLead(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { leadId: true },
  });
  
  return project?.leadId === userId;
}

// GET /api/organizations/[id]/projects/[projectId] - Get project details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, projectId } = await params;

    // Check if user is member of organization
    try {
      await requireMembership(session.user.id, organizationId);
    } catch (error) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            ticketPrefix: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: [
            { role: "asc" }, // LEADs first
            { joinedAt: "asc" },
          ],
        },
        _count: {
          select: {
            tickets: true,
            sprints: true,
            members: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Add user's role in the project
    const userMembership = project.members.find(m => m.userId === session.user.id);
    
    return NextResponse.json({
      ...project,
      userRole: userMembership?.role || null,
      isUserMember: !!userMembership,
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/[id]/projects/[projectId] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, projectId } = await params;

    // Check if user has permission to manage projects or is project lead
    const hasOrgPermission = await requirePermission(session.user.id, organizationId, "canManageProjects").catch(() => false);
    const isLead = await isProjectLead(session.user.id, projectId);

    if (!hasOrgPermission && !isLead) {
      return NextResponse.json({ error: "Insufficient permissions to update project" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // Verify project exists and belongs to organization
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // If leadId is being updated, verify the user is a member of the organization
    if (validatedData.leadId) {
      const leadMembership = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: validatedData.leadId,
            organizationId,
          },
        },
      });

      if (!leadMembership) {
        return NextResponse.json(
          { error: "Project lead must be a member of the organization" },
          { status: 400 }
        );
      }
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: validatedData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            ticketPrefix: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
            sprints: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]/projects/[projectId] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, projectId } = await params;

    // Check if user has permission to delete projects
    try {
      await requirePermission(session.user.id, organizationId, "canDeleteProjects");
    } catch (error) {
      return NextResponse.json({ error: "Insufficient permissions to delete projects" }, { status: 403 });
    }

    // Verify project exists and belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            tickets: true,
            sprints: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if project has tickets or sprints
    if (project._count.tickets > 0 || project._count.sprints > 0) {
      return NextResponse.json(
        { error: "Cannot delete project with existing tickets or sprints. Archive it instead." },
        { status: 400 }
      );
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
