using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Governance;

public interface IRiskExceptionService
{
    Task<RiskExceptionRecord> CreateAsync(
        CreateRiskExceptionRequest request,
        ScopeContext scope,
        string createdByUserId,
        CancellationToken cancellationToken = default);

    Task RevokeAsync(
        Guid tenantId,
        Guid riskExceptionId,
        string revokedByUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RiskExceptionRecord>> ListActiveAsync(
        Guid tenantId,
        Guid? projectId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RiskExceptionRecord>> ListRetiredSinceAsync(
        Guid tenantId,
        Guid? projectId,
        DateTimeOffset sinceUtc,
        CancellationToken cancellationToken = default);
}
