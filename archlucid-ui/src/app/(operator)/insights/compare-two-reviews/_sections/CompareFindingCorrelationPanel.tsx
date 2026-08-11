import { cn } from "@/lib/utils";
import type { ReactElement, ReactNode } from "react";

import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { FindingCorrelationVocabularyDisambiguation } from "@/components/FindingCorrelationVocabularyDisambiguation";
import {
  buildCompareFindingCorrelationCountRows,
  COMPARE_FINDING_CORRELATION_DEDUPE_KEY_FORMAT,
  COMPARE_FINDING_CORRELATION_EXPORT_PARITY_NOTE,
  compareFindingCorrelationMethodLabel,
  type CompareFindingCorrelationMetadata,
} from "@/lib/compare-finding-correlation";
import { CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE } from "@/lib/finding-correlation-vocabulary";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CompareFindingCorrelationPanelProps = {
  readonly metadata: CompareFindingCorrelationMetadata | null;
  readonly loading: boolean;
  readonly softFailureMessage: string | null;
};

function CompareFindingCorrelationSectionShell(props: {
  readonly className: string;
  readonly children: ReactNode;
  readonly busy?: boolean;
}): ReactElement {
  return (
    <section
      id="compare-finding-correlation"
      className={props.className}
      data-testid="compare-finding-correlation-section"
      aria-busy={props.busy === true ? true : undefined}
    >
      {props.children}
      {props.busy === true ? null : <FindingCorrelationVocabularyDisambiguation />}
    </section>
  );
}

export function CompareFindingCorrelationPanel(props: CompareFindingCorrelationPanelProps): ReactElement {
  const { metadata, loading, softFailureMessage } = props;

  if (loading) {
    return (
      <CompareFindingCorrelationSectionShell
        busy
        className="mt-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
      >
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE}
        </h2>
        <p className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          <strong>Loading finding correlation metadata…</strong>
        </p>
      </CompareFindingCorrelationSectionShell>
    );
  }

  if (softFailureMessage !== null) {
    return (
      <CompareFindingCorrelationSectionShell className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-4 dark:border-amber-700 dark:bg-amber-950/20">
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE}
        </h2>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Could not load {softFailureMessage}. Structured and supplementary compare sections above remain authoritative
          for review deltas.
        </p>
      </CompareFindingCorrelationSectionShell>
    );
  }

  if (metadata === null) {
    return (
      <CompareFindingCorrelationSectionShell className="mt-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE}
        </h2>
        <OperatorEmptyState title="No correlation metadata">
          No finding correlation metadata on this comparison (API may predate correlation export metadata).
        </OperatorEmptyState>
      </CompareFindingCorrelationSectionShell>
    );
  }

  const countRows = buildCompareFindingCorrelationCountRows(metadata);

  return (
    <CompareFindingCorrelationSectionShell className="mt-6 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        {CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE}
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {COMPARE_FINDING_CORRELATION_EXPORT_PARITY_NOTE}
      </p>

      <dl className={cn("m-0 mt-4 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
        <div>
          <dt className="text-al-text-secondary">Correlation method</dt>
          <dd className="m-0 mt-1 font-medium text-al-text-primary" data-testid="compare-finding-correlation-method">
            {compareFindingCorrelationMethodLabel(metadata.primaryCorrelationMethod)}
          </dd>
        </div>
        <div>
          <dt className="text-al-text-secondary">Dedupe key format</dt>
          <dd className="m-0 mt-1 font-mono text-sm text-al-text-primary" data-testid="compare-finding-correlation-dedupe-key">
            {COMPARE_FINDING_CORRELATION_DEDUPE_KEY_FORMAT}
          </dd>
        </div>
      </dl>

      <ul
        className={cn("m-0 mt-4 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}
        data-testid="compare-finding-correlation-counts"
      >
        {countRows.map((row) => (
          <li
            key={row.label}
            className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
          >
            <span className="text-al-text-secondary">{row.label}</span>
            <span className="ml-2 font-semibold text-al-text-primary">{row.value}</span>
          </li>
        ))}
      </ul>

      {metadata.honestyNote.length > 0 ? (
        <p
          className={cn("m-0 mt-4 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-al-text-primary dark:border-neutral-800 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="compare-finding-correlation-honesty"
        >
          <strong className="text-al-text-primary">Correlation honesty:</strong> {metadata.honestyNote}
        </p>
      ) : null}
    </CompareFindingCorrelationSectionShell>
  );
}
