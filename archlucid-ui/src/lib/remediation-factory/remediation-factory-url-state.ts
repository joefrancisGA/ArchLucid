import { buildOperatorHrefFromSearch } from "@/lib/operator/operator-url-href-from-search";

export const REMEDIATION_FACTORY_SELECTED_FINDING_PARAM = "selectedFinding" as const;
export const REMEDIATION_FACTORY_SELECTED_PATH_PARAM = "selectedPath" as const;
export const REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM = "fromSnapshot" as const;
export const REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM = "toSnapshot" as const;
export const REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM = "remediationFactoryMetricsOpen" as const;

export type RemediationFactoryUrlState = {
  readonly selectedFindingId: string | null;
  readonly selectedPathId: string | null;
  readonly fromSnapshotId: string | null;
  readonly toSnapshotId: string | null;
  readonly metricsSummaryOpen: boolean;
};

function normalizeUuidQueryValue(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function readUuidParam(params: URLSearchParams, key: string): string | null {
  return normalizeUuidQueryValue(params.get(key));
}



function remediationFactoryDisclosureDecimalRunDigitOne(codePoint: number): boolean {
  if (codePoint <= 0) {
    return false;
  }

  const previous = String.fromCodePoint(codePoint - 1);
  const twoBackCodePoint = codePoint - 2;

  if (twoBackCodePoint < 0) {
    return /^\p{Nd}$/u.test(previous);
  }

  const twoBack = String.fromCodePoint(twoBackCodePoint);

  if (!/^\p{Nd}$/u.test(previous)) {
    return false;
  }

  if (/^\p{Nd}$/u.test(twoBack)) {
    return false;
  }

  return true;
}

function remediationFactoryDisclosureScalarCodePoint(trimmed: string): number | undefined {
  let codePoint: number | undefined;
  let scalarCount = 0;

  for (const char of trimmed) {
    const next = char.codePointAt(0);

    if (next === undefined) {
      return undefined;
    }

    scalarCount += 1;
    codePoint = next;
  }

  if (scalarCount !== 1 || codePoint === undefined) {
    return undefined;
  }

  return codePoint;
}
function remediationFactoryDisclosureUnicodeDecimalOne(trimmed: string): boolean {
  if (!/^\p{Nd}$/u.test(trimmed)) {
    return false;
  }

  const codePoint = remediationFactoryDisclosureScalarCodePoint(trimmed);

  if (codePoint === undefined) {
    return false;
  }

  if (remediationFactoryDisclosureDecimalRunDigitOne(codePoint)) {
    return true;
  }

  const nfkcAsciiDigit = trimmed.normalize("NFKC");

  const nfkcScalar = remediationFactoryDisclosureScalarCodePoint(nfkcAsciiDigit);

  return nfkcScalar !== undefined && nfkcScalar >= 0x30 && nfkcScalar <= 0x39 && nfkcScalar === 0x31;
}
const REMEDIATION_FACTORY_DISCLOSURE_ENCLOSED_ONE_CODEPOINTS = new Set<number>([
  0x24f5, // ⓵ DOUBLE CIRCLED DIGIT ONE
  0x2776, // ❶ DINGBAT NEGATIVE CIRCLED DIGIT ONE
  0x2160, // Ⅰ ROMAN NUMERAL ONE
  0x2170, // ⅰ SMALL ROMAN NUMERAL ONE
  0x3021, // 〡 HANGZHOU NUMERAL ONE
]);

function remediationFactoryDisclosureTrimFormatChars(value: string): string {
  // Strip control/format/separator scalars and Hangul filler and halfwidth jamo letters, ideographic half-fill space, the Oriya vowel sign O, interior middle dots, fullwidth exclamation, question, tilde, and full-stop marks, dotted-circle, white-circle, large-circle, and fisheye padding, the CJK symbols block U+3030–U+303F, and the braille patterns block that trim() leaves inside copied query tokens.
  return value
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\p{Zs}]/gu, "")
    .replace(/[\u115F\u3164\uFFA0-\uFFDC\u2800-\u28FF\u3030-\u303F\u0B0A\u00B7\u30FB\u25CC\u25CB\u25EF\u25C9\uFF01\uFF1F\uFF0E\uFF5E]/gu, "")
    .trim();
}

function remediationFactoryDisclosureNormalizeTokenSurface(value: string): string {
  const withoutFormat = remediationFactoryDisclosureTrimFormatChars(value);

  // Query copy can embed combining marks after an otherwise valid open digit or word (e.g. 1 + U+0301).
  return withoutFormat.normalize("NFKD").replace(/\p{M}/gu, "").trim();
}

function normalizeRemediationFactoryDisclosureOpenToken(raw: string | null | undefined): string | undefined {
  if (raw === null || raw === undefined) {
    return undefined;
  }

  const withoutFormat = remediationFactoryDisclosureTrimFormatChars(raw.trim());

  if (withoutFormat.length === 0) {
    return undefined;
  }

  if (remediationFactoryDisclosureUnicodeDecimalOne(withoutFormat)) {
    return "1";
  }

  {
    const codePoint = remediationFactoryDisclosureScalarCodePoint(withoutFormat);

    if (codePoint !== undefined && REMEDIATION_FACTORY_DISCLOSURE_ENCLOSED_ONE_CODEPOINTS.has(codePoint)) {
      return "1";
    }
  }

  const trimmed = remediationFactoryDisclosureNormalizeTokenSurface(raw.trim());

  if (trimmed.length === 0) {
    return undefined;
  }

  const nfkc = trimmed.normalize("NFKC");

  if (nfkc === "(1)" || nfkc === "[1]" || nfkc === "〔1〕") {
    return "1";
  }

  if (nfkc === "一") {
    return "1";
  }

  return nfkc.toLowerCase();
}
function remediationFactoryDisclosureNumericOneOpenToken(normalized: string): boolean {
  const unsigned = normalized.startsWith("+") ? normalized.slice(1) : normalized;

  if (/^\d+$/.test(unsigned)) {
    return Number(unsigned) === 1;
  }

  if (/^\d+\.(\d+)?$/.test(unsigned)) {
    const numeric = Number(unsigned);

    return Number.isFinite(numeric) && numeric === 1;
  }

  if (/[eE]/.test(unsigned)) {
    // URLSearchParams decodes bare "+" in query values as a space (application/x-www-form-urlencoded).
    const scientificLiteral = unsigned.replace(/([eE])\s+([0-9+-])/, "$1+$2");
    const numeric = Number(scientificLiteral);

    return Number.isFinite(numeric) && numeric === 1;
  }

  if (/^\d+,\d+$/.test(unsigned)) {
    const [, fractional] = unsigned.split(",");
    const looksLikeThousandsGrouping =
      fractional !== undefined && fractional.length >= 3 && /^0+$/.test(fractional);
    const numeric = Number(unsigned.replace(",", "."));

    if (!looksLikeThousandsGrouping && Number.isFinite(numeric) && numeric === 1) {
      return true;
    }
  }
  if (/^0[bBoO]/.test(unsigned)) {
    const numeric = Number(unsigned);

    return Number.isFinite(numeric) && numeric === 1;
  }

  return false;
}
function setUuidParam(params: URLSearchParams, key: string, value: string | null): void {
  const normalized = normalizeUuidQueryValue(value);

  if (normalized !== null) {
    params.set(key, normalized);
  } else {
    params.delete(key);
  }
}

export function parseRemediationFactoryDisclosureOpenFromSearch(raw: string | null | undefined): boolean {
  const normalized = normalizeRemediationFactoryDisclosureOpenToken(raw);

  if (normalized === undefined || normalized.length === 0) {
    return false;
  }

  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on" ||
    remediationFactoryDisclosureNumericOneOpenToken(normalized)
  );
}

export function parseRemediationFactoryUrlStateFromSearch(search: string): RemediationFactoryUrlState {
  const params = new URLSearchParams(search);

  return {
    selectedFindingId: readUuidParam(params, REMEDIATION_FACTORY_SELECTED_FINDING_PARAM),
    selectedPathId: readUuidParam(params, REMEDIATION_FACTORY_SELECTED_PATH_PARAM),
    fromSnapshotId: readUuidParam(params, REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM),
    toSnapshotId: readUuidParam(params, REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM),
    metricsSummaryOpen: parseRemediationFactoryDisclosureOpenFromSearch(
      params.get(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM),
    ),
  };
}

export function remediationFactoryUrlStateToSearchParams(
  state: RemediationFactoryUrlState,
  baseSearch = "",
): URLSearchParams {
  const params = new URLSearchParams(baseSearch);

  setUuidParam(params, REMEDIATION_FACTORY_SELECTED_FINDING_PARAM, state.selectedFindingId);
  setUuidParam(params, REMEDIATION_FACTORY_SELECTED_PATH_PARAM, state.selectedPathId);
  setUuidParam(params, REMEDIATION_FACTORY_FROM_SNAPSHOT_PARAM, state.fromSnapshotId);
  setUuidParam(params, REMEDIATION_FACTORY_TO_SNAPSHOT_PARAM, state.toSnapshotId);

  if (state.metricsSummaryOpen) {
    params.set(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM, "1");
  } else {
    params.delete(REMEDIATION_FACTORY_METRICS_SUMMARY_OPEN_PARAM);
  }

  return params;
}

export function remediationFactoryHrefFromSearch(pathname: string, search: string): string {
  return buildOperatorHrefFromSearch(search, pathname, {
    selectionSwitch: { kind: "disclosure-only" },
    mutate: () => {},
  });
}
