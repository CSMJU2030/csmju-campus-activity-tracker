/** Every time on screen is Bangkok time, whatever the server's clock says. */
const TIME_ZONE = "Asia/Bangkok";

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: TIME_ZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** e.g. "จ. 29 ก.ย. 2569 · 13:00–15:00" */
export function formatSlot(startsAt: string, endsAt: string): string {
  return `${formatDate(startsAt)} · ${formatTime(startsAt)}–${formatTime(endsAt)}`;
}