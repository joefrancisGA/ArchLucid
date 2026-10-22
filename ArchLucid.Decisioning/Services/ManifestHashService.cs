using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Services;

/// <summary>
///     Computes a deterministic SHA-256 hash over a canonical JSON projection of a <see cref="ManifestDocument" />.
/// </summary>
/// <remarks>
///     The canonical projection includes all structural manifest fields (topology, decisions, requirements,
///     security, compliance, cost, constraints, provenance) but excludes non-deterministic metadata like
///     <c>CreatedUtc</c>. Collection entries are sorted before serialization so that insertion-order
///     differences do not produce different hashes.
/// </remarks>
public sealed class ManifestHashService : IManifestHashService
{
    /// <summary>
    ///     Canonical projection schema version. Increment only with deliberate baseline re-lock
    ///     (<c>MANIFEST_HASH_HASHER_BASELINE.md</c>, <c>TB-1157</c>).
    /// </summary>
    public const string HasherSchemaVersion = "v12";

    /// <inheritdoc />
    public string ComputeHash(ManifestDocument manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        string canonical = JsonSerializer.Serialize(new
        {
            HasherSchemaVersion,
            manifest.TenantId,
            manifest.WorkspaceId,
            manifest.ProjectId,
            manifest.ManifestId,
            manifest.RunId,
            manifest.ContextSnapshotId,
            manifest.GraphSnapshotId,
            manifest.FindingsSnapshotId,
            manifest.DecisionTraceId,
            manifest.ArchitectureVersionId,
            CreateTimePolicyPackPins = ManifestCreateTimePinCanonicalProjection.ProjectPolicyPackPins(
                manifest.CreateTimePolicyPackPins),
            CreateTimeEvidencePackagePins = ManifestCreateTimePinCanonicalProjection.ProjectEvidencePackagePins(
                manifest.CreateTimeEvidencePackagePins),
            manifest.CreateTimeEvidencePackagePinsHashSha256,
            manifest.CreateTimeArchitectureVersionContentHashSha256,
            manifest.CreateTimeKnowledgeModelContentHashSha256,
            manifest.CreateTimeFocusedPilotModeEnabled,
            manifest.CreateTimeFocusedPilotCloudProvider,
            manifest.CreateTimePackageOrigin,
            manifest.CreateTimeArchitectureRequestId,
            manifest.CreateTimeStructuralExecutionMode,
            manifest.CreateTimePilotAoaiDeploymentSnapshot,
            manifest.RuleSetId,
            manifest.RuleSetVersion,
            manifest.RuleSetHash,
            manifest.Metadata,
            manifest.Requirements,
            manifest.Topology,
            manifest.Security,
            manifest.Compliance,
            manifest.Cost,
            manifest.Constraints,
            manifest.UnresolvedIssues,
            Decisions = manifest.Decisions
                .OrderBy(d => d.DecisionId)
                .Select(d => new
                {
                    d.DecisionId,
                    d.Category,
                    d.Title,
                    d.SelectedOption,
                    d.Rationale,
                    SupportingFindingIds = d.SupportingFindingIds.OrderBy(x => x).ToArray(),
                    RelatedNodeIds = d.RelatedNodeIds.OrderBy(x => x).ToArray(),
                    d.RawDecisionJson
                })
                .ToArray(),
            Assumptions = manifest.Assumptions.OrderBy(x => x).ToArray(),
            Warnings = manifest.Warnings.OrderBy(x => x).ToArray(),
            manifest.Policy,
            manifest.Provenance,
            manifest.FeasibilityVerdict,
            EffectiveGovernanceAtCommit = manifest.EffectiveGovernanceAtCommit is null
                ? null
                : new
                {
                    manifest.EffectiveGovernanceAtCommit.RuleSetId,
                    manifest.EffectiveGovernanceAtCommit.RuleSetVersion,
                    manifest.EffectiveGovernanceAtCommit.RuleSetHash,
                    manifest.EffectiveGovernanceAtCommit.ComplianceRuleKeyCount,
                    ComplianceRuleKeys = manifest.EffectiveGovernanceAtCommit.ComplianceRuleKeys.OrderBy(x => x, StringComparer.Ordinal).ToArray(),
                    manifest.EffectiveGovernanceAtCommit.ConflictCount,
                    PackAssignments = manifest.EffectiveGovernanceAtCommit.PackAssignments
                        .OrderBy(row => row.PolicyPackId)
                        .ThenBy(row => row.PolicyPackVersion, StringComparer.Ordinal)
                        .ThenBy(row => row.ScopeLevel, StringComparer.Ordinal)
                        .Select(row => new
                        {
                            row.PolicyPackId,
                            row.PolicyPackVersion,
                            row.ScopeLevel
                        })
                        .ToArray(),
                    manifest.EffectiveGovernanceAtCommit.HasEffectivePolicy
                },
            ReviewStandardsAtCommit = manifest.ReviewStandardsAtCommit is null
                ? null
                : new
                {
                    PolicyReferences = manifest.ReviewStandardsAtCommit.PolicyReferences
                        .OrderBy(reference => reference, StringComparer.Ordinal)
                        .ToArray(),
                    manifest.ReviewStandardsAtCommit.FocusedPilotModeEnabled,
                    manifest.ReviewStandardsAtCommit.CloudProvider,
                    ReviewedQualityDimensions = manifest.ReviewStandardsAtCommit.ReviewedQualityDimensions
                        .OrderBy(dimension => dimension, StringComparer.Ordinal)
                        .ToArray()
                },
            CommittedArtifactInventory = manifest.CommittedArtifactInventory
                .OrderBy(row => row.ArtifactName, StringComparer.Ordinal)
                .Select(row => new
                {
                    row.ArtifactName,
                    row.ContentType,
                    row.ContentHashSha256,
                    row.Producer,
                    row.CapturedUtc,
                })
                .ToArray(),
            manifest.CommittedDecisionReceiptHashSha256,
        });

        using SHA256 sha = SHA256.Create();
        byte[] bytes = Encoding.UTF8.GetBytes(canonical);
        byte[] hash = sha.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }
}
