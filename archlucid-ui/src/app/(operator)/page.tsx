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
        Start with the <strong>Core Pilot path</strong>: create a run, commit the manifest, and review artifacts.
        Compare, replay, graph, and advanced features are available once you have a committed run.
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

      {/* Secondary — available once the Core Pilot path is complete. Graph requires "Show more links" in the sidebar. */}
      <section className="mt-6" aria-labelledby="explore-further-heading">
        <h3 id="explore-further-heading" className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Explore further (once you have a committed run)
        </h3>
        <ul className="m-0 max-w-3xl list-disc space-y-1 pl-5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          <li>
            <Link href="/compare" className="text-teal-800 underline dark:text-teal-300">
              Compare two runs
            </Link>
            {" · "}
            <Link href="/replay" className="text-teal-800 underline dark:text-teal-300">
              Replay a run
            </Link>{" "}
            — structured diff and authority-chain validation.
          </li>
          <li>
            <Link href="/graph" className="text-teal-800 underline dark:text-teal-300">
              Graph
            </Link>{" "}
            — provenance or architecture graph for a run ID (enable via <em>Show more links</em> in the sidebar).
          </li>
          <li>
            Ask, search, advisory,{" "}
            <Link href="/planning" className="text-teal-800 underline dark:text-teal-300">
              planning
            </Link>
            , pilot feedback, alerts, and policy tools — use the sidebar groups.
          </li>
        </ul>
      </section>
    </main>
    </OperatorHomeGate>
  );
}
