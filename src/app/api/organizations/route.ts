import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for organization creation
const createOrganizationSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Name too long"),
  description: z.string().optional(),
  ticketPrefix: z.string()
    .min(2, "Ticket prefix must be at least 2 characters")
    .max(5, "Ticket prefix must be at most 5 characters")
    .regex(/^[A-Z]+$/, "Ticket prefix must contain only uppercase letters"),
});

// GET /api/organizations - Get user's organizations
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizations = await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Add user's role in each organization
    const organizationsWithRole = organizations.map((org) => {
      const userMembership = org.members.find(m => m.userId === session.user.id);
      return {
        ...org,
        userRole: userMembership?.role || null,
      };
    });

    return NextResponse.json(organizationsWithRole);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

// POST /api/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createOrganizationSchema.parse(body);

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists
    const existingSlug = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return NextResponse.json(
        { error: "Organization name already exists" },
        { status: 400 }
      );
    }

    // Check if ticket prefix already exists
    const existingPrefix = await prisma.organization.findUnique({
      where: { ticketPrefix: validatedData.ticketPrefix },
    });

    if (existingPrefix) {
      return NextResponse.json(
        { error: "Ticket prefix already exists" },
        { status: 400 }
      );
    }

    // Create organization with owner as admin member
    const organization = await prisma.organization.create({
      data: {
        name: validatedData.name,
        slug,
        ticketPrefix: validatedData.ticketPrefix,
        description: validatedData.description,
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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
          },
        },
      },
    });

    return NextResponse.json({
      ...organization,
      userRole: "ADMIN",
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
