import type { ArchitectureIntelligenceReviewTier } from "@/lib/architecture/architecture-intelligence-review-tier";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type {
  ClosedLoopReasoningResult,
  ClosedLoopReasoningSourceText,
  SpecialistReviewFinding,
} from "@/app/(operator)/architecture/architecture-intelligence/_sections/architecture-intelligence-types";

export const DEFAULT_ARCHITECTURE_FILE_NAME = "architecture-description.txt";
export const DEFAULT_CONTENT_TYPE = "text/plain";

export function parsePriorities(raw: string): string[] {
  return raw
    .split(",")
    .map((priority) => priority.trim())
    .filter((priority) => priority.length > 0);
}

export function flattenFindings(result: ClosedLoopReasoningResult): SpecialistReviewFinding[] {
  return result.specialistReviews.flatMap((review) => review.findings ?? []);
}

export function formatCountMap(counts: Record<string, number> | null | undefined): string {
  if (counts === null || counts === undefined) {
    return "Counts were not stored.";
  }

  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return "None";
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(
    path,
    mergeRegistrationScopeForProxy({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    throw new Error(`Request failed (HTTP ${response.status}). ${text.slice(0, 240)}`);
  }

  return (await response.json()) as T;
}

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, mergeRegistrationScopeForProxy({ method: "GET" }));

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    throw new Error(`Request failed (HTTP ${response.status}). ${text.slice(0, 240)}`);
  }

  return (await response.json()) as T;
}


export function hasUsableArchitectureSourceText(
  sources: readonly ClosedLoopReasoningSourceText[],
): boolean {
  return sources.some((source) => source.content.trim().length > 0);
}

export function requiresArchitectureDescriptionForMutation(
  architectureDescription: string,
  hydratedSourceTexts: readonly ClosedLoopReasoningSourceText[],
): boolean {
  return (
    architectureDescription.trim().length === 0 && !hasUsableArchitectureSourceText(hydratedSourceTexts)
  );
}

export type ArchitectureIntelligenceProductContextStatus =
  | "idle"
  | "loading"
  | "loaded"
  | "empty"
  | "failed";

export function canAnalyzeHydratedReviewFromIntake(
  productContextStatus: ArchitectureIntelligenceProductContextStatus,
  activeRunId: string | null,
  architectureDescription: string,
  hydratedSourceTexts: readonly ClosedLoopReasoningSourceText[],
): boolean {
  return (
    productContextStatus === "loaded" &&
    (activeRunId?.trim().length ?? 0) > 0 &&
    !requiresArchitectureDescriptionForMutation(architectureDescription, hydratedSourceTexts)
  );
}

export function buildRequest(
  architectureDescription: string,
  prioritiesRaw: string,
  framingAnswers: Record<string, string>,
  options?: {
    useGoldenFixture?: boolean;
    runId?: string | null;
    continueFromExistingRun?: boolean;
    publishToProduct?: boolean;
    hydratedSourceTexts?: ClosedLoopReasoningSourceText[];
    reviewTier?: ArchitectureIntelligenceReviewTier;
  },
) {
  const trimmedDescription = architectureDescription.trim();
  const hydrated = options?.hydratedSourceTexts ?? [];

  let sourceTexts: ClosedLoopReasoningSourceText[] = [];

  if (hydrated.length > 0) {
    if (trimmedDescription.length > 0) {
      const canonicalIndex = hydrated.findIndex(
        (source) => source.fileName === DEFAULT_ARCHITECTURE_FILE_NAME,
      );

      if (canonicalIndex >= 0) {
        sourceTexts = hydrated
          .map((source, index) => {
          if (canonicalIndex === index) {
            return {
              ...source,
              content: trimmedDescription,
            };
          }

          return source;
          })
          .filter((source) => source.content.trim().length > 0);
      } else {
        sourceTexts = [
          {
            fileName: DEFAULT_ARCHITECTURE_FILE_NAME,
            contentType: DEFAULT_CONTENT_TYPE,
            content: trimmedDescription,
          },
          ...hydrated.filter((source) => source.content.trim().length > 0),
        ];
      }
    } else {
      sourceTexts = hydrated.filter((source) => source.content.trim().length > 0);
    }
  } else if (trimmedDescription.length > 0) {
    sourceTexts = [
      {
        fileName: DEFAULT_ARCHITECTURE_FILE_NAME,
        contentType: DEFAULT_CONTENT_TYPE,
        content: trimmedDescription,
      },
    ];
  }

  return {
    sourceTexts,
    declaredPriorities: parsePriorities(prioritiesRaw),
    framingAnswers,
    useGoldenFixture: options?.useGoldenFixture ?? false,
    runId: options?.runId ?? undefined,
    continueFromExistingRun: options?.continueFromExistingRun ?? false,
    publishToProduct: options?.publishToProduct ?? false,
    reviewTier: options?.reviewTier ?? "Standard",
  };
}


export function shouldRequestGoldenFixtureForGoldenTest(
  architectureDescription: string,
  hydratedSourceTexts: readonly ClosedLoopReasoningSourceText[],
): boolean {
  if (architectureDescription.trim().length > 0) {
    return false;
  }

  if (hydratedSourceTexts.length === 0) {
    return true;
  }

  return primaryDescriptionFromSources(hydratedSourceTexts).length === 0;
}
export function primaryDescriptionFromSources(sources: readonly ClosedLoopReasoningSourceText[]): string {
  const descriptionSource = sources.find((source) => source.fileName === DEFAULT_ARCHITECTURE_FILE_NAME);

  return descriptionSource?.content?.trim() ?? "";
}

/**
 * Spend summary for a completed run. Prefers real USD, which is what the AI usage dashboard and the
 * budget pill report; falls back to the token sizing used for the analysis-depth check when no LLM
 * cost rates are configured.
 */
export function formatReasoningSpendSummary(result: ClosedLoopReasoningResult): string {
  const parts: string[] = [];

  if (typeof result.budgetEstimatedCostUsd === "number") {
    parts.push(`Estimated cost $${result.budgetEstimatedCostUsd.toFixed(2)}`);
  }

  if (typeof result.budgetRemainingUsd === "number") {
    parts.push(`$${result.budgetRemainingUsd.toFixed(2)} AI budget remaining`);
  }

  if (
    parts.length === 0 &&
    typeof result.budgetEstimatedTokens === "number" &&
    typeof result.budgetMaxTokens === "number"
  ) {
    parts.push(`Est. tokens ${result.budgetEstimatedTokens}/${result.budgetMaxTokens}`);
  }

  if (parts.length === 0) {
    return "";
  }

  return ` · ${parts.join(" · ")}`;
}
