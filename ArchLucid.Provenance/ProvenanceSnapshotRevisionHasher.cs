using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Artifacts;
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
        Guid findingsContextSnapshotId = input.Findings.ContextSnapshotId;
        Guid findingsGraphSnapshotId = input.Findings.GraphSnapshotId;
        string findingsFingerprint = ComputeFindingsFingerprint(input.Findings);
        Guid graphSnapshotId = input.Graph.GraphSnapshotId;
        Guid graphContextSnapshotId = input.Graph.ContextSnapshotId;
        string graphFingerprint = ComputeGraphFingerprint(input.Graph);
        Guid manifestId = input.Manifest.ManifestId;
        Guid manifestContextSnapshotId = input.Manifest.ContextSnapshotId;
        Guid manifestGraphSnapshotId = input.Manifest.GraphSnapshotId;
        Guid manifestFindingsSnapshotId = input.Manifest.FindingsSnapshotId;
        Guid manifestDecisionTraceId = input.Manifest.DecisionTraceId;
        Guid manifestArchitectureVersionId = input.Manifest.ArchitectureVersionId ?? Guid.Empty;
        string manifestRuleSetId = (input.Manifest.RuleSetId ?? string.Empty).Trim();
        string manifestHash = (input.Manifest.ManifestHash ?? string.Empty).Trim();
        string manifestDecisionsFingerprint = ComputeManifestDecisionsFingerprint(input.Manifest);
        Guid decisionTraceId = ResolveDecisionTraceId(input.DecisionTrace);
        Guid traceRunId = ResolveTraceRunId(input.DecisionTrace);
        string appliedRuleIdsFingerprint = ComputeAppliedRuleIdsFingerprint(input.DecisionTrace);
        Guid bundleId = artifactBundleId ?? Guid.Empty;
        string artifactsFingerprint = ComputeArtifactsFingerprint(input.Artifacts);

        string canonical =
            FormattableString.Invariant(
                $"{input.RunId:D}|{input.Findings.RunId:D}|{input.Graph.RunId:D}|{input.Manifest.RunId:D}|{traceRunId:D}|{findingsSnapshotId:D}|{findingsContextSnapshotId:D}|{findingsGraphSnapshotId:D}|{findingsFingerprint}|{graphSnapshotId:D}|{graphContextSnapshotId:D}|{graphFingerprint}|{manifestId:D}|{manifestContextSnapshotId:D}|{manifestGraphSnapshotId:D}|{manifestFindingsSnapshotId:D}|{manifestDecisionTraceId:D}|{manifestArchitectureVersionId:D}|{manifestRuleSetId}|{manifestHash}|{manifestDecisionsFingerprint}|{decisionTraceId:D}|{appliedRuleIdsFingerprint}|{bundleId:D}|{artifactsFingerprint}");

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
                    string label = SelectLastNonEmptyGraphField(group, static node => node.Label);
                    string nodeType = SelectLastNonEmptyGraphField(group, static node => node.NodeType);
                    string category = SelectLastNonEmptyGraphField(group, static node => node.Category);

                    return $"{group.Key}|{label}|{nodeType}|{category}";
                }));

        IEnumerable<string> edgeParts = graph.Edges
            .Select(static edge =>
                $"{edge.FromNodeId.Trim()}|{edge.ToNodeId.Trim()}|{(edge.EdgeType ?? string.Empty).Trim()}")
            .Distinct(StringComparer.OrdinalIgnoreCase)
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
                string supportingFindingIds = string.Join(
                    ",",
                    group.SelectMany(decision => decision.SupportingFindingIds)
                        .Select(static findingId => findingId.Trim())
                        .Where(static findingId => findingId.Length > 0)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(static findingId => findingId, StringComparer.OrdinalIgnoreCase));

                string title = SelectLastNonEmptyManifestDecisionField(group, static decision => decision.Title);
                string category = SelectLastNonEmptyManifestDecisionField(group, static decision => decision.Category);

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
                string relatedNodeIds = string.Join(
                    ",",
                    group.SelectMany(finding => finding.RelatedNodeIds)
                        .Select(static nodeId => nodeId.Trim())
                        .Where(static nodeId => nodeId.Length > 0)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(static nodeId => nodeId, StringComparer.OrdinalIgnoreCase));

                string title = SelectLastNonEmptyFindingField(group, static finding => finding.Title);
                string findingType = SelectLastNonEmptyFindingField(group, static finding => finding.FindingType);
                string category = SelectLastNonEmptyFindingField(group, static finding => finding.Category);
                string agentExecutionTraceId = group
                    .Select(ResolveAgentExecutionTraceId)
                    .Where(static traceId => traceId.Length > 0)
                    .LastOrDefault() ?? string.Empty;

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

    private static string SelectLastNonEmptyFindingField(
        IGrouping<string, Finding> group,
        Func<Finding, string?> selector)
    {
        return group
            .Select(selector)
            .Select(static value => (value ?? string.Empty).Trim())
            .LastOrDefault(static value => value.Length > 0) ?? string.Empty;
    }

    private static string SelectLastNonEmptyGraphField(
        IGrouping<string, GraphNode> group,
        Func<GraphNode, string?> selector)
    {
        return group
            .Select(selector)
            .Select(static value => (value ?? string.Empty).Trim())
            .LastOrDefault(static value => value.Length > 0) ?? string.Empty;
    }

    private static string SelectLastNonEmptyManifestDecisionField(
        IGrouping<string, ResolvedArchitectureDecision> group,
        Func<ResolvedArchitectureDecision, string?> selector)
    {
        return group
            .Select(selector)
            .Select(static value => (value ?? string.Empty).Trim())
            .LastOrDefault(static value => value.Length > 0) ?? string.Empty;
    }

    private static string SelectLastNonEmptyArtifactField(
        IGrouping<Guid, SynthesizedArtifact> group,
        Func<SynthesizedArtifact, string?> selector)
    {
        return group
            .Select(selector)
            .Select(static value => (value ?? string.Empty).Trim())
            .LastOrDefault(static value => value.Length > 0) ?? string.Empty;
    }

    private static string ComputeArtifactsFingerprint(IReadOnlyList<SynthesizedArtifact> artifacts)
    {
        if (artifacts.Count == 0)
            return string.Empty;

        IEnumerable<string> parts = artifacts
            .GroupBy(static artifact => artifact.ArtifactId)
            .OrderBy(static group => group.Key)
            .Select(group =>
            {
                SynthesizedArtifact representative = SelectRevisionArtifactRepresentative(group);

                string contributingDecisionIds = string.Join(
                    ",",
                    group.SelectMany(static artifact => artifact.ContributingDecisionIds)
                        .Select(static decisionId => decisionId.Trim())
                        .Where(static decisionId => decisionId.Length > 0)
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .OrderBy(static decisionId => decisionId, StringComparer.OrdinalIgnoreCase));

                string name = SelectLastNonEmptyArtifactField(group, static artifact => artifact.Name);
                string artifactType = SelectLastNonEmptyArtifactField(group, static artifact => artifact.ArtifactType);
                string format = SelectLastNonEmptyArtifactField(group, static artifact => artifact.Format);

                string contentHash = (representative.ContentHash ?? string.Empty).Trim();

                return $"{group.Key:N}|{contentHash}|{contributingDecisionIds}|{name}|{artifactType}|{format}";
            });

        return string.Join(";", parts);
    }

    internal static SynthesizedArtifact SelectRevisionArtifactRepresentative(
        IEnumerable<SynthesizedArtifact> artifactsWithSameId)
    {
        List<SynthesizedArtifact> rows = artifactsWithSameId.ToList();

        IEnumerable<string> distinctHashes = rows
            .Select(static artifact => artifact.ContentHash ?? string.Empty)
            .Distinct(StringComparer.Ordinal);

        if (distinctHashes.Skip(1).Any())
        {
            return rows
                .OrderByDescending(static artifact => artifact.ContentHash ?? string.Empty, StringComparer.Ordinal)
                .First();
        }

        return rows[^1];
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
