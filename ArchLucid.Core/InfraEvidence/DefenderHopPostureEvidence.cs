namespace ArchLucid.Core.InfraEvidence;

public sealed class DefenderHopPostureEvidence
{
    public IReadOnlySet<Guid> HighAssessmentCloudResourceIds { get; init; } = new HashSet<Guid>();

    public IReadOnlySet<Guid> MediumAssessmentCloudResourceIds { get; init; } = new HashSet<Guid>();

    public IReadOnlySet<Guid> HighAlertCloudResourceIds { get; init; } = new HashSet<Guid>();

    public IReadOnlyList<string> WeakControlNames { get; init; } = [];

    public IReadOnlyDictionary<Guid, string> AttackPathCitationByCloudResourceId { get; init; } =
        new Dictionary<Guid, string>();

    public IReadOnlyDictionary<Guid, int> CriticalOrHighVulnerabilityCountByCloudResourceId { get; init; } =
        new Dictionary<Guid, int>();

    public IReadOnlyDictionary<Guid, string> GovernanceDueByCloudResourceId { get; init; } =
        new Dictionary<Guid, string>();
}
