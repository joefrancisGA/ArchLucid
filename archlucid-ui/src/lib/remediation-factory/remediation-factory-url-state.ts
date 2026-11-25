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

  if (trimmed.length === 1) {
    const codePoint = trimmed.codePointAt(0);

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