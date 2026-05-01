import Link from "next/link";

/**
 * Lightweight “guided tour” callouts for marketing `/demo/preview` — no auth, no new API.
 * Maps to assessment Improvement 3 value props: findings, provenance/timeline, governance posture, manifest.
 */
export function DemoPreviewGuidedCallouts() {
  return (
    <aside
      className="rounded-lg border border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-50"
      aria-label="What to notice in this sample review"
      data-testid="demo-preview-guided-callouts"
    >
      <p className="m-0 font-semibold">What you are seeing (no sign-in)</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-teal-900 dark:text-teal-100">
        <li data-callout="findings">
          <strong>Findings &amp; evidence</strong> — severity, recommended actions, and traceable rationale in the review
          outcome strip above.
        </li>
        <li data-callout="provenance">
          <strong>Provenance &amp; review trail</strong> — pipeline timeline shows how the review moved from context to
          committed manifest (open <span className="font-medium">Classic vertical timeline</span> for the full graph).
        </li>
        <li data-callout="governance">
          <strong>Governance posture</strong> — manifest summary captures policy pack, decisions, and warnings from the
          pre-commit posture for this architecture.
        </li>
        <li data-callout="manifest">
          <strong>Manifest &amp; artifacts</strong> — golden manifest slice plus exportable artifact rows (formats your
          team can attach to PRs or packs).
        </li>
      </ol>
      <p className="mt-3 m-0 text-xs text-teal-800 dark:text-teal-200">
        Prefer the shorter teaser first? Try{" "}
        <Link href="/see-it" className="font-medium underline underline-offset-2">
          See it in 30 seconds
        </Link>
        .
      </p>
    </aside>
  );
}
