import type { Metadata } from "next";
import Link from "next/link";

import { OperatorFirstRunWorkflowPanel } from "@/components/OperatorFirstRunWorkflowPanel";
import { OperatorHomeGate } from "@/components/OperatorHomeGate";
import { ShortcutHint } from "@/components/ShortcutHint";
import { WelcomeBanner } from "@/components/WelcomeBanner";

export const metadata: Metadata = {
  title: "Operator home",
};

/** Landing page: optional welcome banner, first-run workflow panel, and quick links. */
export default function HomePage() {
  return (
    <OperatorHomeGate>
    <main>
      <h2 className="mb-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">Operator home</h2>
      <p className="mb-4 max-w-3xl text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        ArchLucid has three product layers. Start with <strong>Core Pilot</strong>: create a run, commit the
        manifest, and review artifacts. Once you have a committed run, explore{" "}
        <strong>Advanced Analysis</strong> (compare, replay, graph) and{" "}
        <strong>Enterprise Controls</strong> (governance, audit, policy).
      </p>

      <WelcomeBanner />

      <OperatorFirstRunWorkflowPanel />

      {/* Core Pilot quick links — the four steps every pilot needs. */}
      <section className="mt-2" aria-labelledby="core-pilot-heading">
        <h3 id="core-pilot-heading" className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Core Pilot path
        </h3>
        <p className="mb-3 max-w-3xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          These four links cover the complete first-pilot journey.
        </p>
        <ul className="m-0 max-w-3xl list-disc space-y-1 pl-5 leading-relaxed text-neutral-700 dark:text-neutral-300">
          <li>
            <Link href="/runs/new" className="text-teal-800 underline dark:text-teal-300">
              New run (wizard)
            </Link>{" "}
            <ShortcutHint shortcut="Alt+N" className="ml-1 align-middle text-[0.75rem]" /> — guided seven-step
            create; submits the run and tracks the pipeline in real time.
          </li>
          <li>
            <Link href="/runs?projectId=default" className="text-teal-800 underline dark:text-teal-300">
              Runs
            </Link>{" "}
            — list all runs; open detail, commit, inspect manifest, download artifacts and exports.
          </li>
          <li>
            <strong>Commit</strong> — on run detail, use <em>Commit run</em> once the pipeline is complete to produce
            the golden manifest and artifacts. CLI/API alternative: <code>docs/OPERATOR_QUICKSTART.md</code>.
          </li>
          <li>
            <strong>Artifacts</strong> — after commit, open run detail and use the Artifacts table to review,
            preview, and download each artifact. Bundle ZIP also available.
          </li>
        </ul>
      </section>

      {/* Advanced Analysis — deep exploration once you have a committed run. Enable via "Show more links". */}
      <section className="mt-6" aria-labelledby="advanced-analysis-heading">
        <h3 id="advanced-analysis-heading" className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Advanced Analysis
        </h3>
        <p className="mb-2 max-w-3xl text-xs text-neutral-500 dark:text-neutral-400">
          Available once you have a committed run. Enable via <em>Show more links</em> in the sidebar.
        </p>
        <ul className="m-0 max-w-3xl list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          <li>
            <Link href="/compare" className="text-teal-800 underline dark:text-teal-300">
              Compare two runs
            </Link>
            {" · "}
            <Link href="/replay" className="text-teal-800 underline dark:text-teal-300">
              Replay a run
            </Link>{" "}
            — structured manifest diff and authority-chain re-validation.
          </li>
          <li>
            <Link href="/graph" className="text-teal-800 underline dark:text-teal-300">
              Graph
            </Link>{" "}
            — visual provenance or architecture graph for a run ID.
          </li>
          <li>
            <Link href="/ask" className="text-teal-800 underline dark:text-teal-300">
              Ask
            </Link>
            {" · "}
            <Link href="/advisory" className="text-teal-800 underline dark:text-teal-300">
              Advisory
            </Link>
            {" · "}
            <Link href="/product-learning" className="text-teal-800 underline dark:text-teal-300">
              Pilot feedback
            </Link>{" "}
            — natural-language Q&amp;A, advisory scans, and product signal collection.
          </li>
        </ul>
      </section>

      {/* Enterprise Controls — governance, audit, and compliance surfaces. */}
      <section className="mt-5" aria-labelledby="enterprise-controls-heading">
        <h3 id="enterprise-controls-heading" className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Enterprise Controls
        </h3>
        <p className="mb-2 max-w-3xl text-xs text-neutral-500 dark:text-neutral-400">
          Governance, audit, and compliance tooling. Enable extended and advanced links in the sidebar to expose the full
          surface.
        </p>
        <ul className="m-0 max-w-3xl list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          <li>
            <Link href="/governance/dashboard" className="text-teal-800 underline dark:text-teal-300">
              Governance dashboard
            </Link>
            {" · "}
            <Link href="/policy-packs" className="text-teal-800 underline dark:text-teal-300">
              Policy packs
            </Link>
            {" · "}
            <Link href="/governance-resolution" className="text-teal-800 underline dark:text-teal-300">
              Governance resolution
            </Link>{" "}
            — approval workflows, segregation of duties, and effective policy.
          </li>
          <li>
            <Link href="/alerts" className="text-teal-800 underline dark:text-teal-300">
              Alerts
            </Link>
            {" · "}
            <Link href="/audit" className="text-teal-800 underline dark:text-teal-300">
              Audit log
            </Link>{" "}
            — compliance alerts and append-only audit trail export.
          </li>
        </ul>
      </section>
    </main>
    </OperatorHomeGate>
  );
}
