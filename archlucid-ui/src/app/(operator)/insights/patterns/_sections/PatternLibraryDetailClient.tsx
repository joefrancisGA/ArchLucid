"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LAYOUT, OPERATOR_SHELL_SCROLL_OFFSET_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { findPatternLibraryRecord } from "@/lib/pattern-library-catalog";
import {
  derivePatternLibrarySummary,
  resolvePatternLibraryRecords,
} from "@/lib/pattern-library-filters";
import { resolvePatternLibraryPeerCompare } from "@/lib/pattern-library-peer-compare";
import { PATTERN_LIBRARY_POLICY_RULES_SECTION_TITLE } from "@/lib/pattern-library-policy-guidance-copy";
import { PATTERN_LIBRARY_LOAD_RETRY_LABEL, patternLibraryDetailSubtitle } from "@/lib/pattern-library-copy";
import { PATTERN_LIBRARY_DETAIL_PATTERN_KEY_LABEL } from "@/lib/pattern-library-detail-evidence-copy";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { patternLibraryHref } from "@/lib/pattern-library-route";
import { usePatternLibraryProvenance } from "@/lib/use-pattern-library-provenance";
import { cn } from "@/lib/utils";

import { PatternLibraryDomainPlatformBadges, PatternLibrarySignalBadges } from "./PatternLibraryFiltersPanel";
import {
  PatternLibraryRelatedPolicyPacks,
  PatternLibraryRelatedPolicyRules,
} from "./PatternLibraryPolicyGuidance";
import { PatternLibraryDetailBuyerChrome } from "./PatternLibraryDetailBuyerChrome";
import { PatternLibraryDetailPageHeader } from "./PatternLibraryDetailPageHeader";
import { PatternLibraryDetailSkeleton } from "./PatternLibraryDetailSkeleton";
import { PatternLibraryLoadFailurePanel } from "./PatternLibraryLoadFailurePanel";
import { Button } from "@/components/ui/button";
import { TechnicalIdDisclosure } from "@/components/usability/TechnicalIdDisclosure";
import { PatternLibraryDetailNextPatternFooter } from "./PatternLibraryDetailNextPatternFooter";
import { PatternLibraryNextReviewFooterClient } from "./PatternLibraryNextReviewFooterClient";
import { resolveNextPatternLibraryRecord } from "@/lib/resolve-next-pattern-library-record";

type PatternLibraryDetailClientProps = {
  readonly patternKey: string;
};

function DetailSection(props: { readonly id: string; readonly title: string; readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <section id={props.id} className={cn(OPERATOR_SHELL_SCROLL_OFFSET_CLASS, "space-y-2")}>
      <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{props.title}</h2>
      <div className={OPERATOR_TYPOGRAPHY.body}>{props.children}</div>
    </section>
  );
}

function toPatternLibraryLoadFailure(error: Error): ApiLoadFailureState {
  return {
    message: error.message,
    problem: null,
    correlationId: null,
    httpStatus: null,
    retryAfterSeconds: null,
  };
}

export function PatternLibraryDetailClient(props: PatternLibraryDetailClientProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const queryClient = useQueryClient();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const record = findPatternLibraryRecord(props.patternKey);
  const peerCompare = record === null ? null : resolvePatternLibraryPeerCompare(record.patternKey);
  const {
    usingLiveAggregate,
    useSampleCatalog,
    eligiblePatternKeys,
    isPending,
    isFetching,
    isError,
    error,
    provenance,
  } = usePatternLibraryProvenance();
  const summary = useMemo(() => {
    const records = resolvePatternLibraryRecords(
      usingLiveAggregate ? eligiblePatternKeys : [],
      useSampleCatalog,
    );

    return derivePatternLibrarySummary(records);
  }, [eligiblePatternKeys, useSampleCatalog, usingLiveAggregate]);
  const nextPattern = useMemo(() => {
    const records = resolvePatternLibraryRecords(
      usingLiveAggregate ? eligiblePatternKeys : [],
      useSampleCatalog,
    );

    return resolveNextPatternLibraryRecord(records, props.patternKey);
  }, [eligiblePatternKeys, props.patternKey, useSampleCatalog, usingLiveAggregate]);
  const headerRefreshing = isPending || isFetching;
  const loadFailure = isError && error !== null ? toPatternLibraryLoadFailure(error) : null;

  const refreshCatalog = (): void => {
    void queryClient.invalidateQueries({ queryKey: operatorQueryKeys.patternLibraryInsightCards });
  };

  if (record === null) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.body} role="alert">
        Pattern not found.
      </p>
    );
  }

  const headerBadges = (
    <>
      <PatternLibraryDomainPlatformBadges domains={record.domains} platforms={record.platforms} />
      <PatternLibrarySignalBadges adoption={record.adoption} risk={record.risk} governance={record.governance} />
      {buyerPolishedShell ? (
        <TechnicalIdDisclosure
          label={PATTERN_LIBRARY_DETAIL_PATTERN_KEY_LABEL}
          value={record.patternKey}
        />
      ) : null}
      {!buyerPolishedShell ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          {record.reviewCountLabel} · {record.tenantCountLabel}
        </p>
      ) : null}
    </>
  );

  return (
    <OperatorPageContainer
      variant="workflow"
      className={OPERATOR_LAYOUT.majorSectionGap}
      data-testid="pattern-library-detail-page"
    >
      <PatternLibraryDetailPageHeader
        patternKey={record.patternKey}
        patternName={record.name}
        subtitle={patternLibraryDetailSubtitle(record.description, buyerPolishedShell)}
        provenance={provenance}
        showProvenanceDetails={!buyerPolishedShell}
        refreshing={headerRefreshing}
        lastUpdatedUtc={summary.lastUpdatedUtc}
        badges={headerBadges}
        onRefresh={refreshCatalog}
      />

      <PatternLibraryDetailBuyerChrome />

      {scopedRunFilterActive ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="pattern-library-detail-run-scope-banner"
        >
          {"Browsing patterns for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={patternLibraryHref()}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : null}

      {isPending ? <PatternLibraryDetailSkeleton /> : null}

      {!isPending && loadFailure !== null ? (
        <PatternLibraryLoadFailurePanel
          failure={loadFailure}
          retryLabel={PATTERN_LIBRARY_LOAD_RETRY_LABEL}
          testId="pattern-library-detail-load-failure"
          retryTestId="pattern-library-detail-load-retry"
          retryDisabled={headerRefreshing}
          onRetry={refreshCatalog}
        />
      ) : null}

      {!isPending && loadFailure === null ? (
        <>
          <div className="flex flex-wrap gap-2" data-testid="pattern-library-detail-primary-cta-cluster">
            <Button asChild size="sm" variant="primary">
              <Link
                href={`/architecture/reviews/new?pattern=${encodeURIComponent(record.patternKey)}`}
                data-testid="pattern-library-detail-primary-use-in-review"
              >
                Use in review
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={patternLibraryHref(scopedRunFilterActive ? { runId: scopedRunId } : undefined)}>
                Back to library
              </Link>
            </Button>
          </div>

          <div className={OPERATOR_LAYOUT.sectionStack}>
            <DetailSection id="overview" title="Overview">
              <p className="m-0">{record.overview}</p>
            </DetailSection>

            <DetailSection id="where-appears" title="Where this pattern appears">
              <p className="m-0">{record.whereAppears}</p>
            </DetailSection>

            <DetailSection id="platforms-domains" title="Common platforms and domains">
              <PatternLibraryDomainPlatformBadges domains={record.domains} platforms={record.platforms} />
            </DetailSection>

            <DetailSection id="typical-risks" title="Typical risks">
              <ul className="m-0 list-disc space-y-1 pl-5">
                {record.typicalRisks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="required-evidence" title="Required evidence">
              <ul className="m-0 list-disc space-y-1 pl-5">
                {record.requiredEvidence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="governance" title="Approval considerations">
              <ul className="m-0 list-disc space-y-1 pl-5">
                {record.governanceConsiderations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="policy-rules" title={PATTERN_LIBRARY_POLICY_RULES_SECTION_TITLE}>
              <PatternLibraryRelatedPolicyRules rules={record.relatedPolicyRules} />
            </DetailSection>

            {record.relatedPolicyPacks.length > 0 ? (
              <DetailSection id="policy-packs" title="Related policy packs">
                <PatternLibraryRelatedPolicyPacks packs={record.relatedPolicyPacks} />
              </DetailSection>
            ) : null}

            <DetailSection id="alternatives" title="Common alternatives">
              <ul className="m-0 list-disc space-y-1 pl-5">
                {record.alternatives.map((alt) => (
                  <li key={alt}>{alt}</li>
                ))}
              </ul>
            </DetailSection>

            <DetailSection id="architecture-shape" title="Example architecture shape">
              <p className="m-0">{record.architectureShape}</p>
            </DetailSection>

            <DetailSection id="review-questions" title="Review questions to ask">
              <ul className="m-0 list-disc space-y-1 pl-5">
                {record.reviewQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </DetailSection>
          </div>

          <section
            id="next-steps"
            className={cn(
              OPERATOR_SHELL_SCROLL_OFFSET_CLASS,
              "space-y-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800",
            )}
            data-testid="pattern-library-detail-next-steps"
          >
            <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Next steps</h2>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Use this pattern as a starting point for a new architecture review or compare it with peer patterns in the library.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/architecture/reviews/new?pattern=${encodeURIComponent(record.patternKey)}`}
                  data-testid="pattern-library-detail-secondary-use-in-review"
                >
                  Use this pattern in a new review
                </Link>
              </Button>
              {peerCompare !== null ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={peerCompare.href}>{peerCompare.label}</Link>
                </Button>
              ) : null}
            </div>
          </section>
          {scopedRunFilterActive ? <PatternLibraryNextReviewFooterClient runId={scopedRunId} /> : null}
          {nextPattern !== null ? (
            <PatternLibraryDetailNextPatternFooter target={nextPattern} scopedRunId={scopedRunId} />
          ) : null}
        </>
      ) : null}
    </OperatorPageContainer>
  );
}
