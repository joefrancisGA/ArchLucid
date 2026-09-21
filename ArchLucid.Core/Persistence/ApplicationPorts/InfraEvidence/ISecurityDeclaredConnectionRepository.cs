using ArchLucid.Core.Scoping;
using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityDeclaredConnectionRepository
{
    Task InsertAsync(SecurityDeclaredConnectionRecord record, CancellationToken cancellationToken = default);

    Task<SecurityDeclaredConnectionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    async Task<SecurityDeclaredConnectionRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid connectionId,
        CancellationToken cancellationToken = default)
    {
        SecurityDeclaredConnectionRecord? record =
            await TryGetByIdAsync(scope.TenantId, connectionId, cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    async Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityDeclaredConnectionRecord> records =
            await ListByTenantAsync(scope.TenantId, cancellationToken);

        return records
            .Where(record => scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId))
            .ToList();
    }

    Task<SecurityDeclaredConnectionRecord?> TryGetActiveDuplicateAsync(
        Guid tenantId,
        Guid fromCloudResourceId,
        Guid toCloudResourceId,
        SecurityDeclaredConnectionRelationshipType relationshipType,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> ListActiveByTenantAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid connectionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default);

    async Task MarkExpiryProcessedInScopeAsync(
        ProjectScopeKey scope,
        SecurityDeclaredConnectionExpiryProcessedMutation mutation,
        CancellationToken cancellationToken = default)
    {
        SecurityDeclaredConnectionRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.ConnectionId, cancellationToken);
        if (current is null)
            return;

        await MarkExpiryProcessedAsync(scope.TenantId, mutation.ConnectionId, mutation.ProcessedUtc, cancellationToken);
    }

    Task RevokeAsync(
        Guid tenantId,
        Guid connectionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default);

    async Task RevokeInScopeAsync(
        ProjectScopeKey scope,
        SecurityDeclaredConnectionRevokeMutation mutation,
        CancellationToken cancellationToken = default)
    {
        SecurityDeclaredConnectionRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.ConnectionId, cancellationToken);
        if (current is null)
            return;

        await RevokeAsync(scope.TenantId, mutation.ConnectionId, mutation.RevokedByActorKey, mutation.RevokedUtc, cancellationToken);
    }

    Task UpdateRenewalAsync(
        SecurityDeclaredConnectionRecord record,
        CancellationToken cancellationToken = default);

    async Task UpdateRenewalInScopeAsync(
        ProjectScopeKey scope,
        SecurityDeclaredConnectionRenewalMutation mutation,
        CancellationToken cancellationToken = default)
    {
        SecurityDeclaredConnectionRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.ConnectionId, cancellationToken);
        if (current is null)
            return;

        await UpdateRenewalAsync(new SecurityDeclaredConnectionRecord
        {
            ConnectionId = current.ConnectionId,
            TenantId = current.TenantId,
            WorkspaceId = current.WorkspaceId,
            ProjectId = current.ProjectId,
            FromCloudResourceId = current.FromCloudResourceId,
            ToCloudResourceId = current.ToCloudResourceId,
            RelationshipType = current.RelationshipType,
            Rationale = current.Rationale,
            EvidenceReference = current.EvidenceReference,
            ExpirationUtc = mutation.ExpirationUtc,
            Status = current.Status,
            RequestedByActorKey = current.RequestedByActorKey,
            ApprovedByActorKey = mutation.ApprovedByActorKey,
            PayloadHashSha256 = mutation.PayloadHashSha256,
            ExpiryProcessedUtc = null,
            CreatedUtc = current.CreatedUtc,
            UpdatedUtc = mutation.UpdatedUtc,
            RevokedUtc = current.RevokedUtc,
            RevokedByActorKey = current.RevokedByActorKey,
        }, cancellationToken);
    }

    async Task<IReadOnlyList<SecurityDeclaredConnectionRecord>> MarkExpiredInScopeAsync(
        ProjectScopeKey scope,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<SecurityDeclaredConnectionRecord> rows =
            await MarkExpiredAsync(scope.TenantId, asOfUtc, cancellationToken);

        return rows.Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)).ToList();
    }
}

public sealed record SecurityDeclaredConnectionRevokeMutation
{
    public required Guid ConnectionId { get; init; }
    public required string RevokedByActorKey { get; init; }
    public required DateTime RevokedUtc { get; init; }
}

public sealed record SecurityDeclaredConnectionRenewalMutation
{
    public required Guid ConnectionId { get; init; }
    public required DateTime ExpirationUtc { get; init; }
    public required string ApprovedByActorKey { get; init; }
    public required byte[] PayloadHashSha256 { get; init; }
    public required DateTime UpdatedUtc { get; init; }
}

public sealed record SecurityDeclaredConnectionExpiryProcessedMutation
{
    public required Guid ConnectionId { get; init; }
    public required DateTime ProcessedUtc { get; init; }
}
