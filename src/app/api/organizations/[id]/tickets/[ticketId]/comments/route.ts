import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";

// GET /api/organizations/[id]/tickets/[ticketId]/comments - Get ticket comments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, ticketId } = await params;

    // Check if user is member of organization
    try {
      await requireMembership(session.user.id, organizationId);
    } catch (error) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify ticket exists and belongs to organization
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organizationId,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get comments with pagination
    const [comments, totalCount] = await Promise.all([
      prisma.comment.findMany({
        where: { ticketId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          mentions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where: { ticketId } }),
    ]);

    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[id]/tickets/[ticketId]/comments - Create comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; ticketId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: organizationId, ticketId } = await params;

    // Check if user is member of organization
    try {
      await requireMembership(session.user.id, organizationId);
    } catch (error) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Verify ticket exists and belongs to organization
    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        organizationId,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, mentions = [] } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content,
        ticketId,
        authorId: session.user.id,
        mentions: mentions.length > 0 ? {
          create: mentions.map((userId: string) => ({
            userId,
          })),
        } : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        mentions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: "COMMENT_ADDED",
        description: `Comment added to ticket ${ticket.ticketId}`,
        metadata: {
          commentId: comment.id,
        },
        userId: session.user.id,
        organizationId,
        ticketId,
      },
    });

    // Create notifications for mentions
    if (mentions.length > 0) {
      await prisma.notification.createMany({
        data: mentions.map((userId: string) => ({
          type: "MENTION",
          title: "You were mentioned",
          message: `${session.user.name} mentioned you in a comment on ${ticket.ticketId}`,
          metadata: {
            ticketId,
            commentId: comment.id,
          },
          userId,
        })),
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
