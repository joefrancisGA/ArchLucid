using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface ISecurityEvidencePathRoutingRepository
{
    Task<IReadOnlyList<SecurityEvidencePathRoutingRecord>> ListByPathIdAsync(
        Guid tenantId,
        Guid pathId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SecurityEvidencePathRoutingRecord>> ListByPathIdInScopeAsync(
        ProjectScopeKey scope,
        Guid pathId,
        CancellationToken cancellationToken = default) =>
        ListByPathIdAsync(scope.TenantId, pathId, cancellationToken);

    Task ReplaceRoutingForPathAsync(
        Guid tenantId,
        Guid pathId,
        IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows,
        CancellationToken cancellationToken = default);

    Task ReplaceRoutingForPathInScopeAsync(
        ProjectScopeKey scope,
        Guid pathId,
        IReadOnlyList<SecurityEvidencePathRoutingRecord> routingRows,
        CancellationToken cancellationToken = default) =>
        ReplaceRoutingForPathAsync(scope.TenantId, pathId, routingRows, cancellationToken);
}
