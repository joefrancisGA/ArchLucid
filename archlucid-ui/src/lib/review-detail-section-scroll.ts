/** Scroll to a run-detail in-page section and expand workspace disclosure blocks when present. */
export function scrollToReviewDetailSection(sectionId: string): boolean {
  const normalizedId = sectionId.replace(/^#/, "").trim();

  if (normalizedId.length === 0) {
    return false;
  }

  const target = document.getElementById(normalizedId);

  if (target === null) {
    return false;
  }

  const disclosure = target.querySelector<HTMLDetailsElement>("details[data-workspace-disclosure]");

  if (disclosure !== null && !disclosure.open) {
    disclosure.open = true;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });

  if (typeof window !== "undefined") {
    const nextUrl = `${window.location.pathname}${window.location.search}#${normalizedId}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }

  const focusTarget =
    target.matches("a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])")
      ? target
      : target.querySelector<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])",
        );

  if (focusTarget === null) {
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }

    target.focus({ preventScroll: true });
  } else {
    focusTarget.focus({ preventScroll: true });
  }

  return true;
}

/** Retry scroll while tab panels mount after client navigation. */
export function scheduleScrollToReviewDetailSection(sectionId: string, attempt = 0): void {
  const scrolled = scrollToReviewDetailSection(sectionId);

  // Deferred review sections can arrive after the initial 400 ms retry window
  // while their client chunk is still loading. Keep the retry window bounded,
  // but long enough to cover a slow deferred import.
  if (scrolled || attempt >= 40) {
    return;
  }

  window.setTimeout(() => scheduleScrollToReviewDetailSection(sectionId, attempt + 1), 50);
}

/** Scroll to the current location hash when it targets a review-detail section. */
export function scheduleScrollToReviewDetailHashFromLocation(): void {
  if (typeof window === "undefined") {
    return;
  }

  const sectionId = window.location.hash.replace(/^#/, "").trim();

  if (sectionId.length === 0) {
    return;
  }

  scheduleScrollToReviewDetailSection(sectionId);
}
