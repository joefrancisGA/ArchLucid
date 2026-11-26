using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal sealed record RuntimeDeploymentAdvisoryAssessment(
    RuntimeApplicability Applicability, string? EvidenceReference, int ObservedInstances, bool Complete);

/// <summary>Evaluate signed, authorized observations without inferring vendor or prerequisites
/// from configured stack names. A confirmed affected instance dominates incomplete coverage;
/// exclusion requires complete, unambiguous evidence for every enumerated instance.</summary>
internal sealed class RuntimeDeploymentAdvisoryEvaluator(IAuthorizedRuntimeObservationSource source)
{
    public async Task<RuntimeDeploymentAdvisoryAssessment> AssessAsync(ScopeContext scope,
        RuntimeObservationRequest request, VerifiedRuntimeAdvisory advisory, DateTimeOffset now,
        TimeSpan maximumAge, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        RuntimeDeploymentAdvisoryAssessment Unknown() => new(RuntimeApplicability.Unknown, null, 0, false);
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            request.TenantId != scope.TenantId || request.WorkspaceId != scope.WorkspaceId ||
            request.ProjectId != scope.ProjectId || maximumAge <= TimeSpan.Zero ||
            string.IsNullOrWhiteSpace(request.ResourceId) || string.IsNullOrWhiteSpace(request.DeploymentGeneration) ||
            !string.Equals(request.RuntimeFamily, advisory.Product, StringComparison.OrdinalIgnoreCase))
            return Unknown();
        var batch = await source.ReadAsync(request, ct);
        ct.ThrowIfCancellationRequested();
        if (batch is null || batch.Scope != request || string.IsNullOrWhiteSpace(batch.EvidenceReference) ||
            batch.EnumeratedAt > now || now - batch.EnumeratedAt > maximumAge ||
            batch.InstanceIds is not { Count: > 0 } || batch.Observations is null ||
            batch.InstanceIds.Any(string.IsNullOrWhiteSpace)) return Unknown();
        var expected = new HashSet<string>(batch.InstanceIds, StringComparer.Ordinal);
        if (expected.Count != batch.InstanceIds.Count || batch.Observations.Any(o => o is null ||
            !expected.Contains(o.InstanceId) || o.ObservedAt < batch.EnumeratedAt || o.ObservedAt > now))
            return Unknown();

        var states = new List<RuntimeApplicability>();
        var groups = batch.Observations.GroupBy(o => o.InstanceId, StringComparer.Ordinal);
        foreach (var group in groups)
        {
            ct.ThrowIfCancellationRequested();
            var latest = group.Max(o => o.ObservedAt);
            var current = group.Where(o => o.ObservedAt == latest).ToArray();
            // Conflicting observations at the same instant cannot establish exclusion.
            if (current.Length != 1) { states.Add(RuntimeApplicability.Unknown); continue; }
            var observation = current[0];
            states.Add(RuntimeVulnerabilityAssessment.Assess(new RuntimeObservation(
                request.ResourceId, request.RuntimeFamily, observation.Vendor ?? string.Empty,
                observation.Distribution ?? string.Empty, observation.Version, RuntimeEvidenceKind.Executing,
                batch.EvidenceReference, observation.ObservedAt,
                observation.Prerequisites ?? new Dictionary<string, RuntimePrerequisiteState>()),
                advisory, now, maximumAge).Applicability);
        }
        bool complete = batch.Complete && states.Count == expected.Count &&
            !states.Contains(RuntimeApplicability.Unknown);
        var result = states.Contains(RuntimeApplicability.Affected) ? RuntimeApplicability.Affected :
            !complete ? RuntimeApplicability.Unknown :
            states.All(s => s == RuntimeApplicability.OutsideAffectedRange) ? RuntimeApplicability.OutsideAffectedRange :
            states.All(s => s == RuntimeApplicability.PrerequisiteAbsent) ? RuntimeApplicability.PrerequisiteAbsent :
            RuntimeApplicability.Unknown;
        return new(result, batch.EvidenceReference, states.Count, complete);
    }
}
