/**
 * Resume page: light/dark theme toggle.
 * The theme is stored under the same localStorage key as index.html,
 * so the choice carries between the two pages.
 */
(function() {
  "use strict";

  function bindThemeToggle(button, root, storage) {
    const icon = button.querySelector("i");

    function applyTheme(theme) {
      const isDark = theme === "dark";
      root.setAttribute("data-theme", theme);
      button.setAttribute("aria-pressed", String(isDark));
      button.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
      icon.className = isDark ? "bx bx-sun" : "bx bx-moon";
    }

    applyTheme(root.getAttribute("data-theme") === "dark" ? "dark" : "light");

    button.addEventListener("click", function() {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        storage.setItem("theme", next);
      } catch (err) {
        // Storage can be unavailable (private mode); the toggle still works for this visit.
      }
    });
  }

  // Reading window.localStorage itself throws when storage is blocked.
  function getStorage(win) {
    try {
      return win.localStorage;
    } catch (err) {
      return { setItem: function() {} };
    }
  }

  const themeButton = document.querySelector(".theme-toggle");
  if (themeButton) bindThemeToggle(themeButton, document.documentElement, getStorage(window));
})();
