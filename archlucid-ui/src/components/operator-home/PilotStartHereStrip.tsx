import Link from "next/link";

import { InAppHelpLink } from "@/components/InAppHelpLink";

const STEPS = [
  { label: "Platform ready", href: "/health", testId: "pilot-start-platform" },
  { label: "Evidence (extractor or demo)", href: "/help", testId: "pilot-start-evidence" },
  { label: "Create & execute review", href: "/reviews/new", testId: "pilot-start-run" },
  { label: "Commit & sponsor proof", href: "/help", testId: "pilot-start-proof" },
] as const;

/** First-pilot progressive disclosure strip on operator home (assessment #4). */
export function PilotStartHereStrip(): React.JSX.Element {
  return (
    <section
      className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-700 dark:bg-neutral-900/50"
      aria-labelledby="pilot-start-here-heading"
      data-testid="pilot-start-here-strip"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2
          id="pilot-start-here-heading"
          className="m-0 text-sm font-bold uppercase tracking-wide text-neutral-700 dark:text-neutral-200"
        >
          Fast path to first review package
        </h2>
        <InAppHelpLink helpSlug="first-pilot-path" label="Open the canonical operator checklist" />
        <InAppHelpLink helpSlug="first-value-20-minutes" label="Open the 20-minute time-boxed runbook" />
      </div>
      <ol className="m-0 flex list-none flex-wrap gap-3 p-0">
        {STEPS.map((step, index) => (
          <li key={step.testId} className="flex items-center gap-2 text-sm">
            <span
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
              aria-hidden
            >
              {index + 1}
            </span>
            <Link
              href={step.href}
              className="font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100"
              data-testid={step.testId}
            >
              {step.label}
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-3 mb-0 text-xs text-neutral-600 dark:text-neutral-400">
        Primary sequence: platform ready → evidence → create/execute/commit → sponsor proof → commercial next step.
        Operate, V1.1 connectors, and MCP stay optional after first commit. CLI:{" "}
        <code className="text-xs">archlucid pilot proof-packet &lt;runId&gt;</code> ·{" "}
        <code className="text-xs">collect-first-pilot-proof.ps1 -RunId …</code>
      </p>
    </section>
  );
}
