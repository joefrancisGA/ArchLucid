namespace ArchLucid.Core.InfraEvidence;

public sealed class DefenderHopPostureEvidence
{
    public IReadOnlySet<Guid> HighAssessmentCloudResourceIds { get; init; } = new HashSet<Guid>();

    public IReadOnlySet<Guid> MediumAssessmentCloudResourceIds { get; init; } = new HashSet<Guid>();

    public IReadOnlyList<string> WeakControlNames { get; init; } = [];
}
