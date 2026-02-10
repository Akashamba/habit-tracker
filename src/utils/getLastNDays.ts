export function getLastNdates(n = 365) {
  const d = new Date();
  const dates: string[] = [];

  for (let i = 0; i < n; i++) {
    dates.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`,
    );

    d.setDate(d.getDate() - 1);
  }

  return dates;
}
