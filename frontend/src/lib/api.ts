import { cookies } from "next/headers";

/**
 * Server-only client for this subsystem's own backend. The browser never
 * calls the backend with a token of its own: pages and server actions
 * forward the HttpOnly SSO cookie, and the backend verifies it against the
 * Core Hub JWKS on every request.
 */
const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:3002";

/** Standard cookie name (auth-contract.md §5.1). */
export const SSO_COOKIE = "core_hub_access_token";

export type SubsystemRole = "STUDENT" | "ALUMNI" | "STAFF" | "ADMIN";

export type Me = {
  id: string;
  email: string;
  coreRole: string;
  subsystemRole: SubsystemRole;
};

export type ActivityStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";
export type ActivityHourCategory = "UNIVERSITY" | "FACULTY" | "FREE";

export type Activity = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  registrationUrl: string | null;
  registrationDeadline: string | null;
  activityHourCategory: ActivityHourCategory | null;
  activityHours: number | null;
  status: ActivityStatus;
  createdByCoreUserId: string;
  createdAt: string;
  updatedAt: string;
};

type Envelope<T> =
  | { success: true; data: T; meta?: Record<string, unknown> }
  | { success: false; error: { code: string; message: string } };

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

/** Staff and admins post/edit activities; the backend enforces it either way. */
export const canManageActivities = (me: Me) =>
  me.subsystemRole === "STAFF" || me.subsystemRole === "ADMIN";

export async function call<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<ApiResult<T>> {
  const token = (await cookies()).get(SSO_COOKIE)?.value;
  if (!token) return { ok: false, status: 401, message: "ยังไม่ได้เข้าสู่ระบบ" };

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Cookie: `${SSO_COOKIE}=${encodeURIComponent(token)}`,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 503, message: "เชื่อมต่อ backend ของระบบย่อยไม่ได้" };
  }

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (res.ok && body?.success) return { ok: true, data: body.data };
  return {
    ok: false,
    status: res.status,
    message: body && !body.success ? body.error.message : `HTTP ${res.status}`,
  };
}

/** GET /api/v1/me — the identity the backend verified from the Core Hub token. */
export const getMe = () => call<Me>("/api/v1/me");

export const listActivities = (status?: ActivityStatus) =>
  call<Activity[]>(`/api/v1/activities?limit=100${status ? `&status=${status}` : ""}`);
export const getActivity = (id: string) => call<Activity>(`/api/v1/activities/${encodeURIComponent(id)}`);
export const createActivity = (activity: {
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt: string;
  registrationUrl?: string;
  registrationDeadline?: string;
  activityHourCategory?: ActivityHourCategory;
  activityHours?: number;
  status: ActivityStatus;
}) => call<Activity>("/api/v1/activities", { method: "POST", body: activity });
export const updateActivity = (
  id: string,
  activity: {
    title: string;
    description: string | null;
    location: string | null;
    startsAt: string;
    endsAt: string;
    registrationUrl: string | null;
    registrationDeadline: string | null;
    activityHourCategory: ActivityHourCategory | null;
    activityHours: number | null;
    status: ActivityStatus;
  },
) => call<Activity>(`/api/v1/activities/${encodeURIComponent(id)}`, { method: "PATCH", body: activity });
export const deleteActivity = (id: string) =>
  call<Activity>(`/api/v1/activities/${encodeURIComponent(id)}`, { method: "DELETE" });

/** GET /api/health — public. */
export async function getHealth(): Promise<{ status: string; service?: string } | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, { cache: "no-store" });
    const body = (await res.json()) as Envelope<{ status: string; service?: string }>;
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}