import { useQuery } from '@tanstack/react-query';
import { WEATHER_API_KEY, DEFAULT_CITY } from '../lib/constants';

interface CurrentWeather {
  main: { temp: number; feels_like: number; pressure: number; humidity: number };
  wind: { speed: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  name: string;
}

interface ForecastItem {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; pressure: number; humidity: number };
  wind: { speed: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  dt_txt: string;
}

interface Forecast {
  list: ForecastItem[];
}

export function useWeather(city: string = DEFAULT_CITY) {
  return useQuery({
    queryKey: ['weather', city],
    queryFn: async () => {
      const effectiveKey = (typeof localStorage !== 'undefined' && localStorage.getItem('monolith_owm_key')) || WEATHER_API_KEY;

      const [currentRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${effectiveKey}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${effectiveKey}`)
      ]);

      if (!currentRes.ok || !forecastRes.ok) {
        console.warn('Weather API failed, likely due to a new or invalid API key. Falling back to mock data.');
        const nextDays = Array.from({length: 5}).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i + 1);
          return d;
        });

        return {
          current: {
            temp: 18,
            feelsLike: 17,
            condition: 'Clear',
            icon: '01d',
            location: city || DEFAULT_CITY,
            humidity: 53,
            windSpeed: 4.1,
            pressure: 1013,
            isMock: true
          },
          forecast: nextDays.map(date => ({
            date: date.toISOString().split('T')[0],
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            min: 12 + Math.floor(Math.random() * 5),
            max: 20 + Math.floor(Math.random() * 5),
            condition: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
            icon: '01d'
          }))
        };
      }

      const current: CurrentWeather = await currentRes.json();
      const forecast: Forecast = await forecastRes.json();

      const dailyForecasts = new Map<string, { min: number; max: number; weather: any }>();
      const today = new Date().toISOString().split('T')[0];

      for (const item of forecast.list) {
        const date = item.dt_txt.split(' ')[0];
        if (date === today) continue;
        if (dailyForecasts.size >= 5 && !dailyForecasts.has(date)) break;
        if (!dailyForecasts.has(date)) {
          dailyForecasts.set(date, {
            min: item.main.temp_min,
            max: item.main.temp_max,
            weather: item.weather[0],
          });
        } else {
          const existing = dailyForecasts.get(date)!;
          existing.min = Math.min(existing.min, item.main.temp_min);
          existing.max = Math.max(existing.max, item.main.temp_max);
        }
      }

      return {
        current: {
          temp: Math.round(current.main.temp),
          feelsLike: Math.round(current.main.feels_like),
          condition: current.weather[0].main,
          icon: current.weather[0].icon,
          location: current.name,
          humidity: current.main.humidity,
          windSpeed: current.wind.speed,
          pressure: current.main.pressure,
          isMock: false,
        },
        forecast: Array.from(dailyForecasts.entries()).map(([date, data]) => ({
          date,
          dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          min: Math.round(data.min),
          max: Math.round(data.max),
          condition: data.weather.main,
          icon: data.weather.icon
        }))
      };
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
