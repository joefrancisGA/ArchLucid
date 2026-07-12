import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  STANDARDS_RULES_EMPTY_BODY,
  STANDARDS_RULES_EMPTY_HEADING,
} from "@/lib/standards-rules-page";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

export function StandardsRulesEmptyState() {
  return (
    <section
      className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="standards-rules-empty-state"
    >
      <h3 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}>{STANDARDS_RULES_EMPTY_HEADING}</h3>
      <p className={cn("m-0 mt-2 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{STANDARDS_RULES_EMPTY_BODY}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild type="button" size="sm">
          <Link href="/governance/policy-packs">Open policy packs</Link>
        </Button>
        <Button asChild type="button" size="sm" variant="outline">
          <Link href={`/graph?runId=${showcaseRunEnc}`}>View review evidence</Link>
        </Button>
      </div>
    </section>
  );
}
