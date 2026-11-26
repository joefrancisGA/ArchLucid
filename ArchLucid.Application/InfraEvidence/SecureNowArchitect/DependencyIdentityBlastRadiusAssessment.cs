using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class DependencyIdentityBlastRadiusAssessment
{
    public static IReadOnlyList<DependencyIdentityExposure> Assess(ScopeContext scope,
        RuntimeObservationRequest request, DependencyObservation observation, DependencyMatch match,
        IReadOnlyList<VerifiedDependencyIdentityBinding> bindings, DateTimeOffset now, TimeSpan maximumAge)
    {
        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty ||
            request.TenantId != scope.TenantId || request.WorkspaceId != scope.WorkspaceId ||
            request.ProjectId != scope.ProjectId || string.IsNullOrWhiteSpace(request.ResourceId) ||
            string.IsNullOrWhiteSpace(request.DeploymentGeneration) || maximumAge <= TimeSpan.Zero ||
            observation.Kind != DependencyEvidenceKind.Installed || match.State != DependencyMatchState.Affected ||
            string.IsNullOrWhiteSpace(observation.EvidenceId) ||
            !string.Equals(match.EvidenceId, observation.EvidenceId, StringComparison.Ordinal) ||
            observation.ObservedAt > now || now - observation.ObservedAt > maximumAge ||
            match.AdvisoryIds is not { Count: > 0 } || match.AdvisoryIds.Any(string.IsNullOrWhiteSpace) ||
            bindings.Count > 10000) return [];
        var candidates = bindings.Where(b => b is not null && b.Scope == request &&
            string.Equals(b.ArtifactEvidenceId, observation.EvidenceId, StringComparison.Ordinal) &&
            !string.IsNullOrWhiteSpace(b.IdentityId)).ToArray();
        var exposures = new List<DependencyIdentityExposure>();

        foreach (var group in candidates.GroupBy(b => b.IdentityId, StringComparer.Ordinal))
        {
            // Ambiguous or contradictory provenance cannot establish an exposure.
            var records = group.ToArray();

            if (records.Length != 1) continue;
            var b = records[0];

            if (!b.ArtifactExecuting || b.ObservedAt > now || now - b.ObservedAt > maximumAge ||
                b.ValidUntil <= now || b.ValidUntil <= b.ObservedAt ||
                string.IsNullOrWhiteSpace(b.BindingEvidenceId) ||
                b.GrantedCapabilities is not { Count: > 0 and <= 1000 } ||
                b.GrantedCapabilities.Any(string.IsNullOrWhiteSpace)) continue;
            exposures.Add(new(request, b.IdentityId, observation.EvidenceId, b.BindingEvidenceId,
                match.AdvisoryIds.Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray(),
                b.GrantedCapabilities.Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray()));
        }
        return exposures.OrderBy(e => e.IdentityId, StringComparer.Ordinal).ToArray();
    }
}
