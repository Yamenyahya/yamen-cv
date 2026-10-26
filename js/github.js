/* =========================================================
   github.js - API 1: GitHub REST API
   Loads my public GitHub profile and repositories and shows
   each repository as a card with its name, description,
   language, stars, forks and last update.

   Endpoints (free, no API key needed):
     https://api.github.com/users/{username}
     https://api.github.com/users/{username}/repos
   ========================================================= */

"use strict";

const GITHUB_USERNAME = "yamenyahya";
const GITHUB_CACHE_KEY = "github-data";

// Colours GitHub uses for common languages (for the small dot)
const LANGUAGE_COLORS = {
  "C++": "#f34b7d",
  "C": "#555555",
  "R": "#198ce7",
  "Python": "#3572a5",
  "JavaScript": "#f1e05a",
  "TypeScript": "#3178c6",
  "HTML": "#e34c26",
  "CSS": "#663399",
  "Java": "#b07219",
  "Jupyter Notebook": "#da5b0b",
  "SQL": "#e38c00",
  "TSQL": "#e38c00",
  "PLpgSQL": "#336790"
};

// My own descriptions, used when a repository has no description on GitHub
const REPO_DESCRIPTIONS = {
  "yamen-cv": "Personal portfolio website with live GitHub, weather, quotes and tech-news APIs."
};

// All repositories returned by the API (used again when filtering/sorting)
let allRepos = [];

function setupGitHub() {
  document.getElementById("github-refresh").addEventListener("click", function () {
    loadGitHub(true);
  });

  // Re-draw the list whenever a control changes
  document.getElementById("repo-search").addEventListener("input", renderRepos);
  document.getElementById("repo-language").addEventListener("change", renderRepos);
  document.getElementById("repo-sort").addEventListener("change", renderRepos);

  loadGitHub(false);
}

/**
 * Fetches the profile and repositories at the same time.
 * forceRefresh = true skips the saved copy and asks GitHub again.
 */
async function loadGitHub(forceRefresh) {
  const status = document.getElementById("github-status");
  const list = document.getElementById("repo-list");
  const refreshButton = document.getElementById("github-refresh");

  if (forceRefresh) {
    clearCache(GITHUB_CACHE_KEY);
  }

  // Use the saved copy if it is less than 10 minutes old
  let data = readCache(GITHUB_CACHE_KEY, 10);

  if (!data) {
    list.innerHTML = "";
    showLoading(status, "Loading repositories from GitHub...");
    refreshButton.disabled = true;

    try {
      const baseUrl = "https://api.github.com/users/" + GITHUB_USERNAME;

      // Promise.all runs both requests in parallel
      const [user, repos] = await Promise.all([
        fetchJSON(baseUrl),
        fetchJSON(baseUrl + "/repos?sort=updated&per_page=100")
      ]);

      data = { user: user, repos: repos };
      writeCache(GITHUB_CACHE_KEY, data);
    } catch (error) {
      showError(status, "Could not load GitHub repositories. " + error.message, function () {
        loadGitHub(true);
      });
      document.getElementById("github-profile").classList.add("hidden");
      document.getElementById("repo-controls").classList.add("hidden");
      return;
    } finally {
      refreshButton.disabled = false;
    }
  }

  clearStatus(status);
  allRepos = data.repos;

  renderProfile(data.user);
  fillLanguageFilter(allRepos);
  renderRepos();

  // Hero quick-fact: number of public repositories
  document.getElementById("stat-repos").textContent = data.user.public_repos;
  document.getElementById("github-updated").textContent = "Last updated: " + currentTime();
}

/** Small card with avatar, name, bio and counts. */
function renderProfile(user) {
  const box = document.getElementById("github-profile");
  box.innerHTML = "";

  const avatar = el("img", "github-avatar");
  avatar.src = user.avatar_url;
  avatar.alt = "GitHub avatar of " + (user.name || user.login);
  avatar.width = 64;
  avatar.height = 64;
  avatar.loading = "lazy";

  const info = el("div", "github-info");
  const name = el("a", "github-name", user.name || user.login);
  name.href = user.html_url;
  name.target = "_blank";
  name.rel = "noopener";

  info.append(name, el("p", "github-login", "@" + user.login));
  if (user.bio) {
    info.append(el("p", "github-bio", user.bio));
  }

  const stats = el("ul", "github-stats");
  stats.append(
    makeStat(user.public_repos, "Repositories"),
    makeStat(user.followers, "Followers"),
    makeStat(user.following, "Following")
  );

  box.append(avatar, info, stats);
  box.classList.remove("hidden");
}

function makeStat(number, label) {
  const item = el("li");
  item.append(el("strong", "", number), el("span", "", label));
  return item;
}

/** Fills the language <select> with the languages actually used. */
function fillLanguageFilter(repos) {
  const select = document.getElementById("repo-language");
  const previous = select.value;

  // A Set removes duplicates
  const languages = new Set();
  repos.forEach(function (repo) {
    if (repo.language) {
      languages.add(repo.language);
    }
  });

  select.innerHTML = "";
  select.append(new Option("All languages", "all"));
  Array.from(languages).sort().forEach(function (language) {
    select.append(new Option(language, language));
  });

  select.value = languages.has(previous) ? previous : "all";
  document.getElementById("repo-controls").classList.remove("hidden");
}

/** Filters, sorts and draws the repository cards. */
function renderRepos() {
  const list = document.getElementById("repo-list");
  const status = document.getElementById("github-status");
  const search = document.getElementById("repo-search").value.trim().toLowerCase();
  const language = document.getElementById("repo-language").value;
  const sort = document.getElementById("repo-sort").value;

  // 1. Filter
  let repos = allRepos.filter(function (repo) {
    const text = (repo.name + " " + (repo.description || REPO_DESCRIPTIONS[repo.name.toLowerCase()] || "")).toLowerCase();
    const matchesSearch = text.includes(search);
    const matchesLanguage = language === "all" || repo.language === language;
    return matchesSearch && matchesLanguage;
  });

  // 2. Sort (copy first so the original order is kept)
  repos = repos.slice().sort(function (a, b) {
    if (sort === "stars") {
      return b.stargazers_count - a.stargazers_count;
    }
    if (sort === "name") {
      return a.name.localeCompare(b.name);
    }
    return new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
  });

  // 3. Draw
  list.innerHTML = "";

  if (allRepos.length === 0) {
    showInfo(status, "No public repositories yet - new projects will appear here automatically.");
    return;
  }
  if (repos.length === 0) {
    showInfo(status, "No repositories match your search.");
    return;
  }
  clearStatus(status);

  repos.forEach(function (repo) {
    list.append(createRepoCard(repo));
  });
}

/** Builds one repository card. */
function createRepoCard(repo) {
  const card = el("article", "repo-card");

  // Title row: name (link) + optional "Fork" label
  const title = el("h4", "repo-name");
  const link = el("a", "", repo.name);
  link.href = repo.html_url;
  link.target = "_blank";
  link.rel = "noopener";
  title.append(link);
  if (repo.fork) {
    title.append(el("span", "repo-label", "Fork"));
  }

  const descriptionText = repo.description ||
    REPO_DESCRIPTIONS[repo.name.toLowerCase()] ||
    "No description provided.";
  const description = el("p", "repo-desc", descriptionText);

  // Meta row: language, stars, forks, updated
  const meta = el("ul", "repo-meta");

  if (repo.language) {
    const languageItem = el("li", "repo-language");
    const dot = el("span", "lang-dot");
    dot.style.backgroundColor = LANGUAGE_COLORS[repo.language] || "#8b949e";
    languageItem.append(dot, document.createTextNode(repo.language));
    meta.append(languageItem);
  }

  const stars = el("li", "", "⭐ " + repo.stargazers_count);
  stars.title = repo.stargazers_count + " stars";
  const forks = el("li", "", "🍴 " + repo.forks_count);
  forks.title = repo.forks_count + " forks";
  meta.append(stars, forks, el("li", "repo-date", "Updated " + timeAgo(repo.pushed_at || repo.updated_at)));

  card.append(title, description, meta);

  // Live demo link if the repository has a website
  if (repo.homepage && /^https?:\/\//.test(repo.homepage)) {
    const demo = el("a", "repo-demo", "Live demo ↗");
    demo.href = repo.homepage;
    demo.target = "_blank";
    demo.rel = "noopener";
    card.append(demo);
  }

  return card;
}
