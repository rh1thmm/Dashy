import React from 'react';
import { useWeather } from '../hooks/useWeather';
import {
  Cloud, CloudRain, CloudSnow, CloudLightning,
  Sun, Moon, CloudFog, Warning,
  Drop, Wind, Thermometer, Gauge
} from '@phosphor-icons/react';
import type { WidgetTier } from '../types';

function getWeatherIcon(condition: string, isDay: boolean = true, isCompact: boolean = false) {
  const props = { size: isCompact ? 24 : 32, weight: "thin" as const, color: "#121212" };
  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return <CloudRain {...props} />;
  if (lowerCondition.includes('snow')) return <CloudSnow {...props} />;
  if (lowerCondition.includes('thunderstorm')) return <CloudLightning {...props} />;
  if (lowerCondition.includes('cloud')) return <Cloud {...props} />;
  if (lowerCondition.includes('mist') || lowerCondition.includes('fog')) return <CloudFog {...props} />;
  if (lowerCondition.includes('clear')) return isDay ? <Sun {...props} /> : <Moon {...props} />;

  return <Sun {...props} />;
}

export function Weather({ city, tier = 'compact' }: { city?: string; tier?: WidgetTier }) {
  const { data, isLoading, isError } = useWeather(city);

  if (isLoading) return <div className="text-sm font-sans tracking-widest uppercase opacity-50">Loading</div>;
  if (isError || !data) return <div className="text-sm font-sans text-red-800"><Warning size={24} /></div>;

  if (tier === 'compact') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full relative">
        <div className="flex items-center gap-2">
          <span className="font-serif text-4xl font-normal tracking-tighter">{data.current.temp}°</span>
          {getWeatherIcon(data.current.condition, true, true)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full justify-between items-center py-2 relative">
      <div className="flex flex-col items-center mt-2">
        <div className="flex items-center gap-4">
          <span className={`font-serif font-normal tracking-tighter ${tier === 'expanded' ? 'text-7xl' : 'text-6xl'}`}>
            {data.current.temp}°
          </span>
          <div className="flex flex-col items-start justify-center">
            {getWeatherIcon(data.current.condition, !data.current.condition.toLowerCase().includes('clear'))}
            <span className="font-sans text-xs uppercase tracking-widest mt-1 opacity-70">
              {data.current.condition}
            </span>
          </div>
        </div>
        <div className="font-serif text-sm tracking-widest uppercase opacity-50 mt-2">
          {data.current.location}
        </div>
      </div>

      {/* Expanded metrics row */}
      {tier === 'expanded' && (
        <div className="grid grid-cols-4 gap-3 w-full max-w-[260px] mt-4 border-t-[1px] border-border pt-4">
          <Metric icon={<Thermometer size={14} weight="thin" />} label="Feels" value={`${data.current.feelsLike}°`} />
          <Metric icon={<Drop size={14} weight="thin" />} label="Humidity" value={`${data.current.humidity}%`} />
          <Metric icon={<Wind size={14} weight="thin" />} label="Wind" value={`${data.current.windSpeed}m/s`} />
          <Metric icon={<Gauge size={14} weight="thin" />} label="Pressure" value={`${data.current.pressure}hPa`} />
        </div>
      )}

      {/* Forecast */}
      <div className={`flex justify-between w-full mt-4 border-t-[1px] border-border pt-4 ${tier === 'expanded' ? 'max-w-[320px]' : 'max-w-[200px]'}`}>
        {data.forecast.slice(0, tier === 'expanded' ? 5 : 3).map((day, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <span className="font-sans text-[10px] uppercase tracking-widest opacity-60 mb-2">
              {day.dayName}
            </span>
            <div className="scale-75 opacity-80">
              {getWeatherIcon(day.condition)}
            </div>
            <div className="flex gap-2 font-sans text-xs mt-2">
              <span className="font-medium">{day.max}°</span>
              <span className="opacity-40">{day.min}°</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="opacity-40">{icon}</div>
      <span className="font-sans text-[9px] uppercase tracking-widest opacity-50">{label}</span>
      <span className="font-sans text-xs tracking-wide">{value}</span>
    </div>
  );
}
