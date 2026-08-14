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
      // Outside their employment window, they're not expected to show up.
      if (employee.startDate && day < toDateInputValue(employee.startDate)) continue;
      if (employee.endDate && day > toDateInputValue(employee.endDate)) continue;
      if (!present.has(`${employee.id}:${day}`)) {
        absences.push({ date: day, employeeId: employee.id, employeeName: employee.name });
      }
    }
  }
  return absences;
}

export interface CutoffStats {
  employeeId: string;
  employeeName: string;
  present: number;
  absent: number;
}

async function computeCutoffStats(from: string, to: string): Promise<CutoffStats[]> {
  const employees = await prisma.employee.findMany({ orderBy: { name: "asc" } });

  const todayKey = toDateInputValue(new Date());
  const toKey = to < todayKey ? to : todayKey;
  if (from > toKey) {
    return employees.map((e) => ({ employeeId: e.id, employeeName: e.name, present: 0, absent: 0 }));
  }

  const records = await prisma.attendanceRecord.findMany({
    where: {
      clockIn: { not: null },
      date: { gte: parseDateInputValue(from), lte: parseDateInputValue(toKey) },
    },
    select: { employeeId: true, date: true },
  });
  const present = new Set(
    records.map((r) => `${r.employeeId}:${toDateInputValue(r.date)}`),
  );

  const workdays = enumerateWorkdayKeys(from, toKey);

  return employees.map((employee) => {
    let presentCount = 0;
    let absentCount = 0;
    for (const day of workdays) {
      if (employee.startDate && day < toDateInputValue(employee.startDate)) continue;
      if (employee.endDate && day > toDateInputValue(employee.endDate)) continue;
      if (present.has(`${employee.id}:${day}`)) presentCount++;
      else absentCount++;
    }
    return { employeeId: employee.id, employeeName: employee.name, present: presentCount, absent: absentCount };
  });
}

export interface CutoffPeriod {
  from: string;
  to: string;
  stats: CutoffStats[];
}

/**
 * Present/absent day counts per employee for a month's two payroll cutoffs
 * (1st-15th, 16th-end of month), workdays only.
 */
export async function listCutoffStats(month: string): Promise<{
  cutoff1: CutoffPeriod;
  cutoff2: CutoffPeriod;
}> {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();

  const cutoff1From = `${month}-01`;
  const cutoff1To = `${month}-15`;
  const cutoff2From = `${month}-16`;
  const cutoff2To = `${month}-${String(lastDay).padStart(2, "0")}`;

  const [stats1, stats2] = await Promise.all([
    computeCutoffStats(cutoff1From, cutoff1To),
    computeCutoffStats(cutoff2From, cutoff2To),
  ]);

  return {
    cutoff1: { from: cutoff1From, to: cutoff1To, stats: stats1 },
    cutoff2: { from: cutoff2From, to: cutoff2To, stats: stats2 },
  };
}
