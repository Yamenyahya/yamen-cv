/* =========================================================
   quotes.js - API 3: DummyJSON Quotes API
   Shows a random MOTIVATIONAL quote. Every click on
   "New Quote" calls the API again; "Copy" copies the quote.

   How it picks a motivational quote:
     1. Ask the API for a page of 30 quotes starting at a
        random position (so every request is different).
     2. Keep only quotes that contain motivational words
        (success, dream, courage, never give up...).
     3. Show one of them at random.

   Endpoint (free, no API key needed):
     https://dummyjson.com/quotes?limit=30&skip=<random>
   ========================================================= */

"use strict";

const QUOTES_URL = "https://dummyjson.com/quotes";
const QUOTES_PER_REQUEST = 30;

// Words that make a quote motivational
const MOTIVATIONAL_WORDS = [
  "success", "succeed", "dream", "goal", "courage", "believe", "achieve",
  "possible", "give up", "persist", "effort", "hard work", "motivat",
  "inspir", "try", "fail", "start", "begin", "future", "opportunit",
  "strength", "strong", "determin", "confiden", "win", "progress",
  "potential", "ambition", "discipline", "action", "overcome", "challenge",
  "great", "passion", "hope", "growth", "learn", "brave", "fear"
];

// One regular expression that matches any of the words above
const MOTIVATIONAL_PATTERN = new RegExp("\\b(" + MOTIVATIONAL_WORDS.join("|") + ")", "i");

// Total number of quotes in the API (updated after the first answer)
let totalQuotes = 1450;

// The quote currently on screen (so the same one is not shown twice in a row)
let currentQuote = null;

function setupQuotes() {
  document.getElementById("new-quote-btn").addEventListener("click", loadQuote);
  document.getElementById("copy-quote-btn").addEventListener("click", copyQuote);
  loadQuote();
}

function isMotivational(quote) {
  return MOTIVATIONAL_PATTERN.test(quote.quote);
}

async function loadQuote() {
  const status = document.getElementById("quote-status");
  const box = document.getElementById("quote-box");
  const newButton = document.getElementById("new-quote-btn");
  const copyButton = document.getElementById("copy-quote-btn");

  // Disable the button while loading so it can't be spam-clicked
  newButton.disabled = true;
  copyButton.disabled = true;
  box.classList.add("hidden");
  showLoading(status, "Loading a motivational quote...");

  try {
    // Start at a random position so each request returns different quotes
    const skip = Math.floor(Math.random() * Math.max(totalQuotes - QUOTES_PER_REQUEST, 1));
    const data = await fetchJSON(QUOTES_URL + "?limit=" + QUOTES_PER_REQUEST + "&skip=" + skip);

    if (!data || !Array.isArray(data.quotes) || data.quotes.length === 0) {
      throw new ApiError("The quote service sent an empty answer.");
    }
    if (data.total) {
      totalQuotes = data.total;
    }

    // Keep only motivational quotes that are not the one already on screen
    let choices = data.quotes.filter(function (quote) {
      return isMotivational(quote) && (!currentQuote || quote.id !== currentQuote.id);
    });

    // Very unlikely: no motivational words on this page, so use any quote
    if (choices.length === 0) {
      choices = data.quotes;
    }

    const quote = choices[Math.floor(Math.random() * choices.length)];
    currentQuote = quote;

    document.getElementById("quote-text").textContent = "“" + quote.quote + "”";
    document.getElementById("quote-author").textContent = "— " + (quote.author || "Unknown");

    clearStatus(status);
    box.classList.remove("hidden");

    // Restart the fade-in animation for every new quote
    box.classList.remove("fade-in");
    void box.offsetWidth;
    box.classList.add("fade-in");

    copyButton.disabled = false;
  } catch (error) {
    showError(status, "Could not load a quote. " + error.message, loadQuote);
  } finally {
    newButton.disabled = false;
  }
}

/** Copies the current quote to the clipboard. */
async function copyQuote() {
  const copyButton = document.getElementById("copy-quote-btn");
  if (!currentQuote) {
    return;
  }

  const text = "“" + currentQuote.quote + "” — " + currentQuote.author;

  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "Copied ✓";
  } catch (error) {
    copyButton.textContent = "Copy failed";
  }

  setTimeout(function () {
    copyButton.textContent = "Copy";
  }, 1500);
}
