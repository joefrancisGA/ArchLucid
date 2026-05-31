import Link from "next/link";

/**
 * Lightweight guided tour for marketing `/demo/preview` — no auth, no new API.
 * Maps to assessment value props: findings, provenance/timeline, governance posture, manifest.
 */
export function DemoPreviewGuidedCallouts() {
  return (
    <aside
      className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-4 text-sm"
      aria-label="What to notice in this sample review"
      data-testid="demo-preview-guided-callouts"
    >
      <p className="m-0 font-semibold">How to read this walkthrough</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-teal-900 dark:text-teal-100">
        <li data-callout="sponsor-mode">
          <strong>Sponsor-mode summary</strong> — start with the plain-English briefing, then drill into the evidence
          chain only when a reviewer asks why.
        </li>
        <li data-callout="findings">
          <strong>Evidence graph</strong> — trace findings, decisions, and deliverables to source evidence in the review
          outcome strip above.
        </li>
        <li data-callout="provenance">
          <strong>Provenance &amp; review lifecycle</strong> — see how the review moved from captured context to the
          committed manifest. Open <span className="font-medium">Full audit trail</span> for the vertical sequence.
        </li>
        <li data-callout="governance">
          <strong>Governance approval</strong> — manifest summary captures policy pack, decisions, and monitored risks for
          this architecture review.
        </li>
        <li data-callout="manifest">
          <strong>Signed manifest &amp; deliverables</strong> — record plus exportable rows your team can attach to review
          packs.
        </li>
      </ol>
      <p className="mt-3 m-0 rounded border border-teal-200 bg-white/70 px-3 py-2 text-xs text-teal-900 dark:border-teal-800 dark:bg-neutral-950/30 dark:text-teal-100">
        Demo values are illustrative. Use a real extractor ZIP or buyer-provided evidence before treating ROI or risk
        posture as customer proof.
      </p>
      <p className="mt-3 m-0 text-xs text-teal-800 dark:text-teal-200">
        For a shorter overview, view the{" "}
        <Link href="/see-it" className="font-medium underline underline-offset-2">
          30-second summary
        </Link>
        .
      </p>
    </aside>
  );
}
