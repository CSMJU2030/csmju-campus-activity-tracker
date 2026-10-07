"use client";

import { useActionState } from "react";
import { deleteActivityAction } from "./actions";

export default function DeleteActivityButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteActivityAction, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("ลบประกาศนี้ใช่ไหม? การลบไม่สามารถย้อนกลับได้")) {
          event.preventDefault();
        }
      }}
    >
      <input name="id" type="hidden" value={id} />
      {state.error && <p className="alert" role="alert">{state.error}</p>}
      <button className="btn btn-secondary" type="submit" disabled={pending}>
        {pending ? "กำลังลบ..." : "ลบ"}
      </button>
    </form>
  );
}
