using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>Verifies the explicit Azure setting after the caller authorizes a scoped snapshot.</summary>
internal static class InventoryPublicNetworkAccessVerifier
{
    private static readonly TimeSpan MaximumCaptureAge = TimeSpan.FromHours(24);

    internal static async Task<PublicNetworkAccessVerification> VerifyAsync(
        IAzureInventorySnapshotRepository snapshots,
        ScopeContext scope,
        Guid snapshotId,
        Guid resourceId,
        TimeProvider clock,
        CancellationToken cancellationToken)
    {
        PublicNetworkAccessVerification unverified = new(resourceId, PublicNetworkAccessVerificationOutcome.Unverified);
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            snapshotId == Guid.Empty || resourceId == Guid.Empty)
            return unverified;

        AzureInventorySnapshotRecord? header = await snapshots.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);
        DateTime now = clock.GetUtcNow().UtcDateTime;
        if (header is not { CaptureStatus: AzureInventoryCaptureStatus.Succeeded, CapturedUtc: DateTime captured } ||
            header.SnapshotId != snapshotId || header.TenantId != scope.TenantId ||
            header.WorkspaceId != scope.WorkspaceId || header.ProjectId != scope.ProjectId ||
            captured > now || now - captured > MaximumCaptureAge)
            return unverified;

        var (resources, properties) = await snapshots.ListResourcesAndPropertiesByCloudResourceIdsAsync(
            scope, snapshotId, [resourceId], cancellationToken);
        if (resources.Count != 1)
            return unverified;

        AzureInventoryResourceRecord resource = resources[0];
        if (resource.SnapshotId != snapshotId || resource.TenantId != scope.TenantId ||
            resource.CloudResourceId != resourceId || resource.ResourceRowId == Guid.Empty)
            return unverified;

        var setting = properties.Where(property => property.ResourceRowId == resource.ResourceRowId &&
            (property.PropertyKey.Equals("publicNetworkAccess", StringComparison.OrdinalIgnoreCase) ||
             property.PropertyKey.Equals("properties.publicNetworkAccess", StringComparison.OrdinalIgnoreCase)))
            .Take(2).ToArray();
        if (setting.Length != 1 || setting[0].IsRedacted)
            return unverified;

        PublicNetworkAccessVerificationOutcome outcome = setting[0].PropertyValue?.Trim().ToUpperInvariant() switch
        {
            "DISABLED" => PublicNetworkAccessVerificationOutcome.Verified,
            "ENABLED" => PublicNetworkAccessVerificationOutcome.Contradicted,
            _ => PublicNetworkAccessVerificationOutcome.Unverified,
        };
        return new(resourceId, outcome, snapshotId, DateTime.SpecifyKind(captured, DateTimeKind.Utc));
    }
}
