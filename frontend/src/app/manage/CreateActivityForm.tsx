"use client";

import { useActionState } from "react";
import { createActivityAction, updateActivityAction, type ActivityFormState } from "./actions";
import type { Activity } from "../../lib/api";
import { toBangkokDateTimeLocal } from "../../lib/format";

const initialState: ActivityFormState = {};

export default function CreateActivityForm({ activity }: { activity?: Activity }) {
  const action = activity ? updateActivityAction : createActivityAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="form">
      {state.error && <p className="alert" role="alert">{state.error}</p>}
      {state.success && <p className="alert alert-ok" role="status">{state.success}</p>}
      {activity && <input name="id" type="hidden" value={activity.id} />}

      <label>
        <span>ชื่อกิจกรรม <span aria-hidden="true">*</span></span>
        <input name="title" type="text" maxLength={200} required defaultValue={activity?.title} />
      </label>

      <label>
        รายละเอียด
        <textarea name="description" rows={4} defaultValue={activity?.description ?? ""} />
      </label>

      <label>
        สถานที่
        <input name="location" type="text" maxLength={200} defaultValue={activity?.location ?? ""} />
      </label>

      <div className="form-row">
        <label>
          <span>วันและเวลาเริ่ม <span aria-hidden="true">*</span></span>
          <input name="startsAt" type="datetime-local" step={60} required
            defaultValue={activity ? toBangkokDateTimeLocal(activity.startsAt) : undefined} />
        </label>
        <label>
          <span>วันและเวลาสิ้นสุด <span aria-hidden="true">*</span></span>
          <input name="endsAt" type="datetime-local" step={60} required
            defaultValue={activity ? toBangkokDateTimeLocal(activity.endsAt) : undefined} />
        </label>
      </div>

      <label>
        ลิงก์สมัครภายนอก
        <input name="registrationUrl" type="url" placeholder="https://example.com/register"
          defaultValue={activity?.registrationUrl ?? ""} />
      </label>

      <label>
        กำหนดปิดรับสมัคร
        <input name="registrationDeadline" type="datetime-local" step={60}
          defaultValue={activity?.registrationDeadline ? toBangkokDateTimeLocal(activity.registrationDeadline) : ""} />
      </label>

      <div className="form-row">
        <label>
          ประเภทชั่วโมงกิจกรรม
          <select name="activityHourCategory" defaultValue={activity?.activityHourCategory ?? ""}>
            <option value="">ไม่ระบุ</option>
            <option value="UNIVERSITY">ชั่วโมงมหาวิทยาลัย</option>
            <option value="FACULTY">ชั่วโมงคณะ</option>
            <option value="FREE">ชั่วโมงเสรี</option>
          </select>
        </label>
        <label>
          จำนวนชั่วโมงกิจกรรม
          <input name="activityHours" type="number" min="0.01" step="0.01"
            defaultValue={activity?.activityHours ?? ""} />
        </label>
      </div>

      {activity && (
        <label>
          สถานะประกาศ
          <select name="status" defaultValue={activity.status}>
            <option value="PUBLISHED">เผยแพร่</option>
            <option value="DRAFT">ฉบับร่าง</option>
            <option value="CANCELLED">ยกเลิก</option>
          </select>
        </label>
      )}

      <p className="muted small">
        ชั่วโมงเป็นข้อมูลที่ผู้จัดระบุ ระบบไม่ได้คำนวณหรือรับรองชั่วโมงที่ได้รับจริง
        <br />
        เวลาที่ระบุเป็นเวลาไทย (Asia/Bangkok) นักศึกษาจะเห็นเฉพาะประกาศที่มีสถานะเผยแพร่ ช่องที่มีเครื่องหมาย * จำเป็นต้องกรอก
      </p>
      <div>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "กำลังบันทึก..." : activity ? "บันทึกการแก้ไข" : "บันทึกกิจกรรม"}
        </button>
      </div>
    </form>
  );
}
