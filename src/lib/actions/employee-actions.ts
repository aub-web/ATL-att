"use server";

import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/date";
import { canPerformAction, type PunchAction } from "@/lib/attendance";
import { hashPin, isValidPinFormat, verifyPin } from "@/lib/pin";
import type { AttendanceRecord } from "@/generated/prisma/client";

export interface EmployeeOption {
  id: string;
  name: string;
}

/** Public roster for the "who are you?" picker — names only, no PIN state. */
export async function listEmployeeRoster(): Promise<EmployeeOption[]> {
  const today = startOfDay();
  const employees = await prisma.employee.findMany({
    where: {
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: today } }] },
        { OR: [{ endDate: null }, { endDate: { gte: today } }] },
      ],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return employees;
}

export async function getEmployeeAuthStatus(
  employeeId: string,
): Promise<{ hasPin: boolean } | { error: string }> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { pinHash: true },
  });
  if (!employee) {
    return { error: "Employee not found." };
  }
  return { hasPin: employee.pinHash != null };
}

export async function createEmployeePin(
  employeeId: string,
  pin: string,
  confirmPin: string,
): Promise<{ success: true } | { error: string }> {
  if (!isValidPinFormat(pin)) {
    return { error: "PIN must be exactly 4 digits." };
  }
  if (pin !== confirmPin) {
    return { error: "PINs don't match." };
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { pinHash: true },
  });
  if (!employee) {
    return { error: "Employee not found." };
  }
  if (employee.pinHash != null) {
    return { error: "A PIN is already set. Ask an admin to reset it." };
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { pinHash: hashPin(pin) },
  });

  return { success: true };
}

export async function verifyEmployeePin(
  employeeId: string,
  pin: string,
): Promise<{ success: true } | { error: string }> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { pinHash: true },
  });
  if (!employee || !employee.pinHash) {
    return { error: "Employee not found." };
  }

  if (!verifyPin(pin, employee.pinHash)) {
    return { error: "Incorrect PIN." };
  }

  return { success: true };
}

export async function getTodayRecord(employeeId: string) {
  const date = startOfDay();
  return prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date } },
  });
}

export async function punchAttendance(
  employeeId: string,
  action: PunchAction,
): Promise<
  | { error: string }
  | { record: AttendanceRecord; recordedAt: Date }
> {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) {
    return { error: "Employee not found." };
  }

  const date = startOfDay();
  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date } },
  });

  const current = existing ?? {
    clockIn: null,
    lunchStart: null,
    lunchEnd: null,
    clockOut: null,
  };

  if (!canPerformAction(current, action)) {
    return { error: "That action isn't available right now." };
  }

  const now = new Date();
  const record = await prisma.attendanceRecord.upsert({
    where: { employeeId_date: { employeeId, date } },
    create: { employeeId, date, [action]: now },
    update: { [action]: now },
  });

  return { record, recordedAt: now };
}
