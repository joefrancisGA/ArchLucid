import type { ArchitectureIntelligenceReviewTier } from "@/lib/architecture/architecture-intelligence-review-tier";

export type ClosedLoopReasoningSourceText = {
  fileName: string;
  contentType: string;
  content: string;
};

export type ArchitectureIntelligenceFramingQuestion = {
  questionId: string;
  prompt: string;
  isAnswered?: boolean;
  confirmedAnswer?: string | null;
  source?: string;
};

export type ArchitectureIntelligenceSpecialistFinding = {
  findingId?: string;
  title?: string;
  severity?: string;
  conclusion?: string;
  rationale?: string;
};

export type ClosedLoopReasoningResult = {
  model?: { elements?: unknown[]; modelId?: string };
  specialistReviews?: Array<{ findings?: ArchitectureIntelligenceSpecialistFinding[] }>;
  recommendations?: unknown[];
  interview?: {
    framingQuestions?: ArchitectureIntelligenceFramingQuestion[];
    evidenceDrivenQuestions?: ArchitectureIntelligenceFramingQuestion[];
  };
  publishBlocked?: boolean;
  publishBlockReasons?: string[];
  integrityPassedFindingIds?: string[];
  runId?: string | null;
  modelId?: string | null;
  publishedToProduct?: boolean;
  publishedFindingsSnapshotId?: string | null;
  publishedRecommendationCount?: number;
  publishSkipReason?: string | null;
  cacheHit?: boolean;
  cacheReuseReason?: string | null;
  budgetRejected?: boolean;
  budgetRejectReason?: string | null;
  budgetEstimatedTokens?: number;
  budgetMaxTokens?: number;
  budgetEstimatedCostUsd?: number | null;
  budgetRemainingUsd?: number | null;
  budgetEnforced?: boolean;
};

export type ArchitectureIntelligenceProductSourceContext = {
  runId?: string | null;
  sourceTexts?: ClosedLoopReasoningSourceText[];
  declaredPriorities?: string[];
};

const DEFAULT_ARCHITECTURE_FILE_NAME = "architecture-description.txt";
const DEFAULT_CONTENT_TYPE = "text/plain";

export async function fetchArchitectureIntelligenceProductSourceContext(
  runId: string,
): Promise<ArchitectureIntelligenceProductSourceContext> {
  return getJson<ArchitectureIntelligenceProductSourceContext>(
    `/api/proxy/v1/architecture-intelligence/product-runs/${encodeURIComponent(runId)}/source-context`,
  );
}

export async function runArchitectureIntelligenceReasoning(
  body: Record<string, unknown>,
): Promise<ClosedLoopReasoningResult> {
  return postJson<ClosedLoopReasoningResult>("/api/proxy/v1/architecture-intelligence/run", body);
}

export async function continueArchitectureIntelligenceReasoning(
  runId: string,
  body: Record<string, unknown>,
): Promise<ClosedLoopReasoningResult> {
  return postJson<ClosedLoopReasoningResult>(
    `/api/proxy/v1/architecture-intelligence/runs/${encodeURIComponent(runId)}/continue`,
    body,
  );
}

export function primaryDescriptionFromSources(sources: ClosedLoopReasoningSourceText[]): string {
  const descriptionSource =
    sources.find((source) => source.fileName === DEFAULT_ARCHITECTURE_FILE_NAME) ?? sources[0];

  return descriptionSource?.content?.trim() ?? "";
}

export function buildArchitectureIntelligenceRunRequest(options: {
  readonly architectureDescription: string;
  readonly priorities?: string[];
  readonly framingAnswers?: Record<string, string>;
  readonly runId?: string | null;
  readonly hydratedSourceTexts?: ClosedLoopReasoningSourceText[];
  readonly publishToProduct?: boolean;
  readonly reviewTier?: ArchitectureIntelligenceReviewTier;
  readonly continueFromExistingRun?: boolean;
}): Record<string, unknown> {
  const trimmedDescription = options.architectureDescription.trim();
  const hydrated = options.hydratedSourceTexts ?? [];

  let sourceTexts: ClosedLoopReasoningSourceText[] = [];

  if (hydrated.length > 0) {
    sourceTexts = hydrated.map((source, index) => {
      if (index === 0) {
        return {
          ...source,
          content: trimmedDescription.length > 0 ? trimmedDescription : source.content,
        };
      }

      return source;
    });
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
    declaredPriorities: options.priorities ?? [],
    framingAnswers: options.framingAnswers ?? {},
    useGoldenFixture: false,
    runId: options.runId ?? undefined,
    continueFromExistingRun: options.continueFromExistingRun ?? false,
    publishToProduct: options.publishToProduct ?? false,
    reviewTier: options.reviewTier ?? "Standard",
  };
}

/** Prefer USD spend facts; fall back to depth token sizing when cost rates are unavailable. */
export function formatArchitectureIntelligenceSpendSummary(result: ClosedLoopReasoningResult): string {
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

/**
 * Builds closed-loop source texts from architecture draft form fields so operators can refine
 * before a product review exists.
 */
export function buildArchitectureIntelligenceSourcesFromDraftFields(fields: {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
}): ClosedLoopReasoningSourceText[] {
  const systemName = fields.systemName.trim();
  const overview = fields.freeTextIntent.trim();
  const outcome = fields.businessOutcome.trim();

  const lines: string[] = [];

  if (systemName.length > 0) {
    lines.push(`System: ${systemName}`);
  }

  if (overview.length > 0) {
    lines.push(overview);
  }

  if (outcome.length > 0) {
    lines.push(`Business outcome: ${outcome}`);
  }

  if (lines.length === 0) {
    return [];
  }

  return [
    {
      fileName: DEFAULT_ARCHITECTURE_FILE_NAME,
      contentType: DEFAULT_CONTENT_TYPE,
      content: lines.join("\n\n"),
    },
  ];
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    throw new Error(`Request failed (HTTP ${response.status}). ${text.slice(0, 240)}`);
  }

  return (await response.json()) as T;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { method: "GET" });

  if (!response.ok) {
    const text = await response.text().catch(() => "");

    throw new Error(`Request failed (HTTP ${response.status}). ${text.slice(0, 240)}`);
  }

  return (await response.json()) as T;
}
