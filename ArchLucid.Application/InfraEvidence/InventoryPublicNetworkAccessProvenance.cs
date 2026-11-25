using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Projects the shared inventory observation into a bounded, scope-checked provenance statement.</summary>
internal static class InventoryPublicNetworkAccessProvenance
{
    internal static string? Format(ScopeContext scope, PublicNetworkAccessVerification? verification)
    {
        if (verification is not { SnapshotId: Guid snapshotId, CapturedUtc: DateTime captured, Evidence: { } evidence } ||
            snapshotId == Guid.Empty || captured == default || verification.CloudResourceId == Guid.Empty ||
            evidence.ResourceRowId == Guid.Empty || scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty ||
            scope.ProjectId == Guid.Empty || evidence.TenantId != scope.TenantId ||
            evidence.WorkspaceId != scope.WorkspaceId || evidence.ProjectId != scope.ProjectId ||
            !string.Equals(evidence.VerifierVersion, InventoryPublicNetworkAccessVerifier.VerifierVersion, StringComparison.Ordinal) ||
            !InventoryPublicNetworkAccessVerifier.IsPublicNetworkAccessProperty(evidence.PropertyKey) ||
            evidence.MaximumCaptureAgeHours <= 0)
            return null;

        string? coverage = verification.Outcome switch
        {
            PublicNetworkAccessVerificationOutcome.Verified => $"Coverage: {evidence.PropertyKey}=Disabled.",
            PublicNetworkAccessVerificationOutcome.Contradicted => $"Coverage: {evidence.PropertyKey}=Enabled.",
            PublicNetworkAccessVerificationOutcome.Unverified => $"Coverage: {evidence.PropertyKey} did not establish this claim.",
            _ => null,
        };
        if (coverage is null)
            return null;

        return $"Independent deterministic verification ({evidence.VerifierVersion}). "
            + $"Azure inventory snapshot {snapshotId:D}, resource {verification.CloudResourceId:D}, inventory row {evidence.ResourceRowId:D}. "
            + $"Scope {evidence.TenantId:D} / {evidence.WorkspaceId:D} / {evidence.ProjectId:D}. "
            + $"Captured {captured:O}, maximum capture age at verification: {evidence.MaximumCaptureAgeHours} hours. "
            + $"{coverage} The result concerns only this property at capture time and does not establish network reachability or live state.";
    }
}
