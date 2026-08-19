namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Buyer-safe finding row captured from a committed run snapshot for demo diffing.
/// </summary>
public sealed class PolicyPackBeforeAfterFindingLine
{
    public required string FindingId { get; init; }

    public required string Severity { get; init; }

    public required string Title { get; init; }

    public bool BlocksCommitUnderConfiguration { get; init; }
}
