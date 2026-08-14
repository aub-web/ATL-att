"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseDateInputValue, parseDateTimeInputValue } from "@/lib/date";
import { Prisma } from "@/generated/prisma/client";

function parseDateTimeLocal(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  const date = parseDateTimeInputValue(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function safeReturnPath(value: FormDataEntryValue | null): string {
  if (typeof value === "string" && value.startsWith("/admin")) return value;
  return "/admin";
}

export async function updateAttendanceRecord(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));

  await prisma.attendanceRecord.update({
    where: { id },
    data: {
      clockIn: parseDateTimeLocal(formData.get("clockIn")),
      lunchStart: parseDateTimeLocal(formData.get("lunchStart")),
      lunchEnd: parseDateTimeLocal(formData.get("lunchEnd")),
      clockOut: parseDateTimeLocal(formData.get("clockOut")),
    },
  });

  revalidatePath("/admin");
  redirect(returnTo);
}

export async function deleteAttendanceRecord(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = safeReturnPath(formData.get("returnTo"));

  await prisma.attendanceRecord.delete({ where: { id } });

  revalidatePath("/admin");
  redirect(returnTo);
}

export type CreateRecordState = { error: string } | null;

export async function createAttendanceRecord(
  _prevState: CreateRecordState,
  formData: FormData,
): Promise<CreateRecordState> {
  await requireAdmin();
  const employeeId = String(formData.get("employeeId") ?? "");
  const dateValue = String(formData.get("date") ?? "");

  if (!employeeId || !dateValue) {
    return { error: "Choose an employee and a date." };
  }

  const date = parseDateInputValue(dateValue);

  const existing = await prisma.attendanceRecord.findUnique({
    where: { employeeId_date: { employeeId, date } },
  });
  if (existing) {
    redirect(`/admin/records/${existing.id}`);
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      employeeId,
      date,
      clockIn: parseDateTimeLocal(formData.get("clockIn")),
      lunchStart: parseDateTimeLocal(formData.get("lunchStart")),
      lunchEnd: parseDateTimeLocal(formData.get("lunchEnd")),
      clockOut: parseDateTimeLocal(formData.get("clockOut")),
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/records/${record.id}`);
}

export type AddEmployeeState = { error: string } | null;

function normalizeOptionalEmail(value: FormDataEntryValue | null): string | null {
  const trimmed = String(value ?? "").trim().toLowerCase();
  return trimmed === "" ? null : trimmed;
}

export async function addEmployee(
  _prevState: AddEmployeeState,
  formData: FormData,
): Promise<AddEmployeeState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeOptionalEmail(formData.get("email"));

  if (!name) {
    return { error: "Name is required." };
  }

  try {
    // No PIN is set here — the employee chooses their own PIN the first
    // time they select their name on the clock-in page.
    await prisma.employee.create({ data: { name, email } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "An employee with that email already exists." };
    }
    throw err;
  }

  revalidatePath("/admin/roster");
  revalidatePath("/");
  return null;
}

export type UpdateEmployeeState = { error: string } | null;

export async function updateEmployeeProfile(
  _prevState: UpdateEmployeeState,
  formData: FormData,
): Promise<UpdateEmployeeState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeOptionalEmail(formData.get("email"));
  const startDateValue = String(formData.get("startDate") ?? "").trim();
  const startDate = startDateValue ? parseDateInputValue(startDateValue) : null;
  const endDateValue = String(formData.get("endDate") ?? "").trim();
  const endDate = endDateValue ? parseDateInputValue(endDateValue) : null;

  if (!name) {
    return { error: "Name is required." };
  }

  try {
    await prisma.employee.update({ where: { id }, data: { name, email, startDate, endDate } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { error: "An employee with that email already exists." };
    }
    throw err;
  }

  revalidatePath("/admin/roster");
  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin/roster");
}

export async function resetEmployeePin(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.employee.update({ where: { id }, data: { pinHash: null } });
  revalidatePath("/admin/roster");
}

export async function removeEmployee(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await prisma.employee.delete({ where: { id } });
  revalidatePath("/admin/roster");
  revalidatePath("/admin");
  revalidatePath("/");
}
