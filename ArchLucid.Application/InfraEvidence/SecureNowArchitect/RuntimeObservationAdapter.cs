using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Requested observation scope; supplied by the authorized application caller.</summary>
internal sealed record RuntimeObservationRequest(
    Guid TenantId, Guid WorkspaceId, Guid ProjectId, string ResourceId,
    string DeploymentGeneration, string RuntimeFamily);

internal sealed record RuntimeObservedInstance(string InstanceId, string Version, DateTimeOffset ObservedAt)
{
    // Optional signed process provenance. Legacy observations remain version-only.
    public string? Vendor { get; init; }
    public string? Distribution { get; init; }
    public IReadOnlyDictionary<string, RuntimePrerequisiteState>? Prerequisites { get; init; }
}

/// <summary>
/// Result of an authenticated, authorized runtime collector, not a serialized inventory claim.
/// The collector must independently establish resource access, deployment identity, enumeration
/// completeness and process-level version evidence. No production implementation is registered yet.
/// </summary>
internal sealed record RuntimeObservationBatch(
    RuntimeObservationRequest Scope,
    DateTimeOffset EnumeratedAt,
    bool Complete,
    IReadOnlyCollection<string> InstanceIds,
    IReadOnlyCollection<RuntimeObservedInstance> Observations,
    string EvidenceReference);

internal interface IAuthorizedRuntimeObservationSource
{
    Task<RuntimeObservationBatch?> ReadAsync(
        RuntimeObservationRequest request, CancellationToken cancellationToken);
}

internal sealed record RuntimeObservationAssessment(
    RuntimePatchAssessment Patch, string? EvidenceReference);

/// <summary>
/// Accepts evidence exclusively from a server-selected trusted source. Imported properties,
/// uploaded JSON and user assertions are not observation sources. The injected source is a
/// trust boundary: it must authenticate its upstream and enforce scoped authorization.
/// </summary>
internal sealed class RuntimeObservationAdapter(IAuthorizedRuntimeObservationSource source)
{
    public async Task<RuntimeObservationAssessment> AssessAsync(
        ScopeContext scope,
        RuntimeObservationRequest request,
        string minimumFixedVersion,
        DateTimeOffset now,
        TimeSpan maximumAge,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();

        if (scope.TenantId == Guid.Empty || scope.WorkspaceId == Guid.Empty || scope.ProjectId == Guid.Empty
            || request.TenantId != scope.TenantId || request.WorkspaceId != scope.WorkspaceId
            || request.ProjectId != scope.ProjectId
            || string.IsNullOrWhiteSpace(request.ResourceId)
            || string.IsNullOrWhiteSpace(request.DeploymentGeneration)
            || string.IsNullOrWhiteSpace(request.RuntimeFamily)
            || maximumAge <= TimeSpan.Zero)
        {
            return Unknown("Runtime observation request is invalid or outside the authorized scope.");
        }

        RuntimeObservationBatch? batch = await source.ReadAsync(request, cancellationToken);
        cancellationToken.ThrowIfCancellationRequested();

        if (batch is null || batch.Scope != request
            || string.IsNullOrWhiteSpace(batch.EvidenceReference)
            || batch.InstanceIds is null || batch.Observations is null
            || batch.EnumeratedAt > now || now - batch.EnumeratedAt > maximumAge
            || batch.InstanceIds.Count == 0
            || batch.InstanceIds.Any(string.IsNullOrWhiteSpace)
            || batch.InstanceIds.Distinct(StringComparer.Ordinal).Count() != batch.InstanceIds.Count)
        {
            return Unknown("No current, scoped runtime enumeration with provenance is available.");
        }

        // Bind identities unambiguously to deployment generation, even if a platform reuses worker IDs.
        string Bind(string instanceId) => $"{request.DeploymentGeneration.Length}:{request.DeploymentGeneration}{instanceId}";
        HashSet<string> expected = new(batch.InstanceIds, StringComparer.Ordinal);
        if (batch.Observations.Any(item => item is null
            || string.IsNullOrWhiteSpace(item.InstanceId)
            || !expected.Contains(item.InstanceId)
            || item.ObservedAt < batch.EnumeratedAt
            || item.ObservedAt > now))
        {
            return Unknown("Runtime observations are outside the enumerated instance or time boundary.");
        }

        RuntimeInstanceScope evaluatorScope = new(
            request.TenantId.ToString("D"), request.ResourceId, request.RuntimeFamily,
            batch.InstanceIds.Select(Bind).ToArray(), batch.EnumeratedAt, true, batch.Complete);
        RuntimeVersionEvidence[] observations = batch.Observations.Select(item => new RuntimeVersionEvidence(
            evaluatorScope.TenantId, request.ResourceId, Bind(item.InstanceId), request.RuntimeFamily,
            RuntimeEvidenceKind.Executing, item.Version, item.ObservedAt, true)).ToArray();

        return new(RuntimePatchEvidenceEvaluator.Evaluate(
            evaluatorScope, minimumFixedVersion, observations, now, maximumAge), batch.EvidenceReference);
    }

    private static RuntimeObservationAssessment Unknown(string reason) =>
        new(new RuntimePatchAssessment(RuntimePatchStatus.Unknown, reason), null);
}
