import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Shell from "../_components/Shell";
import { canManageActivities, getMe, listActivities } from "../../lib/api";
import { formatSlot } from "../../lib/format";
import CreateActivityForm from "./CreateActivityForm";
import DeleteActivityButton from "./DeleteActivityButton";

export const dynamic = "force-dynamic";

export default async function ManageActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; deleted?: string }>;
}) {
  const me = await getMe();
  if (!me.ok) redirect("/");
  if (!canManageActivities(me.data)) notFound();
  const [activities, params] = await Promise.all([listActivities(), searchParams]);

  return (
    <Shell me={me.data} active="manage">
      <div className="page-head">
        <h1>โพสต์กิจกรรม</h1>
        <p className="muted">
          เพิ่มประกาศกิจกรรมให้นักศึกษาดูได้ และแนบลิงก์สมัครของผู้จัดกิจกรรม
        </p>
      </div>

      {params.updated && <p className="alert alert-ok" role="status">บันทึกการแก้ไขแล้ว</p>}
      {params.deleted && <p className="alert alert-ok" role="status">ลบประกาศแล้ว</p>}

      <section className="card">
        <CreateActivityForm />
      </section>

      <section className="section">
        <div className="page-head">
          <h2>จัดการประกาศ</h2>
        </div>
        {!activities.ok ? (
          <p className="alert" role="alert">โหลดรายการประกาศไม่สำเร็จ: {activities.message}</p>
        ) : activities.data.length === 0 ? (
          <p className="muted">ยังไม่มีประกาศให้จัดการ</p>
        ) : (
          <div className="room-grid">
            {activities.data.map((activity) => (
              <article key={activity.id} className="card room-card">
                <div className="room-card-head">
                  <span className="badge">
                    {activity.status === "PUBLISHED"
                      ? "เผยแพร่"
                      : activity.status === "DRAFT"
                        ? "ฉบับร่าง"
                        : "ยกเลิก"}
                  </span>
                </div>
                <h3>{activity.title}</h3>
                <p className="muted">{formatSlot(activity.startsAt, activity.endsAt)}</p>
                <div className="form-row">
                  <Link className="btn btn-secondary" href={`/manage/${encodeURIComponent(activity.id)}`}>
                    แก้ไข
                  </Link>
                  <DeleteActivityButton id={activity.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}
