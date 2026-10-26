/* =========================================================
   weather.js - API 2: Open-Meteo weather API
   Shows the current weather (temperature, condition, icon,
   feels-like, humidity, wind) and a 3-day forecast for a
   selected city.

   Two free endpoints, no API key needed:
     1. Geocoding: city name  ->  latitude / longitude
        https://geocoding-api.open-meteo.com/v1/search
     2. Forecast:  latitude / longitude  ->  weather
        https://api.open-meteo.com/v1/forecast
   ========================================================= */

"use strict";

/*
  Open-Meteo returns a numeric "weather code" (WMO standard).
  This table turns each code into a text description, an
  OpenWeatherMap icon name and an emoji (used if the icon
  image cannot load).
*/
const WEATHER_CODES = {
  0: { text: "Clear sky", icon: "01", emoji: "☀️" },
  1: { text: "Mainly clear", icon: "02", emoji: "🌤️" },
  2: { text: "Partly cloudy", icon: "03", emoji: "⛅" },
  3: { text: "Overcast", icon: "04", emoji: "☁️" },
  45: { text: "Fog", icon: "50", emoji: "🌫️" },
  48: { text: "Freezing fog", icon: "50", emoji: "🌫️" },
  51: { text: "Light drizzle", icon: "09", emoji: "🌦️" },
  53: { text: "Drizzle", icon: "09", emoji: "🌦️" },
  55: { text: "Heavy drizzle", icon: "09", emoji: "🌧️" },
  56: { text: "Freezing drizzle", icon: "09", emoji: "🌧️" },
  57: { text: "Freezing drizzle", icon: "09", emoji: "🌧️" },
  61: { text: "Light rain", icon: "10", emoji: "🌦️" },
  63: { text: "Rain", icon: "10", emoji: "🌧️" },
  65: { text: "Heavy rain", icon: "10", emoji: "🌧️" },
  66: { text: "Freezing rain", icon: "13", emoji: "🌧️" },
  67: { text: "Freezing rain", icon: "13", emoji: "🌧️" },
  71: { text: "Light snow", icon: "13", emoji: "🌨️" },
  73: { text: "Snow", icon: "13", emoji: "❄️" },
  75: { text: "Heavy snow", icon: "13", emoji: "❄️" },
  77: { text: "Snow grains", icon: "13", emoji: "❄️" },
  80: { text: "Rain showers", icon: "09", emoji: "🌦️" },
  81: { text: "Rain showers", icon: "09", emoji: "🌧️" },
  82: { text: "Violent rain showers", icon: "09", emoji: "⛈️" },
  85: { text: "Snow showers", icon: "13", emoji: "🌨️" },
  86: { text: "Heavy snow showers", icon: "13", emoji: "🌨️" },
  95: { text: "Thunderstorm", icon: "11", emoji: "⛈️" },
  96: { text: "Thunderstorm with hail", icon: "11", emoji: "⛈️" },
  99: { text: "Thunderstorm with hail", icon: "11", emoji: "⛈️" }
};

function describeWeather(code) {
  return WEATHER_CODES[code] || { text: "Unknown", icon: "03", emoji: "🌡️" };
}

// The last city searched (used by the "Try again" button)
let lastCity = "Cairo";

// Counts requests so an old, slow answer never replaces a newer one
let weatherRequestId = 0;

function setupWeather() {
  const form = document.getElementById("weather-form");
  const select = document.getElementById("city-select");
  const input = document.getElementById("city-input");

  // Choosing a city from the list loads it straight away
  select.addEventListener("change", function () {
    input.value = "";
    loadWeather(select.value);
  });

  // Typing a city and pressing Search / Enter
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const city = input.value.trim();

    if (city === "") {
      showError(document.getElementById("weather-status"), "Please type a city name first.");
      input.focus();
      return;
    }
    loadWeather(city);
  });

  loadWeather(select.value);
}

/** Finds the city, then loads and displays its weather. */
async function loadWeather(city) {
  const status = document.getElementById("weather-status");
  const result = document.getElementById("weather-result");
  lastCity = city;
  const requestId = ++weatherRequestId;

  result.classList.add("hidden");
  showLoading(status, "Loading weather for " + city + "...");

  try {
    // Step 1: city name -> coordinates
    const geoUrl = "https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=" +
      encodeURIComponent(city);
    const geo = await fetchJSON(geoUrl);
    if (requestId !== weatherRequestId) {
      return; // a newer search has started
    }

    if (!geo.results || geo.results.length === 0) {
      showError(status, 'No city called "' + city + '" was found. Check the spelling and try again.');
      return;
    }
    const place = geo.results[0];

    // Step 2: coordinates -> current weather + 3-day forecast
    const weatherUrl = "https://api.open-meteo.com/v1/forecast" +
      "?latitude=" + place.latitude +
      "&longitude=" + place.longitude +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&forecast_days=4&timezone=auto";
    const weather = await fetchJSON(weatherUrl);
    if (requestId !== weatherRequestId) {
      return;
    }

    clearStatus(status);
    renderWeather(place, weather);
  } catch (error) {
    if (requestId !== weatherRequestId) {
      return;
    }
    showError(status, "Could not load the weather. " + error.message, function () {
      loadWeather(lastCity);
    });
  }
}

/** Builds the weather card from the API data. */
function renderWeather(place, weather) {
  const result = document.getElementById("weather-result");
  const current = weather.current;
  const units = weather.current_units;
  const info = describeWeather(current.weather_code);
  const dayOrNight = current.is_day ? "d" : "n";

  result.innerHTML = "";

  // Location line, e.g. "Cairo, Egypt"
  const location = el("p", "weather-location", place.name + (place.country ? ", " + place.country : ""));

  // Main row: icon + temperature + condition
  const main = el("div", "weather-main");
  main.append(
    createWeatherIcon(info, dayOrNight, 100),
    el("p", "weather-temp", Math.round(current.temperature_2m) + units.temperature_2m)
  );
  const condition = el("p", "weather-condition", info.text);

  // Details: feels like, humidity, wind
  const details = el("ul", "weather-details");
  details.append(
    el("li", "", "🌡️ Feels like " + Math.round(current.apparent_temperature) + units.apparent_temperature),
    el("li", "", "💧 Humidity " + current.relative_humidity_2m + units.relative_humidity_2m),
    el("li", "", "💨 Wind " + Math.round(current.wind_speed_10m) + " " + units.wind_speed_10m)
  );

  // Next 3 days (index 0 is today, so start at 1)
  const forecast = el("ul", "forecast");
  for (let i = 1; i < weather.daily.time.length; i++) {
    const dayInfo = describeWeather(weather.daily.weather_code[i]);
    const dayName = new Date(weather.daily.time[i] + "T12:00:00")
      .toLocaleDateString("en-US", { weekday: "short" });

    const day = el("li", "forecast-day");
    day.append(
      el("span", "forecast-name", dayName),
      createWeatherIcon(dayInfo, "d", 50),
      el("span", "forecast-temp",
        Math.round(weather.daily.temperature_2m_max[i]) + "° / " +
        Math.round(weather.daily.temperature_2m_min[i]) + "°")
    );
    day.title = dayInfo.text;
    forecast.append(day);
  }

  const updated = el("p", "api-updated", "Local time there: " + current.time.replace("T", " ") +
    " · Updated " + currentTime());

  result.append(location, main, condition, details, forecast, updated);
  result.classList.remove("hidden");
}

/**
 * Weather icon image (OpenWeatherMap icon set).
 * If the image fails to load, an emoji is shown instead.
 */
function createWeatherIcon(info, dayOrNight, size) {
  const img = el("img", "weather-icon");
  img.src = "https://openweathermap.org/img/wn/" + info.icon + dayOrNight + "@2x.png";
  img.alt = info.text;
  img.width = size;
  img.height = size;

  img.addEventListener("error", function () {
    // Clear skies at night show a moon instead of a sun
    const isClearNight = dayOrNight === "n" && (info.icon === "01" || info.icon === "02");
    const emoji = el("span", "weather-emoji", isClearNight ? "🌙" : info.emoji);
    emoji.style.fontSize = Math.round(size * 0.6) + "px";
    emoji.setAttribute("role", "img");
    emoji.setAttribute("aria-label", info.text);
    img.replaceWith(emoji);
  });

  return img;
}
