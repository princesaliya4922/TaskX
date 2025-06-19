import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireMembership, requirePermission } from "@/lib/permissions";

// Validation schema for member invitation
const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

// Validation schema for member role update
const updateMemberRoleSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});



// GET /api/organizations/[id]/members - Get organization members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId } = await params;

    // Check if user is member of organization
    try {
      await requireMembership(session.user.id, organizationId);
    } catch (error) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const members = await prisma.organizationMember.findMany({
      where: { organizationId },
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
      orderBy: [
        { role: "asc" }, // Admins first
        { joinedAt: "asc" },
      ],
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/members - Invite member to organization
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId } = await params;

    // Check if user has permission to invite members
    try {
      await requirePermission(session.user.id, organizationId, "canInviteMembers");
    } catch (error) {
      return NextResponse.json({ error: "Insufficient permissions to invite members" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = inviteMemberSchema.parse(body);

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      // Check if user is already a member
      const existingMember = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId,
          },
        },
      });

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this organization" },
          { status: 400 }
        );
      }

      // Add existing user as member
      const member = await prisma.organizationMember.create({
        data: {
          userId: existingUser.id,
          organizationId,
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
              createdAt: true,
            },
          },
        },
      });

      return NextResponse.json(member, { status: 201 });
    } else {
      // Check if invitation already exists
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          email: validatedData.email,
          organizationId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvitation) {
        return NextResponse.json(
          { error: "Invitation already sent to this email" },
          { status: 400 }
        );
      }

      // Create invitation for new user
      const invitation = await prisma.invitation.create({
        data: {
          email: validatedData.email,
          organizationId,
          role: validatedData.role,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        include: {
          organization: {
            select: {
              name: true,
            },
          },
        },
      });

      // TODO: Send invitation email
      console.log(`Invitation created for ${validatedData.email} to join ${organization.name}`);

      return NextResponse.json({
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error inviting member:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}
