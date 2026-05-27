import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { RunTrustEvidenceCard } from "@/types/authority";

function proxyApiPath(path: string): string {
  if (path.startsWith("/v1/")) {
    return `/api/proxy${path}`;
  }

  return path;
}

function statusClass(status: string): string {
  const key = status.trim().toLowerCase();

  if (key === "available") {
    return "bg-emerald-100 text-emerald-950 dark:bg-emerald-900/35 dark:text-emerald-100";
  }

  if (key === "missing") {
    return "bg-amber-100 text-amber-950 dark:bg-amber-900/35 dark:text-amber-100";
  }

  if (key === "demo-only") {
    return "bg-violet-100 text-violet-950 dark:bg-violet-900/35 dark:text-violet-100";
  }

  if (key === "low confidence") {
    return "bg-orange-100 text-orange-950 dark:bg-orange-900/35 dark:text-orange-100";
  }

  if (key === "not applicable") {
    return "bg-neutral-200 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100";
  }

  return "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100";
}

function FieldRow(props: {
  readonly title: string;
  readonly status: string;
  readonly detail?: string | null;
}): ReactElement {
  const { title, status, detail } = props;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white/60 p-3 dark:border-neutral-700 dark:bg-neutral-900/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{title}</div>
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusClass(status)}`}>{status}</span>
      </div>
      {detail ? (
        <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{detail}</p>
      ) : null}
    </div>
  );
}

/** Committed-run evidence summary: manifest/audit/traces/export posture (no CPA / pen-test / legal claims). */
export function RunTrustEvidenceCardSection(props: {
  readonly card: RunTrustEvidenceCard;
  readonly evidenceAskRunId?: string | null;
}): ReactElement {
  const { card, evidenceAskRunId } = props;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const trimmedAskRun =
    buyerPolishedShell && typeof evidenceAskRunId === "string" ? evidenceAskRunId.trim() : "";

  const rows: ReactElement[] = [
    <FieldRow
      key="execution"
      title={card.executionMode.title}
      status={card.executionMode.status}
      detail={card.executionMode.detail}
    />,
    <FieldRow
      key="manifest"
      title={card.goldenManifest.title}
      status={card.goldenManifest.status}
      detail={card.goldenManifest.detail}
    />,
    <FieldRow
      key="audit"
      title={card.auditTrail.title}
      status={card.auditTrail.status}
      detail={card.auditTrail.detail}
    />,
    <FieldRow
      key="traces"
      title={card.agentTraces.title}
      status={card.agentTraces.status}
      detail={card.agentTraces.detail}
    />,
    <FieldRow
      key="bundle"
      title={card.artifactBundlePointer.title}
      status={card.artifactBundlePointer.status}
      detail={card.artifactBundlePointer.detail}
    />,
    <FieldRow
      key="zip"
      title={card.traceabilityExport.title}
      status={card.traceabilityExport.status}
      detail={card.traceabilityExport.detail}
    />,
    <FieldRow
      key="ai"
      title={card.aiExplainability.title}
      status={card.aiExplainability.status}
      detail={card.aiExplainability.detail}
    />,
  ];

  return (
    <section id="trust-evidence" className="scroll-mt-24">
      <Card>
        <CardHeader>
          <h3 className="m-0 text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            {buyerPolishedShell ? "Evidence basis" : "Evidence basis (operational)"}
          </h3>
          <CardDescription className="text-neutral-600 dark:text-neutral-400">
            {card.selfAttestationNotice}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">{rows}</div>

          {trimmedAskRun.length > 0 ? (
            <div
              className="rounded-lg border border-blue-200/80 bg-blue-50/50 p-4 dark:border-blue-950/55 dark:bg-blue-950/25"
              data-testid="trust-evidence-ask-promotion"
            >
              <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                Ask evidence-backed questions about this review
              </p>
              <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                Answers reference this review&apos;s persisted summary, manifest, and cited evidence where your workspace
                allows.
              </p>
              <div className="mt-3">
                <Button variant="primary" size="sm" asChild>
                  <Link href={`/ask?runId=${encodeURIComponent(trimmedAskRun)}`}>Ask about this review</Link>
                </Button>
              </div>
            </div>
          ) : null}

          {card.topFinding ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-700 dark:bg-neutral-900/50">
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Top finding evidence (severity-first)
              </div>
              <p className="m-0 mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                <span className="font-mono text-xs">{card.topFinding.findingId}</span>
                {card.topFinding.title ? ` — ${card.topFinding.title}` : ""}
              </p>
              <p className="m-0 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Trace completeness: <strong>{card.topFinding.traceCompletenessLabel}</strong>
              </p>
              <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {card.topFinding.evidencePointersSummary}
              </p>
            </div>
          ) : null}

          <div>
            {buyerPolishedShell ? (
              <CollapsibleSection title="Evidence API endpoints (advanced)" defaultOpen={false}>
                <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-sm text-teal-800 dark:text-teal-300">
                  {card.links.map((l) => (
                    <li key={l.rel}>
                      <Link className="underline" href={proxyApiPath(l.path)}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            ) : (
              <>
                <div className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Evidence routes</div>
                <ul className="m-0 mt-2 list-disc space-y-1 pl-5 text-sm text-teal-800 dark:text-teal-300">
                  {card.links.map((l) => (
                    <li key={l.rel}>
                      <Link className="underline" href={proxyApiPath(l.path)}>
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
