import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { SHOWCASE_STATIC_DEMO_MANIFEST_ID } from "@/lib/showcase-static-demo";

type HealthcareClaimsPolicyPackDetailProps = {
  readonly policyPackId: string;
};

/**
 * Sponsor-grade Healthcare Claims pack narrative aligned with the Claims Intake modernization sample review.
 */
export function HealthcareClaimsPolicyPackDetail(props: HealthcareClaimsPolicyPackDetailProps) {
  const { policyPackId } = props;

  const canonicalPackLabel = policyPackBuyerLabel("healthcare-claims-v3", "3.4.1");

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="space-y-3 border-b border-neutral-200 pb-6 dark:border-neutral-800">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
          Active policy pack
        </p>
        <h1 className="m-0 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{canonicalPackLabel}</h1>
        <p className="m-0 max-w-prose text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          This pack encodes PHI minimization, audit-friendly artifact retention, and segregation expectations for regulated
          intake paths — matching the Claims Intake showcase review referenced from Governance and Manifest surfaces.
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Healthcare vertical</Badge>
          <Badge variant="outline">HIPAA-aligned intake posture</Badge>
          <Badge variant="outline">Demonstration rule-set v3.4.1</Badge>
        </div>
        <p className="m-0 font-mono text-xs text-neutral-500 dark:text-neutral-400">Pack reference id: {policyPackId}</p>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50">What sponsors see first</h2>
        <ul className="m-0 mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          <li>Explicit minimization checks where identifiers cross trust boundaries (mirrors the PHI finding storyline).</li>
          <li>Required evidence artifacts for regulators — manifests, graph excerpts, and governance approvals stay linked.</li>
          <li>Operational drift hooks when unstructured attachments spike risk (Alerts ties back to the sample intake graph).</li>
        </ul>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50">Rule families inside this pack</h2>
        <dl className="m-0 mt-4 grid gap-4 text-sm text-neutral-800 dark:text-neutral-200">
          <div>
            <dt className="font-semibold text-neutral-900 dark:text-neutral-50">Identity &amp; lineage</dt>
            <dd className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">
              Tie findings to manifest versions and governance approvals so remediation retains provenance.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-900 dark:text-neutral-50">Data minimization</dt>
            <dd className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">
              Prompts reviewers when PHI-bearing fields persist beyond necessary retention windows on intake APIs.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-900 dark:text-neutral-50">Operational readiness</dt>
            <dd className="m-0 mt-1 text-neutral-600 dark:text-neutral-400">
              Aligns monitoring hooks with drift alerts — visible on the sample Alerts inbox deep-linked to the PHI finding.
            </dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link href={`/manifests/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`}>Open Claims Intake manifest</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/policy-packs">Compare against registry catalog</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/governance">Continue governance workflow</Link>
        </Button>
      </section>

      <Collapsible>
        <CollapsibleTrigger className="text-sm font-medium text-teal-800 underline dark:text-teal-300">
          Technical identifiers &amp; lifecycle metadata
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
          <p className="m-0">
            Rule-set id <span className="font-mono">healthcare-claims-v3</span> · Effective demonstration version{" "}
            <span className="font-mono">3.4.1</span>
          </p>
          <p className="m-0">
            Governance approvals recorded against manifest hash shown on the finalized Claims Intake package — cross-check the
            Governance tab for promotion readiness.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </main>
  );
}
