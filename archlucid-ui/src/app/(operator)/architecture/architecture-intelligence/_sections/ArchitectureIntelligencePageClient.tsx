"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { ArchitectureIntelligenceProductRoundTrip } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceProductRoundTrip";
import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { ArchitectureIntelligenceEvidenceGraphVocabularyRail } from "@/components/ArchitectureIntelligenceEvidenceGraphVocabularyRail";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { governanceFindingInspectHref } from "@/components/governance/findings/governance-findings-navigation";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { PageCapabilityBoundaryStrip } from "@/components/PageCapabilityBoundaryStrip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS,
  architectureIntelligenceReviewTierLabel,
  isArchitectureIntelligenceReviewTier,
  type ArchitectureIntelligenceReviewTier,
} from "@/lib/architecture-intelligence-review-tier";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ClosedLoopReasoningSourceText = {
  fileName: string;
  contentType: string;
  content: string;
};

type SpecialistReviewFinding = {
  findingId?: string;
  title: string;
  severity: string;
  conclusion: string;
  evidenceCondition?: string;
  governanceDisposition?: string;
  rationale?: string;
};

type ArchitectureRecommendation = {
  recommendationId: string;
  problem: string;
  proposedChange: string;
};

type MustNotFailViolation = {
  class: string;
  message: string;
  blocked: boolean;
};

type FramingQuestion = {
  questionId: string;
  prompt: string;
  isAnswered: boolean;
  confirmedAnswer?: string | null;
  source?: string;
};

type EvidenceValidationResult = {
  findingId: string;
  overallPassedIntegrity: boolean;
  escalated: boolean;
  semanticAssessment?: string | null;
  stageResults?: Array<{
    stage: string;
    passed: boolean;
    isDeterministic: boolean;
    detail?: string;
  }>;
};

type AdversarialReviewResult = {
  substantiatedFindings?: SpecialistReviewFinding[];
  challenges?: Array<{ hypothesis: string; falsificationEvidenceNeeded: string; suppressed?: boolean }>;
  falsePositiveRateByLane?: Record<string, number>;
};

type ClosedLoopReasoningResult = {
  model: { elements: unknown[]; modelId?: string };
  specialistReviews: Array<{ findings: SpecialistReviewFinding[] }>;
  recommendations: ArchitectureRecommendation[];
  mustNotFailViolations: MustNotFailViolation[];
  interview?: {
    framingQuestions?: FramingQuestion[];
    evidenceDrivenQuestions?: FramingQuestion[];
  };
  adversarial?: AdversarialReviewResult;
  validationResults?: EvidenceValidationResult[];
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
  productFindings?: Array<{
    findingId: string;
    title: string;
    severity: string;
    properties?: Record<string, string>;
  }>;
};

type CategoryBenchmarkScore = {
  category: string;
  score: number;
  detail: string;
};

type GoldenArchitectureTestResult = {
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
  deltaCounts?: Record<string, number>;
  plantedDefectRecall: number;
  plantedDefectsDetected?: string[];
  plantedDefectsMissed?: string[];
  falsePositiveCount: number;
  categoryScores?: CategoryBenchmarkScore[];
  mutationChangedFindings?: boolean;
  reReviewTriggered?: boolean;
  passed: boolean;
  notes?: string | null;
};

type ReasoningRunState = {
  kind: "reasoning";
  result: ClosedLoopReasoningResult;
};

type GoldenRunState = {
  kind: "golden";
  result: GoldenArchitectureTestResult;
};

type RunState = ReasoningRunState | GoldenRunState;

const DEFAULT_ARCHITECTURE_FILE_NAME = "architecture-description.txt";
const DEFAULT_CONTENT_TYPE = "text/plain";

function parsePriorities(raw: string): string[] {
  return raw
    .split(",")
    .map((priority) => priority.trim())
    .filter((priority) => priority.length > 0);
}

function flattenFindings(result: ClosedLoopReasoningResult): SpecialistReviewFinding[] {
  return result.specialistReviews.flatMap((review) => review.findings ?? []);
}

function formatCountMap(counts: Record<string, number>): string {
  const entries = Object.entries(counts);

  if (entries.length === 0) {
    return "None";
  }

  return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
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

function buildRequest(
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
    declaredPriorities: parsePriorities(prioritiesRaw),
    framingAnswers,
    useGoldenFixture: options?.useGoldenFixture ?? false,
    runId: options?.runId ?? undefined,
    continueFromExistingRun: options?.continueFromExistingRun ?? false,
    publishToProduct: options?.publishToProduct ?? false,
    reviewTier: options?.reviewTier ?? "Standard",
  };
}

function primaryDescriptionFromSources(sources: ClosedLoopReasoningSourceText[]): string {
  const descriptionSource =
    sources.find((source) => source.fileName === DEFAULT_ARCHITECTURE_FILE_NAME) ?? sources[0];

  return descriptionSource?.content?.trim() ?? "";
}

/**
 * Spend summary for a completed run. Prefers real USD, which is what the AI usage dashboard and the
 * budget pill report; falls back to the token sizing used for the analysis-depth check when no LLM
 * cost rates are configured.
 */
function formatReasoningSpendSummary(result: ClosedLoopReasoningResult): string {
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

export function ArchitectureIntelligencePageClient() {
  const searchParams = useSearchParams();
  const inboundRunId = searchParams.get("runId")?.trim() ?? "";
  const inboundFrom = searchParams.get("from")?.trim() ?? "";
  const { blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();

  const [architectureDescription, setArchitectureDescription] = useState("");
  const [prioritiesRaw, setPrioritiesRaw] = useState("");
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [hydratedSourceTexts, setHydratedSourceTexts] = useState<ClosedLoopReasoningSourceText[]>([]);
  const [productContextStatus, setProductContextStatus] = useState<
    "idle" | "loading" | "loaded" | "empty" | "error"
  >("idle");
  const [publishToProduct, setPublishToProduct] = useState(false);
  const [reviewTier, setReviewTier] = useState<ArchitectureIntelligenceReviewTier>("Standard");
  const [loadingAction, setLoadingAction] = useState<
    "reasoning" | "analyze" | "golden" | "fixture" | "continue" | "publish" | "product-context" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);

  const canAnalyzeHydratedReview =
    productContextStatus === "loaded" &&
    (activeRunId?.trim().length ?? 0) > 0 &&
    architectureDescription.trim().length > 0;

  useEffect(() => {
    if (inboundRunId.length === 0) {
      return;
    }

    setActiveRunId(inboundRunId);
    setProductContextStatus("loading");
    setLoadingAction("product-context");
    setError(null);

    let cancelled = false;

    void (async () => {
      try {
        const context = await getJson<{
          runId?: string | null;
          sourceTexts?: ClosedLoopReasoningSourceText[];
          declaredPriorities?: string[];
        }>(
          `/api/proxy/v1/architecture-intelligence/product-runs/${encodeURIComponent(inboundRunId)}/source-context`,
        );

        if (cancelled) {
          return;
        }

        const sources = context.sourceTexts ?? [];
        setHydratedSourceTexts(sources);
        setArchitectureDescription(primaryDescriptionFromSources(sources));
        setActiveRunId(context.runId?.trim() || inboundRunId);

        if ((context.declaredPriorities?.length ?? 0) > 0) {
          setPrioritiesRaw((context.declaredPriorities ?? []).join(", "));
        }

        setProductContextStatus(sources.length > 0 ? "loaded" : "empty");
      } catch (cause) {
        if (cancelled) {
          return;
        }

        setProductContextStatus("error");
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load product run source context. Paste a description or load the golden fixture.",
        );
      } finally {
        if (!cancelled) {
          setLoadingAction(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inboundRunId]);

  const inboundContextLine = useMemo(() => {
    if (inboundRunId.length === 0) {
      return null;
    }

    if (productContextStatus === "loading") {
      return `Loading architecture intake for run ${inboundRunId}…`;
    }

    if (productContextStatus === "loaded") {
      const extraCount = Math.max(0, hydratedSourceTexts.length - 1);
      const extra =
        extraCount > 0 ? ` plus ${extraCount} attached document${extraCount === 1 ? "" : "s"}` : "";

      if (inboundFrom === "findings") {
        return `Loaded product intake from governance findings for run ${inboundRunId}${extra}. Run reasoning, then publish gated findings back to this review.`;
      }

      if (inboundFrom === "reviews") {
        return `Loaded product intake from review ${inboundRunId}${extra}. Run closed-loop reasoning, then publish gated findings into the product path.`;
      }

      return `Loaded product intake for run ${inboundRunId}${extra}.`;
    }

    if (inboundFrom === "findings") {
      return `Opened from governance findings for run ${inboundRunId}. Load failed or empty — paste a description or use the golden fixture.`;
    }

    if (inboundFrom === "reviews") {
      return `Opened from review ${inboundRunId}. Load failed or empty — paste a description or use the golden fixture.`;
    }

    return `Scoped to run ${inboundRunId}.`;
  }, [inboundFrom, inboundRunId, productContextStatus, hydratedSourceTexts.length]);

  const findings = useMemo(() => {
    if (runState?.kind !== "reasoning") {
      return [];
    }

    return flattenFindings(runState.result);
  }, [runState]);

  const interviewQuestions = useMemo(() => {
    if (runState?.kind !== "reasoning") {
      return [] as FramingQuestion[];
    }

    const framing = runState.result.interview?.framingQuestions ?? [];
    const evidence = runState.result.interview?.evidenceDrivenQuestions ?? [];

    return [...framing, ...evidence];
  }, [runState]);

  const runReasoning = useCallback(
    async (options?: { publish?: boolean; action?: "reasoning" | "analyze" }) => {
      if (architectureDescription.trim().length === 0) {
        setError("Architecture description is required (or load the golden fixture).");

        return;
      }

      const shouldPublish = options?.publish ?? publishToProduct;
      const action = options?.action ?? "reasoning";

      setLoadingAction(action);
      setError(null);

      if (shouldPublish) {
        setPublishToProduct(true);
      }

      try {
        const result = await postJson<ClosedLoopReasoningResult>(
          "/api/proxy/v1/architecture-intelligence/run",
          buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
            publishToProduct: shouldPublish,
            runId: activeRunId,
            hydratedSourceTexts,
            reviewTier,
          }),
        );

        setActiveRunId(result.runId ?? null);
        setRunState({ kind: "reasoning", result });
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setLoadingAction(null);
      }
    },
    [
      architectureDescription,
      prioritiesRaw,
      interviewAnswers,
      publishToProduct,
      activeRunId,
      hydratedSourceTexts,
      reviewTier,
    ],
  );

  const analyzeThisReview = useCallback(async () => {
    if (!canAnalyzeHydratedReview) {
      setError("Load a product review intake before analyzing this review.");

      return;
    }

    await runReasoning({ publish: true, action: "analyze" });
  }, [canAnalyzeHydratedReview, runReasoning]);

  const continueWithAnswers = useCallback(async () => {
    if (!activeRunId) {
      setError("Run an architecture reasoning pass first to obtain a run id.");

      return;
    }

    setLoadingAction("continue");
    setError(null);

    try {
      const result = await postJson<ClosedLoopReasoningResult>(
        `/api/proxy/v1/architecture-intelligence/runs/${encodeURIComponent(activeRunId)}/continue`,
        buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
          runId: activeRunId,
          continueFromExistingRun: true,
          publishToProduct,
          hydratedSourceTexts,
          reviewTier,
        }),
      );

      setActiveRunId(result.runId ?? activeRunId);
      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [
    activeRunId,
    architectureDescription,
    prioritiesRaw,
    interviewAnswers,
    publishToProduct,
    hydratedSourceTexts,
    reviewTier,
  ]);

  const publishRun = useCallback(async () => {
    if (!activeRunId) {
      setError("Run an architecture reasoning pass first to obtain a run id.");

      return;
    }

    setLoadingAction("publish");
    setError(null);

    try {
      const result = await postJson<ClosedLoopReasoningResult>(
        `/api/proxy/v1/architecture-intelligence/runs/${encodeURIComponent(activeRunId)}/publish`,
        buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
          runId: activeRunId,
          continueFromExistingRun: true,
          publishToProduct: true,
          hydratedSourceTexts,
          reviewTier,
        }),
      );

      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [activeRunId, architectureDescription, prioritiesRaw, interviewAnswers, hydratedSourceTexts, reviewTier]);

  const runGoldenTest = useCallback(async () => {
    const useFixture = architectureDescription.trim().length === 0 && hydratedSourceTexts.length === 0;

    setLoadingAction("golden");
    setError(null);

    try {
      const result = await postJson<GoldenArchitectureTestResult>(
        "/api/proxy/v1/architecture-intelligence/golden-test",
        buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
          useGoldenFixture: useFixture,
          hydratedSourceTexts,
          runId: activeRunId,
          reviewTier,
        }),
      );

      setRunState({ kind: "golden", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [architectureDescription, prioritiesRaw, interviewAnswers, hydratedSourceTexts, activeRunId, reviewTier]);

  const loadGoldenFixture = useCallback(async () => {
    setLoadingAction("fixture");
    setError(null);

    try {
      const fixture = await getJson<{
        sourceTexts?: ClosedLoopReasoningSourceText[];
        declaredPriorities?: string[];
      }>("/api/proxy/v1/architecture-intelligence/golden-fixture");

      const sources = fixture.sourceTexts ?? [];
      setHydratedSourceTexts(sources);
      setArchitectureDescription(primaryDescriptionFromSources(sources));
      setPrioritiesRaw((fixture.declaredPriorities ?? []).join(", "));
      setProductContextStatus("idle");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, []);

  const isBusy = loadingAction !== null;

  return (
    <div
      className={cn("w-full max-w-3xl", OPERATOR_LAYOUT.majorSectionGap)}
      data-testid="architecture-intelligence-page"
    >
      <OperatorPageHeader
        title="Architecture intelligence"
        subtitle="Run closed-loop architecture reasoning or the golden regression harness against a free-form description."
        titleTestId="architecture-intelligence-page-title"
        actions={<PageContextualHelpButton />}
      />
      <PageCapabilityBoundaryStrip surfaceId="architectureIntelligence" />
      <ArchitectureIntelligenceEvidenceGraphVocabularyRail currentSurfaceId="architecture-intelligence" />
{inboundContextLine ? (
        <p
          className={cn(OPERATOR_TYPOGRAPHY.body, "text-muted-foreground")}
          data-testid="architecture-intelligence-inbound-context"
        >
          {inboundContextLine}
        </p>
      ) : null}

      {activeRunId ? (
        <p
          className={cn(OPERATOR_TYPOGRAPHY.helper, "font-mono")}
          data-testid="architecture-intelligence-active-run"
        >
          Active run: {activeRunId}
        </p>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="architecture-description">Architecture description</Label>
          <Textarea
            id="architecture-description"
            data-testid="architecture-intelligence-description"
            value={architectureDescription}
            onChange={(event) => setArchitectureDescription(event.target.value)}
            rows={10}
            placeholder="Describe components, data flows, quality goals, and constraints…"
            disabled={isBusy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="architecture-priorities">Declared priorities (optional, comma-separated)</Label>
          <Input
            id="architecture-priorities"
            data-testid="architecture-intelligence-priorities"
            value={prioritiesRaw}
            onChange={(event) => setPrioritiesRaw(event.target.value)}
            placeholder="security, reliability, cost"
            disabled={isBusy}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="architecture-review-tier">Analysis depth</Label>
          <select
            id="architecture-review-tier"
            data-testid="architecture-intelligence-review-tier"
            className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={reviewTier}
            disabled={isBusy}
            onChange={(event) => {
              const next = event.target.value;

              if (isArchitectureIntelligenceReviewTier(next)) {
                setReviewTier(next);
              }
            }}
          >
            {ARCHITECTURE_INTELLIGENCE_REVIEW_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {architectureIntelligenceReviewTierLabel(tier)}
              </option>
            ))}
          </select>
          <p className={cn(OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-intelligence-depth-hint">
            Deeper analysis runs more specialist roles and accepts larger sources, so it costs more.
          </p>
        </div>

        <AiBudgetSpendNotice
          action="Architecture reasoning"
          testId="architecture-intelligence-budget-notice"
        />

        <div className="flex flex-wrap gap-2">
          {canAnalyzeHydratedReview ? (
            <Button
              type="button"
              data-testid="architecture-intelligence-analyze-review-button"
              disabled={isBusy || blocksLlmExecution}
              onClick={() => void analyzeThisReview()}
            >
              {loadingAction === "analyze"
                ? "Analyzing and publishing…"
                : "Analyze this review"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant={canAnalyzeHydratedReview ? "outline" : "primary"}
            data-testid="architecture-intelligence-run-button"
            disabled={isBusy || blocksLlmExecution}
            onClick={() => void runReasoning()}
          >
            {loadingAction === "reasoning" ? "Running architecture reasoning…" : "Run architecture reasoning"}
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="architecture-intelligence-golden-test-button"
            disabled={isBusy || blocksLlmExecution}
            onClick={() => void runGoldenTest()}
          >
            {loadingAction === "golden" ? "Running golden test…" : "Run golden test"}
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="architecture-intelligence-load-fixture-button"
            disabled={isBusy}
            onClick={() => void loadGoldenFixture()}
          >
            {loadingAction === "fixture" ? "Loading fixture…" : "Load golden fixture"}
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="architecture-intelligence-publish-button"
            disabled={isBusy || activeRunId === null || blocksLlmExecution}
            onClick={() => void publishRun()}
          >
            {loadingAction === "publish" ? "Publishing…" : "Publish to findings/advisory"}
          </Button>
        </div>

        <label className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
          <input
            type="checkbox"
            data-testid="architecture-intelligence-publish-toggle"
            checked={publishToProduct}
            disabled={isBusy}
            onChange={(event) => setPublishToProduct(event.target.checked)}
          />
          Publish gated findings/recommendations into product stores on run
        </label>
        {canAnalyzeHydratedReview ? (
          <p className={cn(OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-intelligence-analyze-hint">
            Analyze this review runs closed-loop reasoning for the hydrated product run and publishes gated
            output into findings/advisory.
          </p>
        ) : null}

        {activeRunId ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-run-id">
            Active run: {activeRunId}
          </p>
        ) : null}
      </div>

      {error !== null ? (
        <p
          role="alert"
          data-testid="architecture-intelligence-error"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary dark:border-rose-800/50",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          {error}
        </p>
      ) : null}

      {runState?.kind === "reasoning" ? (
        <ArchitectureIntelligenceReasoningResults
          result={runState.result}
          findings={findings}
          interviewQuestions={interviewQuestions}
          interviewAnswers={interviewAnswers}
          onInterviewAnswerChange={(questionId, value) =>
            setInterviewAnswers((previous) => ({ ...previous, [questionId]: value }))
          }
          onResubmitAnswers={() => void continueWithAnswers()}
          isBusy={isBusy}
        />
      ) : null}

      {runState?.kind === "golden" ? <ArchitectureIntelligenceGoldenResults result={runState.result} /> : null}
    </div>
  );
}

type ArchitectureIntelligenceReasoningResultsProps = {
  result: ClosedLoopReasoningResult;
  findings: SpecialistReviewFinding[];
  interviewQuestions: FramingQuestion[];
  interviewAnswers: Record<string, string>;
  onInterviewAnswerChange: (questionId: string, value: string) => void;
  onResubmitAnswers: () => void;
  isBusy: boolean;
};

function ArchitectureIntelligenceReasoningResults(props: ArchitectureIntelligenceReasoningResultsProps) {
  const integritySet = new Set(props.result.integrityPassedFindingIds ?? []);
  const validationById = new Map(
    (props.result.validationResults ?? []).map((validation) => [validation.findingId, validation]),
  );

  return (
    <div className="space-y-4" data-testid="architecture-intelligence-reasoning-results">
      {props.result.publishBlocked ? (
        <p
          role="alert"
          data-testid="architecture-intelligence-publish-blocked"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          Publish blocked: {(props.result.publishBlockReasons ?? []).join(" · ") || "trust gate rejected publishable output."}
        </p>
      ) : null}

      {props.result.budgetRejected ? (
        <p
          role="alert"
          data-testid="architecture-intelligence-budget-rejected"
          className={cn(
            "rounded-md border border-rose-600/40 bg-al-surface-raised p-2 text-al-text-primary",
            OPERATOR_TYPOGRAPHY.body,
          )}
        >
          Analysis not started: {props.result.budgetRejectReason ?? "Pre-flight AI budget admission rejected this analysis."}
        </p>
      ) : null}

      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-element-count">
        Model elements: {props.result.model?.elements?.length ?? 0} · Integrity-passed findings:{" "}
        {props.result.integrityPassedFindingIds?.length ?? 0}
        {props.result.runId ? ` · Run: ${props.result.runId}` : ""}
      </p>

      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-economics">
        {props.result.cacheHit
          ? `Cache hit${props.result.cacheReuseReason ? ` (${props.result.cacheReuseReason})` : ""}`
          : "Cache miss"}
        {formatReasoningSpendSummary(props.result)}
      </p>

      <ArchitectureIntelligenceProductRoundTrip
        runId={props.result.runId}
        publishedToProduct={props.result.publishedToProduct === true}
        publishedRecommendationCount={props.result.publishedRecommendationCount}
        publishSkipReason={props.result.publishSkipReason}
      />

      {props.result.publishedToProduct && props.result.publishedFindingsSnapshotId ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-intelligence-published">
          Findings snapshot {props.result.publishedFindingsSnapshotId}
        </p>
      ) : null}

      <ResultSection title="Interview questions" testId="architecture-intelligence-interview">
        {props.interviewQuestions.length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No open interview questions.</p>
        ) : (
          <div className="space-y-3">
            {props.interviewQuestions.map((question) => (
              <div key={question.questionId} className="space-y-1">
                <Label htmlFor={`interview-${question.questionId}`}>{question.prompt}</Label>
                <Textarea
                  id={`interview-${question.questionId}`}
                  data-testid={`architecture-intelligence-interview-${question.questionId}`}
                  value={props.interviewAnswers[question.questionId] ?? question.confirmedAnswer ?? ""}
                  onChange={(event) => props.onInterviewAnswerChange(question.questionId, event.target.value)}
                  rows={2}
                  disabled={props.isBusy}
                />
              </div>
            ))}
            <Button
              type="button"
              data-testid="architecture-intelligence-resubmit-answers"
              disabled={props.isBusy}
              onClick={props.onResubmitAnswers}
            >
              Re-run with answers
            </Button>
          </div>
        )}
      </ResultSection>

      <ResultSection title="Findings" testId="architecture-intelligence-findings">
        {props.findings.length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No findings returned.</p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {props.findings.map((finding, index) => {
              const findingId = finding.findingId ?? `${finding.title}-${index}`;
              const validation = validationById.get(findingId);
              const product = props.result.productFindings?.find((item) => item.findingId === findingId);
              const provenanceBucket = product?.properties?.["architectureIntelligence.provenancePresentation"];
              const integrityPassed = finding.findingId ? integritySet.has(finding.findingId) : validation?.overallPassedIntegrity;
              const publishedInspectHref =
                props.result.publishedToProduct === true &&
                (props.result.runId?.trim().length ?? 0) > 0 &&
                (finding.findingId?.trim().length ?? 0) > 0
                  ? governanceFindingInspectHref(props.result.runId!, finding.findingId!)
                  : null;

              return (
                <li key={findingId}>
                  <Card data-integrity-passed={integrityPassed ? "true" : "false"}>
                    <CardHeader className="pb-2">
                      <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>{finding.title}</CardTitle>
                    </CardHeader>
                    <CardContent className={cn("space-y-1 pt-0", OPERATOR_TYPOGRAPHY.body)}>
                      <p className="m-0">Severity: {finding.severity}</p>
                      <p className="m-0">Conclusion: {finding.conclusion}</p>
                      <p className="m-0">Integrity: {integrityPassed ? "passed" : "failed / not cited"}</p>
                      {provenanceBucket ? <p className="m-0">Provenance: {provenanceBucket}</p> : null}
                      {validation?.semanticAssessment ? (
                        <p className="m-0">Semantic assessment: {validation.semanticAssessment}</p>
                      ) : null}
                      {publishedInspectHref ? (
                        <p className="m-0">
                          <Link
                            className={OPERATOR_LINK.inline}
                            href={publishedInspectHref}
                            data-testid={`architecture-intelligence-finding-inspect-${finding.findingId}`}
                          >
                            Open evidence trace
                          </Link>
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </ResultSection>

      <ResultSection title="Adversarial lanes" testId="architecture-intelligence-adversarial">
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Substantiated: {props.result.adversarial?.substantiatedFindings?.length ?? 0} · Challenges:{" "}
          {props.result.adversarial?.challenges?.length ?? 0}
        </p>
        {(props.result.adversarial?.challenges ?? []).length > 0 ? (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {(props.result.adversarial?.challenges ?? []).map((challenge, index) => (
              <li key={`${challenge.hypothesis}-${index}`} className={OPERATOR_TYPOGRAPHY.body}>
                {challenge.hypothesis} — {challenge.falsificationEvidenceNeeded}
              </li>
            ))}
          </ul>
        ) : (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No active adversarial challenges.</p>
        )}
      </ResultSection>

      <ResultSection title="Recommendations" testId="architecture-intelligence-recommendations">
        {props.result.recommendations.length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No recommendations returned.</p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {props.result.recommendations.map((recommendation) => (
              <li key={recommendation.recommendationId}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>{recommendation.problem}</CardTitle>
                  </CardHeader>
                  <CardContent className={cn("pt-0", OPERATOR_TYPOGRAPHY.body)}>
                    <p className="m-0">{recommendation.proposedChange}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </ResultSection>

      <ResultSection title="Must-not-fail violations" testId="architecture-intelligence-violations">
        {props.result.mustNotFailViolations.length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No must-not-fail violations.</p>
        ) : (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {props.result.mustNotFailViolations.map((violation, index) => (
              <li key={`${violation.class}-${index}`} className={OPERATOR_TYPOGRAPHY.body}>
                [{violation.class}] {violation.message}
                {violation.blocked ? " (blocked)" : ""}
              </li>
            ))}
          </ul>
        )}
      </ResultSection>
    </div>
  );
}

type ArchitectureIntelligenceGoldenResultsProps = {
  result: GoldenArchitectureTestResult;
};

function ArchitectureIntelligenceGoldenResults(props: ArchitectureIntelligenceGoldenResultsProps) {
  const { result } = props;

  return (
    <div className="space-y-3" data-testid="architecture-intelligence-golden-results">
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-golden-passed">
        Passed: {result.passed ? "Yes" : "No"}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Planted defect recall: {result.plantedDefectRecall.toFixed(2)} · False positives: {result.falsePositiveCount} ·
        Mutation changed findings: {result.mutationChangedFindings ? "Yes" : "No"}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-before-counts">
        Before counts: {formatCountMap(result.beforeCounts ?? {})}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-after-counts">
        After counts: {formatCountMap(result.afterCounts ?? {})}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-delta-counts">
        Delta counts: {formatCountMap(result.deltaCounts ?? {})}
      </p>
      {(result.categoryScores ?? []).length > 0 ? (
        <ul className="m-0 list-disc space-y-1 pl-5" data-testid="architecture-intelligence-category-scores">
          {result.categoryScores?.map((score) => (
            <li key={score.category} className={OPERATOR_TYPOGRAPHY.body}>
              {score.category}: {score.score.toFixed(2)} — {score.detail}
            </li>
          ))}
        </ul>
      ) : null}
      {result.notes ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-golden-notes">
          Notes: {result.notes}
        </p>
      ) : null}
    </div>
  );
}

type ResultSectionProps = {
  title: string;
  testId: string;
  children: ReactNode;
};

function ResultSection(props: ResultSectionProps) {
  return (
    <section data-testid={props.testId}>
      <h2 className={cn("mb-2", OPERATOR_TYPOGRAPHY.sectionTitle)}>{props.title}</h2>
      {props.children}
    </section>
  );
}
