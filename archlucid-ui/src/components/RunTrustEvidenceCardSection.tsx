import Link from "next/link";
import type { ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { enterpriseStatusTagClass, operatorSemanticSurface } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import type { RunTrustEvidenceCard, RunTrustEvidenceRouteRef, TrustEvidenceFieldSnapshot } from "@/types/authority";

function proxyApiPath(path: string): string {
  if (path.startsWith("/v1/")) {
    return `/api/proxy${path}`;
  }

  return path;
}

function statusClass(status: string): string {
  const key = status.trim().toLowerCase();

  if (key === "available") {
    return enterpriseStatusTagClass("ready");
  }

  if (key === "missing") {
    return enterpriseStatusTagClass("needs-attention");
  }

  if (key === "demo-only") {
    return enterpriseStatusTagClass("in-progress");
  }

  if (key === "low confidence") {
    return enterpriseStatusTagClass("needs-attention");
  }

  if (key === "not applicable") {
    return enterpriseStatusTagClass("neutral");
  }

  return enterpriseStatusTagClass("neutral");
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

function linkByRel(links: readonly RunTrustEvidenceRouteRef[], rel: string): RunTrustEvidenceRouteRef | null {
  return links.find((link) => link.rel === rel) ?? null;
}

function proofStepTone(field: TrustEvidenceFieldSnapshot): string {
  const key = field.status.trim().toLowerCase();

  if (key === "available") {
    return operatorSemanticSurface("ready");
  }

  if (key === "demo-only") {
    return operatorSemanticSurface("info");
  }

  return operatorSemanticSurface("warn");
}

function ProofChainStep(props: {
  readonly index: number;
  readonly label: string;
  readonly field: TrustEvidenceFieldSnapshot;
  readonly href?: string | null;
  readonly linkLabel?: string;
}): ReactElement {
  const { index, label, field, href, linkLabel } = props;
  const unavailable = field.status.trim().toLowerCase() !== "available";

  return (
    <li className={`rounded-lg border p-3 ${proofStepTone(field)}`} data-testid={`proof-chain-step-${index}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Step {index}: {label}
          </p>
          <p className="m-0 mt-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">{field.title}</p>
        </div>
        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusClass(field.status)}`}>{field.status}</span>
      </div>
      {field.detail ? (
        <p className="m-0 mt-2 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">{field.detail}</p>
      ) : null}
      {href ? (
        <p className="m-0 mt-2 text-xs">
          <Link className="font-medium text-teal-800 underline dark:text-teal-200" href={proxyApiPath(href)}>
            {linkLabel ?? "Open supporting evidence"}
          </Link>
        </p>
      ) : unavailable ? (
        <p className="m-0 mt-2 text-xs font-medium text-amber-900 dark:text-amber-100">
          WARN: supporting link is missing; collect or regenerate proof before sponsor send.
        </p>
      ) : null}
    </li>
  );
}

function ProofChainView(props: { readonly card: RunTrustEvidenceCard }): ReactElement {
  const { card } = props;
  const evidenceLink = linkByRel(card.links, "evidence");
  const topFindingLink = linkByRel(card.links, "topFindingEvidenceChain");
  const traceabilityLink = linkByRel(card.links, "traceabilityZip");
  const tracesLink = linkByRel(card.links, "traces");

  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/45"
      data-testid="evidence-to-manifest-audit-proof-chain"
    >
      <div className="space-y-1">
        <h4 className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Evidence → finding → manifest → artifact → audit proof chain
        </h4>
        <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
          This chain shows why a committed ArchLucid review is stronger than a free-form AI answer: each sponsor-facing
          claim can point back to stored evidence, a finding, a committed manifest, an exportable artifact, and durable
          audit or trace metadata. It is not a legal attestation.
        </p>
      </div>
      <ol className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <ProofChainStep
          index={1}
          label="Evidence"
          field={card.aiExplainability}
          href={evidenceLink?.path}
          linkLabel={evidenceLink?.label}
        />
        <ProofChainStep
          index={2}
          label="Finding"
          field={{
            title: card.topFinding?.title ?? "Top finding evidence chain",
            status: card.topFinding ? "Available" : "Missing",
            detail: card.topFinding?.evidencePointersSummary ?? "No top finding evidence-chain pointer is available.",
          }}
          href={topFindingLink?.path}
          linkLabel={topFindingLink?.label}
        />
        <ProofChainStep index={3} label="Manifest" field={card.goldenManifest} />
        <ProofChainStep
          index={4}
          label="Artifact"
          field={card.artifactBundlePointer}
          href={traceabilityLink?.path}
          linkLabel={traceabilityLink?.label}
        />
        <ProofChainStep
          index={5}
          label="Audit"
          field={card.auditTrail.status.trim().toLowerCase() === "available" ? card.auditTrail : card.agentTraces}
          href={tracesLink?.path}
          linkLabel={tracesLink?.label}
        />
      </ol>
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

          <ProofChainView card={card} />

          {trimmedAskRun.length > 0 ? (
            <div
              className="rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
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
