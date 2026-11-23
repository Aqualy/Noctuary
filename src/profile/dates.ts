// Birth date and time are stored as written on the clock and calendar there, without time zone.
const two = (n: number) => String(n).padStart(2, '0');

export const toDay = (d: Date) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
export const toTime = (d: Date) => `${two(d.getHours())}:${two(d.getMinutes())}`;
export function fromDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
export function fromTime(time: string): Date {
  const [h, min] = time.split(':').map(Number);
  return new Date(2000, 0, 1, h, min);
}

export const EARLIEST = new Date(1900, 0, 1, 12);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const readable = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
