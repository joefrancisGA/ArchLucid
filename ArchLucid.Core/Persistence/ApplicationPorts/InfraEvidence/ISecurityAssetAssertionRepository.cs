using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityAssetAssertionRepository
{
    Task InsertAsync(SecurityAssetAssertionRecord record, CancellationToken cancellationToken = default);

    Task<SecurityAssetAssertionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid assertionId,
        CancellationToken cancellationToken = default);

    async Task<SecurityAssetAssertionRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid assertionId,
        CancellationToken cancellationToken = default)
    {
        SecurityAssetAssertionRecord? record =
            await TryGetByIdAsync(scope.TenantId, assertionId, cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    Task<IReadOnlyList<SecurityAssetAssertionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<SecurityAssetAssertionRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityAssetAssertionRecord> rows =
            await ListByTenantAsync(scope.TenantId, cancellationToken);

        return rows.Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)).ToList();
    }

    Task<SecurityAssetAssertionRecord?> TryGetActiveByCloudResourceIdAsync(
        Guid tenantId,
        Guid cloudResourceId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    async Task<SecurityAssetAssertionRecord?> TryGetActiveByCloudResourceIdInScopeAsync(
        ProjectScopeKey scope,
        Guid cloudResourceId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityAssetAssertionRecord> rows =
            await ListByScopeAsync(scope, cancellationToken);

        return rows
            .Where(row =>
                row.CloudResourceId == cloudResourceId
                && row.Status == SecurityAssetAssertionStatus.Active
                && row.ExpirationUtc > asOfUtc)
            .OrderByDescending(row => row.CreatedUtc)
            .FirstOrDefault();
    }

    Task<IReadOnlyList<Guid>> ListActiveAssertionIdsAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<Guid>> ListActiveAssertionIdsInScopeAsync(
        ProjectScopeKey scope,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityAssetAssertionRecord> rows =
            await ListByScopeAsync(scope, cancellationToken);

        return rows
            .Where(row =>
                row.Status == SecurityAssetAssertionStatus.Active
                && row.ExpirationUtc > asOfUtc)
            .Select(row => row.AssertionId)
            .ToList();
    }

    Task<IReadOnlyList<SecurityAssetAssertionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid assertionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        Guid tenantId,
        Guid assertionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default);

    Task UpdateRenewalAsync(
        SecurityAssetAssertionRecord record,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<SecurityAssetAssertionRecord>> MarkExpiredInScopeAsync(
        ProjectScopeKey scope,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityAssetAssertionRecord> rows =
            await MarkExpiredAsync(scope.TenantId, asOfUtc, cancellationToken);

        return rows.Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)).ToList();
    }

    async Task MarkExpiryProcessedInScopeAsync(
        ProjectScopeKey scope,
        SecurityAssetAssertionExpiryProcessedMutation mutation,
        CancellationToken cancellationToken = default)
    {
        SecurityAssetAssertionRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.AssertionId, cancellationToken);
        if (current is null)
            return;

        await MarkExpiryProcessedAsync(scope.TenantId, mutation.AssertionId, mutation.ProcessedUtc, cancellationToken);
    }

    async Task RevokeInScopeAsync(
        ProjectScopeKey scope,
        SecurityAssetAssertionRevokeMutation mutation,
        CancellationToken cancellationToken = default)
    {
        SecurityAssetAssertionRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.AssertionId, cancellationToken);
        if (current is null)
            return;

        await RevokeAsync(scope.TenantId, mutation.AssertionId, mutation.RevokedByActorKey, mutation.RevokedUtc, cancellationToken);
    }

    async Task UpdateRenewalInScopeAsync(
        ProjectScopeKey scope,
        SecurityAssetAssertionRenewalMutation mutation,
        CancellationToken cancellationToken = default)
    {
        SecurityAssetAssertionRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.AssertionId, cancellationToken);
        if (current is null)
            return;

        await UpdateRenewalAsync(new SecurityAssetAssertionRecord
        {
            AssertionId = current.AssertionId,
            TenantId = current.TenantId,
            WorkspaceId = current.WorkspaceId,
            ProjectId = current.ProjectId,
            CloudResourceId = current.CloudResourceId,
            DataSensitivity = current.DataSensitivity,
            RegulatoryClass = current.RegulatoryClass,
            DeploymentEnvironment = current.DeploymentEnvironment,
            BusinessCriticality = current.BusinessCriticality,
            IsRevenueImpact = current.IsRevenueImpact,
            IsPatientImpact = current.IsPatientImpact,
            Rationale = current.Rationale,
            EvidenceReference = current.EvidenceReference,
            ExpirationUtc = mutation.ExpirationUtc,
            Status = current.Status,
            RequestedByActorKey = mutation.RequestedByActorKey,
            ApprovedByActorKey = mutation.ApprovedByActorKey,
            PayloadHashSha256 = mutation.PayloadHashSha256,
            ExpiryProcessedUtc = null,
            CreatedUtc = current.CreatedUtc,
            UpdatedUtc = mutation.UpdatedUtc,
            RevokedUtc = current.RevokedUtc,
            RevokedByActorKey = current.RevokedByActorKey,
        }, cancellationToken);
    }
}

public sealed record SecurityAssetAssertionRevokeMutation
{
    public required Guid AssertionId { get; init; }
    public required string RevokedByActorKey { get; init; }
    public required DateTime RevokedUtc { get; init; }
}

public sealed record SecurityAssetAssertionRenewalMutation
{
    public required Guid AssertionId { get; init; }
    public required DateTime ExpirationUtc { get; init; }
    public required string RequestedByActorKey { get; init; }
    public required string ApprovedByActorKey { get; init; }
    public required byte[] PayloadHashSha256 { get; init; }
    public required DateTime UpdatedUtc { get; init; }
}

public sealed record SecurityAssetAssertionExpiryProcessedMutation
{
    public required Guid AssertionId { get; init; }
    public required DateTime ProcessedUtc { get; init; }
}
