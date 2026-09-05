import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

export type TransparencyTrailPanelProps = {
  readonly trail: TransparencyTrail | null | undefined;
  readonly className?: string;
  readonly missingTrailDefect?: boolean;
  /** Working mode keeps the trail expanded; Guided collapses behind a disclosure. */
  readonly defaultExpanded?: boolean;
};

function MustSkippedEntries(trail: TransparencyTrail): TransparencyTrail["skipped"] {
  return trail.skipped.filter((entry) => entry.tier === "Must");
}

function ShouldSkippedEntries(trail: TransparencyTrail): TransparencyTrail["skipped"] {
  return trail.skipped.filter((entry) => entry.tier !== "Must");
}

/** ADR 0050 asserted / inferred / skipped transparency record for review surfaces. */
export function TransparencyTrailPanel(props: TransparencyTrailPanelProps): ReactElement | null {
  const trail = props.trail;

  if (props.missingTrailDefect === true && (trail === null || trail === undefined)) {
    return (
      <div
        className={cn(
          "rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100",
          props.className,
        )}
        data-testid="transparency-trail-missing-defect"
      >
        <p className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>Transparency record missing</p>
        <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
          This review should include an Asserted / Inferred / Skipped trail. Do not finalize or defend outcomes without
          that record.
        </p>
      </div>
    );
  }

  if (trail === null || trail === undefined) {
    return null;
  }

  const mustSkipped = MustSkippedEntries(trail);
  const shouldSkipped = ShouldSkippedEntries(trail);
  const defaultExpanded = props.defaultExpanded ?? true;

  const panelBody = (
    <div className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)}>
      <div>
        <p className="m-0 font-medium">Asserted ({trail.asserted.length})</p>
        {trail.asserted.length > 0 ? (
          <ul className="mt-1 list-disc pl-5">
            {trail.asserted.map((entry) => (
              <li key={entry.key}>
                {entry.key}: {entry.value}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 mt-1 text-al-text-secondary">None recorded.</p>
        )}
      </div>
      <div>
        <p className="m-0 font-medium">Inferred ({trail.inferred.length})</p>
        {trail.inferred.length > 0 ? (
          <ul className="mt-1 list-disc pl-5">
            {trail.inferred.map((entry) => (
              <li key={entry.key}>
                {entry.key}: {entry.value} (confidence {entry.confidence})
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 mt-1 text-al-text-secondary">None recorded.</p>
        )}
      </div>
      {mustSkipped.length > 0 ? (
        <div data-testid="transparency-trail-skipped-must">
          <p className="m-0 font-medium text-rose-800 dark:text-rose-200">
            Skipped MUST questions ({mustSkipped.length})
          </p>
          <ul className="mt-1 list-disc pl-5">
            {mustSkipped.map((entry) => (
              <li key={entry.questionKey}>{entry.questionKey}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {shouldSkipped.length > 0 ? (
        <div>
          <p className="m-0 font-medium">Skipped SHOULD questions ({shouldSkipped.length})</p>
          <ul className="mt-1 list-disc pl-5">
            {shouldSkipped.map((entry) => (
              <li key={entry.questionKey}>{entry.questionKey}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );

  if (!defaultExpanded) {
    return (
      <details
        className={cn("rounded-md border border-neutral-200 p-4 dark:border-neutral-800", props.className)}
        data-testid="transparency-trail-panel"
      >
        <summary className={cn("cursor-pointer font-semibold", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          Transparency trail
        </summary>
        <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          What you asserted, what ArchLucid inferred, and what was skipped.
        </p>
        <div className="mt-4">{panelBody}</div>
      </details>
    );
  }

  return (
    <section
      className={cn("rounded-md border border-neutral-200 p-4 dark:border-neutral-800", props.className)}
      data-testid="transparency-trail-panel"
    >
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Transparency trail</h3>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        What you asserted, what ArchLucid inferred, and what was skipped.
      </p>
      <div className="mt-4">{panelBody}</div>
    </section>
  );
}
