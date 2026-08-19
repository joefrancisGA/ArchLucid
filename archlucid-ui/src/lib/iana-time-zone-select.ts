const UTC_SELECT_VALUE = "Etc/UTC";

const UTC_IANA_ALIASES = new Set(["UTC", "Etc/UTC", "Etc/GMT", "GMT", "Africa/Abidjan"]);

export function isUtcIanaTimeZoneId(id: string): boolean {
  return UTC_IANA_ALIASES.has(id.trim());
}

/** Maps stored/API IANA ids to a select value that exists in the dropdown. */
export function normalizeIanaTimeZoneForSelect(id: string): string {
  const trimmed = id.trim();

  if (trimmed.length === 0 || isUtcIanaTimeZoneId(trimmed)) {
    return UTC_SELECT_VALUE;
  }

  return trimmed;
}

/** Friendly label for timezone options (UTC aliases render as "UTC"). */
export function formatIanaTimeZoneOptionLabel(id: string): string {
  if (isUtcIanaTimeZoneId(id)) {
    return "UTC";
  }

  return id;
}

/** Persist canonical UTC id expected by API defaults and scheduling. */
export function toStoredIanaTimeZoneId(selectValue: string): string {
  if (isUtcIanaTimeZoneId(selectValue)) {
    return "UTC";
  }

  return selectValue.trim();
}

function getRawIanaTimeZones(): string[] {
  try {
    return (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ?? commonTimeZones();
  } catch {
    return commonTimeZones();
  }
}

function commonTimeZones(): string[] {
  return [
    "Etc/UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Singapore",
    "Australia/Sydney",
  ];
}

export type IanaTimeZoneSelectOption = {
  readonly value: string;
  readonly label: string;
};

export function getIanaTimeZoneSelectOptions(): readonly IanaTimeZoneSelectOption[] {
  const options: IanaTimeZoneSelectOption[] = [{ value: UTC_SELECT_VALUE, label: "UTC" }];
  const seen = new Set<string>([UTC_SELECT_VALUE]);

  for (const timeZoneId of getRawIanaTimeZones()) {
    if (isUtcIanaTimeZoneId(timeZoneId) || seen.has(timeZoneId)) {
      continue;
    }

    seen.add(timeZoneId);
    options.push({ value: timeZoneId, label: timeZoneId });
  }

  return options;
}
