import { SubsystemRole } from './core-hub-identity';

/**
 * Subsystem permissions (spec §16).
 *
 *   Core JWT -> Core Role -> Subsystem Role -> Permission -> Business Operation
 *
 * Business code asks for a permission, never for `role === 'admin'`.
 * `:own` variants are scope hints: the guard lets the request through and the
 * service performs the ownership check against business data.
 */
export enum Permission {
  /**
   * Rooms themselves are Core Hub reference data: they are added and closed in
   * the Core Hub backoffice, so this subsystem has no room:create/update.
   */
  ROOM_READ = 'room:read',

  BOOKING_READ_ANY = 'booking:read:any',
  BOOKING_READ_OWN = 'booking:read:own',
  BOOKING_CREATE = 'booking:create',
  BOOKING_CANCEL_ANY = 'booking:cancel:any',
  BOOKING_CANCEL_OWN = 'booking:cancel:own',
  /** Approve or reject a pending booking. */
  BOOKING_REVIEW = 'booking:review',

  ACTIVITY_READ = 'activity:read',
  ACTIVITY_CREATE = 'activity:create',
  ACTIVITY_UPDATE = 'activity:update',
}

/** Students book rooms for themselves and follow their own requests. */
const STUDENT_PERMISSIONS: Permission[] = [
  Permission.ROOM_READ,
  Permission.BOOKING_READ_OWN,
  Permission.BOOKING_CREATE,
  Permission.BOOKING_CANCEL_OWN,
  Permission.ACTIVITY_READ,
];

/** Alumni may look at rooms but not book them. */
const ALUMNI_PERMISSIONS: Permission[] = [Permission.ROOM_READ, Permission.ACTIVITY_READ];

/** Staff run the bookings: they see and review every request. */
const STAFF_PERMISSIONS: Permission[] = [
  Permission.ROOM_READ,
  Permission.BOOKING_READ_ANY,
  Permission.BOOKING_READ_OWN,
  Permission.BOOKING_CREATE,
  Permission.BOOKING_CANCEL_ANY,
  Permission.BOOKING_CANCEL_OWN,
  Permission.BOOKING_REVIEW,
  Permission.ACTIVITY_READ,
  Permission.ACTIVITY_CREATE,
  Permission.ACTIVITY_UPDATE,
];

const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Readonly<Record<SubsystemRole, readonly Permission[]>> =
  Object.freeze({
    [SubsystemRole.STUDENT]: Object.freeze(STUDENT_PERMISSIONS),
    [SubsystemRole.ALUMNI]: Object.freeze(ALUMNI_PERMISSIONS),
    [SubsystemRole.STAFF]: Object.freeze(STAFF_PERMISSIONS),
    [SubsystemRole.ADMIN]: Object.freeze(ADMIN_PERMISSIONS),
  });

/** Does this subsystem role hold the given permission? */
export function can(role: SubsystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Does this subsystem role hold at least one of the given permissions? */
export function canAny(role: SubsystemRole, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}