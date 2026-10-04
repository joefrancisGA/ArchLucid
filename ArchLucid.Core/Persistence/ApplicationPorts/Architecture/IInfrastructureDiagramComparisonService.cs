using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IInfrastructureDiagramComparisonService
{
    Task<DiagramInfrastructureReconciliationResult> CompareAsync(
        ScopeContext scope,
        InfrastructureDiagramComparisonCreateRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default);

    Task<DiagramInfrastructureReconciliationResult?> TryGetComparisonAsync(
        ScopeContext scope,
        Guid comparisonId,
        CancellationToken cancellationToken = default);

    Task<DiagramInfrastructureReconciliationResult> SaveNodeMappingAndRefreshAsync(
        ScopeContext scope,
        Guid comparisonId,
        InfrastructureDiagramNodeMappingSaveRequest request,
        string? savedByUserOid,
        CancellationToken cancellationToken = default);
}
