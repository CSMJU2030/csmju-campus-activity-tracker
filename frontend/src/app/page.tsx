import { getHealth, getMe, listActivities } from "../lib/api";
import { formatSlot } from "../lib/format";
import Shell from "./_components/Shell";

const CORE_HUB_WEB_URL = process.env.CORE_HUB_WEB_URL ?? "http://127.0.0.1:3100";
const SUBSYSTEM_ID = process.env.SUBSYSTEM_ID ?? "csmju-campus-activity-tracker";

/**
 * The subsystem has no sign-in form of its own (SEC-05): the button sends the
 * browser to Core Hub's SSO launcher, which signs the user in if needed and
 * redirects back to /auth/callback here with a Core Hub token.
 */
const ssoUrl = `${CORE_HUB_WEB_URL}/api/sso/${encodeURIComponent(SUBSYSTEM_ID)}`;

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const me = await getMe();
  if (!me.ok) return <SignedOut reason={me.status === 401 ? null : me.message} />;

  const activities = await listActivities("PUBLISHED");

  return (
    <Shell me={me.data} active="activities">
      <div className="page-head">
        <h1>กิจกรรมทั้งหมด</h1>
        <p className="muted">ประกาศกิจกรรมของคณะ · กดปุ่มสมัครเพื่อไปยังแบบฟอร์มของผู้จัดกิจกรรม</p>
      </div>

      {!activities.ok ? (
        <p className="alert">โหลดรายการกิจกรรมไม่สำเร็จ: {activities.message}</p>
      ) : activities.data.length === 0 ? (
        <p className="muted">ยังไม่มีกิจกรรมที่ประกาศในตอนนี้</p>
      ) : (
        <div className="room-grid">
        {activities.data.map((activity) => (
            <div key={activity.id} className="card room-card">
              <div className="room-card-head">
                <span className="badge">{formatSlot(activity.startsAt, activity.endsAt)}</span>
              </div>
              <h2>{activity.title}</h2>
              {activity.location && <p className="muted">{activity.location}</p>}
              {activity.description && <p>{activity.description}</p>}
              {activity.registrationUrl && (
                <p>
                  <a className="btn btn-primary" href={activity.registrationUrl} target="_blank" rel="noreferrer">
                    สมัครเข้าร่วม
                  </a>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}

async function SignedOut({ reason }: { reason: string | null }) {
  const health = await getHealth();

  return (
    <main className="page page-narrow">
      <section className="hero">
        <span className="brand-mark brand-mark-lg" aria-hidden>
          CS
        </span>
        <h1>ระบบแจ้งเตือนกิจกรรม</h1>
        <p className="muted">สาขาวิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยแม่โจ้ · Campus Activity Tracker</p>
      </section>

      <section className="card">
        <h2>เข้าสู่ระบบด้วยบัญชี CSMJU</h2>
        {reason && <p className="alert">{reason}</p>}
        <p>ระบบนี้ไม่มีหน้า login ของตัวเอง ใช้บัญชีเดียวกับ CSMJU Core Hub</p>
        <ol className="steps">
          <li>Core Hub ให้ login (ถ้ายังไม่ได้ login)</li>
          <li>Core Hub ตรวจว่า role ของคุณเข้าระบบนี้ได้ แล้วส่ง token กลับมาที่ /auth/callback</li>
          <li>ระบบนี้ตรวจลายเซ็น RS256 ผ่าน JWKS แล้วตั้งคุกกี้ HttpOnly</li>
        </ol>
        <p>
          <a className="btn btn-primary" href={ssoUrl}>
            เข้าสู่ระบบผ่าน CSMJU Core Hub
          </a>
        </p>
        <p className="muted small">
          สถานะ backend:{" "}
          <span className={`badge ${health?.status === "ok" ? "badge-ok" : "badge-err"}`}>
            {health ? `${health.status} · ${health.service ?? "-"}` : "ติดต่อไม่ได้"}
          </span>
        </p>
      </section>
    </main>
  );
}