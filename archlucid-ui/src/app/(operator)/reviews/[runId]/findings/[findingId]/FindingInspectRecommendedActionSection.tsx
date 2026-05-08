import type { ReactElement } from "react";

export type FindingInspectRecommendedActionSectionProps = {
  readonly tone: "detail" | "inspect";
  readonly structuredActions: string[];
  readonly recommendedActionParagraph: string;
};

const toneSurfaces: Record<FindingInspectRecommendedActionSectionProps["tone"], string> = {
  detail:
    "rounded-lg border border-teal-200/90 bg-teal-50/50 p-4 dark:border-teal-900 dark:bg-teal-950/30",
  inspect:
    "rounded-lg border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900 dark:bg-violet-950/30",
};

/** Recommended remediation — teal framing on finding detail, violet on inspect (later in page flow). */
export function FindingInspectRecommendedActionSection({
  tone,
  structuredActions,
  recommendedActionParagraph,
}: FindingInspectRecommendedActionSectionProps): ReactElement {
  const panelCls = toneSurfaces[tone];

  return (
    <section className={panelCls}>
      <h2 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recommended action</h2>
      {structuredActions.length > 1 ? (
        <ol className="mb-0 mt-2 list-decimal space-y-1.5 pl-5 text-sm text-neutral-800 dark:text-neutral-200">
          {structuredActions.map((action, idx) => (
            <li key={idx}>{action}</li>
          ))}
        </ol>
      ) : (
        <p className="m-0 mt-2 whitespace-pre-line text-sm text-neutral-800 dark:text-neutral-200">
          {recommendedActionParagraph.trim()}
        </p>
      )}
    </section>
  );
}
