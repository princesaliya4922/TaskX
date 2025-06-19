import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireMembership, requirePermission } from "@/lib/permissions";

// Validation schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Name too long"),
  description: z.string().optional(),
  leadId: z.string().optional(),
  key: z.string()
    .min(2, "Project key must be at least 2 characters")
    .max(10, "Project key must be at most 10 characters")
    .regex(/^[A-Z0-9]+$/, "Project key must contain only uppercase letters and numbers")
    .optional(),
});

// GET /api/organizations/[id]/projects - Get organization projects
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

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("includeInactive") === "true";

    const projects = await prisma.project.findMany({
      where: {
        organizationId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
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
      orderBy: [
        { isActive: "desc" },
        { updatedAt: "desc" },
      ],
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/projects - Create new project
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

    // Check if user has permission to create projects
    try {
      await requirePermission(session.user.id, organizationId, "canCreateProjects");
    } catch (error) {
      console.error("Permission check failed:", error);
      return NextResponse.json({
        error: "Insufficient permissions to create projects",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Get organization to check it exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ticketPrefix: true },
    });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Generate project key from name if not provided
    let projectKey = validatedData.key;
    if (!projectKey) {
      projectKey = validatedData.name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 10);

      // If generated key is too short, use organization prefix + number
      if (projectKey.length < 2) {
        const projectCount = await prisma.project.count({
          where: { organizationId },
        });
        projectKey = `${organization.ticketPrefix}P${projectCount + 1}`;
      }
    }

    // Check if project key already exists in organization (should be unique per org)
    const existingProject = await prisma.project.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key: projectKey,
        },
      },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: `A project with key "${projectKey}" already exists in this organization` },
        { status: 400 }
      );
    }

    // If leadId is provided, verify the user is a member of the organization
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

    // Create project with creator as initial member
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        key: projectKey,
        description: validatedData.description,
        organizationId,
        leadId: validatedData.leadId || session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "LEAD",
          },
        },
      },
      include: {
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

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating project:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Failed to create project", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
