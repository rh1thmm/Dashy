import { useEffect, useState } from 'react';
import type { WidgetTier } from '../types';

function systemTimezone(): string | undefined {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function useAutomaticTimezone(requestedTimezone?: string): string {
  const systemZone = systemTimezone();
  const [locationZone, setLocationZone] = useState<string>();

  useEffect(() => {
    if (requestedTimezone && requestedTimezone !== 'auto' || !navigator.geolocation || !navigator.permissions) return;
    let cancelled = false;
    navigator.permissions.query({ name: 'geolocation' }).then(permission => {
      if (permission.state !== 'granted') return;
      navigator.geolocation.getCurrentPosition(async position => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=auto&forecast_days=1`);
          const data = await response.json() as { timezone?: string };
          if (!cancelled && data.timezone) setLocationZone(data.timezone);
        } catch { /* System timezone remains the reliable fallback. */ }
      });
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [requestedTimezone]);

  if (requestedTimezone && requestedTimezone !== 'auto') return requestedTimezone;
  // If location and system disagree, the system's configured clock wins.
  return systemZone || locationZone || 'UTC';
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function formatDigital(time: Date, tz: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit',
    hour12: true, timeZone: tz,
  }).format(time);
}

function formatTimeParts(time: Date, tz: string) {
  const h = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(time);
  const m = new Intl.DateTimeFormat('en-US', { minute: '2-digit', timeZone: tz }).format(time);
  return { hours: parseInt(h, 10), minutes: m };
}

function formatDay(time: Date, tz: string) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: tz }).format(time).toUpperCase();
}

function formatDate(time: Date, tz: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: tz }).format(time).toUpperCase();
}

export function Clock({ tier = 'compact', timezone }: { tier?: WidgetTier; timezone?: string }) {
  const tz = useAutomaticTimezone(timezone);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { hours, minutes } = formatTimeParts(time, tz);
  const digital = formatDigital(time, tz);

  const seconds = time.getSeconds();
  // Keep the rotation monotonically increasing. Using only 0–59 seconds made
  // 59 → 00 interpolate backwards across the entire clock face.
  const secondAngle = Math.floor(time.getTime() / 1000) * 6;
  const minuteAngle = parseInt(minutes, 10) * 6 + seconds * 0.1;
  const hourAngle = (hours % 12) * 30 + parseInt(minutes, 10) * 0.5;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {tier !== 'compact' && (
        <span className="font-sans text-2xl tracking-wider tabular-nums opacity-80 mb-1">{digital}</span>
      )}

      <div className={`flex items-center justify-center ${
        tier === 'compact' ? 'w-[60%] aspect-square' : 'w-4/5 max-w-[180px] flex-1'
      }`}>
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          {Array.from({ length: 60 }).map((_, i) => {
            const isMajor = i % 5 === 0;
            return (
              <line
                key={i}
                x1="50"
                y1={isMajor ? "5" : "8"}
                x2="50"
                y2={isMajor ? "12" : "10"}
                stroke="#121212"
                strokeWidth={isMajor ? "1" : "0.5"}
                transform={`rotate(${i * 6} 50 50)`}
                className="opacity-80"
              />
            );
          })}

          <line
            x1="50"
            y1="50"
            x2="50"
            y2="25"
            stroke="#121212"
            strokeWidth="1.5"
            strokeLinecap="square"
            transform={`rotate(${hourAngle} 50 50)`}
          />

          <line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke="#121212"
            strokeWidth="1"
            strokeLinecap="square"
            transform={`rotate(${minuteAngle} 50 50)`}
          />

          <line
            x1="50"
            y1="55"
            x2="50"
            y2="12"
            stroke="#4A4A4A"
            strokeWidth="0.5"
            strokeLinecap="square"
            transform={`rotate(${secondAngle} 50 50)`}
            className="transition-transform duration-[50ms] ease-linear"
          />

          <rect x="48.5" y="48.5" width="3" height="3" fill="#121212" />
        </svg>
      </div>
      {tier !== 'compact' && (
        <div className="flex flex-col items-center mt-2">
          <span className="font-serif text-xs tracking-[0.25em] opacity-60">{formatDay(time, tz)}</span>
          <span className="font-serif text-xs tracking-[0.2em] opacity-40">{formatDate(time, tz)}</span>
          {tier === 'expanded' && (
            <span className="font-serif text-[10px] tracking-[0.3em] opacity-30 mt-2">
              {getGreeting(hours)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
