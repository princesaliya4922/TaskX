import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";

// Helper function to check if user is project lead
async function isProjectLead(userId: string, projectId: string): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { leadId: true },
  });
  
  return project?.leadId === userId;
}

// DELETE /api/organizations/[id]/projects/[projectId]/members/[memberId] - Remove member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, projectId, memberId } = await params;

    // Check if user is member of organization
    try {
      await requireMembership(session.user.id, organizationId);
    } catch (error) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if user is project lead (only leads can remove members)
    const isLead = await isProjectLead(session.user.id, projectId);
    if (!isLead) {
      return NextResponse.json({ error: "Only project leads can remove members" }, { status: 403 });
    }

    // Get member details to check if they're trying to remove the project lead
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        project: {
          select: { leadId: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Verify member belongs to the correct project
    if (member.projectId !== projectId) {
      return NextResponse.json({ error: "Member not found in this project" }, { status: 404 });
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
