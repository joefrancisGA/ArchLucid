import Link from "next/link";
import type { JSX } from "react";

import { ArchitectureNarrativeMarkdownView } from "@/components/architecture/ArchitectureNarrativeMarkdownView";
import { MARKETING_LAYOUT } from "@/lib/design-tokens";
import type { ExecDigestSponsorDeepLinkView } from "@/lib/digest/exec-digest-sponsor-deep-link-server";
import { cn } from "@/lib/utils";

type ExecDigestSponsorDeepLinkViewProps = {
  readonly view: ExecDigestSponsorDeepLinkView;
};

export function ExecDigestSponsorDeepLinkPanel(props: ExecDigestSponsorDeepLinkViewProps): JSX.Element {
  const { view } = props;
  const isRunCollateral = view.target === "run-collateral";

  return (
    <main className={cn("mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6", MARKETING_LAYOUT.page)}>
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-al-text-secondary">
          Weekly sponsor digest
        </p>
        <h1 className="text-2xl font-semibold text-al-text-primary">
          {isRunCollateral ? "Sponsor collateral" : "Sponsor digest overview"}
        </h1>
        <p className="text-sm text-al-text-secondary">{view.weekLabel}</p>
      </header>

      <p className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900">
        Read-only link from your weekly digest email. Sign in for the full architect workspace.
      </p>

      {isRunCollateral ? (
        <section className="space-y-4" data-testid="exec-digest-sponsor-run-collateral">
          {view.runSummaryMarkdown ? (
            <ArchitectureNarrativeMarkdownView markdown={view.runSummaryMarkdown} />
          ) : (
            <p className="text-sm text-al-text-secondary">No sponsor summary is available for this review.</p>
          )}
        </section>
      ) : (
        <section className="space-y-4" data-testid="exec-digest-sponsor-dashboard">
          {view.committedManifestsInWeek != null ? (
            <p className="text-sm text-al-text-primary">
              Architecture packages committed this period:{" "}
              <strong>{view.committedManifestsInWeek}</strong>
            </p>
          ) : null}

          {view.topRuns.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-al-text-primary">Highlighted reviews</h2>
              <ul className="space-y-2 text-sm text-al-text-secondary">
                {view.topRuns.map((run) => (
                  <li key={run.runIdHex} className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700">
                    <span className="font-mono text-xs text-al-text-secondary">{run.runIdHex}</span>
                    <span className="mx-2">·</span>
                    <span>score {run.significanceScore}</span>
                    {run.caption ? <span className="block pt-1 text-al-text-secondary">{run.caption}</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {view.findingsDeltaSummary ? (
            <p className="text-sm text-al-text-primary">{view.findingsDeltaSummary}</p>
          ) : null}

          {view.complianceDriftMarkdown ? (
            <ArchitectureNarrativeMarkdownView
              markdown={view.complianceDriftMarkdown}
              tableCaption="Compliance drift"
            />
          ) : null}

          {view.decisionNeededMarkdown ? (
            <ArchitectureNarrativeMarkdownView
              markdown={view.decisionNeededMarkdown}
              tableCaption="Decisions needed"
            />
          ) : null}
        </section>
      )}

      <p className="text-sm">
        <Link href={view.signInUrl} className="font-medium text-al-accent hover:underline">
          Sign in to open the full workspace
        </Link>
      </p>
    </main>
  );
}
