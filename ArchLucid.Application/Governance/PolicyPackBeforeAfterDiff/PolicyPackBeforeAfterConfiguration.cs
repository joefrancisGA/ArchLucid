using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     One arm of a policy-pack before/after demo: pack content plus enforcement overrides.
/// </summary>
public sealed class PolicyPackBeforeAfterConfiguration
{
    public required string Label { get; init; }

    public required PolicyPackContentDocument Content { get; init; }

    public bool BlockCommitOnCritical { get; init; }

    public int? BlockCommitMinimumSeverity { get; init; }
}
