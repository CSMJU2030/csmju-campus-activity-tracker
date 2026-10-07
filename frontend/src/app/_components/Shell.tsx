import Link from "next/link";
import { canManageActivities, type Me } from "../../lib/api";

type NavKey = "activities" | "manage";

const CORE_HUB_WEB_URL = process.env.CORE_HUB_WEB_URL ?? "http://127.0.0.1:3100";

/** Header, navigation and the signed-in user, shared by every signed-in page. */
export default function Shell({
  me,
  active,
  children,
}: {
  me: Me;
  active: NavKey;
  children: React.ReactNode;
}) {
  const nav: Array<{ key: NavKey; href: string; label: string }> = [
    { key: "activities", href: "/", label: "กิจกรรมทั้งหมด" },
  ];
  if (canManageActivities(me)) {
    nav.push({ key: "manage", href: "/manage", label: "โพสต์กิจกรรม" });
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden>
              CA
            </span>
            <span>
              <strong>กิจกรรมในรั้วมหาวิทยาลัย</strong>
              <small>สาขาวิชาวิทยาการคอมพิวเตอร์ · Campus Activity Tracker</small>
            </span>
          </Link>

          <nav className="nav" aria-label="เมนูหลัก">
            {nav.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`nav-link${item.key === active ? " nav-link-active" : ""}`}
                aria-current={item.key === active ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
            <a className="nav-link" href={CORE_HUB_WEB_URL}>
              ← กลับ CSMJU Portal
            </a>
          </nav>

          <div className="user">
            <span className="user-text">
              <span>{me.email}</span>
              <small>{me.subsystemRole}</small>
            </span>
            <form action="/auth/logout" method="post">
              <button className="btn btn-secondary btn-sm" type="submit">
                ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="page">{children}</main>
    </>
  );
}

/** Result of the last form action, passed back as ?ok= / ?error=. */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <p className="alert" role="alert">{error}</p>;
  if (ok) return <p className="alert alert-ok" role="status">{ok}</p>;
  return null;
}