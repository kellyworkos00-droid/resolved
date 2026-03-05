import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const managerId = searchParams.get("managerId");
    const employeeId = searchParams.get("employeeId");

    // Get employees managed by a manager
    if (managerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: managerId },
        include: {
          managerOf: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  position: true,
                  department: true,
                },
              },
            },
          },
        },
      });

      if (!manager) {
        return NextResponse.json({ error: "Manager not found" }, { status: 404 });
      }

      return NextResponse.json({
        managerId: manager.id,
        managerName: `${manager.firstName} ${manager.lastName}`,
        subordinates: manager.managerOf.map((rel: { employee: { id: string; firstName: string; lastName: string; email: string; position: string; department: string } }) => ({
          id: rel.employee.id,
          firstName: rel.employee.firstName,
          lastName: rel.employee.lastName,
          email: rel.employee.email,
          position: rel.employee.position,
          department: rel.employee.department,
        })),
      });
    }

    // Get manager for an employee
    if (employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          managedBy: {
            include: {
              manager: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  position: true,
                  department: true,
                },
              },
            },
          },
        },
      });

      if (!employee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      const managerRel = employee.managedBy[0];

      return NextResponse.json({
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        manager: managerRel
          ? {
              id: managerRel.manager.id,
              firstName: managerRel.manager.firstName,
              lastName: managerRel.manager.lastName,
              email: managerRel.manager.email,
              position: managerRel.manager.position,
              department: managerRel.manager.department,
            }
          : null,
      });
    }

    // Get complete org structure
    const employees = await prisma.employee.findMany({
      include: {
        managerOf: {
          select: { employee: { select: { id: true, firstName: true, lastName: true } } },
        },
        managedBy: {
          select: { manager: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching org chart:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizational structure" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { managerId, subordinateId } = body;

    if (!managerId || !subordinateId) {
      return NextResponse.json(
        { error: "Manager ID and Subordinate ID required" },
        { status: 400 }
      );
    }

    // Verify both employees exist
    const [manager, subordinate] = await Promise.all([
      prisma.employee.findUnique({ where: { id: managerId } }),
      prisma.employee.findUnique({ where: { id: subordinateId } }),
    ]);

    if (!manager || !subordinate) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Create manager relationship
    const relation = await prisma.employeeManager.create({
      data: {
        managerId,
        subordinateId,
      },
      include: {
        manager: { select: { firstName: true, lastName: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(
      {
        message: `${relation.employee.firstName} ${relation.employee.lastName} is now reporting to ${relation.manager.firstName} ${relation.manager.lastName}`,
        relation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating manager relation:", error);
    return NextResponse.json(
      { error: "Failed to create manager relation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { relationId } = body;

    if (!relationId) {
      return NextResponse.json(
        { error: "Relation ID required" },
        { status: 400 }
      );
    }

    await prisma.employeeManager.delete({
      where: { id: relationId },
    });

    return NextResponse.json({ message: "Manager relation removed successfully" });
  } catch (error) {
    console.error("Error deleting manager relation:", error);
    return NextResponse.json(
      { error: "Failed to delete relation" },
      { status: 500 }
    );
  }
}
