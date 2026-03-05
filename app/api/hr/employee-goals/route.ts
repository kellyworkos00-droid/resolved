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

    const goals = await prisma.employeeGoal.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(status && { status }),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    // Calculate metrics
    const metricsData = goals.reduce(
      (acc: any, goal: any) => {
        acc.total++;
        if (goal.status === "ACTIVE") acc.active++;
        if (goal.status === "COMPLETED") acc.completed++;
        if (goal.progressPercent === 100) acc.fullyCompleted++;
        return acc;
      },
      { total: 0, active: 0, completed: 0, fullyCompleted: 0 }
    );

    return NextResponse.json({
      goals,
      metrics: metricsData,
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
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
      title,
      description,
      dueDate,
      priority,
      alignedWith,
    } = body;

    if (!employeeId || !title || !dueDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const goal = await prisma.employeeGoal.create({
      data: {
        employeeId,
        title,
        description,
        dueDate: new Date(dueDate),
        priority: priority || "MEDIUM",
        alignedWith,
        status: "ACTIVE",
        progressPercent: 0,
        setDate: new Date(),
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, position: true },
        },
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      goalId,
      progressPercent,
      status,
      reviewNotes,
    } = body;

    if (!goalId) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
    }

    const updateData: any = {};
    if (progressPercent !== undefined) updateData.progressPercent = progressPercent;
    if (status) updateData.status = status;
    if (reviewNotes) updateData.reviewNotes = reviewNotes;
    if (progressPercent === 100 && status === "COMPLETED") {
      updateData.completionDate = new Date();
    }

    const goal = await prisma.employeeGoal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { goalId } = body;

    if (!goalId) {
      return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
    }

    await prisma.employeeGoal.delete({
      where: { id: goalId },
    });

    return NextResponse.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
