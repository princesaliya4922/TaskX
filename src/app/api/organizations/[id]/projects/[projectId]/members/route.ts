import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireMembership } from "@/lib/permissions";

// Validation schema for adding project member
const addMemberSchema = z.object({
  userId: z.string(),
  role: z.enum(["LEAD", "MEMBER"]).default("MEMBER"),
});

// Helper function to check if user is project lead
async function isProjectLead(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { leadId: true },
  });
  
  return project?.leadId === userId;
}

// GET /api/organizations/[id]/projects/[projectId]/members - Get project members
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

    // Verify project exists and belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // LEADs first
        { joinedAt: "asc" },
      ],
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching project members:", error);
    return NextResponse.json(
      { error: "Failed to fetch project members" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/projects/[projectId]/members - Add member to project
export async function POST(
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

    // Check if user is project lead (only leads can add members)
    const isLead = await isProjectLead(session.user.id, projectId);
    if (!isLead) {
      return NextResponse.json({ error: "Only project leads can add members" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = addMemberSchema.parse(body);

    // Verify project exists and belongs to organization
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is a member of the organization
    const orgMembership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: validatedData.userId,
          organizationId,
        },
      },
    });

    if (!orgMembership) {
      return NextResponse.json(
        { error: "User must be a member of the organization" },
        { status: 400 }
      );
    }

    // Check if user is already a project member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: validatedData.userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }

    // Add member to project
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: validatedData.userId,
        role: validatedData.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error adding project member:", error);
    return NextResponse.json(
      { error: "Failed to add project member" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]/projects/[projectId]/members/[memberId] - Remove member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; projectId: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, projectId, memberId } = params;

    // Check if user is member of organization
    try {
      await requireMembership(session.user.id, organizationId);
    } catch (error) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if member exists
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        project: {
          select: {
            id: true,
            organizationId: true,
            leadId: true,
          },
        },
      },
    });

    if (!member || member.project.organizationId !== organizationId || member.projectId !== projectId) {
      return NextResponse.json({ error: "Project member not found" }, { status: 404 });
    }

    // Check permissions: project lead can remove anyone, users can remove themselves
    const isLead = await isProjectLead(session.user.id, projectId);
    const isSelf = member.userId === session.user.id;

    if (!isLead && !isSelf) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Prevent removing project lead (must transfer leadership first)
    if (member.project.leadId === member.userId) {
      return NextResponse.json(
        { error: "Cannot remove project lead. Transfer leadership first." },
        { status: 400 }
      );
    }

    // Remove member
    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing project member:", error);
    return NextResponse.json(
      { error: "Failed to remove project member" },
      { status: 500 }
    );
  }
}
