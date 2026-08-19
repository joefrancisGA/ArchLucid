using System.Security.Cryptography;
using System.Text;

using ArchLucid.Contracts.Persistence.DecisionTraces;

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
        Guid graphSnapshotId = input.Graph.GraphSnapshotId;
        Guid manifestId = input.Manifest.ManifestId;
        Guid decisionTraceId = ResolveDecisionTraceId(input.DecisionTrace);
        Guid bundleId = artifactBundleId ?? Guid.Empty;

        string canonical =
            FormattableString.Invariant(
                $"{input.RunId:D}|{findingsSnapshotId:D}|{graphSnapshotId:D}|{manifestId:D}|{decisionTraceId:D}|{bundleId:D}");

        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(canonical));

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static Guid ResolveDecisionTraceId(DecisionTraceDto trace)
    {
        if (trace is RuleAuditTraceDto ruleAudit)
            return ruleAudit.RuleAudit.DecisionTraceId;

        return Guid.Empty;
    }
}
