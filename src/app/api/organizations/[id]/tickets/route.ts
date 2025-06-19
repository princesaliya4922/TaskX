import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";

// GET /api/organizations/[id]/tickets - Get organization tickets
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
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const sprintId = searchParams.get("sprintId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {
      organizationId,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (sprintId) {
      where.sprintId = sprintId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { ticketId: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get tickets with pagination
    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
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
          sprint: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          labels: {
            include: {
              label: true,
            },
          },
          _count: {
            select: {
              comments: true,
              attachments: true,
              children: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/tickets - Create new ticket
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

    // Check if user is member of organization
    try {
      await requireMembership(session.user.id, organizationId);
    } catch (error) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      priority = "MEDIUM",
      area = "DEVELOPMENT",
      projectId,
      assigneeId,
      sprintId,
      parentId,
      storyPoints,
      dueDate,
      labelIds = [],
    } = body;

    // Validate required fields
    if (!title || !type) {
      return NextResponse.json(
        { error: "Title and type are required" },
        { status: 400 }
      );
    }

    // Validate project belongs to organization if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
    }

    // Get organization for ticket prefix
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

    // Get next ticket number for organization
    const lastTicket = await prisma.ticket.findFirst({
      where: { organizationId },
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true },
    });

    const ticketNumber = (lastTicket?.ticketNumber || 0) + 1;
    const ticketId = `${organization.ticketPrefix}-${ticketNumber}`;

    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        type,
        priority,
        area,
        ticketNumber,
        ticketId,
        organizationId,
        projectId,
        reporterId: session.user.id,
        assigneeId,
        sprintId,
        parentId,
        storyPoints,
        dueDate: dueDate ? new Date(dueDate) : null,
        labels: labelIds.length > 0 ? {
          create: labelIds.map((labelId: string) => ({
            labelId,
          })),
        } : undefined,
      },
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
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
