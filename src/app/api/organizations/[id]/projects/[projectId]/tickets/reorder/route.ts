import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireMembership } from "@/lib/permissions";

// POST /api/organizations/[id]/projects/[projectId]/tickets/reorder - Reorder tickets
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

    const body = await request.json();
    const { ticketIds, sprintId } = body;

    if (!Array.isArray(ticketIds)) {
      return NextResponse.json(
        { error: "ticketIds must be an array" },
        { status: 400 }
      );
    }

    // Verify all tickets belong to the organization and project
    const tickets = await prisma.ticket.findMany({
      where: {
        id: { in: ticketIds },
        organizationId,
        projectId,
      },
    });

    if (tickets.length !== ticketIds.length) {
      return NextResponse.json(
        { error: "Some tickets not found or access denied" },
        { status: 404 }
      );
    }

    // For now, we'll store the order in the ticket metadata or use a simple approach
    // Since we don't have an order field, we'll use a timestamp-based approach
    // that maintains the relative order

    const baseTime = Date.now();
    const updatePromises = ticketIds.map((ticketId: string, index: number) => {
      return prisma.ticket.update({
        where: { id: ticketId },
        data: {
          // Use updatedAt with incremental timestamps to maintain order
          updatedAt: new Date(baseTime + index * 1000), // 1 second apart
        },
      });
    });

    await Promise.all(updatePromises);

    // Log the activity
    await prisma.activity.create({
      data: {
        type: "TICKETS_REORDERED",
        description: `Reordered ${ticketIds.length} tickets${
          sprintId ? ` in sprint` : ` in backlog`
        }`,
        metadata: {
          ticketIds,
          sprintId,
          projectId,
        },
        // We'll associate this with the first ticket for simplicity
        ticketId: ticketIds[0],
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering tickets:", error);
    return NextResponse.json(
      { error: "Failed to reorder tickets" },
      { status: 500 }
    );
  }
}
