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

  return true;
}

/** Retry scroll while tab panels mount after client navigation. */
export function scheduleScrollToReviewDetailSection(sectionId: string, attempt = 0): void {
  const scrolled = scrollToReviewDetailSection(sectionId);

  if (scrolled || attempt >= 8) {
    return;
  }

  window.setTimeout(() => scheduleScrollToReviewDetailSection(sectionId, attempt + 1), 50);
}
