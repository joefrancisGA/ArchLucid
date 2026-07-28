"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

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
  title: string;
  severity: string;
  conclusion: string;
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

type ClosedLoopReasoningResult = {
  model: { elements: unknown[] };
  specialistReviews: Array<{ findings: SpecialistReviewFinding[] }>;
  recommendations: ArchitectureRecommendation[];
  mustNotFailViolations: MustNotFailViolation[];
};

type GoldenArchitectureTestResult = {
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
  plantedDefectRecall: number;
  falsePositiveCount: number;
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

function buildRequest(architectureDescription: string, prioritiesRaw: string) {
  const sourceTexts: ClosedLoopReasoningSourceText[] = [
    {
      fileName: DEFAULT_ARCHITECTURE_FILE_NAME,
      contentType: DEFAULT_CONTENT_TYPE,
      content: architectureDescription.trim(),
    },
  ];

  return {
    sourceTexts,
    declaredPriorities: parsePriorities(prioritiesRaw),
  };
}

export function ArchitectureIntelligencePageClient() {
  const [architectureDescription, setArchitectureDescription] = useState("");
  const [prioritiesRaw, setPrioritiesRaw] = useState("");
  const [loadingAction, setLoadingAction] = useState<"reasoning" | "golden" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState | null>(null);

  const findings = useMemo(() => {
    if (runState?.kind !== "reasoning") {
      return [];
    }

    return flattenFindings(runState.result);
  }, [runState]);

  const runReasoning = useCallback(async () => {
    if (architectureDescription.trim().length === 0) {
      setError("Architecture description is required.");

      return;
    }

    setLoadingAction("reasoning");
    setError(null);

    try {
      const result = await postJson<ClosedLoopReasoningResult>(
        "/api/proxy/v1/architecture-intelligence/run",
        buildRequest(architectureDescription, prioritiesRaw),
      );

      setRunState({ kind: "reasoning", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [architectureDescription, prioritiesRaw]);

  const runGoldenTest = useCallback(async () => {
    if (architectureDescription.trim().length === 0) {
      setError("Architecture description is required.");

      return;
    }

    setLoadingAction("golden");
    setError(null);

    try {
      const result = await postJson<GoldenArchitectureTestResult>(
        "/api/proxy/v1/architecture-intelligence/golden-test",
        buildRequest(architectureDescription, prioritiesRaw),
      );

      setRunState({ kind: "golden", result });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoadingAction(null);
    }
  }, [architectureDescription, prioritiesRaw]);

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
        </div>
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
          elementCount={runState.result.model?.elements?.length ?? 0}
          findings={findings}
          recommendations={runState.result.recommendations ?? []}
          violations={runState.result.mustNotFailViolations ?? []}
        />
      ) : null}

      {runState?.kind === "golden" ? <ArchitectureIntelligenceGoldenResults result={runState.result} /> : null}
    </div>
  );
}

type ArchitectureIntelligenceReasoningResultsProps = {
  elementCount: number;
  findings: SpecialistReviewFinding[];
  recommendations: ArchitectureRecommendation[];
  violations: MustNotFailViolation[];
};

function ArchitectureIntelligenceReasoningResults(props: ArchitectureIntelligenceReasoningResultsProps) {
  return (
    <div className="space-y-4" data-testid="architecture-intelligence-reasoning-results">
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-element-count">
        Model elements: {props.elementCount}
      </p>

      <ResultSection title="Findings" testId="architecture-intelligence-findings">
        {props.findings.length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No findings returned.</p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {props.findings.map((finding, index) => (
              <li key={`${finding.title}-${index}`}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>{finding.title}</CardTitle>
                  </CardHeader>
                  <CardContent className={cn("space-y-1 pt-0", OPERATOR_TYPOGRAPHY.body)}>
                    <p className="m-0">Severity: {finding.severity}</p>
                    <p className="m-0">Conclusion: {finding.conclusion}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </ResultSection>

      <ResultSection title="Recommendations" testId="architecture-intelligence-recommendations">
        {props.recommendations.length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No recommendations returned.</p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {props.recommendations.map((recommendation) => (
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
        {props.violations.length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No must-not-fail violations.</p>
        ) : (
          <ul className="m-0 list-disc space-y-1 pl-5">
            {props.violations.map((violation, index) => (
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
        Planted defect recall: {result.plantedDefectRecall.toFixed(2)} · False positives: {result.falsePositiveCount}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-before-counts">
        Before counts: {formatCountMap(result.beforeCounts ?? {})}
      </p>
      <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-after-counts">
        After counts: {formatCountMap(result.afterCounts ?? {})}
      </p>
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
