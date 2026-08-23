import Link from "next/link";

import { ArchitectureIntelligenceProductRoundTrip } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceProductRoundTrip";
import { ArchitectureIntelligenceResultSection } from "@/app/(operator)/architecture/architecture-intelligence/_sections/ArchitectureIntelligenceResultSection";
import { formatReasoningSpendSummary } from "@/app/(operator)/architecture/architecture-intelligence/_sections/architecture-intelligence-client-api";
import type {
  ClosedLoopReasoningResult,
  FramingQuestion,
  SpecialistReviewFinding,
} from "@/app/(operator)/architecture/architecture-intelligence/_sections/architecture-intelligence-types";
import { resolvePublishBlockedAlertMessage } from "@/lib/architecture/architecture-intelligence-framing-interview";
import { governanceFindingInspectHref } from "@/components/governance/findings/governance-findings-navigation";
import { SeverityTag } from "@/components/ui/severity-tag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import { findingJobViewLaneLead } from "@/lib/findings/finding-job-view-lane-lead";
import { buildReviewFindingsTabHref } from "@/lib/findings/review-findings-job-view-url";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ArchitectureIntelligenceReasoningResultsProps = {
  result: ClosedLoopReasoningResult;
  findings: SpecialistReviewFinding[];
  interviewQuestions: FramingQuestion[];
  interviewAnswers: Record<string, string>;
  onInterviewAnswerChange: (questionId: string, value: string) => void;
  onResubmitAnswers: () => void;
  isBusy: boolean;
};

export function ArchitectureIntelligenceReasoningResults(props: ArchitectureIntelligenceReasoningResultsProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const integritySet = new Set(props.result.integrityPassedFindingIds ?? []);
  const validationById = new Map(
    (props.result.validationResults ?? []).map((validation) => [validation.findingId, validation]),
  );
  const runId = props.result.runId?.trim() ?? "";
  const adversarialChallengeCount = props.result.adversarial?.challenges?.length ?? 0;
  const verifyHypothesesLaneHref =
    runId.length > 0 && adversarialChallengeCount > 0
      ? buildReviewFindingsTabHref(runId, "verify-hypotheses")
      : null;
  const integrityPassedCount = props.result.integrityPassedFindingIds?.length ?? 0;

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
          {resolvePublishBlockedAlertMessage(props.result)}
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

      {buyerPolishedShell ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-element-count">
          Integrity-passed findings: {integrityPassedCount}
          {props.result.runId ? (
            <>
              {" · "}
              <TechnicalIdDisclosure label="Run" value={props.result.runId} />
            </>
          ) : null}
        </p>
      ) : (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-element-count">
          Model elements: {props.result.model?.elements?.length ?? 0} · Integrity-passed findings: {integrityPassedCount}
          {props.result.runId ? ` · Run: ${props.result.runId}` : ""}
        </p>
      )}

      {!buyerPolishedShell ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} data-testid="architecture-intelligence-economics">
          {props.result.cacheHit
            ? `Cache hit${props.result.cacheReuseReason ? ` (${props.result.cacheReuseReason})` : ""}`
            : "Cache miss"}
          {formatReasoningSpendSummary(props.result)}
        </p>
      ) : null}

      <ArchitectureIntelligenceProductRoundTrip
        runId={props.result.runId}
        publishedToProduct={props.result.publishedToProduct === true}
        publishedRecommendationCount={props.result.publishedRecommendationCount}
        publishSkipReason={props.result.publishSkipReason}
      />

      {props.result.publishedToProduct && props.result.publishedFindingsSnapshotId ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="architecture-intelligence-published">
          Findings snapshot{" "}
          <TechnicalIdDisclosure label="Snapshot" value={props.result.publishedFindingsSnapshotId} />
        </p>
      ) : null}

      <ArchitectureIntelligenceResultSection title="Interview questions" testId="architecture-intelligence-interview">
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
      </ArchitectureIntelligenceResultSection>

      <ArchitectureIntelligenceResultSection title="Findings" testId="architecture-intelligence-findings">
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-al-text-secondary">Severity:</span>
                        <SeverityTag severity={finding.severity} />
                      </div>
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
      </ArchitectureIntelligenceResultSection>

      <ArchitectureIntelligenceResultSection title="Adversarial lanes" testId="architecture-intelligence-adversarial">
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Substantiated: {props.result.adversarial?.substantiatedFindings?.length ?? 0} · Challenges:{" "}
          {props.result.adversarial?.challenges?.length ?? 0}
        </p>
        {adversarialChallengeCount > 0 ? (
          <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {findingJobViewLaneLead("verify-hypotheses")}
          </p>
        ) : null}
        {verifyHypothesesLaneHref !== null ? (
          <p className="m-0 mt-2">
            <Link
              href={verifyHypothesesLaneHref}
              className={cn(OPERATOR_LINK.inline, "font-medium")}
              data-testid="architecture-intelligence-adversarial-verify-lane-link"
            >
              Open verify-hypotheses lane on the findings list
            </Link>
          </p>
        ) : null}
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
      </ArchitectureIntelligenceResultSection>

      <ArchitectureIntelligenceResultSection title="Recommendations" testId="architecture-intelligence-recommendations">
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
      </ArchitectureIntelligenceResultSection>

      <ArchitectureIntelligenceResultSection title="Must-not-fail violations" testId="architecture-intelligence-violations">
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
      </ArchitectureIntelligenceResultSection>
    </div>
  );
}
