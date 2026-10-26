/* =========================================================
   api.js - Shared helpers used by every API widget
   (github.js, weather.js, quotes.js, news.js)

   - fetchJSON():   fetch + async/await with a timeout and
                    clear error messages
   - showLoading(), showError(), clearStatus():
                    consistent loading / error states
   - el():          safely builds DOM elements (uses textContent,
                    so text from an API can never inject HTML)
   - cache helpers: keep a short copy of API results in
                    sessionStorage to avoid hitting rate limits
   ========================================================= */

"use strict";

// How long to wait for an API before giving up (milliseconds)
const API_TIMEOUT = 10000;

/**
 * Custom error type so widgets can show a helpful message
 * depending on what went wrong (status code, timeout, offline...).
 */
class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status || 0;
  }
}

/**
 * Fetches a URL and returns the parsed JSON.
 * Throws an ApiError when the request fails, times out,
 * or the server answers with an error status (404, 500...).
 */
async function fetchJSON(url, options = {}) {
  // AbortController lets us cancel the request after API_TIMEOUT ms
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });

    if (!response.ok) {
      throw new ApiError(describeStatus(response.status), response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === "AbortError") {
      throw new ApiError("The request took too long and timed out.");
    }
    if (!navigator.onLine) {
      throw new ApiError("You appear to be offline. Check your internet connection.");
    }
    // Network failure (server down, blocked request, CORS problem...)
    throw new ApiError("Could not reach the server. Please try again in a moment.");
  } finally {
    clearTimeout(timer);
  }
}

// Turns an HTTP status code into a friendly sentence
function describeStatus(status) {
  if (status === 403 || status === 429) {
    return "Too many requests were made. Please wait a minute and try again.";
  }
  if (status === 404) {
    return "The requested data was not found (404).";
  }
  if (status >= 500) {
    return "The service is having problems right now (error " + status + ").";
  }
  return "The request failed (error " + status + ").";
}


/* ---------------------------------------------------------
   DOM HELPERS
   --------------------------------------------------------- */

/**
 * Creates an element with an optional class name and text.
 * Example: el("p", "repo-desc", "My description")
 */
function el(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined && text !== null) {
    element.textContent = text;
  }
  return element;
}

/** Shows a spinner and a "Loading..." message inside a status box. */
function showLoading(statusBox, text) {
  statusBox.innerHTML = "";
  statusBox.className = "api-status loading";
  statusBox.setAttribute("aria-busy", "true");

  const spinner = el("span", "spinner");
  spinner.setAttribute("aria-hidden", "true");
  statusBox.append(spinner, el("span", "", text || "Loading..."));
}

/**
 * Shows an error message with a "Try again" button.
 * onRetry is the function to run when the button is clicked.
 */
function showError(statusBox, message, onRetry) {
  statusBox.innerHTML = "";
  statusBox.className = "api-status error";
  statusBox.removeAttribute("aria-busy");

  statusBox.append(el("span", "status-icon", "⚠️"), el("span", "", message));

  if (onRetry) {
    const retryButton = el("button", "retry-btn", "Try again");
    retryButton.type = "button";
    retryButton.addEventListener("click", onRetry);
    statusBox.append(retryButton);
  }
}

/** Shows a neutral information message (e.g. "No results"). */
function showInfo(statusBox, message) {
  statusBox.innerHTML = "";
  statusBox.className = "api-status info";
  statusBox.removeAttribute("aria-busy");
  statusBox.append(el("span", "", message));
}

/** Empties a status box once the data has loaded. */
function clearStatus(statusBox) {
  statusBox.innerHTML = "";
  statusBox.className = "api-status";
  statusBox.removeAttribute("aria-busy");
}


/* ---------------------------------------------------------
   FORMAT HELPERS
   --------------------------------------------------------- */

/** "3 days ago", "5 hours ago"... from a date string or Date. */
function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];

  for (const [name, size] of units) {
    const amount = Math.floor(seconds / size);
    if (amount >= 1) {
      return amount + " " + name + (amount > 1 ? "s" : "") + " ago";
    }
  }
  return "just now";
}

/** Current time as "10:45 PM" for "Last updated" labels. */
function currentTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}


/* ---------------------------------------------------------
   CACHE HELPERS (sessionStorage)
   GitHub allows only 60 requests per hour without a key,
   so results are kept for a few minutes. try/catch is used
   because storage can be blocked in private browsing.
   --------------------------------------------------------- */

function readCache(key, maxAgeMinutes) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (saved && Date.now() - saved.time < maxAgeMinutes * 60000) {
      return saved.data;
    }
  } catch (error) {
    // Ignore: the data will simply be fetched again
  }
  return null;
}

function writeCache(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), data: data }));
  } catch (error) {
    // Ignore: caching is only an optimisation
  }
}

function clearCache(key) {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    // Ignore
  }
}
