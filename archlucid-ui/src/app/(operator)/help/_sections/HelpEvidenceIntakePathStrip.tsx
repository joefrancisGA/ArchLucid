import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  EVIDENCE_INTAKE_HELP_PATH_OPTIONS,
  EVIDENCE_INTAKE_HELP_PATH_PANEL_INTRO,
  EVIDENCE_INTAKE_HELP_PATH_PANEL_TITLE,
} from "@/lib/evidence-intake-help-guide-content";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Starting-path CTAs for `/help/evidence-intake` (TB-1351). */
export function HelpEvidenceIntakePathStrip(): React.ReactElement {
  return (
    <section
      aria-labelledby="help-evidence-intake-path-heading"
      data-testid="help-evidence-intake-path-strip"
      id="choose-a-starting-path"
    >
      <h2
        id="help-evidence-intake-path-heading"
        className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {EVIDENCE_INTAKE_HELP_PATH_PANEL_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {EVIDENCE_INTAKE_HELP_PATH_PANEL_INTRO}
      </p>
      <ul className="m-0 mt-3 grid list-none gap-3 p-0 md:grid-cols-3">
        {EVIDENCE_INTAKE_HELP_PATH_OPTIONS.map((pathOption) => (
          <li
            key={pathOption.id}
            className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
            data-testid={`help-evidence-intake-path-${pathOption.id}`}
          >
            <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {pathOption.label}
            </p>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {pathOption.description}
            </p>
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <Link href={pathOption.href}>{pathOption.label}</Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
