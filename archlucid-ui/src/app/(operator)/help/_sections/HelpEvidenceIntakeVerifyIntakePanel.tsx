import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  EVIDENCE_INTAKE_HELP_VERIFY_INTAKE_INTRO,
  EVIDENCE_INTAKE_HELP_VERIFY_INTAKE_TITLE,
  EVIDENCE_INTAKE_HELP_VERIFY_STEPS,
} from "@/lib/evidence-intake-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Verify-intake checklist with actionable in-app links (TB-1354). */
export function HelpEvidenceIntakeVerifyIntakePanel(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-evidence-intake-verify-heading"
      className="rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="help-evidence-intake-verify-panel"
      id="verify-intake-before-finalize"
    >
      <h2
        id="help-evidence-intake-verify-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {EVIDENCE_INTAKE_HELP_VERIFY_INTAKE_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {EVIDENCE_INTAKE_HELP_VERIFY_INTAKE_INTRO}
      </p>
      <ol className={cn("m-0 mt-3 list-decimal space-y-3 pl-5", OPERATOR_TYPOGRAPHY.body)}>
        {EVIDENCE_INTAKE_HELP_VERIFY_STEPS.map((step) => (
          <li key={step.title}>
            <span className="font-medium text-al-text-primary">{step.title}</span>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{step.body}</p>
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <Link href={step.action.href}>{step.action.label}</Link>
              </Button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
