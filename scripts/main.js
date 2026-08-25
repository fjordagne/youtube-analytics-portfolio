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

function observeAmbientRegion(element, onChange) {
  if (!("IntersectionObserver" in window)) {
    element.classList.add("is-in-view");
    onChange?.(true);
    return;
  }

  const observer = new IntersectionObserver(([entry]) => {
    element.classList.toggle("is-in-view", entry.isIntersecting);
    onChange?.(entry.isIntersecting);
  }, { rootMargin: "12% 0px", threshold: 0 });

  observer.observe(element);
}

function configurePageVisibility() {
  const update = () => document.body.classList.toggle("is-page-hidden", document.hidden);
  update();
  document.addEventListener("visibilitychange", update);
}

function configureHeroGraphics() {
  const hero = document.querySelector(".hero");
  const field = hero?.querySelector("[data-pixel-field]");
  const grid = hero?.querySelector("[data-hero-grid]");
  if (!hero || !field || !grid) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const canInteract = !reducedMotion && finePointer;
  const pixelCount = finePointer ? 26 : 15;
  const pixels = [];
  const pixelPositions = [
    [5, 14], [12, 67], [19, 31], [28, 82], [36, 9], [44, 48], [57, 72],
    [64, 24], [73, 89], [82, 55], [91, 18], [23, 95], [49, 39], [76, 64],
    [8, 43], [33, 77], [60, 12], [88, 35], [16, 86], [41, 58], [69, 27],
    [96, 70], [52, 5], [79, 46], [30, 61], [86, 93]
  ];

  for (let index = 0; index < pixelCount; index += 1) {
    const element = document.createElement("span");
    const [x, y] = pixelPositions[index];
    const size = 1 + ((index * 7) % 3);
    const opacity = 0.045 + ((index * 11) % 6) * 0.012;
    const driftX = ((index * 5) % 7) - 3 || 2;
    const driftY = ((index * 3) % 7) - 3 || -2;

    element.className = "hero-pixel";
    element.style.setProperty("--pixel-x", `${x}%`);
    element.style.setProperty("--pixel-y", `${y}%`);
    element.style.setProperty("--pixel-size", `${size}px`);
    element.style.setProperty("--pixel-opacity", opacity.toFixed(3));
    element.style.setProperty("--pixel-live-opacity", opacity.toFixed(3));
    element.style.setProperty("--pixel-drift-x", `${driftX}px`);
    element.style.setProperty("--pixel-drift-y", `${driftY}px`);
    element.style.setProperty("--pixel-drift-neg-x", `${-driftX}px`);
    element.style.setProperty("--pixel-drift-neg-y", `${-driftY}px`);
    element.style.setProperty("--pixel-duration", `${28 + ((index * 7) % 17)}s`);
    element.style.setProperty("--pixel-delay", `${-((index * 13) % 19)}s`);
    field.append(element);

    pixels.push({
      element,
      x,
      y,
      opacity,
      polarity: index % 5 === 0 ? -0.34 : 1,
      currentX: 0,
      currentY: 0,
      currentOpacity: opacity,
      targetX: 0,
      targetY: 0,
      targetOpacity: opacity
    });
  }

  let isInView = true;
  observeAmbientRegion(hero, (visible) => {
    isInView = visible;
    if (!visible && canInteract) resetTargets(true);
  });

  if (!canInteract) return;

  let pointer = null;
  let previousPointer = null;
  let gridCurrentX = 0;
  let gridCurrentY = 0;
  let gridTargetX = 0;
  let gridTargetY = 0;
  let animationFrame = 0;
  let velocityTimer = 0;

  function resetTargets(immediate = false) {
    gridTargetX = 0;
    gridTargetY = 0;
    pixels.forEach((pixel) => {
      pixel.targetX = 0;
      pixel.targetY = 0;
      pixel.targetOpacity = pixel.opacity;
    });

    if (immediate) {
      gridCurrentX = 0;
      gridCurrentY = 0;
      grid.style.setProperty("--grid-x", "0px");
      grid.style.setProperty("--grid-y", "0px");
      pixels.forEach((pixel) => {
        pixel.currentX = 0;
        pixel.currentY = 0;
        pixel.currentOpacity = pixel.opacity;
        pixel.element.style.setProperty("--pixel-offset-x", "0px");
        pixel.element.style.setProperty("--pixel-offset-y", "0px");
        pixel.element.style.setProperty("--pixel-live-opacity", pixel.opacity.toFixed(3));
      });
      return;
    }

    requestUpdate();
  }

  function setTargets(velocityBoost = 0) {
    if (!pointer || !isInView) {
      resetTargets();
      return;
    }

    const rect = hero.getBoundingClientRect();
    const localX = pointer.clientX - rect.left;
    const localY = pointer.clientY - rect.top;
    const normalizedX = Math.max(0, Math.min(1, localX / rect.width)) - 0.5;
    const normalizedY = Math.max(0, Math.min(1, localY / rect.height)) - 0.5;
    const radius = Math.min(260, Math.max(180, rect.width * 0.2));

    gridTargetX = normalizedX * -10;
    gridTargetY = normalizedY * -7;

    pixels.forEach((pixel) => {
      const pixelX = rect.width * pixel.x / 100;
      const pixelY = rect.height * pixel.y / 100;
      const deltaX = pixelX - localX;
      const deltaY = pixelY - localY;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const influence = Math.max(0, 1 - distance / radius) ** 2;
      const displacement = influence * (5.5 + velocityBoost * 2.5) * pixel.polarity;

      pixel.targetX = deltaX / distance * displacement;
      pixel.targetY = deltaY / distance * displacement;
      pixel.targetOpacity = pixel.opacity + influence * (0.08 + velocityBoost * 0.025);
    });

    requestUpdate();
  }

  function updateFrame() {
    animationFrame = 0;
    if (document.hidden || !isInView) return;

    let unsettled = false;
    gridCurrentX += (gridTargetX - gridCurrentX) * 0.075;
    gridCurrentY += (gridTargetY - gridCurrentY) * 0.075;
    grid.style.setProperty("--grid-x", `${gridCurrentX.toFixed(2)}px`);
    grid.style.setProperty("--grid-y", `${gridCurrentY.toFixed(2)}px`);
    unsettled ||= Math.abs(gridTargetX - gridCurrentX) > 0.03 || Math.abs(gridTargetY - gridCurrentY) > 0.03;

    pixels.forEach((pixel) => {
      pixel.currentX += (pixel.targetX - pixel.currentX) * 0.1;
      pixel.currentY += (pixel.targetY - pixel.currentY) * 0.1;
      pixel.currentOpacity += (pixel.targetOpacity - pixel.currentOpacity) * 0.1;
      pixel.element.style.setProperty("--pixel-offset-x", `${pixel.currentX.toFixed(2)}px`);
      pixel.element.style.setProperty("--pixel-offset-y", `${pixel.currentY.toFixed(2)}px`);
      pixel.element.style.setProperty("--pixel-live-opacity", pixel.currentOpacity.toFixed(3));
      unsettled ||= Math.abs(pixel.targetX - pixel.currentX) > 0.03
        || Math.abs(pixel.targetY - pixel.currentY) > 0.03
        || Math.abs(pixel.targetOpacity - pixel.currentOpacity) > 0.002;
    });

    if (unsettled) animationFrame = requestAnimationFrame(updateFrame);
  }

  function requestUpdate() {
    if (!animationFrame && !document.hidden) animationFrame = requestAnimationFrame(updateFrame);
  }

  function handlePointerMove(event) {
    const now = event.timeStamp;
    let velocityBoost = 0;
    if (previousPointer) {
      const elapsed = Math.max(16, now - previousPointer.time);
      const speed = Math.hypot(event.clientX - previousPointer.x, event.clientY - previousPointer.y) / elapsed;
      velocityBoost = Math.min(1, speed / 1.25);
    }

    pointer = { clientX: event.clientX, clientY: event.clientY };
    previousPointer = { x: event.clientX, y: event.clientY, time: now };
    setTargets(velocityBoost);

    window.clearTimeout(velocityTimer);
    velocityTimer = window.setTimeout(() => setTargets(0), 130);
  }

  hero.addEventListener("pointermove", handlePointerMove, { passive: true });
  hero.addEventListener("pointerleave", () => {
    pointer = null;
    previousPointer = null;
    window.clearTimeout(velocityTimer);
    resetTargets();
  });
  window.addEventListener("scroll", () => {
    if (pointer && isInView) setTargets(0);
  }, { passive: true });
}

function configureDataNetwork() {
  const stage = document.querySelector("[data-data-network]");
  if (!stage) return;

  observeAmbientRegion(stage);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reducedMotion || !finePointer) return;

  const metrics = [...stage.querySelectorAll(".channel-metrics li")];
  const paths = [...stage.querySelectorAll("[data-network-path]")];
  const pulses = [...stage.querySelectorAll("[data-network-pulse]")];
  const nodes = [...stage.querySelectorAll("[data-network-node]")];
  let clearTimer = 0;

  const activate = (index) => {
    metrics.forEach((metric, metricIndex) => metric.classList.toggle("is-signal-active", metricIndex === index));
    paths.forEach((path) => path.classList.toggle("is-active", Number(path.dataset.networkPath) === index));
    nodes.forEach((node) => node.classList.toggle("is-active", Number(node.dataset.networkNode) === index));
    pulses.forEach((pulse) => pulse.classList.remove("is-active"));
    const activePulse = pulses.find((pulse) => Number(pulse.dataset.networkPulse) === index);
    if (activePulse) {
      void activePulse.getBoundingClientRect();
      activePulse.classList.add("is-active");
    }
  };

  metrics.forEach((metric, index) => {
    metric.addEventListener("pointerenter", () => {
      window.clearTimeout(clearTimer);
      activate(index);
    });
  });

  stage.addEventListener("pointerleave", () => {
    clearTimer = window.setTimeout(() => activate(-1), 160);
  });
}

function configureProcessFlow() {
  const flow = document.querySelector("[data-process-flow]");
  if (!flow) return;

  let hasDrawn = false;
  observeAmbientRegion(flow, (visible) => {
    if (visible && !hasDrawn) {
      hasDrawn = true;
      flow.classList.add("is-drawn");
    }
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reducedMotion || !finePointer) return;

  const steps = [...flow.querySelectorAll(".process-list li")];
  const segments = [...flow.querySelectorAll("[data-process-segment]")];
  const nodes = [...flow.querySelectorAll("[data-process-node]")];
  let clearTimer = 0;

  const activate = (index) => {
    flow.classList.toggle("has-active-step", index >= 0);
    steps.forEach((step, stepIndex) => step.classList.toggle("is-active", stepIndex === index));
    nodes.forEach((node) => node.classList.toggle("is-active", Number(node.dataset.processNode) === index));
    const forwardSegments = [];
    segments.forEach((segment) => {
      const segmentIndex = Number(segment.dataset.processSegment);
      segment.classList.toggle("is-adjacent", segmentIndex === index || segmentIndex === index - 1);
      segment.classList.remove("is-forward");
      if (segmentIndex === index && index < steps.length - 1) forwardSegments.push(segment);
    });
    if (forwardSegments.length) void flow.offsetWidth;
    forwardSegments.forEach((segment) => segment.classList.add("is-forward"));
  };

  steps.forEach((step, index) => {
    step.addEventListener("pointerenter", () => {
      window.clearTimeout(clearTimer);
      activate(index);
    });
  });

  flow.addEventListener("pointerleave", () => {
    clearTimer = window.setTimeout(() => activate(-1), 140);
  });
}

configurePageVisibility();
configureTheme();
configureSectionNavigation();
configureReveals();
configureMediaDialog();
configurePrintControl();
configureHeroGraphics();
configureDataNetwork();
configureProcessFlow();
