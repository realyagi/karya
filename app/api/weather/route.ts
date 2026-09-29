import { NextResponse } from 'next/server';

interface LocationResult { name?: string; latitude?: number; longitude?: number; country?: string; admin1?: string }

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim();
  if (!query) return NextResponse.json({ error: 'A city or location is required.' }, { status: 400 });
  const geocodeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${new URLSearchParams({ name: query, count: '1', language: 'en', format: 'json' })}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!geocodeResponse.ok) return NextResponse.json({ error: 'Weather location lookup failed.' }, { status: 502 });
  const locationData = await geocodeResponse.json() as { results?: LocationResult[] };
  const location = locationData.results?.[0];
  if (!location?.latitude || !location.longitude) return NextResponse.json({ error: `I could not find weather data for ${query}.` }, { status: 404 });
  const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude), current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m', hourly: 'precipitation_probability,temperature_2m', forecast_days: '2', timezone: 'auto' })}`, { cache: 'no-store', signal: AbortSignal.timeout(10_000) });
  if (!weatherResponse.ok) return NextResponse.json({ error: 'Weather provider failed.' }, { status: 502 });
  return NextResponse.json({ success: true, location: { name: location.name, country: location.country, region: location.admin1, latitude: location.latitude, longitude: location.longitude }, weather: await weatherResponse.json() });
}