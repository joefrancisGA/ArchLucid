/** Heuristic parser for extractor-style cost JSON; orphan KPIs use GET /v1/roi/executive-summary (TB-103). */

const MAX_DEPTH = 42;

const EXCLUDE_TAIL_KEY_FRAGMENT =
  /(percent|ratio|count|confidence|priority|generation|cores?|tier|hoursinmonth|latitude|longitude)/i;

const ANY_SAVINGS_PATH =
  /\bsavings\b|\bcostdifference\b|opportunity|\boptimization\b|\bpotential\b|\brecommended\b|idle|\borgphan\b|waste|reduction|rightsiz/i;

const ANNUAL_VALUE_KEY = /\bannual\w*savings|annualsavingsamount|potentialannual|opportunityannual|yearlysavings/i;

const MONTHLY_SAVINGS_KEY =
  /\bestimatedmonthlysavings\b|\bpotentialmonthlysavings\b|\bmonthlysavings\b/i;

/** Column headings implying opportunity vs raw billed spend (`PreTaxCost` alone is ambiguous). */
const CM_OPPORTUNITY_HEADING = /\b(savings|opportunity|potential|recommended|optimization|delta|forecast|idle|unused|waste)/i;

const monthlyPotentialKeys = ["estimatedMonthlySavings", "potentialMonthlySavings", "monthlySavings"] as const;

function isRecord(node: unknown): node is Record<string, unknown> {
  return typeof node === "object" && node !== null && !Array.isArray(node);
}

function flattenPath(stack: readonly string[]): string {
  return stack.join(".").toLowerCase();
}

/** Sum Advisor-style `potentialSavings` blobs without walking children twice. */
function advisoryPotentialSavingsUsd(record: Record<string, unknown>): number {
  const ps = record.potentialSavings;

  if (!isRecord(ps)) return 0;

  let partial = 0;
  const annual = ps.annualSavingsAmount;

  if (typeof annual === "number" && Number.isFinite(annual)) partial += Math.abs(annual);

  monthlyPotentialKeys.forEach((k) => {
    const mv = ps[k];

    if (typeof mv === "number" && Number.isFinite(mv))
      partial += Math.abs(mv) * 12;
  });

  return partial;
}

/** Walk heterogeneous JSON blobs and sum annualized USD hints for cost-side extractor artifacts. */
export function heuristicAnnualUsdOpportunityFromCostArtifactJson(parsed: unknown): number {
  if (parsed === null || parsed === undefined) return 0;

  const stack: string[] = [];

  function leafAnnualUsd(n: number): number {
    if (!Number.isFinite(n)) return 0;

    const hay = flattenPath(stack);
    const tail = stack[stack.length - 1] ?? "";

    if (!ANY_SAVINGS_PATH.test(hay)) return 0;

    if (EXCLUDE_TAIL_KEY_FRAGMENT.test(tail)) return 0;

    const a = Math.abs(n);

    if (ANNUAL_VALUE_KEY.test(tail)) return a;

    if (MONTHLY_SAVINGS_KEY.test(tail)) return a * 12;

    if (/\bsavingsusd\b|^savings$/i.test(tail)) return a;

    if (/\bcostusd\b|\bmonthly\b/i.test(tail) && ANY_SAVINGS_PATH.test(hay)) return a * 12;

    return 0;
  }

  function walk(node: unknown, depth: number): number {
    if (depth > MAX_DEPTH) return 0;

    if (typeof node === "number") return leafAnnualUsd(node);

    if (Array.isArray(node)) return node.reduce((acc, row) => acc + walk(row, depth + 1), 0);

    if (!isRecord(node)) return 0;

    let acc = advisoryPotentialSavingsUsd(node);

    if (isCostManagementQueryShape(node.properties)) acc += extractCostManagementOpportunityUsd(node.properties);

    for (const [key, child] of Object.entries(node)) {
      if (String(key).toLowerCase() === "potentialsavings") continue;

      stack.push(key);
      acc += walk(child, depth + 1);
      stack.pop();
    }

    return acc;
  }

  stack.length = 0;

  return walk(parsed, 0);
}

function isCostManagementQueryShape(props: unknown): props is Record<string, unknown> {
  if (!isRecord(props))
    return false;

  const cols = props.columns;
  const rs = props.rows;

  return Array.isArray(cols) && Array.isArray(rs);
}

function extractCostManagementOpportunityUsd(props: Record<string, unknown>): number {
  const columns = props.columns;
  const rows = props.rows;

  if (!Array.isArray(columns) || !Array.isArray(rows)) return 0;

  const headings: string[] = columns.map((cell) =>
    normalizeHeadingCell(typeof cell === "string" ? cell : headingFromColumnDescriptor(cell)),
  );

  const colIdx = headings.findIndex((h) => CM_OPPORTUNITY_HEADING.test(h));

  if (colIdx < 0) return 0;

  const monthly = MONTHLY_SAVINGS_KEY.test(headings[colIdx]) || /\bmonthly\b/i.test(headings[colIdx]);

  let sum = 0;

  rows.forEach((row) => {
    if (!Array.isArray(row) || typeof row[colIdx] !== "number")
      return;

    const cell = row[colIdx] as number;

    if (!Number.isFinite(cell)) return;

    sum += monthly ? Math.abs(cell) * 12 : Math.abs(cell);
  });

  return sum;
}

function normalizeHeadingCell(h: string): string {
  return h.replace(/\s+/g, "").toLowerCase();
}

function headingFromColumnDescriptor(cell: unknown): string {
  if (!isRecord(cell)) return "";

  const n = cell.name;

  return typeof n === "string" ? n : "";
}

