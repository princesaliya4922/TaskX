import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireMembership, requirePermission, isOwner } from "@/lib/permissions";

// Validation schema for organization updates
const updateOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Name too long").optional(),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().nullable(),
});



// GET /api/organizations/[id] - Get organization details
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

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        owner: {
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
          orderBy: {
            joinedAt: "asc",
          },
        },
        _count: {
          select: {
            members: true,
            tickets: true,
            sprints: true,
            labels: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Add user's role
    const userMembership = organization.members.find(m => m.userId === session.user.id);
    
    return NextResponse.json({
      ...organization,
      userRole: userMembership?.role || null,
    });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/[id] - Update organization
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = params.id;

    // Check if user has permission to manage organization
    try {
      await requirePermission(session.user.id, organizationId, "canManageOrganization");
    } catch (error) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateOrganizationSchema.parse(body);

    // If name is being updated, generate new slug
    let updateData: any = { ...validatedData };
    if (validatedData.name) {
      const slug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      // Check if new slug conflicts with existing organizations
      const existingSlug = await prisma.organization.findFirst({
        where: {
          slug,
          id: { not: organizationId },
        },
      });

      if (existingSlug) {
        return NextResponse.json(
          { error: "Organization name already exists" },
          { status: 400 }
        );
      }

      updateData.slug = slug;
    }

    const organization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      include: {
        owner: {
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
            members: true,
            tickets: true,
            sprints: true,
            labels: true,
          },
        },
      },
    });

    return NextResponse.json({
      ...organization,
      userRole: "ADMIN",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = params.id;

    // Check if user is owner of organization (only owner can delete)
    const userIsOwner = await isOwner(session.user.id, organizationId);
    if (!userIsOwner) {
      return NextResponse.json({ error: "Only organization owner can delete organization" }, { status: 403 });
    }

    // Delete organization (cascade will handle related records)
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    return NextResponse.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}
