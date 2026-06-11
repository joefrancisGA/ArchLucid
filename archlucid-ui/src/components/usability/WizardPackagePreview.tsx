"use client";

type WizardPackagePreviewProps = {
  readonly systemName: string;
  readonly hasEvidence: boolean;
};

/** Live preview of what the review package will include. */
export function WizardPackagePreview(props: WizardPackagePreviewProps) {
  const items = [
    "Topology analysis findings",
    "Cost posture summary",
    "Compliance checks against policy packs",
    "Critic review and explainability trace",
    props.hasEvidence ? "Evidence-linked provenance graph" : "Evidence trail (attach files to enrich)",
    "Signed manifest and exportable deliverables",
  ];

  return (
    <aside
      className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/40"
      data-testid="wizard-package-preview"
      aria-label="Review package preview"
    >
      <h3 className="m-0 mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        Your review package will include
      </h3>
      <p className="m-0 mb-2 text-xs text-neutral-600 dark:text-neutral-400">
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
