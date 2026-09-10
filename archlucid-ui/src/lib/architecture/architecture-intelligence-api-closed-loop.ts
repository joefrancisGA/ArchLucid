import type { ArchitectureIntelligenceReviewTier } from "@/lib/architecture/architecture-intelligence-review-tier";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { architectureIntelligenceRunModelBlockedReason } from "@/lib/architecture/architecture-intelligence-run-model-blocked-reason";
import { architectureIntelligenceRunMutationBlockedReason } from "@/lib/architecture/architecture-intelligence-run-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { buildApiRequestErrorFromParts } from "@/lib/api-error";
import { applyCorrelationHeaders } from "@/lib/api/http";
import { apiGet } from "@/lib/api/http";

import type {
  ArchitectureIntelligenceProductSourceContext,
  ClosedLoopReasoningResult,
  ClosedLoopReasoningSourceText,
} from "@/lib/architecture/architecture-intelligence-api-types";
import type { components } from "@/lib/openapi-schemas";
import { apiGetSealedManifestAware } from "@/lib/api/api-get-sealed-manifest-aware";

type ArchitectureKnowledgeModel = components["schemas"]["ArchitectureKnowledgeModel"];

const DEFAULT_ARCHITECTURE_FILE_NAME = "architecture-description.txt";
const DEFAULT_CONTENT_TYPE = "text/plain";

export async function fetchArchitectureIntelligenceProductSourceContext(
  runId: string,
): Promise<ArchitectureIntelligenceProductSourceContext> {
  return apiGetSealedManifestAware<ArchitectureIntelligenceProductSourceContext>(
    `/v1/architecture-intelligence/product-runs/${encodeURIComponent(runId)}/source-context`,
  );
}

export async function fetchArchitectureIntelligenceRunModel(
  runId: string,
): Promise<ArchitectureKnowledgeModel> {
  try {
    return await apiGet<ArchitectureKnowledgeModel>(
      `/v1/architecture-intelligence/runs/${encodeURIComponent(runId)}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureIntelligenceRunModelBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function fetchArchitectureIntelligenceRunModel(
  runId: string,
): Promise<ArchitectureKnowledgeModel> {
  try {
    return await apiGet<ArchitectureKnowledgeModel>(
      `/v1/architecture-intelligence/runs/${encodeURIComponent(runId)}`,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureIntelligenceRunModelBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
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

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const scoped = mergeRegistrationScopeForProxy({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const headers = new Headers(scoped.headers);
  const { headers: correlatedHeaders, correlationId } = applyCorrelationHeaders(headers);

  let response: Response;

  try {
    response = await fetch(path, { ...scoped, headers: correlatedHeaders });
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = architectureIntelligenceRunMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  const text = await response.text().catch(() => "");

  if (!response.ok) {
    const failure = toApiLoadFailure(buildApiRequestErrorFromParts(response, text, correlationId));
    const blockedReason = architectureIntelligenceRunMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }

  if (text.trim().length === 0) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
