import { getIanaTimeZoneSelectOptions, isUtcIanaTimeZoneId, toStoredIanaTimeZoneId } from "@/lib/iana-time-zone-select";

export type IanaTimeZoneDisplayEntry = {
  readonly ianaTimeZoneId: string;
  readonly friendlyName: string;
  readonly city: string;
  readonly searchIndex: string;
};

type CuratedTimeZoneMeta = {
  readonly friendlyName: string;
  readonly city: string;
  readonly searchTerms: readonly string[];
};

const CURATED_TIME_ZONE_META: Readonly<Record<string, CuratedTimeZoneMeta>> = {
  "America/Halifax": { friendlyName: "Atlantic Time", city: "Halifax", searchTerms: ["AST", "ADT", "Atlantic"] },
  "America/New_York": { friendlyName: "Eastern Time", city: "New York", searchTerms: ["EST", "EDT", "Boston", "Eastern", "NYC"] },
  "America/Chicago": { friendlyName: "Central Time", city: "Chicago", searchTerms: ["CST", "CDT", "Central", "Dallas"] },
  "America/Denver": { friendlyName: "Mountain Time", city: "Denver", searchTerms: ["MST", "MDT", "Mountain"] },
  "America/Los_Angeles": { friendlyName: "Pacific Time", city: "Los Angeles", searchTerms: ["PST", "PDT", "Pacific", "LA"] },
  "America/Phoenix": { friendlyName: "Mountain Time", city: "Phoenix", searchTerms: ["MST", "Arizona"] },
  "America/Anchorage": { friendlyName: "Alaska Time", city: "Anchorage", searchTerms: ["AKST", "AKDT", "Alaska"] },
  "Pacific/Honolulu": { friendlyName: "Hawaii Time", city: "Honolulu", searchTerms: ["HST", "Hawaii"] },
  "Europe/London": { friendlyName: "Greenwich Mean Time", city: "London", searchTerms: ["GMT", "BST", "UK", "Britain"] },
  "Europe/Paris": { friendlyName: "Central European Time", city: "Paris", searchTerms: ["CET", "CEST", "France"] },
  "Europe/Berlin": { friendlyName: "Central European Time", city: "Berlin", searchTerms: ["CET", "CEST", "Germany"] },
  "Asia/Tokyo": { friendlyName: "Japan Standard Time", city: "Tokyo", searchTerms: ["JST", "Japan"] },
  "Asia/Singapore": { friendlyName: "Singapore Time", city: "Singapore", searchTerms: ["SGT"] },
  "Asia/Kolkata": { friendlyName: "India Standard Time", city: "Kolkata", searchTerms: ["IST", "India", "Mumbai", "Delhi"] },
  "Australia/Sydney": { friendlyName: "Australian Eastern Time", city: "Sydney", searchTerms: ["AEST", "AEDT", "Australia"] },
};

const IANA_TIME_ZONE_DISPLAY_CACHE = new Map<string, IanaTimeZoneDisplayEntry>();

function cityFromIanaId(ianaTimeZoneId: string): string {
  const segment = ianaTimeZoneId.split("/").pop() ?? ianaTimeZoneId;

  return segment.replace(/_/g, " ");
}

function friendlyNameFromIntl(ianaTimeZoneId: string, instant: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimeZoneId,
      timeZoneName: "longGeneric",
    }).formatToParts(instant);
    const generic = parts.find((part) => part.type === "timeZoneName")?.value?.trim() ?? "";

    if (generic.length > 0 && generic !== ianaTimeZoneId) {
      return generic;
    }
  } catch {
    // Fall through to city label when Intl cannot resolve the zone.
  }

  return cityFromIanaId(ianaTimeZoneId);
}

function normalizeSearchToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[−–—]/g, "-");
}

function buildSearchIndex(input: {
  readonly ianaTimeZoneId: string;
  readonly friendlyName: string;
  readonly city: string;
  readonly searchTerms: readonly string[];
  readonly instant: Date;
}): string {
  const offset = normalizeSearchToken(formatIanaTimeZoneUtcOffsetLabel(input.ianaTimeZoneId, input.instant));
  const offsetCompact = offset.replace(":", "");

  return normalizeSearchToken(
    [
      input.ianaTimeZoneId,
      input.friendlyName,
      input.city,
      ...input.searchTerms,
      offset,
      offsetCompact,
      offset.replace("utc", "gmt"),
    ].join(" "),
  );
}

export function formatIanaTimeZoneFriendlyTitle(ianaTimeZoneId: string): string {
  const normalized = toStoredIanaTimeZoneId(ianaTimeZoneId);

  if (isUtcIanaTimeZoneId(normalized)) {
    return "Coordinated Universal Time";
  }

  const curated = CURATED_TIME_ZONE_META[normalized];

  if (curated !== undefined) {
    return `${curated.friendlyName} — ${curated.city}`;
  }

  const city = cityFromIanaId(normalized);
  const friendlyName = friendlyNameFromIntl(normalized, new Date());

  if (friendlyName === city) {
    return city;
  }

  return `${friendlyName} — ${city}`;
}

export function formatIanaTimeZoneUtcOffsetLabel(ianaTimeZoneId: string, instant: Date = new Date()): string {
  if (isUtcIanaTimeZoneId(ianaTimeZoneId)) {
    return "UTC+00:00";
  }

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimeZoneId,
      timeZoneName: "longOffset",
    }).formatToParts(instant);
    const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "";

    if (raw === "GMT" || raw === "UTC") {
      return "UTC+00:00";
    }

    const match = raw.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);

    if (match !== null) {
      const sign = match[1] === "-" ? "−" : "+";
      const hours = match[2].padStart(2, "0");
      const minutes = match[3] ?? "00";

      return `UTC${sign}${hours}:${minutes}`;
    }
  } catch {
    // Fall through when the zone id is unknown to Intl.
  }

  return "UTC+00:00";
}

export function formatIanaTimeZoneClosedLabel(ianaTimeZoneId: string, instant: Date = new Date()): string {
  return `${formatIanaTimeZoneFriendlyTitle(ianaTimeZoneId)} (${formatIanaTimeZoneUtcOffsetLabel(ianaTimeZoneId, instant)})`;
}

export function formatIanaTimeZoneCurrentTimePreview(ianaTimeZoneId: string, instant: Date = new Date()): string {
  try {
    const formatted = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaTimeZoneId,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(instant);

    return `Currently ${formatted}`;
  } catch {
    return "Currently —";
  }
}

export function resolveIanaTimeZoneDisplayEntry(
  ianaTimeZoneId: string,
  instant: Date = new Date(),
): IanaTimeZoneDisplayEntry {
  const normalized = toStoredIanaTimeZoneId(ianaTimeZoneId);
  const cached = IANA_TIME_ZONE_DISPLAY_CACHE.get(normalized);

  if (cached !== undefined) {
    return cached;
  }

  const curated = CURATED_TIME_ZONE_META[normalized];
  const city = curated?.city ?? cityFromIanaId(normalized);
  const friendlyName = curated?.friendlyName ?? friendlyNameFromIntl(normalized, instant);
  const searchTerms = curated?.searchTerms ?? [];
  const entry: IanaTimeZoneDisplayEntry = {
    ianaTimeZoneId: normalized,
    friendlyName,
    city,
    searchIndex: buildSearchIndex({
      ianaTimeZoneId: normalized,
      friendlyName,
      city,
      searchTerms,
      instant,
    }),
  };

  IANA_TIME_ZONE_DISPLAY_CACHE.set(normalized, entry);

  return entry;
}

export function listIanaTimeZoneDisplayEntries(instant: Date = new Date()): readonly IanaTimeZoneDisplayEntry[] {
  return getIanaTimeZoneSelectOptions().map((option) =>
    resolveIanaTimeZoneDisplayEntry(toStoredIanaTimeZoneId(option.value), instant),
  );
}

export function searchIanaTimeZoneDisplayEntries(
  query: string,
  entries: readonly IanaTimeZoneDisplayEntry[],
): readonly IanaTimeZoneDisplayEntry[] {
  const normalizedQuery = normalizeSearchToken(query);

  if (normalizedQuery.length === 0) {
    return entries;
  }

  return entries.filter((entry) => entry.searchIndex.includes(normalizedQuery));
}

export function sortIanaTimeZoneDisplayEntries(
  entries: readonly IanaTimeZoneDisplayEntry[],
  instant: Date = new Date(),
): readonly IanaTimeZoneDisplayEntry[] {
  return [...entries].sort((left, right) => {
    const offsetCompare = formatIanaTimeZoneUtcOffsetLabel(left.ianaTimeZoneId, instant).localeCompare(
      formatIanaTimeZoneUtcOffsetLabel(right.ianaTimeZoneId, instant),
    );

    if (offsetCompare !== 0) {
      return offsetCompare;
    }

    return formatIanaTimeZoneFriendlyTitle(left.ianaTimeZoneId).localeCompare(
      formatIanaTimeZoneFriendlyTitle(right.ianaTimeZoneId),
    );
  });
}
