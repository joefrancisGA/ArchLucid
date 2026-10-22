using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Core.Artifacts;

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
        Guid manifestId = input.Manifest.ManifestId;
        string manifestHash = input.Manifest.ManifestHash ?? string.Empty;
        Guid decisionTraceId = ResolveDecisionTraceId(input.DecisionTrace);
        string appliedRuleIdsFingerprint = ComputeAppliedRuleIdsFingerprint(input.DecisionTrace);
        Guid bundleId = artifactBundleId ?? Guid.Empty;
        string artifactsFingerprint = ComputeArtifactsFingerprint(input.Artifacts);

        string canonical =
            FormattableString.Invariant(
                $"{input.RunId:D}|{findingsSnapshotId:D}|{findingsFingerprint}|{graphSnapshotId:D}|{manifestId:D}|{manifestHash}|{decisionTraceId:D}|{appliedRuleIdsFingerprint}|{bundleId:D}|{artifactsFingerprint}");

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));

        return Convert.ToHexString(hash).ToLowerInvariant();
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

                return $"{group.Key}|{relatedNodeIds}";
            });

        return string.Join(";", parts);
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

                return $"{artifact.ArtifactId:N}|{artifact.ContentHash ?? string.Empty}|{contributingDecisionIds}";
            });

        return string.Join(";", parts);
    }

    private static Guid ResolveDecisionTraceId(DecisionTraceDto trace)
    {
        if (trace is RuleAuditTraceDto ruleAudit)
            return ruleAudit.RuleAudit.DecisionTraceId;

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
