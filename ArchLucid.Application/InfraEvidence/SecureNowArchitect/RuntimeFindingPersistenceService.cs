using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Only internally evaluated evidence may be passed to the journal. A missing
/// catalog or observation never authorizes closure of an existing finding.</summary>
internal sealed class RuntimeFindingPersistenceService(
    RuntimeAdvisoryFindingService assessment, IRuntimeFindingJournal journal)
{
    public async Task<RuntimeFindingPersistenceResult> AssessAndPersistAsync(
        ScopeContext scope, RuntimeObservationRequest request, TimeSpan maximumAge, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();

        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            request.TenantId != scope.TenantId || request.WorkspaceId != scope.WorkspaceId ||
            request.ProjectId != scope.ProjectId || maximumAge <= TimeSpan.Zero)
            return new(false, false, 0);
        var result = await assessment.AssessAsync(scope, request, maximumAge, ct);
        ct.ThrowIfCancellationRequested();
        int count = result.Findings.Count + result.LifecycleFindings.Count;

        if (!result.CatalogCurrent || count == 0) return new(result.CatalogCurrent, false, count);

        if (result.Findings.Any(f => f.Scope != request) || result.LifecycleFindings.Any(f => f.Scope != request))
            return new(false, false, 0);
        return new(true, await journal.AppendAsync(request, result, ct), count);
    }
}
