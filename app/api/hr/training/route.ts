import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    // Get training programs
    if (!employeeId) {
      const programs = await prisma.trainingProgram.findMany({
        where: {
          ...(type && { category: type }),
          ...(status && { status }),
        },
        include: {
          enrollments: {
            select: {
              id: true,
              employee: { select: { firstName: true, lastName: true } },
              status: true,
              completionPercent: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
      });
      return NextResponse.json(programs);
    }

    // Get employee trainings
    const enrollments = await prisma.trainingEnrollment.findMany({
      where: { employeeId },
      include: {
        program: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            duration: true,
          },
        },
      },
      orderBy: { enrollmentDate: "desc" },
    });
    return NextResponse.json(enrollments);
  } catch (error) {
    console.error("Error fetching training data:", error);
    return NextResponse.json(
      { error: "Failed to fetch training data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { type, action } = body;

    // Create training program
    if (type === "program") {
      const { title, description, category, provider, startDate, endDate, duration, maxParticipants, cost } = body;

      if (!title || !category || !startDate || !endDate) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const program = await prisma.trainingProgram.create({
        data: {
          title,
          description,
          category,
          provider,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          duration: duration || 0,
          maxParticipants: maxParticipants || 0,
          cost: cost || 0,
          status: "SCHEDULED",
        },
      });

      return NextResponse.json(program, { status: 201 });
    }

    // Enroll employee in training
    if (type === "enrollment") {
      const { employeeId, programId } = body;

      if (!employeeId || !programId) {
        return NextResponse.json(
          { error: "Employee ID and Program ID required" },
          { status: 400 }
        );
      }

      const enrollment = await prisma.trainingEnrollment.create({
        data: {
          employeeId,
          programId,
          enrollmentDate: new Date(),
          status: "ENROLLED",
          completionPercent: 0,
        },
        include: {
          program: { select: { title: true, startDate: true } },
          employee: { select: { firstName: true, lastName: true } },
        },
      });

      return NextResponse.json(enrollment, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error("Error creating training data:", error);
    return NextResponse.json(
      { error: "Failed to create training data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { enrollmentId, completionPercent, score, status } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: "Enrollment ID required" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        ...(completionPercent !== undefined && { completionPercent }),
        ...(score !== undefined && { score }),
        ...(status && { status }),
      },
      include: {
        program: { select: { title: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(enrollment);
  } catch (error) {
    console.error("Error updating training enrollment:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}
