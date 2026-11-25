using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Core.Findings;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

internal static class InventoryStorageMinimumTlsVerifier
{
    internal static bool MentionsMinimumTls(string? text) =>
        text is not null && (text.Contains("minimum TLS", StringComparison.OrdinalIgnoreCase)
            || text.Contains("minimal TLS", StringComparison.OrdinalIgnoreCase)
            || text.Contains("min TLS", StringComparison.OrdinalIgnoreCase)
            || text.Contains("minimumTlsVersion", StringComparison.OrdinalIgnoreCase)
            || text.Contains("minTlsVersion", StringComparison.OrdinalIgnoreCase)
            || text.Contains("min_tls_version", StringComparison.OrdinalIgnoreCase));

    internal static async Task<StorageMinimumTlsVerification> VerifyAsync(
        IAzureInventorySnapshotRepository snapshots, ScopeContext scope, Guid snapshotId, Guid resourceId,
        TimeProvider clock, CancellationToken cancellationToken)
    {
        StorageMinimumTlsVerification unverified = new(resourceId, StorageMinimumTlsOutcome.Unverified);
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            snapshotId == Guid.Empty || resourceId == Guid.Empty)
            return unverified;

        AzureInventorySnapshotRecord? header = await snapshots.TryGetBySnapshotIdAsync(scope, snapshotId, cancellationToken);
        DateTime now = clock.GetUtcNow().UtcDateTime;
        if (header is not { CaptureStatus: AzureInventoryCaptureStatus.Succeeded, CapturedUtc: DateTime captured } ||
            header.SnapshotId != snapshotId || header.TenantId != scope.TenantId ||
            header.WorkspaceId != scope.WorkspaceId || header.ProjectId != scope.ProjectId ||
            captured > now || now - captured > TimeSpan.FromHours(24))
            return unverified;

        var (resources, properties) = await snapshots.ListResourcesAndPropertiesByCloudResourceIdsAsync(
            scope, snapshotId, [resourceId], cancellationToken);
        if (resources.Count != 1)
            return unverified;

        AzureInventoryResourceRecord resource = resources[0];
        if (resource.SnapshotId != snapshotId || resource.TenantId != scope.TenantId ||
            resource.CloudResourceId != resourceId || resource.ResourceRowId == Guid.Empty ||
            !string.Equals(resource.ResourceType, "Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase))
            return unverified;

        AzureInventoryResourcePropertyReadModel[] values = properties.Where(p =>
            p.ResourceRowId == resource.ResourceRowId &&
            (string.Equals(p.PropertyKey, "minimumTlsVersion", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(p.PropertyKey, "properties.minimumTlsVersion", StringComparison.OrdinalIgnoreCase)))
            .Take(2).ToArray();
        if (values.Length != 1 || values[0].IsRedacted || values[0].PropertyValue is not string rawValue)
            return unverified;

        string version = DeclarationInventorySecurityPropertyValueComparer.ComparableToken(
            DeclarationSecurityPropertyLogicalNames.MinimumTlsVersion, rawValue);
        if (version is not ("1.0" or "1.1" or "1.2" or "1.3"))
            return unverified;

        StorageMinimumTlsOutcome outcome = version == StorageMinimumTlsVerification.ExpectedVersion
            ? StorageMinimumTlsOutcome.Verified : StorageMinimumTlsOutcome.Contradicted;
        return new(resourceId, outcome, snapshotId, DateTime.SpecifyKind(captured, DateTimeKind.Utc),
            resource.ResourceRowId, version)
        {
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
        };
    }
}
