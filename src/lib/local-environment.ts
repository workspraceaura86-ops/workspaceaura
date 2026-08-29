/**
 * Local environmental context — Open-Meteo (free, no key).
 *
 * IMPORTANT: temperature, humidity and air quality here describe the *general
 * outdoor conditions for the user's area*, based on browser geolocation. They
 * are NOT measurements of the workspace. That is why each is weighted only 10%
 * in the Aura Score, while the desk-side distance sensor carries 70%.
 */

export type LocalEnvironment = {
  temperature: number;
  humidity: number;
  aqi: number;
  latitude: number;
  longitude: number;
};

export async function getCoords(): Promise<{ latitude: number; longitude: number }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not available in this browser.");
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      (e) => reject(new Error(e.message || "Location permission denied.")),
      { timeout: 12000, maximumAge: 10 * 60_000 },
    );
  });
}

export async function fetchLocalEnvironment(
  latitude: number,
  longitude: number,
): Promise<LocalEnvironment> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m`;
  const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm2_5,pm10,us_aqi`;

  const [weatherRes, airRes] = await Promise.all([fetch(weatherUrl), fetch(airUrl)]);
  if (!weatherRes.ok) throw new Error("Weather service unavailable.");
  const weather = (await weatherRes.json()) as {
    current?: { temperature_2m?: number; relative_humidity_2m?: number };
  };
  const air = airRes.ok
    ? ((await airRes.json()) as { current?: { us_aqi?: number } })
    : { current: undefined };

  return {
    temperature: weather.current?.temperature_2m ?? 22,
    humidity: weather.current?.relative_humidity_2m ?? 45,
    aqi: air.current?.us_aqi ?? 40,
    latitude,
    longitude,
  };
}
