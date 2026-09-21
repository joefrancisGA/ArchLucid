using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IOperationalSecurityExceptionRepository
{
    Task InsertAsync(OperationalSecurityExceptionRecord record, CancellationToken cancellationToken = default);

    Task<OperationalSecurityExceptionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid exceptionId,
        CancellationToken cancellationToken = default);

    async Task<OperationalSecurityExceptionRecord?> TryGetByIdInScopeAsync(
        ProjectScopeKey scope,
        Guid exceptionId,
        CancellationToken cancellationToken = default)
    {
        OperationalSecurityExceptionRecord? record =
            await TryGetByIdAsync(scope.TenantId, exceptionId, cancellationToken);

        return record is not null
               && scope.Matches(record.TenantId, record.WorkspaceId, record.ProjectId)
            ? record
            : null;
    }

    Task<IReadOnlyList<OperationalSecurityExceptionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default);

    async Task<IReadOnlyList<OperationalSecurityExceptionRecord>> ListByScopeAsync(
        ProjectScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OperationalSecurityExceptionRecord> rows =
            await ListByTenantAsync(scope.TenantId, cancellationToken);

        return rows.Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)).ToList();
    }

    Task<IReadOnlyList<OperationalSecurityExceptionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid exceptionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        Guid tenantId,
        Guid exceptionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default);

    Task<bool> HasActiveExceptionForFindingAsync(
        Guid tenantId,
        Guid findingId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default);

    async Task<bool> HasActiveExceptionForFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OperationalSecurityExceptionRecord> rows =
            await ListByScopeAsync(scope, cancellationToken);

        return rows.Any(row =>
            row.FindingId == findingId
            && row.Status == OperationalSecurityExceptionStatus.Active
            && row.ExpirationUtc > asOfUtc);
    }

    async Task<IReadOnlyList<OperationalSecurityExceptionRecord>> MarkExpiredInScopeAsync(
        ProjectScopeKey scope,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default)
    {
        IReadOnlyList<OperationalSecurityExceptionRecord> rows =
            await MarkExpiredAsync(scope.TenantId, asOfUtc, cancellationToken);

        return rows.Where(row => scope.Matches(row.TenantId, row.WorkspaceId, row.ProjectId)).ToList();
    }

    async Task MarkExpiryProcessedInScopeAsync(
        ProjectScopeKey scope,
        OperationalSecurityExceptionExpiryProcessedMutation mutation,
        CancellationToken cancellationToken = default)
    {
        OperationalSecurityExceptionRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.ExceptionId, cancellationToken);
        if (current is null)
            return;

        await MarkExpiryProcessedAsync(scope.TenantId, mutation.ExceptionId, mutation.ProcessedUtc, cancellationToken);
    }

    async Task RevokeInScopeAsync(
        ProjectScopeKey scope,
        OperationalSecurityExceptionRevokeMutation mutation,
        CancellationToken cancellationToken = default)
    {
        OperationalSecurityExceptionRecord? current =
            await TryGetByIdInScopeAsync(scope, mutation.ExceptionId, cancellationToken);
        if (current is null)
            return;

        await RevokeAsync(scope.TenantId, mutation.ExceptionId, mutation.RevokedByActorKey, mutation.RevokedUtc, cancellationToken);
    }
}

public sealed record OperationalSecurityExceptionRevokeMutation
{
    public required Guid ExceptionId { get; init; }
    public required string RevokedByActorKey { get; init; }
    public required DateTime RevokedUtc { get; init; }
}

public sealed record OperationalSecurityExceptionExpiryProcessedMutation
{
    public required Guid ExceptionId { get; init; }
    public required DateTime ProcessedUtc { get; init; }
}
