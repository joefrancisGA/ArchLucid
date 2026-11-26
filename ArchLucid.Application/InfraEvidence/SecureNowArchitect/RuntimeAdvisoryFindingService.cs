using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

// Only a server-selected, independently verified catalog provider may implement this contract.
internal sealed record VerifiedRuntimeAdvisoryCatalog(string EvidenceId, DateTimeOffset VerifiedAt,
    DateTimeOffset ValidUntil, IReadOnlyList<VerifiedRuntimeAdvisory> Entries)
{
    public IReadOnlyList<VerifiedRuntimeLifecycle> Lifecycles { get; init; } = [];
}

internal interface IVerifiedRuntimeAdvisoryCatalogSource
{
    Task<VerifiedRuntimeAdvisoryCatalog?> ReadAsync(RuntimeObservationRequest request, CancellationToken ct);
}

internal sealed record RuntimeAdvisoryFindingCandidate(RuntimeObservationRequest Scope,
    string AdvisoryId, string AdvisoryEvidenceId, string CatalogEvidenceId,
    string RuntimeEvidenceReference, int ObservedInstances, bool CoverageComplete);

internal sealed record RuntimeCatalogAssessment(bool CatalogCurrent,
    IReadOnlyList<RuntimeAdvisoryFindingCandidate> Findings, int UnknownAssessments)
{
    public IReadOnlyList<RuntimeLifecycleFindingCandidate> LifecycleFindings { get; init; } = [];
}

/// <summary>Produces evidence-backed candidates only; never closes existing findings based on missing evidence.</summary>
internal sealed class RuntimeAdvisoryFindingService(IVerifiedRuntimeAdvisoryCatalogSource catalogs,
    RuntimeDeploymentAdvisoryEvaluator evaluator, TimeProvider clock,
    RuntimeDeploymentLifecycleEvaluator lifecycleEvaluator)
{
    public async Task<RuntimeCatalogAssessment> AssessAsync(ScopeContext scope,
        RuntimeObservationRequest request, TimeSpan maximumAge, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        RuntimeCatalogAssessment Unavailable() => new(false, [], 0);
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            request.TenantId != scope.TenantId || request.WorkspaceId != scope.WorkspaceId ||
            request.ProjectId != scope.ProjectId || maximumAge <= TimeSpan.Zero ||
            string.IsNullOrWhiteSpace(request.ResourceId) || string.IsNullOrWhiteSpace(request.RuntimeFamily) ||
            string.IsNullOrWhiteSpace(request.DeploymentGeneration)) return Unavailable();
        var catalog = await catalogs.ReadAsync(request, ct);
        var now = clock.GetUtcNow();
        if (catalog is null || string.IsNullOrWhiteSpace(catalog.EvidenceId) ||
            catalog.VerifiedAt > now || catalog.ValidUntil <= now || catalog.ValidUntil <= catalog.VerifiedAt ||
            catalog.Entries is null || catalog.Entries.Count > 1000 ||
            catalog.Lifecycles is null || catalog.Lifecycles.Count > 1000 ||
            catalog.Lifecycles.Any(l => l is null || l.VerifiedAt > catalog.VerifiedAt ||
                l.ValidUntil <= l.VerifiedAt || string.IsNullOrWhiteSpace(l.EvidenceId)) ||
            catalog.Entries.Any(a => a is null || string.IsNullOrWhiteSpace(a.AdvisoryId) ||
                string.IsNullOrWhiteSpace(a.EvidenceId) || a.VerifiedAt > catalog.VerifiedAt ||
                a.ValidUntil <= a.VerifiedAt || a.RequiredPrerequisites is null))
            return Unavailable();
        var entries = catalog.Entries.Where(a => string.Equals(a.Product, request.RuntimeFamily,
            StringComparison.OrdinalIgnoreCase)).ToArray();
        if (entries.Select(a => a.AdvisoryId).Distinct(StringComparer.OrdinalIgnoreCase).Count() != entries.Length)
            return Unavailable();
        var findings = new List<RuntimeAdvisoryFindingCandidate>();
        int unknown = 0;
        foreach (var advisory in entries)
        {
            ct.ThrowIfCancellationRequested();
            now = clock.GetUtcNow();
            if (catalog.ValidUntil <= now) return Unavailable();
            var result = await evaluator.AssessAsync(scope, request, advisory, now, maximumAge, ct);
            if (result.Applicability == RuntimeApplicability.Affected &&
                !string.IsNullOrWhiteSpace(result.EvidenceReference))
                findings.Add(new(request, advisory.AdvisoryId, advisory.EvidenceId, catalog.EvidenceId,
                    result.EvidenceReference, result.ObservedInstances, result.Complete));
            else if (result.Applicability == RuntimeApplicability.Unknown) unknown++;
        }
        var lifecycle = await lifecycleEvaluator.AssessAsync(scope, request, catalog, clock.GetUtcNow(), maximumAge, ct);
        ct.ThrowIfCancellationRequested();
        return catalog.ValidUntil <= clock.GetUtcNow() ? Unavailable() : new RuntimeCatalogAssessment(true, findings.ToArray(), unknown)
        {
            LifecycleFindings = lifecycle
        };
    }
}
