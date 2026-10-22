import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION,
  EVIDENCE_TRAIL_HELP_FINDING_JUMP_INTRO,
  EVIDENCE_TRAIL_HELP_FINDING_JUMP_TITLE,
  EVIDENCE_TRAIL_HELP_FINDING_TRACE_ACTION,
} from "@/lib/evidence-trail-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Finding trace vs graph deep-link honesty for `/help/evidence-trail` (TB-1361). */
export function HelpEvidenceTrailFindingJumpPanel(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-evidence-trail-finding-jump-heading"
      className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="help-evidence-trail-finding-jump-panel"
      id="jump-from-a-finding"
    >
      <h2
        id="help-evidence-trail-finding-jump-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {EVIDENCE_TRAIL_HELP_FINDING_JUMP_TITLE}
      </h2>
      <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        {EVIDENCE_TRAIL_HELP_FINDING_JUMP_INTRO}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link
            href={EVIDENCE_TRAIL_HELP_FINDING_TRACE_ACTION.href}
            data-testid={EVIDENCE_TRAIL_HELP_FINDING_TRACE_ACTION.testId}
          >
            {EVIDENCE_TRAIL_HELP_FINDING_TRACE_ACTION.label}
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link
            href={EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION.href}
            data-testid={EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION.testId}
          >
            {EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION.label}
          </Link>
        </Button>
      </div>
    </section>
  );
}
