import { describe, expect, it } from 'vitest';
import { getCurrentDateTime, getRelativeDate } from './current-time';

describe('current time', () => {
  const instant = new Date('2026-09-25T23:30:00.000Z');

  it('uses the configured timezone for the calendar date', () => {
    expect(getCurrentDateTime(instant, 'Asia/Kolkata')).toMatchObject({
      date: '2026-09-26',
      time: '05:00:00',
      timezone: 'Asia/Kolkata',
    });
  });

  it('resolves relative dates from the local calendar date', () => {
    expect(getRelativeDate('tomorrow', instant, 'Asia/Kolkata')).toBe('2026-09-27');
    expect(getRelativeDate('next monday', instant, 'Asia/Kolkata')).toBe('2026-09-28');
  });
});