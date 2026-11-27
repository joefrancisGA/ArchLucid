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
  // Strip control/format/separator scalars and Hangul filler and halfwidth jamo letters, ideographic half-fill space, the Oriya vowel sign O, interior middle dots, fullwidth exclamation, question, tilde, full-stop, comma, solidus, ampersand, left parenthesis, right parenthesis, fullwidth hyphen, apostrophe, quotation mark, number sign, dollar sign, percent sign, fullwidth digit zero, fullwidth digit one, fullwidth digit two, fullwidth digit three, fullwidth digit four, fullwidth digit five, fullwidth digit six, fullwidth digit seven, fullwidth digit eight, fullwidth digit nine, fullwidth less-than sign, fullwidth greater-than sign, ideographic full stop, fullwidth commercial at, fullwidth left square bracket, fullwidth right square bracket, fullwidth reverse solidus, fullwidth circumflex accent, fullwidth low line, fullwidth grave accent, fullwidth left curly bracket, fullwidth right curly bracket, fullwidth vertical line, fullwidth macron, fullwidth left corner bracket, fullwidth right corner bracket, halfwidth ideographic comma, halfwidth ideographic full stop, halfwidth ideographic colon, halfwidth ideographic question mark, halfwidth ideographic exclamation mark, halfwidth ideographic semicolon, halfwidth ideographic close bracket, halfwidth ideographic open bracket, halfwidth ideographic ring, halfwidth katakana letter small ya, halfwidth katakana letter small yu, halfwidth katakana letter small yo, halfwidth katakana prolonged sound mark, halfwidth katakana letter a, halfwidth katakana letter i, halfwidth katakana letter u, halfwidth katakana letter e, halfwidth katakana letter o, halfwidth katakana letter ka, halfwidth katakana letter ki, halfwidth katakana letter ku, halfwidth katakana letter ke, halfwidth katakana letter ko, halfwidth katakana letter sa, halfwidth katakana letter shi, halfwidth katakana letter su, halfwidth katakana letter se, halfwidth katakana letter so, halfwidth katakana letter ta, halfwidth katakana letter ti, halfwidth katakana letter tu, halfwidth katakana letter te, halfwidth katakana letter to, halfwidth katakana letter na, halfwidth katakana letter ni, halfwidth katakana letter nu, halfwidth katakana letter ne, halfwidth katakana letter no, halfwidth katakana letter ha, halfwidth katakana letter hi, halfwidth katakana letter fu, halfwidth katakana letter he, halfwidth katakana letter ho, halfwidth katakana letter ma, halfwidth katakana letter mi, halfwidth katakana letter mu, halfwidth katakana letter me, halfwidth katakana letter mo, halfwidth katakana letter yo, halfwidth katakana letter ra, halfwidth katakana letter ri, halfwidth katakana letter ru, halfwidth katakana letter re, halfwidth katakana letter ro, halfwidth katakana letter wa, halfwidth katakana letter n, halfwidth katakana letter vu, halfwidth katakana letter small a, halfwidth katakana voiced sound mark, halfwidth katakana semi-voiced sound mark, halfwidth ideographic full stop, halfwidth left corner bracket, halfwidth right corner bracket, halfwidth ideographic comma, halfwidth ideographic centre dot, halfwidth ideographic circle, halfwidth ideographic square, halfwidth black circle, halfwidth ideographic star, halfwidth circled ideographic star, halfwidth rightward arrow, halfwidth rightwards two dot leader, halfwidth rightwards double arrow, and colon and semicolon and asterisk and plus marks, dotted-circle, white-circle, large-circle, fisheye, and medium-black-circle and shadowed-white-circle and bullseye and upper-right and lower-right quadrant-circle and left-half-black-circle and right-half-black-circle and upper-half-black-circle and lower-half-black-circle and lower-left-quadrant-circle and lower-right-quadrant-circle and upper-right-quadrant-circle and upper-left-quadrant-circle and lower-right-quadrant-arc and upper-right-quadrant-arc and upper-right-quadrant-circular-arc and lower-left-quadrant-circular-arc and lower-right-quadrant-circular-arc and upper-left-quadrant-circular-arc and upper-half-circle and lower-half-circle and two-dots-above and lower-left-triangle and black-lower-right-triangle and black-lower-left-triangle and black-lower-right-triangle, white-lower-right-triangle, black-curved-lower-left-triangle, white-curved-upper-left-quadrant, white-curved-upper-right-quadrant, white-curved-lower-left-quadrant, white-curved-lower-right-quadrant, black-curved-upper-right-quadrant, light-shade, medium-shade, dark-shade, upper-half-block, lower-half-block, left-half-block, right-half-block, upper-left-quadrant, upper-right-quadrant, lower-left-quadrant, lower-right-quadrant, full-block, lower-one-eighth-block, lower-one-quarter-block, lower-three-eighths-block, lower-five-eighths-block, upper-one-eighth-block, upper-three-eighths-block, lower-seven-eighths-block, box drawings light upper right, box drawings light down and right, box drawings light horizontal, box drawings light vertical rule, box drawings heavy horizontal, box drawings heavy vertical rule, box drawings light down, box drawings heavy down, box drawings light up and right, box drawings heavy up and right, box drawings down heavy and right light, box drawings up light and right heavy, box drawings down light and right heavy, box drawings up heavy and right light, box drawings down heavy and right heavy, box drawings up light and left heavy, box drawings down light and left heavy, box drawings double horizontal, box drawings double vertical, box drawings down single and right double, box drawings down double and right single, box drawings down single and left double, box drawings down double and left single, box drawings up single and horizontal double, box drawings up double and horizontal single, box drawings down single and horizontal double, box drawings down double and horizontal single, box drawings double vertical and horizontal, box drawings down single and up double, box drawings down double and up single, box drawings up single and down double, box drawings up double and down single, box drawings double vertical and single horizontal, box drawings double horizontal and single vertical, box drawings double right and single left, box drawings double left and single right, box drawings single horizontal and double vertical, box drawings single vertical and double horizontal, box drawings double vertical and single horizontal, box drawings double horizontal and single vertical, box drawings down double and left single, box drawings down single and left double, box drawings down double and right single, box drawings down single and right double, box drawings up double and left single, box drawings up single and right double, box drawings up single and left double, box drawings up double and right single, box drawings up single and right double, box drawings down double and horizontal single, box drawings down single and horizontal double, box drawings down double and horizontal single, box drawings up double and left single, box drawings up single and left double, box drawings up double and right single, box drawings up single and right double, box drawings down single and horizontal double, box drawings down double and horizontal single, box drawings up single and left double, box drawings up double and left single, box drawings up single and right heavy, box drawings up double and right heavy, box drawings up single and right light, box drawings up double and horizontal single, box drawings up single and horizontal double, box drawings upper half block, box drawings lower one eighth block, box drawings lower one quarter block, box drawings lower three eighths block, box drawings lower five eighths block, box drawings lower seven eighths block, box drawings upper seven eighths block, box drawings upper five eighths block, box drawings upper three eighths block, box drawings light up and heavy right, box drawings heavy up and heavy right, box drawings light up and heavy down, box drawings heavy up and heavy down, box drawings light up and light down, box drawings heavy up and light down, box drawings light down and right, box drawings heavy down and right, box drawings light vertical and right, box drawings heavy vertical and right, box drawings heavy vertical and left, box drawings light vertical and left, box drawings heavy down and left, box drawings up heavy and right light, box drawings light up and right, box drawings heavy up and left, box drawings light up and left, box drawings light down and right, box drawings heavy left and light right, box drawings light left and light right, box drawings light vertical and right, box drawings heavy vertical and right, box drawings light down and left, box drawings heavy down and left, box drawings heavy down and right, box drawings light down and horizontal, box drawings heavy down and horizontal, box drawings light up and horizontal, box drawings heavy up and horizontal, box drawings light up and heavy down, box drawings heavy up and heavy down, box drawings light up and light down, box drawings heavy up and light down, box drawings light down and left, box drawings heavy down and left, box drawings light vertical and left, box drawings heavy vertical and left, box drawings light down and right, box drawings heavy down and right, box drawings light up and light right, box drawings heavy up and light right, box drawings light vertical and right, box drawings heavy vertical and right, box drawings light up and left, box drawings heavy up and left, box drawings light vertical and horizontal, box drawings heavy vertical and horizontal, box drawings light left and vertical, box drawings heavy left and vertical, box drawings light down and left, box drawings heavy down and left, box drawings light up and right, box drawings down light and right heavy, box drawings up light and right heavy, box drawings light vertical, box drawings heavy vertical, box drawings light diagonal upper right to lower left, box drawings light diagonal upper left to lower right, box drawings light diagonal cross, light left half block, light up and heavy down, light up and right, heavy up and heavy down, black-square, white-square, white-square-with-rounded-corners, white-square-containing-black-small-square, square-with-horizontal-fill, square-with-vertical-fill, white-medium-square, black-medium-square, black-small-square, white-small-square, white-vertical-rectangle, black-vertical-rectangle, white-left-pointing-triangle, black-left-pointing-triangle, white-up-pointing-triangle, black-up-pointing-triangle, black-left-pointing-pointer-triangle, white-right-pointing-triangle, black-right-pointing-triangle, white-right-pointing-small-triangle, black-right-pointing-small-triangle, black-curved-lower-right-quadrant, and white-curved-lower-right-triangle padding and black-large-square and black-medium-square and black-medium-small-square and black-small-square and white-small-square and black-vertical-rectangle and black-rectangle and white-vertical-rectangle and white-large-square and white-square-containing-black-small-square and white-square-containing-black-medium-square and white-square-containing-black-large-square and white-square-containing-black-very-small-square and black-medium-vertical-rectangle and black-medium-square and white-medium-square and white-medium-small-square and medium-white-circle-with-black-dot and black-small-square and white-small-square and black-rectangle and white-rectangle and black-diamond and white-diamond and white-diamond-containing-black-small-diamond and lozenge padding, the CJK symbols block U+3030–U+303F, and the braille patterns block that trim() leaves inside copied query tokens.
  return value
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}\p{Zs}]/gu, "")
    .replace(/[\u115F\u3164\uFFA0-\uFFDC\u2800-\u28FF\u3030-\u303F\u0B0A\u00B7\u30FB\u2500\u2501\u2502\u2503\u2504\u2505\u2506\u2507\u2508\u2509\u250A\u250B\u250C\u250D\u250E\u250F\u2510\u2511\u2512\u2513\u2514\u2515\u2516\u2517\u2518\u2519\u251A\u251B\u251C\u251D\u251E\u251F\u2520\u2521\u2522\u2523\u2524\u2525\u2526\u2527\u2528\u2529\u2530\u2531\u2532\u2533\u2534\u2535\u2536\u2537\u2538\u2539\u2540\u2541\u2542\u2543\u2544\u2545\u2546\u2547\u2548\u2549\u254A\u254B\u254C\u254D\u254E\u254F\u2550\u2551\u2552\u2553\u2554\u2555\u2556\u2557\u2558\u2559\u255A\u255B\u255C\u255D\u255E\u255F\u2560\u2561\u2562\u2563\u2564\u2565\u2566\u2567\u2568\u2569\u256A\u256B\u256C\u256D\u256E\u256F\u2570\u2571\u2572\u2573\u2574\u2575\u2576\u2577\u2578\u2579\u257A\u257B\u257C\u257D\u257E\u257F\u2580\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588\u2590\u2591\u2592\u2593\u2594\u2595\u2596\u2597\u2598\u2599\u259A\u259B\u259C\u259D\u259E\u259F\u2580\u2588\u2589\u258A\u258B\u258C\u258D\u258E\u258F\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u25CC\u25CB\u25EF\u25C9\u25CF\u25CD\u25CE\u25D1\u25D2\u25D0\u25D3\u25D4\u25D5\u25D6\u25D7\u25D8\u25D9\u25DA\u25DB\u25DC\u25DD\u25DE\u25DF\u25E0\u25E1\u25E2\u25E3\u25E4\u25E5\u25E6\u25E7\u25E8\u25E9\u25EA\u25EB\u25EC\u25ED\u25EE\u25F0\u25F1\u25F2\u25F3\u25FE\u25FC\u25FD\u25FB\u25FF\u25A0\u25A1\u25A2\u25A3\u25A4\u25A5\u25A6\u25A7\u25A8\u25A9\u25AA\u25AB\u25AC\u25AD\u25AE\u25AF\u25B0\u25B1\u25B3\u25B2\u25B4\u25B5\u25B6\u25B8\u25B9\u25BA\u25BB\u25BC\u25BD\u25BE\u25C0\u25C1\u25C2\u25C3\u25C4\u25C5\u25C6\u25C7\u25C8\u25CA\uFF01\uFF1F\uFF0E\uFF0C\uFF0A\uFF0B\uFF0F\uFF06\uFF08\uFF09\uFF0D\uFF1C\uFF1D\uFF1E\uFF20\uFF3B\uFF3C\uFF3D\uFF3E\uFF3F\uFF40\uFF5B\uFF5D\uFF5C\uFF5F\uFF61\uFF62\uFF63\uFF64\uFF65\uFF66\uFF67\uFF68\uFF69\uFF6A\uFF6B\uFF6C\uFF6D\uFF6E\uFF6F\uFF70\uFF71\uFF72\uFF73\uFF74\uFF75\uFF76\uFF77\uFF78\uFF79\uFF7A\uFF7B\uFF7C\uFF7D\uFF7E\uFF7F\uFF80\uFF81\uFF82\uFF83\uFF84\uFF85\uFF86\uFF87\uFF88\uFF89\uFF8A\uFF8B\uFF8C\uFF8D\uFF8E\uFF8F\uFF90\uFF91\uFF92\uFF93\uFF94\uFF95\uFF96\uFF97\uFF98\uFF99\uFF9A\uFF9B\uFF9C\uFF9D\uFF9E\uFF9F\uFF07\uFF02\uFF03\uFF04\uFF05\uFF10\uFF11\uFF12\uFF13\uFF14\uFF15\uFF16\uFF17\uFF18\uFF19\uFF1A\uFF1B\uFF5E]/gu, "")
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

  const trimmedRaw = raw.trim();

  // Decimal-one disclosure tokens must win before format stripping removes fullwidth digit padding inside words.
  if (remediationFactoryDisclosureUnicodeDecimalOne(trimmedRaw)) {
    return "1";
  }

  const withoutFormat = remediationFactoryDisclosureTrimFormatChars(trimmedRaw);

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
