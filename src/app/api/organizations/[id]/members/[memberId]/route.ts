import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requirePermission, isOwner } from "@/lib/permissions";

// Validation schema for member role update
const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});



// PUT /api/organizations/[id]/members/[memberId] - Update member role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, memberId } = params;

    // Check if user has permission to change roles
    try {
      await requirePermission(session.user.id, organizationId, "canChangeRoles");
    } catch (error) {
      return NextResponse.json({ error: "Insufficient permissions to change member roles" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateMemberRoleSchema.parse(body);

    // Check if member exists
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!member || member.organizationId !== organizationId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Prevent changing owner's role
    const memberIsOwner = await isOwner(member.userId, organizationId);
    if (memberIsOwner) {
      return NextResponse.json(
        { error: "Cannot change organization owner's role" },
        { status: 400 }
      );
    }

    // Update member role
    const updatedMember = await prisma.organizationMember.update({
      where: { id: memberId },
      data: { role: validatedData.role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id]/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, memberId } = params;

    // Check if member exists
    const member = await prisma.organizationMember.findUnique({
      where: { id: memberId },
      include: {
        organization: {
          select: { ownerId: true },
        },
      },
    });

    if (!member || member.organizationId !== organizationId) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check permissions: admin can remove anyone, users can remove themselves
    const isSelf = member.userId === session.user.id;

    if (!isSelf) {
      try {
        await requirePermission(session.user.id, organizationId, "canRemoveMembers");
      } catch (error) {
        return NextResponse.json({ error: "Insufficient permissions to remove members" }, { status: 403 });
      }
    }

    // Prevent removing organization owner
    const memberIsOwner = await isOwner(member.userId, organizationId);
    if (memberIsOwner) {
      return NextResponse.json(
        { error: "Cannot remove organization owner" },
        { status: 400 }
      );
    }

    // Remove member
    await prisma.organizationMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
