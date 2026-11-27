using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Explicit system-owned execution boundary. No public route or implicit scheduling.
/// A failed publication must not silently assess a previously published envelope.</summary>
internal sealed class RuntimeSecurityExecutionService(
    RuntimeAttestationPublisher publisher, RuntimeFindingPersistenceService persistence,
    IRuntimeAttestationPublicationAuthority authority)
{
    public async Task<RuntimeSecurityExecutionResult> ExecuteAsync(ScopeContext scope,
        RuntimeObservationRequest request, TimeSpan maximumAge, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            request.TenantId != scope.TenantId || request.WorkspaceId != scope.WorkspaceId ||
            request.ProjectId != scope.ProjectId || maximumAge <= TimeSpan.Zero ||
            maximumAge > TimeSpan.FromMinutes(5) || string.IsNullOrWhiteSpace(request.ResourceId) ||
            string.IsNullOrWhiteSpace(request.DeploymentGeneration) || string.IsNullOrWhiteSpace(request.RuntimeFamily) ||
            !await authority.CanPublishAsync(request, ct))
            return new(false, false, false, 0);

        if (!await publisher.PublishAsync(request, ct)) return new(false, false, false, 0);
        ct.ThrowIfCancellationRequested();

        if (!await authority.CanPublishAsync(request, ct)) return new(true, false, false, 0);
        var result = await persistence.AssessAndPersistAsync(scope, request, maximumAge, ct);
        return new(true, result.CatalogCurrent, result.Persisted, result.Candidates);
    }
}
