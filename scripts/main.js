"use strict";

document.documentElement.classList.add("has-js");

async function fileExists(path) {
  if (!path) return false;

  try {
    const response = await fetch(path, { method: "HEAD", cache: "no-store" });
    return response.ok;
  } catch {
    return false;
  }
}

async function configureCvDownload() {
  const link = document.querySelector("[data-optional-download]");
  if (!link) return;

  const path = link.dataset.file;
  const status = document.querySelector("[data-download-status]");
  if (!(await fileExists(path))) return;

  link.href = path;
  link.download = "Fjord_Agne_CV_EN.pdf";
  link.classList.remove("is-unavailable");
  link.removeAttribute("aria-disabled");

  if (status) status.textContent = "PDF download ready.";
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

configureCvDownload();
configureMediaDialog();
configurePrintControl();
