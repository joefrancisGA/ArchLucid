/**
 * Locale string for an ISO-8601 instant, or em dash when missing / not parseable (avoids “Invalid Date” in UI).
 * Uses fixed `en-US` + `UTC` so server and client render the same text (hydration-safe for client components).
 */
export function formatInstantForLocale(iso: string | null | undefined): string {
  if (iso === null || iso === undefined) {
    return " — ";
  }

  const trimmed = iso.trim();

  if (trimmed.length === 0) {
    return " — ";
  }

  const ms = Date.parse(trimmed);

  if (!Number.isFinite(ms)) {
    return " — ";
  }

  return (
    new Date(ms).toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " UTC"
  );
}

/**
 * Conversation list rows: date-only in UTC without a trailing “UTC” timezone label (reads cleaner than
 * long timestamps for saved threads while staying SSR/hydration-safe).
 */
export function formatConversationListDate(iso: string | null | undefined): string {
  if (iso === null || iso === undefined) {
    return " — ";
  }

  const trimmed = iso.trim();

  if (trimmed.length === 0) {
    return " — ";
  }

  const ms = Date.parse(trimmed);

  if (!Number.isFinite(ms)) {
    return " — ";
  }

  return new Date(ms).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Buyer-facing governance timestamps — Eastern Time reads more naturally for US procurement demos.
 */
export function formatInstantForBuyerGovernance(iso: string | null | undefined): string {
  if (iso === null || iso === undefined) {
    return " — ";
  }

  const trimmed = iso.trim();

  if (trimmed.length === 0) {
    return " — ";
  }

  const ms = Date.parse(trimmed);

  if (!Number.isFinite(ms)) {
    return trimmed;
  }

  return (
    new Date(ms).toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }) + " ET"
  );
}

/**
 * Conversation sidebar rows in polished demo builds: show a stable example label to avoid stale-looking
 * static demo dates in buyer captures.
 */
export function formatConversationListDatePolished(iso: string | null | undefined): string {
  // Same arity as `formatConversationListDate` so callers can swap formatters; value not shown in polished shell.
  void iso;

  return "Example evidence answer";
}

/** Browser IANA zone id from `Intl`, or `UTC` when unavailable. */
export function getBrowserIanaTimeZoneId(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/**
 * Short zone label for a wall clock (for example `EDT`, `EST`, `UTC`) — not the long IANA id.
 * Uses the instant so daylight-saving transitions pick the correct abbreviation.
 */
export function formatIanaTimeZoneAbbreviation(timeZoneId: string, instant: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZoneId,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(instant);
    const abbreviation = parts.find((part) => part.type === "timeZoneName")?.value ?? "";

    if (abbreviation.length > 0) {
      return abbreviation;
    }
  } catch {
    // Fall through to IANA id when the zone is unknown to Intl.
  }

  return timeZoneId;
}

/** Abbreviation for the browser's current zone (for example `EDT` for Eastern in summer). */
export function formatBrowserTimeZoneAbbreviation(instant: Date = new Date()): string {
  return formatIanaTimeZoneAbbreviation(getBrowserIanaTimeZoneId(), instant);
}
