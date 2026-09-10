const GOVERNANCE_FINDINGS_RETURN_HREF_KEY = "archlucid_governance_findings_return_href_v1";

/** Persists the governance findings queue URL (including filters) for hub continue navigation. */
export function persistGovernanceFindingsReturnHref(href: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const trimmed = href.trim();

  if (!trimmed.startsWith("/governance/findings")) {
    return;
  }

  try {
    window.localStorage.setItem(GOVERNANCE_FINDINGS_RETURN_HREF_KEY, trimmed);
  } catch {
    /* private mode */
  }
}

export function readGovernanceFindingsReturnHref(): string {
  if (typeof window === "undefined") {
    return "/governance/findings";
  }

  try {
    const raw = window.localStorage.getItem(GOVERNANCE_FINDINGS_RETURN_HREF_KEY)?.trim();

    if (raw !== undefined && raw.length > 0 && raw.startsWith("/governance/findings")) {
      return raw;
    }
  } catch {
    /* private mode */
  }

  return "/governance/findings";
}
