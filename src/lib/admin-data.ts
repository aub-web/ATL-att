import "server-only";
import { prisma } from "@/lib/prisma";
import { parseDateInputValue, toDateInputValue } from "@/lib/date";
import { enumerateWorkdayKeys } from "@/lib/holidays";
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

export interface Absence {
  date: string; // "yyyy-MM-dd", Manila
  employeeId: string;
  employeeName: string;
}

/**
 * Workdays (Mon-Fri, excluding Philippine holidays) in [from, to] with no
 * clock-in on record for a given employee. `to` is clamped to today, since
 * future workdays haven't happened yet.
 */
export async function listAbsences(filters: {
  from: string;
  to: string;
  employeeId?: string;
}): Promise<Absence[]> {
  const todayKey = toDateInputValue(new Date());
  const toKey = filters.to < todayKey ? filters.to : todayKey;
  if (filters.from > toKey) return [];

  const [employees, records] = await Promise.all([
    prisma.employee.findMany({
      where: filters.employeeId ? { id: filters.employeeId } : undefined,
      orderBy: { name: "asc" },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        clockIn: { not: null },
        employeeId: filters.employeeId,
        date: {
          gte: parseDateInputValue(filters.from),
          lte: parseDateInputValue(toKey),
        },
      },
      select: { employeeId: true, date: true },
    }),
  ]);

  const present = new Set(
    records.map((r) => `${r.employeeId}:${toDateInputValue(r.date)}`),
  );

  const workdays = enumerateWorkdayKeys(filters.from, toKey);
  const absences: Absence[] = [];
  for (const day of workdays) {
    for (const employee of employees) {
      if (!present.has(`${employee.id}:${day}`)) {
        absences.push({ date: day, employeeId: employee.id, employeeName: employee.name });
      }
    }
  }
  return absences;
}
