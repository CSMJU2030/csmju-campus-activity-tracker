import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Shell from "../../_components/Shell";
import { canManageActivities, getActivity, getMe } from "../../../lib/api";
import CreateActivityForm from "../CreateActivityForm";

export const dynamic = "force-dynamic";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMe();
  if (!me.ok) redirect("/");
  if (!canManageActivities(me.data)) notFound();

  const { id } = await params;
  const result = await getActivity(id);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <Shell me={me.data} active="manage">
        <p className="alert" role="alert">โหลดประกาศไม่สำเร็จ: {result.message}</p>
        <Link href="/manage">กลับไปหน้าจัดการประกาศ</Link>
      </Shell>
    );
  }

  return (
    <Shell me={me.data} active="manage">
      <div className="page-head">
        <h1>แก้ไขประกาศ</h1>
        <p className="muted">แก้ไขรายละเอียดและสถานะการเผยแพร่ของกิจกรรม</p>
      </div>
      <section className="card">
        <CreateActivityForm activity={result.data} />
        <p><Link href="/manage">กลับไปหน้าจัดการประกาศ</Link></p>
      </section>
    </Shell>
  );
}
