export function toUTCDateString(date: string | Date = new Date()) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export function toUTCDateISO(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
