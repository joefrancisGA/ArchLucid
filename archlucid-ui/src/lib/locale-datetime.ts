import { DEFAULT_IANA_TIME_ZONE_ID } from "@/lib/default-iana-time-zone";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";

/**
 * Locale string for an ISO-8601 instant, or em dash when missing / not parseable (avoids “Invalid Date” in UI).
 * Uses fixed `en-US` + product default IANA zone so server and client render the same text (hydration-safe).
 */
export function formatInstantForLocale(iso: string | null | undefined): string {
  return formatInstantInPreferredTimeZone(iso);
}

/**
 * Conversation list rows: date-only in the product default zone (reads cleaner than long timestamps
 * for saved threads while staying SSR/hydration-safe).
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
    timeZone: DEFAULT_IANA_TIME_ZONE_ID,
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

function resolvePreferredIanaTimeZoneId(ianaTimeZoneId: string | null | undefined): string {
  if (ianaTimeZoneId === null || ianaTimeZoneId === undefined) {
    return DEFAULT_IANA_TIME_ZONE_ID;
  }

  const trimmed = ianaTimeZoneId.trim();

  if (trimmed.length === 0) {
    return DEFAULT_IANA_TIME_ZONE_ID;
  }

  return trimmed;
}

/** Minute-precision wall clock plus short zone (EDT/EST), never seconds. */
function formatInstantClockInTimeZone(instant: Date, timeZoneId: string): string {
  return instant.toLocaleString("en-US", {
    timeZone: timeZoneId,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

/** Two-digit year and 24-hour clock, no AM/PM — dense inventory last-seen cells. */
function formatInstantCompactMilitaryClockInTimeZone(instant: Date, timeZoneId: string): string {
  return instant.toLocaleString("en-US", {
    timeZone: timeZoneId,
    year: "2-digit",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Operator capture/clock labels in the user's IANA preference (product default: US Eastern).
 * Minute precision only — snapshot freshness does not need seconds. `timeZoneName: "short"`
 * picks EDT vs EST from the instant. Explicit `timeZone` keeps SSR and client text aligned (TB-1678).
 */
export function formatInstantInPreferredTimeZone(
  iso: string | null | undefined,
  ianaTimeZoneId: string | null | undefined = DEFAULT_IANA_TIME_ZONE_ID,
): string {
  if (iso === null || iso === undefined) {
    return " — ";
  }

  const trimmed = iso.trim();

  if (trimmed.length === 0) {
    return " — ";
  }

  const ms = parseIsoUtcMs(trimmed);

  if (!Number.isFinite(ms)) {
    return trimmed;
  }

  const instant = new Date(ms);
  const timeZoneId = resolvePreferredIanaTimeZoneId(ianaTimeZoneId);

  try {
    return formatInstantClockInTimeZone(instant, timeZoneId);
  } catch {
    if (timeZoneId === DEFAULT_IANA_TIME_ZONE_ID) {
      return trimmed;
    }

    return formatInstantClockInTimeZone(instant, DEFAULT_IANA_TIME_ZONE_ID);
  }
}

/**
 * Compact inventory timestamps: two-digit year and 24-hour clock (no AM/PM).
 * Minute precision, product default IANA zone — hydration-safe (TB-1678).
 */
export function formatInstantCompactMilitary(
  iso: string | null | undefined,
  ianaTimeZoneId: string | null | undefined = DEFAULT_IANA_TIME_ZONE_ID,
): string {
  if (iso === null || iso === undefined) {
    return " — ";
  }

  const trimmed = iso.trim();

  if (trimmed.length === 0) {
    return " — ";
  }

  const ms = parseIsoUtcMs(trimmed);

  if (!Number.isFinite(ms)) {
    return trimmed;
  }

  const instant = new Date(ms);
  const timeZoneId = resolvePreferredIanaTimeZoneId(ianaTimeZoneId);

  try {
    return formatInstantCompactMilitaryClockInTimeZone(instant, timeZoneId);
  } catch {
    if (timeZoneId === DEFAULT_IANA_TIME_ZONE_ID) {
      return trimmed;
    }

    return formatInstantCompactMilitaryClockInTimeZone(instant, DEFAULT_IANA_TIME_ZONE_ID);
  }
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

/** Browser IANA zone id from `Intl`, or the product default when unavailable. */
export function getBrowserIanaTimeZoneId(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return DEFAULT_IANA_TIME_ZONE_ID;
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
