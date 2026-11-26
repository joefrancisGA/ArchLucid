using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record RuntimeLifecycleFindingCandidate(RuntimeObservationRequest Scope, string InstanceId,
    string ReleaseLine, string LifecycleEvidenceId, string CatalogEvidenceId, string RuntimeEvidenceReference);

internal sealed class RuntimeDeploymentLifecycleEvaluator(IAuthorizedRuntimeObservationSource source)
{
    public async Task<IReadOnlyList<RuntimeLifecycleFindingCandidate>> AssessAsync(ScopeContext scope,
        RuntimeObservationRequest request, VerifiedRuntimeAdvisoryCatalog catalog, DateTimeOffset now,
        TimeSpan maximumAge, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            request.TenantId != scope.TenantId || request.WorkspaceId != scope.WorkspaceId ||
            request.ProjectId != scope.ProjectId || maximumAge <= TimeSpan.Zero ||
            string.IsNullOrWhiteSpace(request.ResourceId) || string.IsNullOrWhiteSpace(request.DeploymentGeneration) ||
            string.IsNullOrWhiteSpace(request.RuntimeFamily) || string.IsNullOrWhiteSpace(catalog.EvidenceId) ||
            catalog.VerifiedAt > now || catalog.ValidUntil <= now || catalog.ValidUntil <= catalog.VerifiedAt ||
            catalog.Lifecycles is not { Count: > 0 and <= 1000 }) return [];
        var batch = await source.ReadAsync(request, ct);
        ct.ThrowIfCancellationRequested();
        if (batch is null || batch.Scope != request || string.IsNullOrWhiteSpace(batch.EvidenceReference) ||
            batch.EnumeratedAt > now || now - batch.EnumeratedAt > maximumAge ||
            batch.InstanceIds is not { Count: > 0 and <= 10000 } ||
            batch.Observations is not { Count: <= 20000 } || batch.InstanceIds.Any(string.IsNullOrWhiteSpace))
            return [];
        var expected = new HashSet<string>(batch.InstanceIds, StringComparer.Ordinal);
        if (expected.Count != batch.InstanceIds.Count || batch.Observations.Any(o => o is null ||
            !expected.Contains(o.InstanceId) || o.ObservedAt < batch.EnumeratedAt || o.ObservedAt > now)) return [];
        var findings = new List<RuntimeLifecycleFindingCandidate>();
        foreach (var group in batch.Observations.GroupBy(o => o.InstanceId, StringComparer.Ordinal))
        {
            ct.ThrowIfCancellationRequested();
            var latest = group.Max(o => o.ObservedAt);
            var current = group.Where(o => o.ObservedAt == latest).ToArray();
            if (current.Length != 1) continue;
            var item = current[0];
            if (!Version.TryParse(item.Version, out var version) || version.Build < 0 ||
                string.IsNullOrWhiteSpace(item.Vendor) || string.IsNullOrWhiteSpace(item.Distribution)) continue;
            var line = $"{version.Major}.{version.Minor}";
            var records = catalog.Lifecycles.Where(l => l is not null &&
                string.Equals(l.Product, request.RuntimeFamily, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(l.Vendor, item.Vendor, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(l.Distribution, item.Distribution, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(l.ReleaseLine, line, StringComparison.Ordinal)).ToArray();
            if (records.Length != 1 || records[0].VerifiedAt > catalog.VerifiedAt) continue;
            var observation = new RuntimeObservation(request.ResourceId, request.RuntimeFamily, item.Vendor,
                item.Distribution, item.Version, RuntimeEvidenceKind.Executing, batch.EvidenceReference,
                item.ObservedAt, item.Prerequisites ?? new Dictionary<string, RuntimePrerequisiteState>());
            if (RuntimeLifecycleAssessment.Assess(observation, records[0], now, maximumAge) == RuntimeLifecycleStatus.EndOfSupport)
                findings.Add(new(request, item.InstanceId, line, records[0].EvidenceId, catalog.EvidenceId, batch.EvidenceReference));
        }
        return findings.ToArray();
    }
}
