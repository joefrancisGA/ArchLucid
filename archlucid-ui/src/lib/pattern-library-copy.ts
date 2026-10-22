/** Canonical `/insights/patterns` copy — header, provenance, and empty states. */
export const PATTERN_LIBRARY_PAGE_TITLE = "Pattern library";

export const PATTERN_LIBRARY_PAGE_SUBTITLE =
  "Explore anonymized architecture patterns, adoption signals, domains, platforms, risks, and approval outcomes.";

export const PATTERN_LIBRARY_PAGE_SUBTITLE_BUYER =
  "Anonymized architecture patterns with adoption, risk, and approval signals.";

export function patternLibraryPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? PATTERN_LIBRARY_PAGE_SUBTITLE_BUYER : PATTERN_LIBRARY_PAGE_SUBTITLE;
}

export const PATTERN_LIBRARY_LOADING_STATUS = "Loading pattern library…";

export const PATTERN_LIBRARY_DETAIL_PAGE_TITLE = "Pattern detail";

export const PATTERN_LIBRARY_DETAIL_LOADING_STATUS = "Loading pattern detail…";

export function patternLibraryDetailSubtitle(
  recordDescription: string,
  buyerPolishedShell: boolean,
): string {
  if (buyerPolishedShell) {
    return "Anonymized pattern guidance for reviews and approval comparisons.";
  }

  return recordDescription;
}

export const PATTERN_LIBRARY_LOAD_RETRY_LABEL = "Try again";

export const PATTERN_LIBRARY_REFRESH_LABEL = "Refresh";

export const PATTERN_LIBRARY_REFRESHING_LABEL = "Refreshing…";

export const PATTERN_LIBRARY_LAST_UPDATED_PREFIX = "Last updated";

export const PATTERN_LIBRARY_PRIVACY_NOTE =
  "Pattern statistics are anonymized and thresholded. Tenant-identifying data is never shown.";

export const PATTERN_LIBRARY_AGGREGATE_PRIVACY_COPY =
  "Anonymized aggregate patterns are shown only when minimum privacy thresholds are met. Tenant-identifying data is never displayed.";

export const PATTERN_LIBRARY_DEMO_NOTICE =
  "Demo workspace: sample pattern data is shown to illustrate the experience.";

export const PATTERN_LIBRARY_SAMPLE_NOTICE =
  "Sample pattern data is shown in this workspace. It does not represent customer usage.";

export const PATTERN_LIBRARY_SEARCH_PLACEHOLDER = "Search patterns";

export const PATTERN_LIBRARY_EMPTY_FILTERED_TITLE = "No patterns match these filters";

export const PATTERN_LIBRARY_EMPTY_FILTERED_BODY =
  "Try another domain, platform, or risk filter — or clear filters to see the full catalog.";

export const PATTERN_LIBRARY_EMPTY_BUILDING_TITLE = "Pattern library is building from finalized reviews";

export const PATTERN_LIBRARY_EMPTY_BUILDING_BODY =
  "As more reviews finalize across anonymized tenants, additional patterns will appear when privacy thresholds are met.";

export const PATTERN_LIBRARY_SUMMARY_PATTERNS_LABEL = "Patterns tracked";
export const PATTERN_LIBRARY_SUMMARY_DOMAINS_LABEL = "Domains represented";
export const PATTERN_LIBRARY_SUMMARY_PLATFORMS_LABEL = "Platforms represented";
export const PATTERN_LIBRARY_SUMMARY_REVIEWS_LABEL = "Reviews contributing";
export const PATTERN_LIBRARY_SUMMARY_THRESHOLD_LABEL = "Minimum tenant threshold";
export const PATTERN_LIBRARY_SUMMARY_UPDATED_LABEL = "Last updated";

export const PATTERN_LIBRARY_NAV_LINK_LABEL = "Pattern library";

/** Shown on the disabled sidebar row until aggregate privacy threshold is met. */
export const PATTERN_LIBRARY_NAV_UNAVAILABLE_TITLE =
  "Unlocks when anonymized pattern statistics meet the minimum tenant threshold across finalized reviews.";

export const PATTERN_LIBRARY_WHAT_IS_PATTERN =
  "A pattern is a recurring architecture shape ArchLucid observes across anonymized reviews — with adoption, risk, and approval signals to help you compare options.";
