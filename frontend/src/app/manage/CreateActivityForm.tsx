"use client";

import { useActionState } from "react";
import { createActivityAction, type CreateActivityState } from "./actions";

const initialState: CreateActivityState = {};

export default function CreateActivityForm() {
  const [state, formAction, pending] = useActionState(createActivityAction, initialState);

  return (
    <form action={formAction} className="form">
      {state.error && <p className="alert" role="alert">{state.error}</p>}
      {state.success && <p className="alert alert-ok" role="status">{state.success}</p>}

      <label>
        <span>ชื่อกิจกรรม <span aria-hidden="true">*</span></span>
        <input name="title" type="text" maxLength={200} required />
      </label>

      <label>
        รายละเอียด
        <textarea name="description" rows={4} />
      </label>

      <label>
        สถานที่
        <input name="location" type="text" maxLength={200} />
      </label>

      <div className="form-row">
        <label>
          <span>วันและเวลาเริ่ม <span aria-hidden="true">*</span></span>
          <input name="startsAt" type="datetime-local" step={60} required />
        </label>
        <label>
          <span>วันและเวลาสิ้นสุด <span aria-hidden="true">*</span></span>
          <input name="endsAt" type="datetime-local" step={60} required />
        </label>
      </div>

      <label>
        ลิงก์สมัครภายนอก
        <input name="registrationUrl" type="url" placeholder="https://example.com/register" />
      </label>

      <label>
        กำหนดปิดรับสมัคร
        <input name="registrationDeadline" type="datetime-local" step={60} />
      </label>

      <p className="muted small">
        เวลาที่ระบุเป็นเวลาไทย (Asia/Bangkok) กิจกรรมจะเผยแพร่ให้นักศึกษาเห็นทันที ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก
      </p>
      <div>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก..." : "บันทึกกิจกรรม"}
        </button>
      </div>
    </form>
  );
}
