"use server";

import { revalidatePath } from "next/cache";
import { createActivity, deleteActivity, updateActivity, type ActivityHourCategory, type ActivityStatus } from "../../lib/api";
import { parseBangkokDateTime } from "../../lib/format";
import { redirect } from "next/navigation";

export type CreateActivityState = {
  error?: string;
  success?: string;
};

export type ActivityFormState = CreateActivityState;

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isActivityHourCategory(value: string): value is ActivityHourCategory {
  return value === "UNIVERSITY" || value === "FACULTY" || value === "FREE";
}

function isActivityStatus(value: string): value is ActivityStatus {
  return value === "DRAFT" || value === "PUBLISHED" || value === "CANCELLED";
}

export async function createActivityAction(
  _previousState: CreateActivityState,
  formData: FormData,
): Promise<CreateActivityState> {
  const title = formText(formData, "title");
  const startsAtValue = formText(formData, "startsAt");
  const endsAtValue = formText(formData, "endsAt");
  const startsAt = parseBangkokDateTime(startsAtValue);
  const endsAt = parseBangkokDateTime(endsAtValue);

  if (!title) return { error: "กรุณากรอกชื่อกิจกรรม" };
  if (!startsAtValue || Number.isNaN(startsAt.getTime())) {
    return { error: "กรุณาระบุวันและเวลาเริ่มกิจกรรมให้ถูกต้อง" };
  }
  if (!endsAtValue || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return { error: "วันและเวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มกิจกรรม" };
  }

  const registrationUrl = formText(formData, "registrationUrl");
  if (registrationUrl) {
    try {
      const url = new URL(registrationUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return { error: "ลิงก์สมัครต้องขึ้นต้นด้วย http:// หรือ https://" };
      }
    } catch {
      return { error: "กรุณากรอกลิงก์สมัครให้ถูกต้อง" };
    }
  }

  const registrationDeadlineValue = formText(formData, "registrationDeadline");
  const registrationDeadline = registrationDeadlineValue
    ? parseBangkokDateTime(registrationDeadlineValue)
    : undefined;
  if (
    registrationDeadline &&
    (Number.isNaN(registrationDeadline.getTime()) || registrationDeadline > startsAt)
  ) {
    return { error: "กำหนดปิดรับสมัครต้องไม่อยู่หลังเวลาเริ่มกิจกรรม" };
  }

  const activityHourCategoryValue = formText(formData, "activityHourCategory");
  const activityHoursValue = formText(formData, "activityHours");
  if (Boolean(activityHourCategoryValue) !== Boolean(activityHoursValue)) {
    return { error: "กรุณาระบุทั้งประเภทและจำนวนชั่วโมงกิจกรรม หรือเว้นว่างทั้งคู่" };
  }
  if (activityHourCategoryValue && !isActivityHourCategory(activityHourCategoryValue)) {
    return { error: "กรุณาเลือกประเภทชั่วโมงกิจกรรมให้ถูกต้อง" };
  }
  const activityHourCategory = isActivityHourCategory(activityHourCategoryValue)
    ? activityHourCategoryValue
    : undefined;

  const activityHours = activityHoursValue ? Number(activityHoursValue) : undefined;
  if (
    activityHours !== undefined &&
    (!Number.isFinite(activityHours) ||
      activityHours <= 0 ||
      !/^\d+(?:\.\d{1,2})?$/.test(activityHoursValue))
  ) {
    return { error: "จำนวนชั่วโมงต้องมากกว่า 0 และระบุทศนิยมได้ไม่เกิน 2 ตำแหน่ง" };
  }

  const result = await createActivity({
    title,
    description: formText(formData, "description") || undefined,
    location: formText(formData, "location") || undefined,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    registrationUrl: registrationUrl || undefined,
    registrationDeadline: registrationDeadline?.toISOString(),
    activityHourCategory,
    activityHours,
    status: "PUBLISHED" satisfies ActivityStatus,
  });

  if (!result.ok) return { error: `บันทึกกิจกรรมไม่สำเร็จ: ${result.message}` };

  revalidatePath("/");
  revalidatePath("/manage");
  return { success: "เผยแพร่กิจกรรมแล้ว นักศึกษาสามารถเห็นกิจกรรมนี้ได้" };
}

export async function updateActivityAction(
  _previousState: ActivityFormState,
  formData: FormData,
): Promise<ActivityFormState> {
  const id = formText(formData, "id");
  const title = formText(formData, "title");
  const startsAtValue = formText(formData, "startsAt");
  const endsAtValue = formText(formData, "endsAt");
  const startsAt = parseBangkokDateTime(startsAtValue);
  const endsAt = parseBangkokDateTime(endsAtValue);

  if (!id) return { error: "ไม่พบรหัสประกาศที่ต้องการแก้ไข" };
  if (!title) return { error: "กรุณากรอกชื่อกิจกรรม" };
  if (!startsAtValue || Number.isNaN(startsAt.getTime())) {
    return { error: "กรุณาระบุวันและเวลาเริ่มกิจกรรมให้ถูกต้อง" };
  }
  if (!endsAtValue || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
    return { error: "วันและเวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มกิจกรรม" };
  }

  const registrationUrl = formText(formData, "registrationUrl");
  if (registrationUrl) {
    try {
      const url = new URL(registrationUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") {
        return { error: "ลิงก์สมัครต้องขึ้นต้นด้วย http:// หรือ https://" };
      }
    } catch {
      return { error: "กรุณากรอกลิงก์สมัครให้ถูกต้อง" };
    }
  }

  const registrationDeadlineValue = formText(formData, "registrationDeadline");
  const registrationDeadline = registrationDeadlineValue
    ? parseBangkokDateTime(registrationDeadlineValue)
    : null;
  if (
    registrationDeadline &&
    (Number.isNaN(registrationDeadline.getTime()) || registrationDeadline > startsAt)
  ) {
    return { error: "กำหนดปิดรับสมัครต้องไม่อยู่หลังเวลาเริ่มกิจกรรม" };
  }

  const categoryValue = formText(formData, "activityHourCategory");
  const hoursValue = formText(formData, "activityHours");
  const statusValue = formText(formData, "status");
  if (!isActivityStatus(statusValue)) return { error: "กรุณาเลือกสถานะประกาศให้ถูกต้อง" };
  if (Boolean(categoryValue) !== Boolean(hoursValue)) {
    return { error: "กรุณาระบุทั้งประเภทและจำนวนชั่วโมงกิจกรรม หรือเว้นว่างทั้งคู่" };
  }
  if (categoryValue && !isActivityHourCategory(categoryValue)) {
    return { error: "กรุณาเลือกประเภทชั่วโมงกิจกรรมให้ถูกต้อง" };
  }
  const hours = hoursValue ? Number(hoursValue) : null;
  if (
    hours !== null &&
    (!Number.isFinite(hours) || hours <= 0 || !/^\d+(?:\.\d{1,2})?$/.test(hoursValue))
  ) {
    return { error: "จำนวนชั่วโมงต้องมากกว่า 0 และระบุทศนิยมได้ไม่เกิน 2 ตำแหน่ง" };
  }

  const result = await updateActivity(id, {
    title,
    description: formText(formData, "description") || null,
    location: formText(formData, "location") || null,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    registrationUrl: registrationUrl || null,
    registrationDeadline: registrationDeadline?.toISOString() ?? null,
    activityHourCategory: isActivityHourCategory(categoryValue) ? categoryValue : null,
    activityHours: hours,
    status: statusValue,
  });

  if (!result.ok) return { error: `แก้ไขประกาศไม่สำเร็จ: ${result.message}` };
  revalidatePath("/");
  revalidatePath("/manage");
  redirect("/manage?updated=1");
}

export async function deleteActivityAction(
  _previousState: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  const id = formText(formData, "id");
  if (!id) return { error: "ไม่พบรหัสประกาศที่ต้องการลบ" };

  const result = await deleteActivity(id);
  if (!result.ok) return { error: `ลบประกาศไม่สำเร็จ: ${result.message}` };
  revalidatePath("/");
  revalidatePath("/manage");
  redirect("/manage?deleted=1");
}
