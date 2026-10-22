using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class NoOpOperationalSecurityExceptionRepository : IOperationalSecurityExceptionRepository
{
    public Task InsertAsync(OperationalSecurityExceptionRecord record, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<OperationalSecurityExceptionRecord?> TryGetByIdAsync(
        Guid tenantId,
        Guid exceptionId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<OperationalSecurityExceptionRecord?>(null);

    public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> ListByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>([]);

    public Task<IReadOnlyList<OperationalSecurityExceptionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<OperationalSecurityExceptionRecord>>([]);

    public Task MarkExpiryProcessedAsync(
        Guid tenantId,
        Guid exceptionId,
        DateTime processedUtc,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task RevokeAsync(
        Guid tenantId,
        Guid exceptionId,
        string revokedByActorKey,
        DateTime revokedUtc,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<bool> HasActiveExceptionForFindingAsync(
        Guid tenantId,
        Guid findingId,
        DateTime asOfUtc,
        CancellationToken cancellationToken = default) =>
        Task.FromResult(false);
}
