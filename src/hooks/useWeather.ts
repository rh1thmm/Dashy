import { useQuery } from '@tanstack/react-query';
import { DEFAULT_CITY } from '../lib/constants';

interface WttrCurrent {
  temp_C: string;
  FeelsLikeC: string;
  humidity: string;
  windspeedKmph: string;
  pressure: string;
  weatherCode: string;
  weatherDesc: Array<{ value: string }>;
}

interface WttrHourly {
  weatherDesc: Array<{ value: string }>;
  weatherCode: string;
}

interface WttrDay {
  date: string;
  maxtempC: string;
  mintempC: string;
  hourly: WttrHourly[];
}

interface WttrNearestArea {
  areaName: Array<{ value: string }>;
  country: Array<{ value: string }>;
}

interface WttrResponse {
  current_condition: WttrCurrent[];
  weather: WttrDay[];
  nearest_area: WttrNearestArea[];
}

function toCondition(desc: string): string {
  const lower = desc.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('patchy')) return 'Rain';
  if (lower.includes('snow') || lower.includes('sleet') || lower.includes('blizzard')) return 'Snow';
  if (lower.includes('thunder') || lower.includes('storm')) return 'Thunderstorm';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'Clouds';
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return 'Mist';
  if (lower.includes('clear') || lower.includes('sunny')) return 'Clear';
  return 'Clouds';
}

function getDayName(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' });
}

export function useWeather(city: string = DEFAULT_CITY) {
  return useQuery({
    queryKey: ['weather', city],
    queryFn: async () => {
      const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data: WttrResponse = await res.json();

      const c = data.current_condition[0];
      const desc = c.weatherDesc[0]?.value || 'Clear';
      const location = data.nearest_area[0]?.areaName[0]?.value || city;

      const current = {
        temp: Math.round(Number(c.temp_C)),
        feelsLike: Math.round(Number(c.FeelsLikeC)),
        condition: toCondition(desc),
        location,
        humidity: Number(c.humidity),
        windSpeed: Math.round(Number(c.windspeedKmph) / 3.6 * 10) / 10,
        pressure: Number(c.pressure),
      };

      const forecast = data.weather
        .slice(0, 5)
        .map((w, i) => ({
          date: w.date,
          dayName: getDayName(w.date, i),
          min: Math.round(Number(w.mintempC)),
          max: Math.round(Number(w.maxtempC)),
          condition: toCondition(w.hourly[4]?.weatherDesc[0]?.value || 'Clear'),
        }));

      return { current, forecast };
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
