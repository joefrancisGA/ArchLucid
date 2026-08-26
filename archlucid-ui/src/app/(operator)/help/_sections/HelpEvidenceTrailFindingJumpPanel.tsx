import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EVIDENCE_TRAIL_HELP_FINDING_GRAPH_ACTION,
  EVIDENCE_TRAIL_HELP_FINDING_JUMP_INTRO,
  EVIDENCE_TRAIL_HELP_FINDING_JUMP_TITLE,
  EVIDENCE_TRAIL_HELP_FINDING_TRACE_ACTION,
} from "@/lib/evidence-trail-help-guide-content";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Finding trace vs graph deep-link honesty for `/help/evidence-trail` (TB-1361). */
export function HelpEvidenceTrailFindingJumpPanel(): React.ReactElement {
  return (
    <Card
      className="border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="help-evidence-trail-finding-jump-panel"
      id="jump-from-a-finding"
    >
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle as="h2" className={cn("text-lg", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {EVIDENCE_TRAIL_HELP_FINDING_JUMP_TITLE}
        </CardTitle>
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {EVIDENCE_TRAIL_HELP_FINDING_JUMP_INTRO}
        </p>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "flex flex-wrap items-center gap-2")}>
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
      </CardContent>
    </Card>
  );
}
