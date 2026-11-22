using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed class NoOpRiskExceptionRepository : IRiskExceptionRepository
{
    public Task CreateAsync(RiskExceptionRecord record, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task<RiskExceptionRecord?> GetByIdAsync(Guid tenantId, Guid riskExceptionId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<RiskExceptionRecord?>(null);
    }

    public Task<RiskExceptionRecord?> GetActiveForScopeFindingAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        DateTimeOffset asOfUtc,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<RiskExceptionRecord?>(null);
    }

    public Task<IReadOnlyList<RiskExceptionRecord>> ListActiveForTenantAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<RiskExceptionRecord>>([]);
    }

    public Task RevokeAsync(
        Guid tenantId,
        Guid riskExceptionId,
        string revokedByUserId,
        DateTimeOffset revokedAtUtc,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<RiskExceptionRecord>> MarkExpiredAsync(
        Guid tenantId,
        DateTimeOffset asOfUtc,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<RiskExceptionRecord>>([]);
    }

    public Task RenewAsync(
        Guid tenantId,
        Guid riskExceptionId,
        DateTimeOffset expiresAtUtc,
        string renewedByUserId,
        string? rationale,
        string? evidenceRef,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<RiskExceptionRecord>> ListRetiredSinceUtcAsync(
        Guid tenantId,
        Guid? projectId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult<IReadOnlyList<RiskExceptionRecord>>([]);
    }
}
