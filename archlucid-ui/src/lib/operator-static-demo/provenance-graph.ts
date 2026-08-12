import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import {
  getShowcaseStaticDemoPayload,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
} from "@/lib/showcase-static-demo";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";

import {
  isDemoRunIdEligibleForStaticFallback,
  isShowcaseSpineStaticPayloadActiveForRun,
} from "./eligibility";

/** Curated linkage graph aligned with Claims Intake static showcase payloads (demo static operator mode only). */
export function buildStaticDemoProvenanceGraphFromShowcase(urlRunId: string): ArchitectureRunProvenanceGraph {

  const d = getShowcaseStaticDemoPayload(urlRunId);

  const rid = d.run.runId;

  const manifest = d.manifest;

  const chain = d.authorityChain;

  const ctxReferenceId = chain.contextSnapshotId ?? "ctx-demo";
  const graphReferenceId = chain.graphSnapshotId ?? "graph-demo";
  const findingsReferenceId = chain.findingsSnapshotId ?? "find-demo";
  const bundleReferenceId = chain.artifactBundleId ?? "bundle-demo";
  const manifestReferenceId = manifest.manifestId;

  const timelineReferenceIdForEvent = (eventType: string): string | null => {
    switch (eventType) {
      case "RunStarted":
        return rid;

      case "context.snapshot.created":
        return ctxReferenceId;

      case "graph.snapshot.created":
        return graphReferenceId;

      case "findings.snapshot.created":
        return findingsReferenceId;

      case "finalize.run":
        return manifestReferenceId;

      case "com.archlucid.governance.approval.recorded":
        return "audit-claims-intake-001";

      case "artifact.bundle.created":
        return bundleReferenceId;

      default:
        return null;
    }
  };

  const timeline = d.pipelineTimeline.map((row) => ({
    timestampUtc: row.occurredUtc,
    kind: row.eventType,
    label: pipelineEventTypeFriendlyLabel(row.eventType),
    referenceId: timelineReferenceIdForEvent(row.eventType),
  }));

  return {

    runId: rid,

    nodes: [

      { id: "n-run", type: "ArchitectureRun", referenceId: rid, name: "Review started" },

      {

        id: "n-ctx",

        type: "ContextSnapshot",

        referenceId: chain.contextSnapshotId ?? "ctx-demo",

        name: "Source context reviewed",

      },

      {

        id: "n-policy",

        type: "PolicyPack",

        referenceId: "demo-healthcare-claims-pack",

        name: policyPackBuyerLabel("healthcare-claims-v3", "3.4.1"),

      },

      {

        id: "n-rule",

        type: "DecisionRule",

        referenceId: "phi.minimization.intake",

        name: "PHI minimization at intake",

      },

      {

        id: "n-graph",

        type: "GraphSnapshot",

        referenceId: chain.graphSnapshotId ?? "graph-demo",

        name: "Evidence trail created",

      },

      {

        id: "n-evidence",

        type: "EvidenceArtifact",

        referenceId: "intake-subgraph-v2",

        name: "Intake subgraph evidence",

      },

      {

        id: "n-find",

        type: "FindingsSnapshot",

        referenceId: chain.findingsSnapshotId ?? "find-demo",

        name: "Findings identified",

      },

      {
        id: "n-phi",
        type: "Finding",
        referenceId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
        name: "PHI minimization risk (monitored)",
      },

      {

        id: "n-control",

        type: "Control",

        referenceId: "ingress-classifier",

        name: "Ingress PHI classification control",

      },

      {

        id: "n-reviewer",

        type: "Reviewer",

        referenceId: "jordan-lee",

        name: "Jordan Lee — Architecture approver",

      },

      {

        id: "n-monitor",

        type: "Monitor",

        referenceId: "exception-volume-weekly",

        name: "Weekly exception-volume monitoring",

      },

      {

        id: "n-manifest",

        type: "GoldenManifest",

        referenceId: manifest.manifestId,

        name: "Signed decision record finalized",

      },

      {

        id: "n-audit",

        type: "AuditEvent",

        referenceId: "audit-claims-intake-001",

        name: "Governance approval recorded",

      },

      {

        id: "n-bundle",

        type: "ArtifactBundle",

        referenceId: chain.artifactBundleId ?? "bundle-demo",

        name: "Evidence bundle assembled",

      },

      {

        id: "n-owner",

        type: "RiskOwner",

        referenceId: "taylor-morgan",

        name: "Taylor Morgan — Residual risk owner",

      },

    ],

    edges: [

      { id: "e-run-ctx", type: "produced", fromNodeId: "n-run", toNodeId: "n-ctx" },

      { id: "e-ctx-policy", type: "evaluated against", fromNodeId: "n-ctx", toNodeId: "n-policy" },

      { id: "e-policy-rule", type: "defines", fromNodeId: "n-policy", toNodeId: "n-rule" },

      { id: "e-rule-graph", type: "applied in", fromNodeId: "n-rule", toNodeId: "n-graph" },

      { id: "e-graph-evidence", type: "cites", fromNodeId: "n-graph", toNodeId: "n-evidence" },

      { id: "e-evidence-find", type: "supports", fromNodeId: "n-evidence", toNodeId: "n-find" },

      { id: "e-find-phi", type: "raised", fromNodeId: "n-find", toNodeId: "n-phi" },

      { id: "e-phi-control", type: "mitigated by", fromNodeId: "n-phi", toNodeId: "n-control" },

      { id: "e-control-reviewer", type: "reviewed by", fromNodeId: "n-control", toNodeId: "n-reviewer" },

      { id: "e-phi-monitor", type: "monitored via", fromNodeId: "n-phi", toNodeId: "n-monitor" },

      { id: "e-monitor-owner", type: "owned by", fromNodeId: "n-monitor", toNodeId: "n-owner" },

      { id: "e-phi-manifest", type: "recorded in", fromNodeId: "n-phi", toNodeId: "n-manifest" },

      { id: "e-reviewer-audit", type: "recorded in", fromNodeId: "n-reviewer", toNodeId: "n-audit" },

      { id: "e-manifest-audit", type: "finalized in", fromNodeId: "n-manifest", toNodeId: "n-audit" },

      { id: "e-manifest-bundle", type: "packaged", fromNodeId: "n-manifest", toNodeId: "n-bundle" },

    ],

    timeline,

    traceabilityGaps: [],

  };

}

export function tryStaticDemoProvenanceGraph(runId: string): ArchitectureRunProvenanceGraph | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return buildStaticDemoProvenanceGraphFromShowcase(effectiveRunId);
}
