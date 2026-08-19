namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Repeatable before/after artifact suitable for JSON export, markdown rendering, and Verify snapshots.
/// </summary>
public sealed class PolicyPackBeforeAfterDiffArtifact
{
    public required string DemoLabel { get; init; }

    public required string RunId { get; init; }

    public required PolicyPackBeforeAfterConfigurationSnapshot Before { get; init; }

    public required PolicyPackBeforeAfterConfigurationSnapshot After { get; init; }

    public required PolicyPackBeforeAfterDiffChangeSet Changes { get; init; }

    public required IReadOnlyList<PolicyPackBeforeAfterAuditCitation> AuditTrailCitations { get; init; }
}
