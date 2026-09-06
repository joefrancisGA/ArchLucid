"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { FindingEvidenceTrailLink } from "@/components/usability/FindingEvidenceTrailLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { evidenceAbsenceFindingLabel } from "@/lib/evidence-absence-finding-copy";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { deriveTrustEvidenceReadiness } from "@/lib/trust-evidence-readiness";
import { splitTrustEvidenceDetail } from "@/lib/trust-evidence-technical-detail";
import {
  resolveTrustEvidenceDiagnosticsApiPath,
} from "@/lib/trust-evidence-product-links";
import {
  parseTrustEvidenceFieldsOpenFromSearch,
  parseTrustEvidenceTechOpenFromSearch,
  runTrustEvidenceDisclosureHrefFromSearch,
} from "@/lib/runs/run-trust-evidence-disclosure-url";
import type { RunTrustEvidenceCard } from "@/types/authority";

import { RunTrustEvidenceFieldRow } from "./RunTrustEvidenceFieldRows";
import { RunTrustEvidenceProofChain } from "./RunTrustEvidenceProofChain";
import {
  buildEvidenceBasisFields,
  deriveRunTrustEvidenceReadinessFromCard,
} from "./run-trust-evidence-readiness";

export { deriveRunTrustEvidenceReadinessFromCard };

/** Committed-run evidence summary: manifest/audit/traces/export posture (no CPA / pen-test / legal claims). */
export function RunTrustEvidenceCardSection(props: {
  readonly card: RunTrustEvidenceCard;
  readonly evidenceAskRunId?: string | null;
  readonly runId: string;
  readonly blockingFindingId?: string | null;
  readonly blockingFindingTitle?: string | null;
  readonly approvalBlocked?: boolean;
}): ReactElement {
  const { card, evidenceAskRunId, runId, blockingFindingId, blockingFindingTitle, approvalBlocked } = props;
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const trustEvidenceFieldsOpenParam = searchParams.get("trustEvidenceFieldsOpen");
  const trustEvidenceTechOpenParam = searchParams.get("trustEvidenceTechOpen");
  const [fieldsOpen, setFieldsOpenState] = useState(() =>
    parseTrustEvidenceFieldsOpenFromSearch(trustEvidenceFieldsOpenParam),
  );
  const [technicalOpen, setTechnicalOpenState] = useState(() =>
    parseTrustEvidenceTechOpenFromSearch(trustEvidenceTechOpenParam),
  );
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const syncTrustEvidencePanelsToUrl = useCallback(
    (state: { fieldsOpen: boolean; technicalOpen: boolean }) => {
      router.replace(runTrustEvidenceDisclosureHrefFromSearch(searchParams.toString(), state, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setFieldsOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setFieldsOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncTrustEvidencePanelsToUrl({ fieldsOpen: next, technicalOpen });

        return next;
      });
    },
    [syncTrustEvidencePanelsToUrl, technicalOpen],
  );

  const setTechnicalOpen = useCallback(
    (value: SetStateAction<boolean>) => {
      setTechnicalOpenState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncTrustEvidencePanelsToUrl({ fieldsOpen, technicalOpen: next });

        return next;
      });
    },
    [fieldsOpen, syncTrustEvidencePanelsToUrl],
  );

  useEffect(() => {
    setFieldsOpenState(parseTrustEvidenceFieldsOpenFromSearch(trustEvidenceFieldsOpenParam));
  }, [trustEvidenceFieldsOpenParam]);

  useEffect(() => {
    setTechnicalOpenState(parseTrustEvidenceTechOpenFromSearch(trustEvidenceTechOpenParam));
  }, [trustEvidenceTechOpenParam]);

  const trimmedAskRun =
    buyerPolishedShell && typeof evidenceAskRunId === "string" ? evidenceAskRunId.trim() : "";

  const fields = buildEvidenceBasisFields(card, buyerPolishedShell);
  const readiness = deriveTrustEvidenceReadiness(fields);
  const technicalRows = fields.filter((field) => field.technical !== null);
  const topFindingPointers = splitTrustEvidenceDetail(card.topFinding?.evidencePointersSummary);
  const trimmedBlockingFindingId =
    typeof blockingFindingId === "string" ? blockingFindingId.trim() : "";
  const trimmedBlockingFindingTitle =
    typeof blockingFindingTitle === "string" ? blockingFindingTitle.trim() : "";
  const showApprovalBlockerLink =
    approvalBlocked === true
    && trimmedBlockingFindingId.length > 0
    && trimmedBlockingFindingTitle.length > 0;
  const findingsTabHref = buildReviewDetailTabHref(runId, "findings", {
    hash: `finding-workspace-card-${trimmedBlockingFindingId}`,
  });

  return (
    <section id="trust-evidence" className="scroll-mt-24">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <h3 className={cn("m-0 text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            Evidence basis
          </h3>

          {showApprovalBlockerLink ? (
            <p
              className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
              data-testid="trust-evidence-approval-blocker-link"
            >
              Approval is blocked by{" "}
              <Link className={OPERATOR_LINK.nav} href={findingsTabHref}>
                {trimmedBlockingFindingTitle}
              </Link>
              .{" "}
              <FindingEvidenceTrailLink
                runId={runId}
                findingId={trimmedBlockingFindingId}
                label="Open finding evidence trail"
              />
            </p>
          ) : null}

          {readiness.exceptions.length > 0 ? (
            <div
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="trust-evidence-exception-fields"
            >
              {readiness.exceptions.map((field) => (
                <RunTrustEvidenceFieldRow key={field.key} title={field.title} status={field.status} detail={field.detail} />
              ))}
            </div>
          ) : null}

          {trimmedAskRun.length > 0 ? (
            <div
              className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
              data-testid="trust-evidence-ask-promotion"
            >
              <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}>
                Ask evidence-backed questions about this review
              </p>
              <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Answers reference this review&apos;s persisted summary, finalized review record, and cited evidence where your workspace
                allows.
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/insights/ask-review-questions?runId=${encodeURIComponent(trimmedAskRun)}`}>Ask about this review</Link>
                </Button>
              </div>
            </div>
          ) : null}

          {card.topFinding ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/50">
              <div className={cn("font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Top finding evidence (severity-first)
              </div>
              <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                {card.topFinding.title
                  ? evidenceAbsenceFindingLabel(card.topFinding.title)
                  : "Top finding evidence chain"}
              </p>
              <p className={cn("m-0 mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                Trace completeness: <strong>{card.topFinding.traceCompletenessLabel}</strong>
              </p>
              {topFindingPointers.display ? (
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                  {topFindingPointers.display}
                </p>
              ) : null}
            </div>
          ) : null}

          <CollapsibleSection
            title="All evidence fields"
            headingLevel={4}
            summaryLine={`${readiness.satisfied.length} field${readiness.satisfied.length === 1 ? "" : "s"} need no attention`}
            open={fieldsOpen}
            onToggle={setFieldsOpen}
            sectionTestId="trust-evidence-satisfied-fields"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {readiness.satisfied.map((field) => (
                <RunTrustEvidenceFieldRow key={field.key} title={field.title} status={field.status} detail={field.detail} />
              ))}
            </div>
          </CollapsibleSection>

          <RunTrustEvidenceProofChain card={card} runId={runId} buyerPolishedShell={buyerPolishedShell} />

          <section aria-labelledby="trust-evidence-scope-limitations">
            <h4 id="trust-evidence-scope-limitations" className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Scope and limitations
            </h4>
            <p className={cn("m-0 mt-2 max-w-prose text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {card.selfAttestationNotice}
            </p>
          </section>

          <CollapsibleSection
            title="Technical details (diagnostics)"
            headingLevel={4}
            summaryLine="Identifiers, versions, and API routes for support and audit"
            open={technicalOpen}
            onToggle={setTechnicalOpen}
            sectionTestId="trust-evidence-technical-details"
          >
            {technicalRows.length > 0 ? (
              <dl className={cn("m-0 grid gap-2", OPERATOR_TYPOGRAPHY.body)}>
                {technicalRows.map((field) => (
                  <div key={field.key}>
                    <dt className="font-medium text-neutral-700 dark:text-neutral-300">{field.title}</dt>
                    <dd className={cn("m-0 break-all font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                      {field.technical}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {card.topFinding ? (
              <div className="mt-3">
                <div className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                  Top finding
                </div>
                <p className={cn("m-0 break-all font-mono text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.micro)}>
                  {card.topFinding.findingId}
                  {topFindingPointers.technical !== null ? ` — ${topFindingPointers.technical}` : ""}
                </p>
              </div>
            ) : null}
            <div className="mt-3">
              <div className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
                {buyerPolishedShell ? "Trust diagnostics routes" : "Evidence routes (trust diagnostics)"}
              </div>
              <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.body)}>
                {(card.links ?? []).map((link) => (
                  <li key={link.rel}>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">{link.label}: </span>
                    <Link className="underline" href={resolveTrustEvidenceDiagnosticsApiPath(link.path ?? "")}>
                      {link.path}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </CollapsibleSection>
        </CardContent>
      </Card>
    </section>
  );
}
