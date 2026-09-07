// Time zone data ships with the browser's Intl/ICU runtime, so this catalog is
// available offline and stays aligned with the platform's IANA implementation.
const fallback = ['UTC', 'America/Edmonton', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland'];

export const TIMEZONES = typeof Intl.supportedValuesOf === 'function'
  ? Intl.supportedValuesOf('timeZone')
  : fallback;
