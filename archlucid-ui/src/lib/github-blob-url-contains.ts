/**
 * Substring scan for github.com/{owner}/{repo}/blob|tree/ URLs in customer-facing copy.
 * Avoids unanchored regex patterns flagged by CodeQL js/regex/missing-regexp-anchor.
 */
export function textContainsGitHubBlobOrTreeUrl(text: string): boolean {
  const haystack = text.toLowerCase();
  const marker = "github.com/";
  let searchFrom = 0;

  while (searchFrom < haystack.length) {
    const idx = haystack.indexOf(marker, searchFrom);

    if (idx === -1) {
      return false;
    }

    const remainder = haystack.slice(idx + marker.length);
    const parts = remainder.split("/");

    if (parts.length >= 3 && (parts[2] === "blob" || parts[2] === "tree")) {
      return true;
    }

    searchFrom = idx + marker.length;
  }

  return false;
}
