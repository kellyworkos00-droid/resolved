import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const appraisals = await prisma.performanceAppraisal.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(status && { status }),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        peerReviews: {
          select: {
            id: true,
            reviewer: { select: { firstName: true, lastName: true } },
            rating: true,
          },
        },
      },
      orderBy: { createdDate: "desc" },
    });

    return NextResponse.json(appraisals);
  } catch (error) {
    console.error("Error fetching appraisals:", error);
    return NextResponse.json(
      { error: "Failed to fetch appraisals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      employeeId,
      managerId,
      appraisalDate,
      reviewPeriodStart,
      reviewPeriodEnd,
      selfRating,
      selfComment,
      managerRating,
      managerComment,
      goals,
    } = body;

    // Validation
    if (!employeeId || !managerId || !appraisalDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const appraisal = await prisma.performanceAppraisal.create({
      data: {
        employeeId,
        managerId,
        appraisalType: "ANNUAL",
        appraisalDate: new Date(appraisalDate),
        reviewPeriodStart: new Date(reviewPeriodStart),
        reviewPeriodEnd: new Date(reviewPeriodEnd),
        status: "DRAFT",
        selfRating: selfRating || 0,
        selfComment,
        managerRating: managerRating || 0,
        managerComment,
        goals: goals || [],
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, email: true },
        },
        manager: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(appraisal, { status: 201 });
  } catch (error) {
    console.error("Error creating appraisal:", error);
    return NextResponse.json(
      { error: "Failed to create appraisal" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, selfRating, selfComment, managerRating, managerComment, status } =
      body;

    if (!id) {
      return NextResponse.json({ error: "Appraisal ID required" }, { status: 400 });
    }

    const appraisal = await prisma.performanceAppraisal.update({
      where: { id },
      data: {
        ...(selfRating !== undefined && { selfRating }),
        ...(selfComment && { selfComment }),
        ...(managerRating !== undefined && { managerRating }),
        ...(managerComment && { managerComment }),
        ...(status && { status }),
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        peerReviews: { select: { id: true, overallScore: true } },
      },
    });

    return NextResponse.json(appraisal);
  } catch (error) {
    console.error("Error updating appraisal:", error);
    return NextResponse.json(
      { error: "Failed to update appraisal" },
      { status: 500 }
    );
  }
}
