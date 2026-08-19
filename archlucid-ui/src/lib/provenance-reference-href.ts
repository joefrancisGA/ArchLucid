import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { signedRecordArtifactPath, signedRecordDetailPath } from "@/lib/signed-records-paths";
import { getFindingEvidenceTraceHref } from "@/lib/findings/finding-evidence-navigation";
import type { ArchitectureLinkageNode } from "@/types/architecture-provenance";

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function encodeRunPath(runId: string): string {
  return encodeURIComponent(runId.trim());
}

function goldenManifestIdFromNodes(nodes: readonly ArchitectureLinkageNode[]): string | null {
  const golden = nodes.find((node) => node.type === "GoldenManifest");

  if (golden === undefined) {
    return null;
  }

  const referenceId = golden.referenceId.trim();

  return referenceId.length > 0 ? referenceId : null;
}

function nodeHref(
  runId: string,
  node: ArchitectureLinkageNode,
  nodes: readonly ArchitectureLinkageNode[],
  manifestId: string | null,
): string | null {
  switch (node.type) {
    case "ArchitectureRun":
      return `/architecture/reviews/${encodeRunPath(runId)}`;

    case "GoldenManifest":
      return signedRecordDetailPath(node.referenceId);

    case "Finding":
      return getFindingEvidenceTraceHref(runId, node.referenceId);

    case "PolicyPack":
      return `/governance/policy-packs/${encodeURIComponent(node.referenceId)}`;

    case "DecisionRule": {
      const packNode = nodes.find((candidate) => candidate.type === "PolicyPack");

      if (packNode !== undefined) {
        return `/governance/policy-packs/${encodeURIComponent(packNode.referenceId)}`;
      }

      return null;
    }

    case "EvidenceArtifact":
    case "Artifact": {
      if (manifestId !== null) {
        return signedRecordArtifactPath(manifestId, node.referenceId);
      }

      return `/architecture/reviews/${encodeRunPath(runId)}#artifacts-exports`;
    }

    case "GraphSnapshot":
      return evidenceGraphHref({ runId });

    case "FindingsSnapshot":
      return `/architecture/reviews/${encodeRunPath(runId)}#findings-queue`;

    default:
      return `#prov-node-row-${encodeURIComponent(node.id)}`;
  }
}

/** Resolves a provenance timeline or node reference id to an in-app navigation target when possible. */
export function provenanceReferenceHref(
  runId: string,
  referenceId: string | null | undefined,
  nodes: readonly ArchitectureLinkageNode[],
): string | null {
  const ref = referenceId?.trim() ?? "";

  if (ref.length === 0) {
    return null;
  }

  const manifestId = goldenManifestIdFromNodes(nodes);
  const byReference = nodes.find((node) => node.referenceId === ref);

  if (byReference !== undefined) {
    return nodeHref(runId, byReference, nodes, manifestId);
  }

  const byId = nodes.find((node) => node.id === ref);

  if (byId !== undefined) {
    return nodeHref(runId, byId, nodes, manifestId);
  }

  if (GUID_RE.test(ref) && manifestId === ref) {
    return signedRecordDetailPath(ref);
  }

  return null;
}
