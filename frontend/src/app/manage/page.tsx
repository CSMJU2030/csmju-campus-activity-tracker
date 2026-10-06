import { notFound, redirect } from "next/navigation";
import Shell from "../_components/Shell";
import { canManageActivities, getMe } from "../../lib/api";
import CreateActivityForm from "./CreateActivityForm";

export const dynamic = "force-dynamic";

export default async function ManageActivitiesPage() {
  const me = await getMe();
  if (!me.ok) redirect("/");
  if (!canManageActivities(me.data)) notFound();

  return (
    <Shell me={me.data} active="manage">
      <div className="page-head">
        <h1>โพสต์กิจกรรม</h1>
        <p className="muted">
          เพิ่มประกาศกิจกรรมให้นักศึกษาดูได้ และแนบลิงก์สมัครของผู้จัดกิจกรรม
        </p>
      </div>

      <section className="card">
        <CreateActivityForm />
      </section>
    </Shell>
  );
}
