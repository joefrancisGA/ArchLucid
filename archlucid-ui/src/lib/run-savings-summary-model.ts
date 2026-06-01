import { fetchArtifactContentUtf8, type ArtifactContentFetchResult } from "@/lib/api/architecture-runs";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import {
  artifactBasenameMatchesList,
  RUN_POTENTIAL_SAVINGS_COST_ACTUAL_ARTIFACT_FILENAMES,
} from "@/lib/run-potential-savings-artifact-names";
import { heuristicAnnualUsdOpportunityFromCostArtifactJson } from "@/lib/run-potential-savings-parser";
import {
  SHOWCASE_STATIC_DEMO_ILLUSTRATIVE_ANNUALIZED_EXTRACTION_USD,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { ArtifactDescriptor } from "@/types/authority";

const SAVINGS_JSON_FETCH_CAP_BYTES = 786_432;

export type RunSavingsSummarySourceKind = "server-findings" | "static-demo" | "extractor-heuristic";

/** Headline KPI surfaced on run detail — server resolver, static demo, or demo-only extractor heuristics. */
export type RunSavingsSummaryModel = Readonly<{
  annualizedUsd: number;
  /** Short methodology footnotes (never echoes raw payloads). */
  basisFootnotes: readonly string[];
  sourceKind: RunSavingsSummarySourceKind;
}>;

/** Picks extractor-style artifacts deterministically regardless of synthesized `artifactType`. */
export function resolveExtractorNamedArtifact(descriptors: readonly ArtifactDescriptor[], filenames: readonly string[]): ArtifactDescriptor | null {
  return descriptors.find((a) => artifactBasenameMatchesList(a.name, filenames)) ?? null;
}

function tryParsedJson(fetch: ArtifactContentFetchResult): { readonly parsed: unknown; readonly footnotes: string[] } {
  const truncationNote =
    fetch.truncated === true
      ? [
        `${fetch.byteLength}-byte excerpt exceeded preview cap (${SAVINGS_JSON_FETCH_CAP_BYTES} bytes); KPI may under-read until the ZIP is downloaded.`,
      ]
      : [];

  try {
    return { parsed: JSON.parse(fetch.text) as unknown, footnotes: truncationNote };
  } catch {
    return {
      parsed: null,
      footnotes: [...truncationNote, `JSON parsing failed (${fetch.byteLength} bytes preview).`],
    };
  }
}

/** Server-side hydrate for **`RunSavingsSummary`** — returns **`null`** when no KPI applies. */
export async function loadRunSavingsSummaryModel(params: Readonly<{
  manifestId: string | undefined | null;
  artifacts: readonly ArtifactDescriptor[];
  usedStaticDemoRun: boolean;
  routeRunId: string;
}>): Promise<RunSavingsSummaryModel | null> {
  const canonRun = canonicalizeDemoRunId(params.routeRunId);

  const manifestTrim = typeof params.manifestId === "string" ? params.manifestId.trim() : "";

  if (params.usedStaticDemoRun && canonRun === SHOWCASE_STATIC_DEMO_RUN_ID) {
    const footnotes: string[] =
      SHOWCASE_STATIC_DEMO_ILLUSTRATIVE_ANNUALIZED_EXTRACTION_USD <= 0
        ? []
        : [
          "Demonstration KPI — representative annualized extractor opportunity anchored to Claims Intake sample reviews.",
          "Connect a tenant with live `cost-actual.json` artifacts to replace this illustrative figure.",
        ];

    const amount = SHOWCASE_STATIC_DEMO_ILLUSTRATIVE_ANNUALIZED_EXTRACTION_USD;

    if (amount > 0) {
      return { annualizedUsd: amount, basisFootnotes: footnotes, sourceKind: "static-demo" };
    }

    return null;
  }

  const costDescriptor = resolveExtractorNamedArtifact(params.artifacts, RUN_POTENTIAL_SAVINGS_COST_ACTUAL_ARTIFACT_FILENAMES);

  if (costDescriptor === null)
    return null;

  const footnotesAccumulator: string[] = [];
  let fromCost = 0;

  if (manifestTrim.length > 0) {
    try {
      const fetched = await fetchArtifactContentUtf8(manifestTrim, costDescriptor.artifactId, SAVINGS_JSON_FETCH_CAP_BYTES);
      const parsedJson = tryParsedJson(fetched);

      footnotesAccumulator.push(...parsedJson.footnotes);
      fromCost = heuristicAnnualUsdOpportunityFromCostArtifactJson(parsedJson.parsed);
    } catch {
      footnotesAccumulator.push("`cost-actual.json` artifact could not be read for automatic KPI rollup.");
    }
  }

  const sumRounded = Math.round(fromCost);

  if (!Number.isFinite(sumRounded) || sumRounded <= 0)
    return null;

  footnotesAccumulator.push(
    `Heuristic roll-up aggregates savings-like numeric signals from ${costDescriptor.name.trim()}. Pure billed totals without adjacent savings wording are suppressed so Finance can still audit the original via Artifacts. Orphan-candidate totals live on the executive dashboard via GET /v1/roi/executive-summary.`,
  );

  return {
    annualizedUsd: sumRounded,
    basisFootnotes: dedupeFootnotesPreserveOrder(footnotesAccumulator),
    sourceKind: "extractor-heuristic",
  };
}

function dedupeFootnotesPreserveOrder(messages: readonly string[]): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();

  for (const raw of messages) {
    const t = raw.trim();

    if (t.length === 0 || seen.has(t))
      continue;

    ordered.push(t);
    seen.add(t);
  }

  return ordered;
}
