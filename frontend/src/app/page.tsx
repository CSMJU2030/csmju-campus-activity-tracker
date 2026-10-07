import Link from "next/link";
import { getHealth, getMe, listActivities } from "../lib/api";
import { formatDate, formatSlot, formatTime } from "../lib/format";
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
      <section className="welcome-banner" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <span className="eyebrow">MAEJO UNIVERSITY · CAMPUS LIFE</span>
          <h1 id="welcome-title">เติมสีสันให้ทุกวัน<br />ด้วยกิจกรรมที่ใช่</h1>
          <p>สำรวจกิจกรรมที่น่าสนใจในรั้วมหาวิทยาลัย แล้วออกไปเก็บประสบการณ์ใหม่ด้วยกัน</p>
          <div className="welcome-note">
            <span className="welcome-note-mark" aria-hidden="true">CA</span>
            <span>พื้นที่รวมกิจกรรมสำหรับชาวแม่โจ้</span>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span className="art-orbit art-orbit-one" />
          <span className="art-orbit art-orbit-two" />
          <span className="art-card">
            <span className="art-card-label">CAMPUS</span>
            <span className="art-card-title">Make<br />memories.</span>
            <span className="art-card-footer">LEARN · MEET · GROW</span>
          </span>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <span className="eyebrow eyebrow-muted">WHAT'S ON</span>
          <h2>กิจกรรมที่กำลังเปิดอยู่</h2>
          <p className="muted">เลือกกิจกรรมที่สนใจ แล้วสมัครกับผู้จัดได้โดยตรง</p>
        </div>
        {activities.ok && (
          <span className="activity-count">
            <strong>{activities.data.length}</strong>
            <span>กิจกรรม</span>
          </span>
        )}
      </div>

      {!activities.ok ? (
        <p className="alert">โหลดรายการกิจกรรมไม่สำเร็จ: {activities.message}</p>
      ) : activities.data.length === 0 ? (
        <section className="empty-state card">
          <span className="empty-state-mark" aria-hidden="true">CA</span>
          <h3>กำลังเตรียมกิจกรรมใหม่</h3>
          <p className="muted">ตอนนี้ยังไม่มีกิจกรรมประกาศ รอติดตามข่าวสารได้ที่หน้านี้</p>
        </section>
      ) : (
        <div className="activity-grid">
          {activities.data.map((activity) => (
            <article key={activity.id} className="card activity-card">
              <div className="activity-card-top">
                <span className="badge">กิจกรรมที่เผยแพร่</span>
                {activity.activityHours !== null && activity.activityHourCategory && (
                  <span className="activity-hours">{activity.activityHours} ชั่วโมง</span>
                )}
              </div>
              <h3>{activity.title}</h3>
              {activity.description && <p className="activity-description">{activity.description}</p>}
              <div className="activity-details">
                <div className="activity-detail">
                  <span className="detail-label">วันและเวลา</span>
                  <time dateTime={activity.startsAt}>{formatSlot(activity.startsAt, activity.endsAt)}</time>
                </div>
                {activity.location && (
                  <div className="activity-detail">
                    <span className="detail-label">สถานที่</span>
                    <span>{activity.location}</span>
                  </div>
                )}
                {activity.registrationDeadline && (
                  <div className="activity-detail">
                    <span className="detail-label">ปิดรับสมัคร</span>
                    <time dateTime={activity.registrationDeadline}>
                      {formatDate(activity.registrationDeadline)} · {formatTime(activity.registrationDeadline)}
                    </time>
                  </div>
                )}
              </div>
              <div className="activity-card-footer">
                {activity.activityHourCategory && activity.activityHours !== null && (
                  <span className="hour-category">
                    {activity.activityHourCategory === "UNIVERSITY"
                      ? "ชั่วโมงมหาวิทยาลัย"
                      : activity.activityHourCategory === "FACULTY"
                        ? "ชั่วโมงคณะ"
                        : "ชั่วโมงเสรี"}
                  </span>
                )}
                {activity.registrationUrl ? (
                  <a className="btn btn-primary" href={activity.registrationUrl} target="_blank" rel="noreferrer">
                    สมัครเข้าร่วม <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  <span className="muted small">ติดตามรายละเอียดจากผู้จัด</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </Shell>
  );
}

async function SignedOut({ reason }: { reason: string | null }) {
  const health = await getHealth();

  return (
    <main className="signed-out-page">
      <section className="signed-out-layout">
        <div className="signed-out-intro">
          <Link href="/" className="brand signed-out-brand">
            <span className="brand-mark" aria-hidden="true">CA</span>
            <span><strong>Campus Activity Tracker</strong><small>MAEJO UNIVERSITY</small></span>
          </Link>
          <span className="eyebrow">CAMPUS LIFE, CONNECTED</span>
          <h1>ทุกกิจกรรมดี ๆ<br />เริ่มต้นที่นี่</h1>
          <p>ค้นพบพื้นที่เรียนรู้ ผู้คนใหม่ ๆ และประสบการณ์ที่ทำให้ชีวิตในมหาวิทยาลัยมีความหมาย</p>
          <div className="signed-out-art" aria-hidden="true">
            <span className="signed-out-art-ring" />
            <span className="signed-out-art-card">MEET<br /><strong>YOUR<br />PEOPLE</strong></span>
          </div>
          <span className="signed-out-caption">สาขาวิชาวิทยาการคอมพิวเตอร์ · มหาวิทยาลัยแม่โจ้</span>
        </div>
        <section className="card sign-in-card">
          <span className="eyebrow eyebrow-muted">WELCOME BACK</span>
          <h2>เข้าสู่ระบบ</h2>
          <p className="muted">ใช้บัญชี CSMJU ของคุณเพื่อสำรวจกิจกรรมและสมัครเข้าร่วม</p>
          {reason && <p className="alert" role="alert">{reason}</p>}
          <a className="btn btn-primary sign-in-button" href={ssoUrl}>
            เข้าสู่ระบบผ่าน CSMJU Core Hub <span aria-hidden="true">→</span>
          </a>
          <p className="sign-in-note">ระบบนี้ใช้การเข้าสู่ระบบกลางของ CSMJU อย่างปลอดภัย</p>
          <div className="backend-status">
            <span className="backend-status-label">สถานะการเชื่อมต่อ</span>
            <span className={`badge ${health?.status === "ok" ? "badge-ok" : "badge-err"}`}>
              {health ? `${health.status} · ${health.service ?? "-"}` : "ติดต่อ backend ไม่ได้"}
            </span>
          </div>
        </section>
      </section>
    </main>
  );
}