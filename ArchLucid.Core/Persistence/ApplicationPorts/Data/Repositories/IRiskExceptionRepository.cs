using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Data.Repositories;

public interface IRiskExceptionRepository
{
    Task CreateAsync(RiskExceptionRecord record, CancellationToken cancellationToken = default);

    Task<RiskExceptionRecord?> GetByIdAsync(Guid tenantId, Guid riskExceptionId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RiskExceptionRecord>> ListActiveForTenantAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        Guid tenantId,
        Guid riskExceptionId,
        string revokedByUserId,
        DateTimeOffset revokedAtUtc,
        CancellationToken cancellationToken = default);

    Task MarkExpiredAsync(Guid tenantId, DateTimeOffset asOfUtc, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RiskExceptionRecord>> ListRetiredSinceUtcAsync(
        Guid tenantId,
        Guid? projectId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default);
}
