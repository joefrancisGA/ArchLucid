/** Canonical Advisory scans hub path under Governance (TB-1124). */
export const ADVISORY_SCANS_HREF = "/governance/advisory-scans" as const;

/** Scans tab deep link on the Advisory scans hub (traffic workbook row ADT). */
export const ADVISORY_SCANS_SCANS_HREF = `${ADVISORY_SCANS_HREF}?tab=scans` as const;

/** Schedules tab deep link on the Advisory scans hub (traffic workbook row AD). */
export const ADVISORY_SCANS_SCHEDULES_HREF = `${ADVISORY_SCANS_HREF}?tab=schedules` as const;
