"use strict";

document.documentElement.classList.add("has-js");

const themeStorageKey = "fjord-theme";

function getStoredTheme() {
  try {
    const value = localStorage.getItem(themeStorageKey);
    return value === "dark" || value === "light" ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const label = button.querySelector("[data-theme-label]");
    if (label) label.textContent = `${theme === "dark" ? "Dark" : "Light"} mode`;
    button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
  });

  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === "dark" ? "#101111" : "#f5f5f3";

  if (!persist) return;
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The selected theme still applies when storage is unavailable.
  }
}

function configureTheme() {
  const buttons = document.querySelectorAll("[data-theme-toggle]");
  if (!buttons.length) return;

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  applyTheme(document.documentElement.dataset.theme || (systemTheme.matches ? "dark" : "light"));

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });
  });

  systemTheme.addEventListener?.("change", (event) => {
    if (!getStoredTheme()) applyTheme(event.matches ? "dark" : "light");
  });
}

function configureSectionNavigation() {
  const links = [...document.querySelectorAll("[data-section-link]")];
  if (!links.length) return;

  const sections = links.map((link) => {
    const id = link.dataset.sectionLink;
    const target = id === "main-content" ? document.querySelector(".hero") : document.getElementById(id);
    return { link, target };
  }).filter(({ target }) => target);

  const setActive = (activeLink) => {
    sections.forEach(({ link }) => {
      const isActive = link === activeLink;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  setActive(sections[0]?.link);
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    const match = sections.find(({ target }) => target === visible.target);
    if (match) setActive(match.link);
  }, { rootMargin: "-22% 0px -62% 0px", threshold: [0, 0.1] });

  sections.forEach(({ target }) => observer.observe(target));
}

function configureReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const revealElements = [...document.querySelectorAll([
    ".section-heading > div:not(.section-marker)",
    ".section-heading__copy",
    ".channel-metrics",
    ".channel-evidence",
    ".case-study",
    ".format-proof",
    ".packaging-principles",
    ".creative-group",
    ".process-list",
    ".toolkit-compact",
    ".contact-section__main",
    ".contact-section__links",
    ".cv-hero__title",
    ".cv-hero__actions",
    ".cv-section"
  ].join(","))];
  const dividers = [...document.querySelectorAll(".section-marker")];
  const animatedElements = [...revealElements, ...dividers];

  revealElements.forEach((element, index) => {
    element.dataset.reveal = "";
    element.style.setProperty("--reveal-delay", `${(index % 3) * 45}ms`);
  });
  dividers.forEach((element) => { element.dataset.divider = ""; });

  if (!("IntersectionObserver" in window)) {
    animatedElements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10%", threshold: 0.08 });

  animatedElements.forEach((element) => observer.observe(element));
}

function configureMediaDialog() {
  const dialog = document.querySelector("[data-media-dialog]");
  if (!dialog || typeof dialog.showModal !== "function") return;

  const dialogImage = dialog.querySelector("[data-media-dialog-image]");
  const dialogCaption = dialog.querySelector("[data-media-dialog-caption]");
  const closeButton = dialog.querySelector("[data-media-dialog-close]");
  if (!dialogImage || !dialogCaption || !closeButton) return;

  let opener = null;

  document.querySelectorAll("[data-enlarge]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

      const sourceImage = link.querySelector("img");
      if (!sourceImage) return;

      event.preventDefault();
      opener = link;
      dialogImage.src = link.href;
      dialogImage.alt = sourceImage.alt;
      dialogCaption.textContent = link.dataset.enlargeCaption || "";
      document.documentElement.classList.add("is-dialog-open");
      dialog.showModal();
    });
  });

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("is-dialog-open");
    dialogImage.removeAttribute("src");
    dialogImage.alt = "";
    dialogCaption.textContent = "";
    if (opener?.isConnected) opener.focus();
    opener = null;
  });
}

function configurePrintControl() {
  const printButton = document.querySelector("[data-print-cv]");
  if (!printButton) return;

  printButton.addEventListener("click", () => window.print());
}

configureTheme();
configureSectionNavigation();
configureReveals();
configureMediaDialog();
configurePrintControl();
