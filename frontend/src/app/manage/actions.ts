"use server";

import { revalidatePath } from "next/cache";
import { createActivity, type ActivityStatus } from "../../lib/api";
import { parseBangkokDateTime } from "../../lib/format";

export type CreateActivityState = {
  error?: string;
  success?: string;
};

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
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

  const result = await createActivity({
    title,
    description: formText(formData, "description") || undefined,
    location: formText(formData, "location") || undefined,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    registrationUrl: registrationUrl || undefined,
    registrationDeadline: registrationDeadline?.toISOString(),
    status: "PUBLISHED" satisfies ActivityStatus,
  });

  if (!result.ok) return { error: `บันทึกกิจกรรมไม่สำเร็จ: ${result.message}` };

  revalidatePath("/");
  revalidatePath("/manage");
  return { success: "เผยแพร่กิจกรรมแล้ว นักศึกษาสามารถเห็นกิจกรรมนี้ได้" };
}
