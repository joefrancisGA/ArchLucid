namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Durable audit row reference included in the before/after diff artifact for sponsor evidence.
/// </summary>
public sealed class PolicyPackBeforeAfterAuditCitation
{
    public required string EventType { get; init; }

    public string? RunId { get; init; }

    public Guid? AssignmentId { get; init; }

    public Guid? PolicyPackId { get; init; }

    public string? PolicyPackVersion { get; init; }
}
