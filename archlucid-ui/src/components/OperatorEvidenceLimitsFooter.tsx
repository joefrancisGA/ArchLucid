import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import { GeneratedByModelAliasDisclosure } from "@/components/GeneratedByModelAliasDisclosure";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

export type OperatorEvidenceLimitsExecutionProps = {
  readonly realModeFellBackToSimulator?: boolean;
  readonly pilotAoaiDeploymentSnapshot?: string | null;
};

export type OperatorEvidenceLimitsInspectMetaProps = {
  readonly modelDeploymentName?: string | null;
  readonly modelAlias?: string | null;
  readonly promptTemplateVersion?: string | null;
};

export type OperatorEvidenceLimitsFooterProps = {
  readonly runId: string;
  /** Finding detail: adds `/findings/{id}/evidence-trace` alongside provenance. */
  readonly findingIdForInspectLink?: string | null;
  /** Link to aggregate explanation section on run detail (`#run-explanation`). */
  readonly showArchitectureReviewSummaryLink?: boolean;
  readonly execution?: OperatorEvidenceLimitsExecutionProps | null;
  readonly inspectMetadata?: OperatorEvidenceLimitsInspectMetaProps | null;
};

function trimmedOrEmpty(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Operator-facing footer: deep links to provenance / explain surfaces plus factual execution disclaimers
 * from existing API fields only (run fallback flags, inspect metadata).
 */
export function OperatorEvidenceLimitsFooter({
  runId,
  findingIdForInspectLink,
  showArchitectureReviewSummaryLink = true,
  execution,
  inspectMetadata,
}: OperatorEvidenceLimitsFooterProps) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const safeRunId = runId.trim();
  const runBase = `/architecture/reviews/${encodeURIComponent(safeRunId)}`;
  const provenanceHref = `${runBase}/provenance`;
  const explainHref = `${runBase}#run-explanation`;
  const inspectFindingId = trimmedOrEmpty(findingIdForInspectLink);
  const inspectHref =
    inspectFindingId.length > 0
      ? getFindingEvidenceTraceHref(safeRunId, inspectFindingId)
      : null;

  const showFallbackDisclaimer = execution?.realModeFellBackToSimulator === true;
  const deploymentSnapshot = trimmedOrEmpty(execution?.pilotAoaiDeploymentSnapshot);

  const modelName = trimmedOrEmpty(inspectMetadata?.modelDeploymentName);
  const modelAlias = trimmedOrEmpty(inspectMetadata?.modelAlias);
  const promptVersion = trimmedOrEmpty(inspectMetadata?.promptTemplateVersion);
  const showInspectMetaLine =
    !buyerPolishedShell && (modelName.length > 0 || promptVersion.length > 0);

  /** Buyer walkthrough shell: disclaimers cite internal APIs; static demo context is surfaced elsewhere (e.g. banner). */
  const showTechnicalExecutionDisclosures = !buyerPolishedShell;

  const reviewSummaryLinkLabel = buyerPolishedShell ? "Findings & assessment (on review)" : "Architecture review summary";
  const provenanceLinkLabel = buyerPolishedShell ? "Structural provenance overview" : "Review trail";

  return (
    <footer
      className={cn("rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}
      aria-labelledby="operator-evidence-limits-heading"
      data-testid="operator-evidence-limits-footer"
    >
      <h2 id="operator-evidence-limits-heading" className={cn("m-0 font-semibold tracking-tight", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Evidence basis
      </h2>

      <p className={cn("m-0 mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Review structural provenance and recorded inspect metadata linked from this review.
      </p>

      <details className={cn("m-0 mt-2 rounded-md border border-neutral-200 bg-white/60 p-2 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-950/40 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        <summary className="cursor-pointer font-medium text-neutral-800 dark:text-neutral-200">Review scope and limitations</summary>
        <p className="m-0 mt-2 leading-relaxed">
          This strip reflects API-reported execution signals only; it does not assert production latency or external
          system health.
        </p>
      </details>

      <ul className="m-0 mt-3 list-none space-y-2 p-0" data-testid="operator-evidence-limits-links">
        <li>
          <Link
            className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
            href={provenanceHref}
            aria-label={buyerPolishedShell ? "Structural provenance overview" : "Review trail (provenance graph)"}
          >
            {provenanceLinkLabel}
          </Link>
        </li>

        {showArchitectureReviewSummaryLink ? (
          <li>
            <Link
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
              href={explainHref}
              aria-label={
                buyerPolishedShell
                  ? "Findings and assessment section on the review"
                  : "Architecture review summary (explain aggregate)"
              }
            >
              {reviewSummaryLinkLabel}
            </Link>
          </li>
        ) : null}

        {inspectHref !== null ? (
          <li>
            <Link
              className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300 dark:hover:text-teal-200"
              href={inspectHref}
            >
              Technical inspection trail
            </Link>
          </li>
        ) : null}
      </ul>

      <GeneratedByModelAliasDisclosure modelAlias={modelAlias.length > 0 ? modelAlias : null} className="mt-3" />

      {showFallbackDisclaimer && showTechnicalExecutionDisclosures ? (
        <p
          className={cn("m-0 mt-3 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="operator-evidence-limits-fallback-disclaimer"
        >
          This review is flagged in API data as real-mode fallback: Azure OpenAI execution did not complete and deterministic
          simulator output was substituted (see review record field{" "}
          <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>realModeFellBackToSimulator</span>
          ).
          {deploymentSnapshot.length > 0 ? (
            <>
              {" "}
              Recorded deployment snapshot at fallback:{" "}
              <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>{deploymentSnapshot}</span>.
            </>
          ) : null}
        </p>
      ) : null}

      {showInspectMetaLine ? (
        <p
          className={cn("m-0 mt-3 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="operator-evidence-limits-inspect-metadata"
        >
          Inspect API returned{" "}
          {modelName.length > 0 ? (
            <>
              model deployment name <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>{modelName}</span>
            </>
          ) : null}
          {modelName.length > 0 && promptVersion.length > 0 ? " and " : null}
          {promptVersion.length > 0 ? (
            <>
              prompt template version <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>{promptVersion}</span>
            </>
          ) : null}
          .
        </p>
      ) : null}
    </footer>
  );
}
