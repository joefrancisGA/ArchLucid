"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
type WizardPackagePreviewProps = {
  readonly systemName: string;
  readonly hasEvidence: boolean;
};

/** Live preview of what the review will include. */
export function WizardPackagePreview(props: WizardPackagePreviewProps) {
  const items = [
    "Architecture structure findings",
    "Cost posture summary",
    "Compliance checks against policy packs",
    "Critic review and explainability trace",
    props.hasEvidence ? "Evidence-linked provenance graph" : "Evidence trail (attach files to enrich)",
    "Sealed review record and exportable deliverables",
  ];

  return (
    <aside
      className={cn("rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/40", OPERATOR_TYPOGRAPHY.body)}
      data-testid="wizard-package-preview"
      aria-label="Review preview"
    >
      <h3 className={cn("m-0 mb-2 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Your review will include
      </h3>
      <p className={cn("m-0 mb-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        Architecture review: <span className="font-medium">{props.systemName.trim() || "Untitled"}</span>
      </p>
      <ul className="m-0 list-disc space-y-1 pl-5 text-neutral-700 dark:text-neutral-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}
