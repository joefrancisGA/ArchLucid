using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed class DependencyIdentityEvidenceService(IVerifiedDependencyIdentityBindingSource source,
    TimeProvider clock)
{
    public async Task<DependencyIdentityEvidenceAssessment> AssessAsync(ScopeContext scope,
        RuntimeObservationRequest request, DependencyObservation observation, DependencyMatch match,
        TimeSpan maximumAge, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            request.TenantId != scope.TenantId || request.WorkspaceId != scope.WorkspaceId ||
            request.ProjectId != scope.ProjectId || maximumAge <= TimeSpan.Zero ||
            string.IsNullOrWhiteSpace(request.ResourceId) || string.IsNullOrWhiteSpace(request.DeploymentGeneration) ||
            observation.Kind != DependencyEvidenceKind.Installed || match.State != DependencyMatchState.Affected)
            return new(false, []);
        var bindings = await source.ReadAsync(request, ct);
        ct.ThrowIfCancellationRequested();

        if (bindings is null || bindings.Count > 10000 || bindings.Any(b => b is null || b.Scope != request))
            return new(false, []);
        return new(true, DependencyIdentityBlastRadiusAssessment.Assess(scope, request, observation, match,
            bindings, clock.GetUtcNow(), maximumAge));
    }
}
