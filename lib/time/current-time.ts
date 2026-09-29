export interface CurrentDateTime {
  iso: string;
  date: string;
  time: string;
  dayOfWeek: string;
  timezone: string;
  unixTimestamp: number;
}

function getTimeZone(timeZone?: string): string {
  if (timeZone) return timeZone;
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function getCurrentDateTime(now = new Date(), timeZone?: string): CurrentDateTime {
  const resolvedTimeZone = getTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolvedTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    weekday: 'long',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    iso: now.toISOString(),
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`,
    dayOfWeek: values.weekday,
    timezone: resolvedTimeZone,
    unixTimestamp: now.getTime(),
  };
}

export function getRelativeDate(dateLabel: string, now = new Date(), timeZone?: string): string | undefined {
  const value = dateLabel.toLowerCase();
  const current = getCurrentDateTime(now, timeZone);
  const date = new Date(`${current.date}T12:00:00`);

  if (value.includes('tomorrow')) date.setDate(date.getDate() + 1);
  else if (value.includes('today')) return current.date;
  else if (value.includes('yesterday')) date.setDate(date.getDate() - 1);
  else if (value.includes('next week')) date.setDate(date.getDate() + 7);
  else {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const target = weekdays.findIndex((weekday) => value.includes(`next ${weekday}`));
    if (target === -1) return undefined;
    const daysAhead = (target - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + daysAhead);
  }

  return date.toISOString().slice(0, 10);
}