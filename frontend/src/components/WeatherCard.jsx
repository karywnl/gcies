import { useState, useEffect } from 'react';
import { Wind, Droplets } from 'lucide-react';

const getWeatherInfo = (code) => {
    if (code === 0)  return { label: 'Clear Sky',    emoji: '☀️' };
    if (code <= 3)   return { label: 'Partly Cloudy', emoji: '⛅' };
    if (code <= 48)  return { label: 'Foggy',         emoji: '🌫️' };
    if (code <= 55)  return { label: 'Drizzle',       emoji: '🌦️' };
    if (code <= 67)  return { label: 'Rainy',         emoji: '🌧️' };
    if (code <= 77)  return { label: 'Snowy',         emoji: '❄️' };
    if (code <= 82)  return { label: 'Showers',       emoji: '🌧️' };
    if (code <= 86)  return { label: 'Snow Showers',  emoji: '🌨️' };
    return                  { label: 'Thunderstorm',  emoji: '⛈️' };
};

const WeatherCard = ({ lat, lon }) => {
    const [weather, setWeather] = useState(null);
    const [error, setError]     = useState(false);

    useEffect(() => {
        if (lat == null || lon == null) return;
        setWeather(null);
        setError(false);

        fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m` +
            `&wind_speed_unit=kmh&timezone=auto`
        )
            .then(r => r.json())
            .then(d => {
                const c = d?.current;
                if (!c) { setError(true); return; }
                setWeather({
                    temp:     Math.round(c.temperature_2m),
                    code:     c.weather_code,
                    humidity: c.relative_humidity_2m,
                    wind:     Math.round(c.wind_speed_10m),
                });
            })
            .catch(() => setError(true));
    }, [lat, lon]);

    if (error) return null;

    const info = weather ? getWeatherInfo(weather.code) : null;

    return (
        <div
            className="compact-panel"
            style={{
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
            }}
        >
            {/* Label */}
            <span style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                flexShrink: 0,
            }}>
                Current Weather
            </span>

            {!weather ? (
                /* Loading skeleton — same horizontal shape */
                <>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--glass-border)', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                    <div style={{ width: '100px', height: '14px', borderRadius: '6px', background: 'var(--glass-border)', animation: 'pulse 1.5s infinite' }} />
                </>
            ) : (
                <>
                    {/* Emoji + temperature + condition */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{info.emoji}</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {weather.temp}°C
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {info.label}
                        </span>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <Droplets size={13} color="var(--primary)" />
                            {weather.humidity}% humidity
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            <Wind size={13} color="#10b981" />
                            {weather.wind} km/h
                        </span>
                    </div>

                    {/* Source attribution */}
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        Live · Open-Meteo
                    </span>
                </>
            )}
        </div>
    );
};

export default WeatherCard;
