/** Every time on screen is Bangkok time, whatever the server's clock says. */
const TIME_ZONE = "Asia/Bangkok";
const DATE_TIME_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function parseBangkokDateTime(value: string): Date {
  const wallTime = new Date(`${value}Z`);
  if (Number.isNaN(wallTime.getTime())) return wallTime;

  const parts = DATE_TIME_PARTS_FORMATTER.formatToParts(wallTime);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  const bangkokTimeAsUtc = Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second"),
  );

  return new Date(wallTime.getTime() * 2 - bangkokTimeAsUtc);
}

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