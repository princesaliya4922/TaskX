import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";

// GET /api/organizations/[id]/projects/[projectId]/sprints - Get project sprints
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

    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get("includeCompleted") === "true";

    // Build where clause
    const where: any = {
      organizationId,
      projectId,
    };

    if (!includeCompleted) {
      where.status = {
        in: ["PLANNED", "ACTIVE"],
      };
    }

    const sprints = await prisma.sprint.findMany({
      where,
      include: {
        tickets: {
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
                key: true,
              },
            },
            _count: {
              select: {
                comments: true,
                attachments: true,
              },
            },
          },
          orderBy: [
            { updatedAt: "asc" }, // Maintain drag-and-drop order
          ],
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // ACTIVE first, then PLANNED, then COMPLETED
        { startDate: "desc" },
      ],
    });

    return NextResponse.json(sprints);
  } catch (error) {
    console.error("Error fetching project sprints:", error);
    return NextResponse.json(
      { error: "Failed to fetch project sprints" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/projects/[projectId]/sprints - Create new sprint
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

    const body = await request.json();
    const { name, startDate, endDate, goal } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Create sprint
    const sprint = await prisma.sprint.create({
      data: {
        name,
        organizationId,
        projectId,
        startDate: start,
        endDate: end,
        goal,
        status: "PLANNED",
      },
      include: {
        tickets: {
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
                key: true,
              },
            },
            _count: {
              select: {
                comments: true,
                attachments: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    return NextResponse.json(sprint, { status: 201 });
  } catch (error) {
    console.error("Error creating sprint:", error);
    return NextResponse.json(
      { error: "Failed to create sprint" },
      { status: 500 }
    );
  }
}
