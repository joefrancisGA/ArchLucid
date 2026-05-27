using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class NoOpRiskExceptionRepository : IRiskExceptionRepository
{
    public Task CreateAsync(RiskExceptionRecord record, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<RiskExceptionRecord?> GetByIdAsync(Guid tenantId, Guid riskExceptionId, CancellationToken cancellationToken = default) =>
        Task.FromResult<RiskExceptionRecord?>(null);

    public Task<IReadOnlyList<RiskExceptionRecord>> ListActiveForTenantAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RiskExceptionRecord>>([]);

    public Task RevokeAsync(
        Guid tenantId,
        Guid riskExceptionId,
        string revokedByUserId,
        DateTimeOffset revokedAtUtc,
        CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task MarkExpiredAsync(Guid tenantId, DateTimeOffset asOfUtc, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public Task<IReadOnlyList<RiskExceptionRecord>> ListRetiredSinceUtcAsync(
        Guid tenantId,
        Guid? projectId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<RiskExceptionRecord>>([]);
}
