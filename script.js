/* =========================================================
   Yamen Yahya Zakaria - CV Webpage
   Assignment 2: Interactive features with JavaScript

   Features in this file:
     1. Welcome message on page load
     2. Dark mode / Light mode toggle
     3. Show / Hide sections (Projects, Skills, Certifications)
     4. Interactive project details (Show / Hide Details)
     5. Dynamic skills list (add a new skill)
     6. Contact form with validation
     7. Scroll effects: active nav link, progress bar,
        back-to-top button and sections that fade in
   ========================================================= */

// Run all setup code once the HTML page has finished loading
document.addEventListener("DOMContentLoaded", function () {
  showWelcomeMessage();
  setupThemeToggle();
  setupSectionToggles();
  setupProjectDetails();
  setupDynamicSkills();
  setupContactForm();
  setupScrollEffects();
});


/* ---------------------------------------------------------
   1. WELCOME MESSAGE
   Shows a greeting based on the time of day when the page loads.
   --------------------------------------------------------- */
function showWelcomeMessage() {
  const banner = document.getElementById("welcome-banner");
  const text = document.getElementById("welcome-text");
  const closeButton = document.getElementById("close-welcome");

  // Pick a greeting depending on the current hour
  const hour = new Date().getHours();
  let greeting;

  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  text.textContent = greeting + "! Welcome to my portfolio page 👋";
  banner.classList.remove("hidden");

  // Let the visitor close the banner
  closeButton.addEventListener("click", function () {
    banner.classList.add("hidden");
  });

  // Hide the banner automatically after 6 seconds
  setTimeout(function () {
    banner.classList.add("hidden");
  }, 6000);
}


/* ---------------------------------------------------------
   2. DARK MODE / LIGHT MODE TOGGLE
   Adds or removes the "dark-mode" class on <body>.
   The choice is saved so it stays the same on the next visit.
   --------------------------------------------------------- */
function setupThemeToggle() {
  const toggleButton = document.getElementById("theme-toggle");

  // Load the saved theme (if any)
  if (loadSetting("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
  updateThemeButton(toggleButton);

  // Switch theme when the button is clicked
  toggleButton.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    const isDark = document.body.classList.contains("dark-mode");
    saveSetting("theme", isDark ? "dark" : "light");
    updateThemeButton(toggleButton);
  });
}

// Changes the button text to match the current theme
function updateThemeButton(button) {
  if (document.body.classList.contains("dark-mode")) {
    button.textContent = "☀️ Light Mode";
  } else {
    button.textContent = "🌙 Dark Mode";
  }
}

// Helpers for saving settings in the browser.
// try/catch is used because storage can be blocked in some browsers.
function saveSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    // Storage not available - the theme still works, it just won't be remembered
  }
}

function loadSetting(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}


/* ---------------------------------------------------------
   3. SHOW / HIDE SECTIONS
   Each .toggle-btn has a data-target attribute with the id
   of the content it controls, and a data-label (e.g. "Skills").
   --------------------------------------------------------- */
function setupSectionToggles() {
  const toggleButtons = document.querySelectorAll(".toggle-btn");

  toggleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const content = document.getElementById(button.dataset.target);
      const label = button.dataset.label;

      // Toggle the hidden class, then update the button text
      content.classList.toggle("hidden");

      // Tell screen readers whether the section is open
      button.setAttribute("aria-expanded", !content.classList.contains("hidden"));

      if (content.classList.contains("hidden")) {
        button.textContent = "Show " + label;
      } else {
        button.textContent = "Hide " + label;
      }
    });
  });
}


/* ---------------------------------------------------------
   4. INTERACTIVE PROJECT SECTION
   "Show Details" reveals the bullet points of a project
   without reloading the page.
   --------------------------------------------------------- */
function setupProjectDetails() {
  const detailButtons = document.querySelectorAll(".details-btn");

  detailButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      // The details list is the element right after the button
      const details = button.nextElementSibling;
      details.classList.toggle("hidden");
      button.setAttribute("aria-expanded", !details.classList.contains("hidden"));

      if (details.classList.contains("hidden")) {
        button.textContent = "Show Details";
      } else {
        button.textContent = "Hide Details";
      }
    });
  });
}


/* ---------------------------------------------------------
   5. DYNAMIC SKILLS LIST
   The user types a skill and clicks "Add" (or presses Enter).
   The skill appears instantly in the "Added Skills" list.
   --------------------------------------------------------- */
function setupDynamicSkills() {
  const input = document.getElementById("skill-input");
  const addButton = document.getElementById("add-skill-btn");

  addButton.addEventListener("click", addSkill);

  // Pressing Enter inside the input also adds the skill
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      addSkill();
    }
  });
}

function addSkill() {
  const input = document.getElementById("skill-input");
  const list = document.getElementById("added-skills");
  const message = document.getElementById("skill-message");
  const skill = input.value.trim();

  // Check 1: the input must not be empty
  if (skill === "") {
    showMessage(message, "Please type a skill first.", "fail");
    return;
  }

  // Check 2: the skill must not already be on the page
  if (skillExists(skill)) {
    showMessage(message, '"' + skill + '" is already in the skills list.', "fail");
    return;
  }

  // Remove the "No skills added yet." note the first time
  const emptyNote = list.querySelector(".empty-note");
  if (emptyNote) {
    emptyNote.remove();
  }

  // Create the new <li> tag and add it to the list
  const newItem = document.createElement("li");
  newItem.textContent = skill;
  newItem.classList.add("new-skill");
  list.appendChild(newItem);

  showMessage(message, '"' + skill + '" was added to the skills list!', "success");

  // Clear the input so the user can add another skill
  input.value = "";
  input.focus();
}

// Returns true if a skill with the same name (any letter case) exists
function skillExists(skill) {
  const allSkills = document.querySelectorAll("#skills .tags li:not(.empty-note)");

  for (let i = 0; i < allSkills.length; i++) {
    if (allSkills[i].textContent.toLowerCase() === skill.toLowerCase()) {
      return true;
    }
  }
  return false;
}


/* ---------------------------------------------------------
   6. CONTACT FORM WITH VALIDATION
   Checks that all fields are filled in and that the email
   has a valid format, then shows an error or success message.
   --------------------------------------------------------- */
function setupContactForm() {
  const form = document.getElementById("contact-form");

  form.addEventListener("submit", function (event) {
    // Stop the page from reloading
    event.preventDefault();

    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const messageInput = document.getElementById("message");
    const formMessage = document.getElementById("form-message");

    // Validate every field (each function returns true or false)
    const nameOk = validateRequired(nameInput, "name-error", "Please enter your name.");
    const emailOk = validateEmail(emailInput);
    const messageOk = validateRequired(messageInput, "message-error", "Please write a message.");

    if (nameOk && emailOk && messageOk) {
      const firstName = nameInput.value.trim().split(" ")[0];
      showMessage(formMessage, "Thank you, " + firstName + "! Your message has been sent successfully.", "success");
      form.reset();
    } else {
      showMessage(formMessage, "Please fix the errors above and try again.", "fail");
    }
  });

  // Clear a field's error as soon as the user starts typing in it
  const fields = form.querySelectorAll("input, textarea");
  fields.forEach(function (field) {
    field.addEventListener("input", function () {
      clearError(field, field.id + "-error");
    });
  });
}

// Checks that a field is not empty
function validateRequired(field, errorId, errorText) {
  if (field.value.trim() === "") {
    setError(field, errorId, errorText);
    return false;
  }
  clearError(field, errorId);
  return true;
}

// Checks that the email is filled in and has a valid format
function validateEmail(field) {
  const email = field.value.trim();

  // Pattern: some text, then @, then a domain with a dot (e.g. name@mail.com)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (email === "") {
    setError(field, "email-error", "Please enter your email.");
    return false;
  }
  if (!emailPattern.test(email)) {
    setError(field, "email-error", "Please enter a valid email (e.g. name@example.com).");
    return false;
  }
  clearError(field, "email-error");
  return true;
}

// Shows an error under a field and gives it a red border
function setError(field, errorId, text) {
  field.classList.add("invalid");
  document.getElementById(errorId).textContent = text;
}

// Removes the error from a field
function clearError(field, errorId) {
  field.classList.remove("invalid");
  document.getElementById(errorId).textContent = "";
}


/* ---------------------------------------------------------
   7. SCROLL EFFECTS
   - Smoothly scrolls to a section when a nav link is clicked
   - Highlights the nav link of the section on screen
   - Fills the progress bar as the visitor reads down the page
   - Shows a "back to top" button after scrolling down
   - Fades each section in when it scrolls into view
   --------------------------------------------------------- */
function setupScrollEffects() {
  const sections = document.querySelectorAll("main section");
  const navLinks = document.querySelectorAll("#navbar a");
  const progressBar = document.getElementById("progress-bar");
  const backToTop = document.getElementById("back-to-top");

  // Runs every time the page is scrolled
  function onScroll() {
    const scrollTop = window.scrollY;

    // --- Progress bar: how far down the page we are, in percent ---
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    progressBar.style.width = percent + "%";

    // --- Back to top button: show after 400px of scrolling ---
    if (scrollTop > 400) {
      backToTop.classList.add("show");
    } else {
      backToTop.classList.remove("show");
    }

    // --- Active link: the last section whose top has passed the nav bar ---
    let currentId = "";
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top <= 120) {
        currentId = section.id;
      }
    });

    // At the very bottom of the page, highlight the last section (Contact)
    if (window.innerHeight + scrollTop >= document.documentElement.scrollHeight - 5) {
      currentId = sections[sections.length - 1].id;
    }

    navLinks.forEach(function (link) {
      if (link.getAttribute("href") === "#" + currentId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // --- Reveal sections that have entered the screen ---
    sections.forEach(function (section) {
      if (section.getBoundingClientRect().top < window.innerHeight - 60) {
        section.classList.add("visible");
      }
    });
  }

  window.addEventListener("scroll", onScroll);
  onScroll(); // run once on load so the first sections appear straight away

  // Smooth scroll for nav links: stop just below the sticky nav bar.
  // offsetTop ignores the fade-in animation, so the position is always exact.
  const navbar = document.getElementById("navbar");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) {
        return;
      }
      event.preventDefault();
      target.classList.add("visible");
      window.scrollTo({
        top: target.offsetTop - navbar.offsetHeight - 15,
        behavior: "smooth"
      });
    });
  });

  // Back to top button scrolls smoothly to the top
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}


/* ---------------------------------------------------------
   SHARED HELPER
   Displays a success (green) or fail (red) message.
   --------------------------------------------------------- */
function showMessage(element, text, type) {
  element.textContent = text;
  element.className = "form-message " + type;
}
