/* =========================================================
   news.js - API 4: Hacker News Search API (by Algolia)
   Shows the latest technology headlines. Tabs switch between
   categories: Top Stories, AI, Data and Web Development.

   Endpoint (free, no API key needed):
     https://hn.algolia.com/api/v1/
   ========================================================= */

"use strict";

const NEWS_BASE_URL = "https://hn.algolia.com/api/v1/";
const NEWS_COUNT = 6;

// What to ask the API for each category tab
const NEWS_CATEGORIES = {
  top: "search?tags=front_page",
  ai: "search_by_date?tags=story&query=" + encodeURIComponent("AI"),
  data: "search_by_date?tags=story&query=" + encodeURIComponent("data"),
  web: "search_by_date?tags=story&query=" + encodeURIComponent("javascript")
};

// Results are kept per category so switching tabs back is instant
const newsCache = {};
let activeCategory = "top";

function setupNews() {
  const tabs = document.querySelectorAll(".news-tab");

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      // Highlight the clicked tab
      tabs.forEach(function (other) {
        other.classList.remove("active");
        other.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      loadNews(tab.dataset.category);
    });
  });

  loadNews("top");
}

async function loadNews(category) {
  const status = document.getElementById("news-status");
  const list = document.getElementById("news-list");
  activeCategory = category;

  // Already loaded this category? Show it straight away.
  if (newsCache[category]) {
    clearStatus(status);
    renderNews(newsCache[category]);
    return;
  }

  list.innerHTML = "";
  showLoading(status, "Loading headlines...");

  try {
    // Only stories with a title and a link to an article
    const url = NEWS_BASE_URL + NEWS_CATEGORIES[category] +
      "&hitsPerPage=20&numericFilters=" + encodeURIComponent("points>2");
    const data = await fetchJSON(url);

    const stories = (data.hits || [])
      .filter(function (story) {
        return story.title && /^https?:\/\//.test(story.url || "");
      })
      .slice(0, NEWS_COUNT);

    // The user may have clicked another tab while this was loading
    if (category !== activeCategory) {
      newsCache[category] = stories;
      return;
    }

    if (stories.length === 0) {
      showInfo(status, "No headlines found right now. Please try another category.");
      return;
    }

    newsCache[category] = stories;
    clearStatus(status);
    renderNews(stories);
  } catch (error) {
    if (category !== activeCategory) {
      return;
    }
    showError(status, "Could not load the news. " + error.message, function () {
      loadNews(category);
    });
  }
}

function renderNews(stories) {
  const list = document.getElementById("news-list");
  list.innerHTML = "";

  stories.forEach(function (story) {
    const item = el("li", "news-item");

    const link = el("a", "news-title", story.title);
    link.href = story.url;
    link.target = "_blank";
    link.rel = "noopener";

    // Show only the website name, e.g. "github.com"
    let site = "";
    try {
      site = new URL(story.url).hostname.replace("www.", "");
    } catch (error) {
      site = "";
    }

    const meta = el("p", "news-meta",
      [site, "▲ " + story.points + " points", timeAgo(story.created_at)]
        .filter(Boolean)
        .join(" · "));

    item.append(link, meta);
    list.append(item);
  });
}
