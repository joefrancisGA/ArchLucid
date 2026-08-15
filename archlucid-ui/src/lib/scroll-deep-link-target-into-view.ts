/** Scroll a same-page deep-link anchor into view after client navigation or delayed mount. */
export function scrollDeepLinkTargetIntoView(targetId: string): boolean {
  const normalizedId = targetId.replace(/^#/, "").trim();

  if (normalizedId.length === 0) {
    return false;
  }

  const target = document.getElementById(normalizedId);

  if (target === null) {
    return false;
  }

  target.scrollIntoView({ behavior: "smooth", block: "start" });

  return true;
}

/** Retry scroll while disclosure sections or async panels mount after navigation. */
export function scheduleScrollDeepLinkTargetIntoView(targetId: string, attempt = 0): void {
  const scrolled = scrollDeepLinkTargetIntoView(targetId);

  if (scrolled || attempt >= 8) {
    return;
  }

  window.setTimeout(() => scheduleScrollDeepLinkTargetIntoView(targetId, attempt + 1), 50);
}
