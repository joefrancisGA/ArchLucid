import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  EVIDENCE_TRAIL_HELP_ACTION_PANEL_TITLE,
  EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS,
  EVIDENCE_TRAIL_HELP_SAMPLE_HONESTY,
} from "@/lib/evidence-trail-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Secondary graph actions for `/help/evidence-trail` — header owns the sole primary CTA (TB-1539). */
export function HelpEvidenceTrailActionPanel(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-evidence-trail-action-heading"
      className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="help-evidence-trail-action-panel"
      id="open-the-evidence-graph"
    >
      <h2
        id="help-evidence-trail-action-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {EVIDENCE_TRAIL_HELP_ACTION_PANEL_TITLE}
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openGraph.href}>
            {EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openGraph.label}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link
            href={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.loadGraph.href}
            data-testid={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.loadGraph.testId}
          >
            {EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.loadGraph.label}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link
            href={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openSampleGraph.href}
            data-testid={EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openSampleGraph.testId}
          >
            {EVIDENCE_TRAIL_HELP_PRIMARY_ACTIONS.openSampleGraph.label}
          </Link>
        </Button>
      </div>
      <p
        className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="help-evidence-trail-sample-honesty"
      >
        {EVIDENCE_TRAIL_HELP_SAMPLE_HONESTY}
      </p>
    </section>
  );
}
