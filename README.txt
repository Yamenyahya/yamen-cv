Yamen Yahya Zakaria - Assignment 3: Portfolio Website with API Integration
==========================================================================

Live website: see link.txt
Single-page application (SPA) built with HTML, CSS and plain JavaScript (no frameworks).


1. WEBSITE STRUCTURE
--------------------
Home       - hero section with photo, title, call-to-action buttons and quick facts
About Me   - profile + education (from Assignment 2)
Experience - internships + professional experience (from Assignment 2)
Projects   - featured projects (from Assignment 2) + live GitHub repositories (API)
Skills     - all skills from Assignment 2 + "add a skill" feature
Achievements
Live Data  - weather, quote and tech-news widgets (APIs)
Contact    - contact details + validated contact form

All content and all interactive features from Assignment 2 were kept:
welcome message, dark/light mode, show/hide sections, project details,
dynamic skills list, form validation, active nav link, progress bar,
back-to-top button and fade-in sections.


2. APIs USED (all free, NO API KEY needed - nothing to configure)
-----------------------------------------------------------------
API 1 - GitHub REST API                         (js/github.js)
  https://api.github.com/users/yamenyahya
  https://api.github.com/users/yamenyahya/repos
  Shows: profile summary, and for each repository the name, description,
  language, stars, forks and last update. Includes search, language
  filter and sorting. Results are cached for 10 minutes in sessionStorage
  because GitHub allows 60 requests per hour without a key.

API 2 - Open-Meteo Weather API                  (js/weather.js)
  https://geocoding-api.open-meteo.com/v1/search  (city -> coordinates)
  https://api.open-meteo.com/v1/forecast          (coordinates -> weather)
  Shows: temperature, weather condition, icon, feels-like, humidity, wind
  and a 3-day forecast. Pick a city from the list or type any city.

API 3 - DummyJSON Quotes API                    (js/quotes.js)
  https://dummyjson.com/quotes?limit=30&skip=<random number>
  Shows a random MOTIVATIONAL quote: each request gets 30 quotes from a
  random position, keeps only quotes with motivational words (success,
  dream, courage, never give up...) and shows one at random.
  The "New Quote" button calls the API again; "Copy" copies the quote.

API 4 - Hacker News Search API (Algolia)        (js/news.js)
  https://hn.algolia.com/api/v1/
  Shows the latest technology headlines with category tabs
  (Top Stories, AI, Data, Web Dev).


3. JAVASCRIPT
-------------
- Every request uses fetch() with async/await (shared helper fetchJSON in js/api.js).
- Loading state: spinner + "Loading..." message while waiting.
- Error handling: failed requests, HTTP errors (404, 403 rate limit, 500),
  timeouts (10 seconds, using AbortController) and offline mode each show a
  clear message with a "Try again" button.
- Empty results are handled too (unknown city, no repositories, no search match).
- The DOM is updated dynamically with createElement/textContent
  (API text is never inserted as HTML, which keeps the page safe).
- Each API widget loads independently, so if one service is down the rest
  of the site still works.


4. FILES
--------
index.html       page structure
styles.css       all styles (light + dark theme, responsive layout)
script.js        main file: starts everything + Assignment 2 features + mobile menu
js/api.js        shared fetch, loading/error, formatting and cache helpers
js/github.js     API 1 - GitHub
js/weather.js    API 2 - Weather
js/quotes.js     API 3 - Quotes
js/news.js       API 4 - Tech news
images/          profile photo and favicon
link.txt         live website URL


5. HOW TO RUN LOCALLY
---------------------
Open index.html in any modern browser (internet connection needed for the APIs).
