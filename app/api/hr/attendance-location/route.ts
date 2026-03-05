import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const attendance = await prisma.attendance.findMany({
      where: {
        ...(employeeId && { employeeId }),
        ...(dateFrom && dateTo && {
          date: {
            gte: new Date(dateFrom),
            lte: new Date(dateTo),
          },
        }),
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
        locationData: {
          select: {
            id: true,
            checkInLocation: true,
            checkInLatitude: true,
            checkInLongitude: true,
            checkOutLocation: true,
            biometricType: true,
            biometricVerified: true,
            checkInPhoto: true,
            checkOutPhoto: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { employeeId, checkInLocation, checkInLatitude, checkInLongitude, checkInPhoto } =
      body;

    if (!employeeId || !checkInLocation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    let attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: new Date(today),
      },
    });

    if (!attendance) {
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          date: new Date(today),
          checkIn: new Date(),
          status: "PRESENT",
        },
      });
    } else {
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkIn: new Date(),
          status: "PRESENT",
        },
      });
    }

    // Create or update location data
    const locationData = await prisma.attendanceLocation.upsert({
      where: { attendanceId: attendance.id },
      create: {
        attendanceId: attendance.id,
        checkInLocation,
        checkInLatitude: checkInLatitude || undefined,
        checkInLongitude: checkInLongitude || undefined,
        checkInPhoto,
        biometricVerified: false,
      },
      update: {
        checkInLocation,
        checkInLatitude: checkInLatitude || undefined,
        checkInLongitude: checkInLongitude || undefined,
        checkInPhoto,
      },
      select: {
        id: true,
        attendanceId: true,
        checkInLocation: true,
        biometricVerified: true,
      },
    });

    return NextResponse.json(
      {
        attendance,
        location: locationData,
        message: "Check-in recorded successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error recording attendance:", error);
    return NextResponse.json(
      { error: "Failed to record attendance" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { attendanceId, checkOutLocation, checkOutLatitude, checkOutLongitude, checkOutPhoto } =
      body;

    if (!attendanceId) {
      return NextResponse.json(
        { error: "Attendance ID required" },
        { status: 400 }
      );
    }

    // Calculate hours worked
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance?.checkIn) {
      return NextResponse.json(
        { error: "No check-in found for this attendance" },
        { status: 400 }
      );
    }

    const checkOut = new Date();
    const hoursWorked =
      (checkOut.getTime() - new Date(attendance.checkIn).getTime()) / (1000 * 60 * 60);

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        checkOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
      },
    });

    // Update location data
    await prisma.attendanceLocation.update({
      where: { attendanceId },
      data: {
        checkOutLocation,
        checkOutLatitude: checkOutLatitude || undefined,
        checkOutLongitude: checkOutLongitude || undefined,
        checkOutPhoto,
      },
    });

    return NextResponse.json({
      attendance: updatedAttendance,
      message: "Check-out recorded successfully",
    });
  } catch (error) {
    console.error("Error recording checkout:", error);
    return NextResponse.json(
      { error: "Failed to record checkout" },
      { status: 500 }
    );
  }
}
