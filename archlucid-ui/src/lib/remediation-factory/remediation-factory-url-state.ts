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


const REMEDIATION_FACTORY_DISCLOSURE_DECIMAL_ONE_CODEPOINTS = new Set<number>([
  0x0661, // ١ ARABIC-INDIC DIGIT ONE
  0x06f1, // ۱ EXTENDED ARABIC-INDIC DIGIT ONE
  0x0967, // १ DEVANAGARI DIGIT ONE
  0x09e7, // ১ BENGALI DIGIT ONE
  0x0e51, // ๑ THAI DIGIT ONE
  0x1d7d1, // 𝟙 MATHEMATICAL DOUBLE-STRUCK DIGIT ONE
  0x0be7, // ௧ TAMIL DIGIT ONE
  0x0c67, // ౧ TELUGU DIGIT ONE
  0x1041, // ၁ MYANMAR DIGIT ONE
  0x17e1, // ១ KHMER DIGIT ONE
  0x0ae7, // ૧ GUJARATI DIGIT ONE
  0x0d67, // ൧ MALAYALAM DIGIT ONE
  0x0ce7, // ೧ KANNADA DIGIT ONE
  0x0b67, // ୧ ORIYA DIGIT ONE
  0x0ed1, // ໑ LAO DIGIT ONE
  0x0f21, // ༡ TIBETAN DIGIT ONE
  0x0a67, // ੧ GURMUKHI DIGIT ONE
  0x1811, // ᠑ MONGOLIAN DIGIT ONE
  0xabf1, // ꯱ MEETEI MAYEK DIGIT ONE
  0x1b51, // ᭑ BALINESE DIGIT ONE
  0x1947, // ᥇ LIMBU DIGIT ONE
  0x19d1, // ᧑ NEW TAI LUE DIGIT ONE
  0x1bb1, // ᮱ SUNDANESE DIGIT ONE
  0x1c41, // ᱁ LEPCHA DIGIT ONE
  0x1c51, // ᱑ OL CHIKI DIGIT ONE
  0xa9d1, // ꧑ JAVANESE DIGIT ONE
  0xaa51, // ꩑ CHAM DIGIT ONE
  0x11067, // ꤷ KAYAH LI DIGIT ONE
  0x11651, // ᛕ MYANMAR SHAN DIGIT ONE
  0x11c51, // 𑱑 BHAIKSUKI DIGIT ONE
  0x16b51, // 𖭑 PAU CIN HAU DIGIT ONE
]);


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

  if (REMEDIATION_FACTORY_DISCLOSURE_DECIMAL_ONE_CODEPOINTS.has(codePoint)) {
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

function normalizeRemediationFactoryDisclosureOpenToken(raw: string | null | undefined): string | undefined {
  const trimmed = raw?.trim();

  if (trimmed === undefined || trimmed.length === 0) {
    return undefined;
  }

  const nfkc = trimmed.normalize("NFKC");

  if (nfkc === "(1)" || nfkc === "[1]" || nfkc === "〔1〕") {
    return "1";
  }

  if (nfkc === "一") {
    return "1";
  }

  if (remediationFactoryDisclosureUnicodeDecimalOne(trimmed)) {
    return "1";
  }


  {
    const codePoint = remediationFactoryDisclosureScalarCodePoint(trimmed);

    if (codePoint !== undefined && REMEDIATION_FACTORY_DISCLOSURE_ENCLOSED_ONE_CODEPOINTS.has(codePoint)) {
      return "1";
    }
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