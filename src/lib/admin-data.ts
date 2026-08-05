import "server-only";
import { prisma } from "@/lib/prisma";
import { parseDateInputValue } from "@/lib/date";
import type { Prisma } from "@/generated/prisma/client";

export interface AttendanceFilters {
  from?: string; // yyyy-MM-dd
  to?: string; // yyyy-MM-dd
  employeeId?: string;
}

export function listEmployees() {
  return prisma.employee.findMany({ orderBy: { name: "asc" } });
}

export function listAttendanceRecords(filters: AttendanceFilters) {
  const where: Prisma.AttendanceRecordWhereInput = {};

  if (filters.employeeId) {
    where.employeeId = filters.employeeId;
  }

  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: parseDateInputValue(filters.from) } : {}),
      ...(filters.to ? { lte: parseDateInputValue(filters.to) } : {}),
    };
  }

  return prisma.attendanceRecord.findMany({
    where,
    include: { employee: true },
    orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
  });
}

export function getAttendanceRecord(id: string) {
  return prisma.attendanceRecord.findUnique({
    where: { id },
    include: { employee: true },
  });
}

export function getEmployee(id: string) {
  return prisma.employee.findUnique({ where: { id } });
}
