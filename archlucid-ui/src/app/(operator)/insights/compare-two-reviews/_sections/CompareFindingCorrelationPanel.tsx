import { cn } from "@/lib/utils";
import type { ReactElement, ReactNode } from "react";

import { CompareFindingLifecycleBlock } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingLifecycleBlock";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { FindingCorrelationVocabularyDisambiguation } from "@/components/findings/FindingCorrelationVocabularyDisambiguation";
import {
  buildCompareFindingCorrelationCountRows,
  COMPARE_FINDING_CORRELATION_DEDUPE_KEY_FORMAT,
  COMPARE_FINDING_CORRELATION_EXPORT_PARITY_NOTE,
  compareFindingCorrelationMethodLabel,
  type CompareFindingCorrelationMetadata,
} from "@/lib/compare-finding-correlation";
import type { CompareFindingLifecycleRecord, CompareFindingLifecycleSummary } from "@/lib/compare-finding-lifecycle";
import { CROSS_REVIEW_FINDING_CORRELATION_PANEL_TITLE } from "@/lib/vocabulary/finding-correlation-vocabulary";
import { COMPARE_FINDING_CORRELATION_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type CompareFindingCorrelationPanelProps = {
  readonly metadata: CompareFindingCorrelationMetadata | null;
  readonly lifecycle: CompareFindingLifecycleSummary | null;
  readonly lifecycleRecords?: readonly CompareFindingLifecycleRecord[];
  readonly priorRunId?: string | null;
  readonly laterRunId?: string | null;
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
  const {
    metadata,
    lifecycle,
    lifecycleRecords = [],
    priorRunId = null,
    laterRunId = null,
    loading,
    softFailureMessage,
  } = props;

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
      <CompareFindingCorrelationSectionShell
        className={cn("mt-6", DESIGN_TOKENS.callout.warn, "rounded-lg border-dashed p-4")}
      >
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
        <EnterpriseCompactEmptyState {...COMPARE_FINDING_CORRELATION_EMPTY_COMPACT} />
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

      <CompareFindingLifecycleBlock
        summary={lifecycle}
        records={lifecycleRecords}
        priorRunId={priorRunId}
        laterRunId={laterRunId}
      />
    </CompareFindingCorrelationSectionShell>
  );
}
