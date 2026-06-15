import Link from "next/link";

import { Button } from "@/components/ui/button";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

const PRIMARY_HREF = "/reviews/new";
const PRIMARY_LABEL = "Start your first review package";

/**
 * First-screen operator orientation: one primary pilot action and at most three secondary links.
 */
export function OperatorPilotOrientationBanner() {
  const firstPilotPathHref = resolveInAppDocHref("/docs/runbooks/FIRST_PILOT_OPERATOR_PATH.md");

  return (
    <section
      aria-labelledby="operator-pilot-orientation-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="operator-pilot-orientation"
    >
      <h2 id="operator-pilot-orientation-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
        First pilot path
      </h2>
      <p className={`mt-2 max-w-3xl ${OPERATOR_TYPOGRAPHY.body}`}>
        Run one governed architecture review, commit the package, then collect proof before any sponsor handoff.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild size="sm">
          <Link href={PRIMARY_HREF} data-testid="operator-pilot-primary-action">
            {PRIMARY_LABEL}
          </Link>
        </Button>
        <nav aria-label="First pilot secondary links" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href={firstPilotPathHref}
            className={`${OPERATOR_TYPOGRAPHY.meta} text-al-accent-interactive underline-offset-2 hover:underline`}
            data-testid="operator-pilot-secondary-first-run"
          >
            First-pilot checklist
          </Link>
          <Link
            href="/help/first-pilot-path"
            className={`${OPERATOR_TYPOGRAPHY.meta} text-al-accent-interactive underline-offset-2 hover:underline`}
            data-testid="operator-pilot-secondary-help"
          >
            In-app guidance
          </Link>
          <Link
            href="/reviews"
            className={`${OPERATOR_TYPOGRAPHY.meta} text-al-accent-interactive underline-offset-2 hover:underline`}
            data-testid="operator-pilot-secondary-reviews"
          >
            Review packages
          </Link>
        </nav>
      </div>
    </section>
  );
}
