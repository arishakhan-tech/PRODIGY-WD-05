 // ---------- CONFIG ----------
const  MY_API_KEY = "d5bc717564b39d374fd5da3a3ef1602c"; 
let UNITS = "metric"; // 'metric' => °C, 'imperial' => °F

// ---------- ELEMENTS ----------
const statusEl = document.getElementById("status");
const weatherCard = document.getElementById("weatherCard");
const iconEl = document.getElementById("icon");
const temperatureEl = document.getElementById("temperature");
const placeNameEl = document.getElementById("placeName");
const timestampEl = document.getElementById("timestamp");
const conditionEl = document.getElementById("condition");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const cloudsEl = document.getElementById("clouds");
const pressureEl = document.getElementById("pressure");
const sunriseEl = document.getElementById("sunrise");
const sunsetEl = document.getElementById("sunset");

const unitMetricBtn = document.getElementById("unitMetric");
const unitImperialBtn = document.getElementById("unitImperial");
const useMyLocationBtn = document.getElementById("useMyLocation");
const cityForm = document.getElementById("cityForm");
const cityInput = document.getElementById("cityInput");

// ---------- HELPERS ----------
function setStatus(msg = "") { statusEl.textContent = msg; }
function unitLabel() { return UNITS === "metric" ? "°C" : "°F"; }
function windUnit() { return UNITS === "metric" ? "m/s" : "mph"; }
function showCard(show) {
  weatherCard.classList.toggle("hidden", !show);
  weatherCard.setAttribute("aria-hidden", !show);
}

function fmtTime(ts, tzOffset) {
  // ts in seconds, tzOffset in seconds
  const d = new Date((ts + tzOffset) * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ---------- URL BUILDERS ----------
function urlByCity(city) {
  const base = "https://api.openweathermap.org/data/2.5/weather";
  const params = new URLSearchParams({ q: city, appid: MY_API_KEY, units: UNITS });
  return `${base}?${params.toString()}`;
}
function urlByCoords(lat, lon) {
  const base = "https://api.openweathermap.org/data/2.5/weather";
  const params = new URLSearchParams({ lat, lon, appid: MY_API_KEY, units: UNITS });
  return `${base}?${params.toString()}`;
}

// ---------- RENDER ----------
function renderWeather(data) {
  const {
    name,
    sys: { country, sunrise, sunset },
    weather,
    main: { temp, feels_like, humidity, pressure },
    wind,
    clouds,
    dt,
    timezone
  } = data;

  const iconCode = weather?.[0]?.icon ?? "01d";
  const desc = (weather?.[0]?.description ?? "—").replace(/\b\w/g, c => c.toUpperCase());

  iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  iconEl.alt = desc;

  placeNameEl.textContent = `${name ?? "—"}, ${country ?? ""}`.replace(/, $/, "");
  timestampEl.textContent = `Updated: ${new Date((dt + timezone) * 1000).toLocaleString()}`;
  temperatureEl.textContent = `${Math.round(temp)}${unitLabel()}`;
  conditionEl.textContent = desc;
  feelsLikeEl.textContent = `${Math.round(feels_like)}${unitLabel()}`;
  humidityEl.textContent = `${humidity}%`;
  windEl.textContent = `${Math.round(wind?.speed ?? 0)} ${windUnit()}`;
  cloudsEl.textContent = `${clouds?.all ?? 0}%`;
  pressureEl.textContent = `${pressure} hPa`;
  sunriseEl.textContent = fmtTime(sunrise, timezone);
  sunsetEl.textContent = fmtTime(sunset, timezone);

  showCard(true);
  setStatus("");
}

// ---------- FETCH ----------
async function fetchWeather(url) {
  try {
    setStatus("Fetching weather...");
    showCard(false);
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Request failed (${res.status})`);
    }
    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    setStatus(`⚠️ ${err.message}`);
    showCard(false);
  }
}

// ---------- EVENTS ----------
unitMetricBtn.addEventListener("click", () => {
  if (UNITS !== "metric") {
    UNITS = "metric"; unitMetricBtn.classList.add("active"); unitImperialBtn.classList.remove("active");
    const city = placeNameEl.textContent.split(",")[0]; if (city && city !== "—") fetchWeather(urlByCity(city));
  }
});
unitImperialBtn.addEventListener("click", () => {
  if (UNITS !== "imperial") {
    UNITS = "imperial"; unitImperialBtn.classList.add("active"); unitMetricBtn.classList.remove("active");
    const city = placeNameEl.textContent.split(",")[0]; if (city && city !== "—") fetchWeather(urlByCity(city));
  }
});

useMyLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) { setStatus("Geolocation not supported. Search by city."); return; }
  setStatus("Getting your location...");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetchWeather(urlByCoords(latitude, longitude));
    },
    () => { setStatus("Location permission denied or unavailable. Please search by city."); },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

cityForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  fetchWeather(urlByCity(city));
});

// Try to auto-detect once on load (non-blocking)
setTimeout(() => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => { const { latitude, longitude } = pos.coords; fetchWeather(urlByCoords(latitude, longitude)); },
      () => { /* silent fail */ }
    );
  }
}, 300);
