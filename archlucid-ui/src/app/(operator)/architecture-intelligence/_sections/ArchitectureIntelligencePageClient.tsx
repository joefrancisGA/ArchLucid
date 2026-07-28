"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
  },
) {
  const sourceTexts: ClosedLoopReasoningSourceText[] = architectureDescription.trim().length
    ? [
        {
          fileName: DEFAULT_ARCHITECTURE_FILE_NAME,
          contentType: DEFAULT_CONTENT_TYPE,
          content: architectureDescription.trim(),
        },
      ]
    : [];

  return {
    sourceTexts,
    declaredPriorities: parsePriorities(prioritiesRaw),
    framingAnswers,
    useGoldenFixture: options?.useGoldenFixture ?? false,
    runId: options?.runId ?? undefined,
    continueFromExistingRun: options?.continueFromExistingRun ?? false,
    publishToProduct: options?.publishToProduct ?? false,
  };
}

export function ArchitectureIntelligencePageClient() {
  const searchParams = useSearchParams();
  const inboundRunId = searchParams.get("runId")?.trim() ?? "";
  const inboundFrom = searchParams.get("from")?.trim() ?? "";

  const [architectureDescription, setArchitectureDescription] = useState("");
  const [prioritiesRaw, setPrioritiesRaw] = useState("");
  const [interviewAnswers, setInterviewAnswers] = useState<Record<string, string>>({});
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [publishToProduct, setPublishToProduct] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"reasoning" | "golden" | "fixture" | "continue" | "publish" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);

  useEffect(() => {
    if (inboundRunId.length === 0) {
      return;
    }

    setActiveRunId(inboundRunId);
  }, [inboundRunId]);

  const inboundContextLine = useMemo(() => {
    if (inboundRunId.length === 0) {
      return null;
    }

    if (inboundFrom === "findings") {
      return `Opened from governance findings for run ${inboundRunId}. Continue with interview answers or load the golden fixture to demo the closed loop.`;
    }

    if (inboundFrom === "reviews") {
      return `Opened from review ${inboundRunId}. Run closed-loop reasoning, then publish gated findings into the product path.`;
    }

    return `Scoped to run ${inboundRunId}.`;
  }, [inboundFrom, inboundRunId]);

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

  const runReasoning = useCallback(async () => {
    if (architectureDescription.trim().length === 0) {
      setError("Architecture description is required (or load the golden fixture).");

      return;
    }

    setLoadingAction("reasoning");
    setError(null);

    try {
      const result = await postJson<ClosedLoopReasoningResult>(
        "/api/proxy/v1/architecture-intelligence/run",
        buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
          publishToProduct,
          runId: activeRunId,
        }),
      );

      setActiveRunId(result.runId ?? null);
      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [architectureDescription, prioritiesRaw, interviewAnswers, publishToProduct, activeRunId]);

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
        }),
      );

      setActiveRunId(result.runId ?? activeRunId);
      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [activeRunId, architectureDescription, prioritiesRaw, interviewAnswers, publishToProduct]);

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
        }),
      );

      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [activeRunId, architectureDescription, prioritiesRaw, interviewAnswers]);

  const runGoldenTest = useCallback(async () => {
    const useFixture = architectureDescription.trim().length === 0;

    setLoadingAction("golden");
    setError(null);

    try {
      const result = await postJson<GoldenArchitectureTestResult>(
        "/api/proxy/v1/architecture-intelligence/golden-test",
        buildRequest(architectureDescription, prioritiesRaw, interviewAnswers, {
          useGoldenFixture: useFixture,
        }),
      );

      setRunState({ kind: "golden", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [architectureDescription, prioritiesRaw, interviewAnswers]);

  const loadGoldenFixture = useCallback(async () => {
    setLoadingAction("fixture");
    setError(null);

    try {
      const fixture = await getJson<{
        sourceTexts?: ClosedLoopReasoningSourceText[];
        declaredPriorities?: string[];
      }>("/api/proxy/v1/architecture-intelligence/golden-fixture");

      const content = fixture.sourceTexts?.[0]?.content ?? "";
      setArchitectureDescription(content);
      setPrioritiesRaw((fixture.declaredPriorities ?? []).join(", "));
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
      />

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

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            data-testid="architecture-intelligence-run-button"
            disabled={isBusy}
            onClick={() => void runReasoning()}
          >
            {loadingAction === "reasoning" ? "Running architecture reasoning…" : "Run architecture reasoning"}
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="architecture-intelligence-golden-test-button"
            disabled={isBusy}
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
            disabled={isBusy || activeRunId === null}
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

      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-element-count">
        Model elements: {props.result.model?.elements?.length ?? 0} · Integrity-passed findings:{" "}
        {props.result.integrityPassedFindingIds?.length ?? 0}
        {props.result.runId ? ` · Run: ${props.result.runId}` : ""}
      </p>

      {props.result.publishedToProduct ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-published">
          Published to product stores
          {props.result.publishedFindingsSnapshotId
            ? ` · findings snapshot ${props.result.publishedFindingsSnapshotId}`
            : ""}
          {typeof props.result.publishedRecommendationCount === "number"
            ? ` · ${props.result.publishedRecommendationCount} recommendations`
            : ""}
        </p>
      ) : null}

      {props.result.publishSkipReason ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-publish-skip">
          Publish skipped: {props.result.publishSkipReason}
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
