using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Artifacts;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.Provenance;

/// <summary>
///     Stable revision fingerprint for provenance snapshot freshness (manifest, findings, graph, trace, artifacts).
/// </summary>
public static class ProvenanceSnapshotRevisionHasher
{
    /// <summary>Computes a lowercase hex SHA-256 over run artefact identity fields.</summary>
    public static string Compute(ProvenanceBuildInput input, Guid? artifactBundleId = null)
    {
        ArgumentNullException.ThrowIfNull(input);

        Guid findingsSnapshotId = input.Findings.FindingsSnapshotId;
        string findingsFingerprint = ComputeFindingsFingerprint(input.Findings);
        Guid graphSnapshotId = input.Graph.GraphSnapshotId;
        string graphFingerprint = ComputeGraphFingerprint(input.Graph);
        Guid manifestId = input.Manifest.ManifestId;
        string manifestHash = (input.Manifest.ManifestHash ?? string.Empty).Trim();
        string manifestDecisionsFingerprint = ComputeManifestDecisionsFingerprint(input.Manifest);
        Guid decisionTraceId = ResolveDecisionTraceId(input.DecisionTrace);
        Guid traceRunId = ResolveTraceRunId(input.DecisionTrace);
        string appliedRuleIdsFingerprint = ComputeAppliedRuleIdsFingerprint(input.DecisionTrace);
        Guid bundleId = artifactBundleId ?? Guid.Empty;
        string artifactsFingerprint = ComputeArtifactsFingerprint(input.Artifacts);

        string canonical =
            FormattableString.Invariant(
                $"{input.RunId:D}|{input.Findings.RunId:D}|{input.Graph.RunId:D}|{input.Manifest.RunId:D}|{traceRunId:D}|{findingsSnapshotId:D}|{findingsFingerprint}|{graphSnapshotId:D}|{graphFingerprint}|{manifestId:D}|{manifestHash}|{manifestDecisionsFingerprint}|{decisionTraceId:D}|{appliedRuleIdsFingerprint}|{bundleId:D}|{artifactsFingerprint}");

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string ComputeGraphFingerprint(GraphSnapshot graph)
    {
        if (graph.Nodes.Count == 0 && graph.Edges.Count == 0)
            return string.Empty;

        string nodeParts = string.Join(
            ",",
            graph.Nodes
                .Where(static node => !string.IsNullOrWhiteSpace(node.NodeId))
                .GroupBy(
                    static node => node.NodeId.Trim(),
                    StringComparer.OrdinalIgnoreCase)
                .OrderBy(static group => group.Key, StringComparer.OrdinalIgnoreCase)
                .Select(static group =>
                {
                    GraphNode representative = group.First();
                    string label = (representative.Label ?? string.Empty).Trim();
                    string nodeType = (representative.NodeType ?? string.Empty).Trim();
                    string category = (representative.Category ?? string.Empty).Trim();

                    return $"{group.Key}|{label}|{nodeType}|{category}";
                }));

        IEnumerable<string> edgeParts = graph.Edges
            .Select(static edge =>
                $"{edge.FromNodeId.Trim()}|{edge.ToNodeId.Trim()}|{edge.EdgeType}")
            .OrderBy(static part => part, StringComparer.OrdinalIgnoreCase);

        string edges = string.Join(";", edgeParts);

        return $"{nodeParts}|{edges}";
    }

    private static string ComputeManifestDecisionsFingerprint(ManifestDocument manifest)
    {
        if (manifest.Decisions.Count == 0)
            return string.Empty;

        IEnumerable<string> parts = manifest.Decisions
            .GroupBy(
                decision => (decision.DecisionId ?? string.Empty).Trim(),
                StringComparer.OrdinalIgnoreCase)
            .OrderBy(group => group.Key, StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                ResolvedArchitectureDecision representative = group.First();

                string supportingFindingIds = string.Join(
                    ",",
                    group.SelectMany(decision => decision.SupportingFindingIds)
                        .Select(static findingId => findingId.Trim())
                        .Where(static findingId => findingId.Length > 0)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(static findingId => findingId, StringComparer.OrdinalIgnoreCase));

                string title = (representative.Title ?? string.Empty).Trim();
                string category = (representative.Category ?? string.Empty).Trim();

                return $"{group.Key}|{supportingFindingIds}|{title}|{category}";
            });

        return string.Join(";", parts);
    }

    private static string ComputeFindingsFingerprint(FindingsSnapshot findings)
    {
        if (findings.Findings.Count == 0)
            return string.Empty;

        IEnumerable<string> parts = findings.Findings
            .GroupBy(
                finding => (finding.FindingId ?? string.Empty).Trim(),
                StringComparer.OrdinalIgnoreCase)
            .OrderBy(group => group.Key, StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                Finding representative = group.First();

                string relatedNodeIds = string.Join(
                    ",",
                    group.SelectMany(finding => finding.RelatedNodeIds)
                        .Select(static nodeId => nodeId.Trim())
                        .Where(static nodeId => nodeId.Length > 0)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(static nodeId => nodeId, StringComparer.OrdinalIgnoreCase));

                string title = (representative.Title ?? string.Empty).Trim();
                string findingType = (representative.FindingType ?? string.Empty).Trim();
                string category = (representative.Category ?? string.Empty).Trim();
                string agentExecutionTraceId = ResolveAgentExecutionTraceId(representative);

                return $"{group.Key}|{relatedNodeIds}|{title}|{findingType}|{category}|{agentExecutionTraceId}";
            });

        return string.Join(";", parts);
    }

    private static string ResolveAgentExecutionTraceId(Finding finding)
    {
        if (!string.IsNullOrWhiteSpace(finding.AgentExecutionTraceId))
            return finding.AgentExecutionTraceId.Trim();

        return finding.Trace?.SourceAgentExecutionTraceId?.Trim() ?? string.Empty;
    }

    private static string ComputeArtifactsFingerprint(IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        if (artifacts.Count == 0)
            return string.Empty;

        IEnumerable<string> parts = SynthesizedArtifactBundleCanonicalizer
            .DistinctByArtifactId(artifacts)
            .OrderBy(static artifact => artifact.ArtifactId)
            .Select(static artifact =>
            {
                string contributingDecisionIds = string.Join(
                    ",",
                    artifact.ContributingDecisionIds
                        .Select(static decisionId => decisionId.Trim())
                        .Where(static decisionId => decisionId.Length > 0)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(static decisionId => decisionId, StringComparer.OrdinalIgnoreCase));

                string name = (artifact.Name ?? string.Empty).Trim();
                string artifactType = (artifact.ArtifactType ?? string.Empty).Trim();
                string format = (artifact.Format ?? string.Empty).Trim();

                string contentHash = (artifact.ContentHash ?? string.Empty).Trim();

                return $"{artifact.ArtifactId:N}|{contentHash}|{contributingDecisionIds}|{name}|{artifactType}|{format}";
            });

        return string.Join(";", parts);
    }

    private static Guid ResolveDecisionTraceId(DecisionTraceDto trace)
    {
        if (trace is RuleAuditTraceDto ruleAudit)
            return ruleAudit.RuleAudit.DecisionTraceId;

        return Guid.Empty;
    }

    private static Guid ResolveTraceRunId(DecisionTraceDto trace)
    {
        if (trace is RuleAuditTraceDto ruleAudit)
            return ruleAudit.RuleAudit.RunId;

        return Guid.Empty;
    }

    private static string ComputeAppliedRuleIdsFingerprint(DecisionTraceDto trace)
    {
        if (trace is not RuleAuditTraceDto ruleAudit)
            return string.Empty;

        IEnumerable<string> parts = ruleAudit.RuleAudit.AppliedRuleIds
            .Select(static ruleId => ruleId.Trim())
            .Where(static ruleId => ruleId.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static ruleId => ruleId, StringComparer.OrdinalIgnoreCase);

        return string.Join(";", parts);
    }
}
