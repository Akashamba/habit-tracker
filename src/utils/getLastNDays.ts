import { toUTCDateString } from "./getUTCDate";

export function getLastNdates(n = 365) {
  const d = new Date();
  const dates: string[] = [];

  for (let i = 0; i < n; i++) {
    dates.push(toUTCDateString(d));

    d.setDate(d.getDate() - 1);
  }

  return dates;
}
