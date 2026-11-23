// Birth date and time are stored as written on the clock and calendar there, without time zone.
const two = (n: number) => String(n).padStart(2, '0');

export const toDay = (d: Date) => `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
export const toTime = (d: Date) => `${two(d.getHours())}:${two(d.getMinutes())}`;
export const EARLIEST = new Date(1900, 0, 1, 12);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const readable = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
