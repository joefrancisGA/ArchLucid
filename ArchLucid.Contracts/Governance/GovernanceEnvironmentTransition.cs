namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Allowed single-step transition from one governance environment slug to another.
/// </summary>
public sealed class GovernanceEnvironmentTransition
{
    public string SourceSlug { get; set; } = string.Empty;

    public string TargetSlug { get; set; } = string.Empty;
}
