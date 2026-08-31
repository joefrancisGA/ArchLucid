namespace ArchLucid.Contracts.Governance;

/// <summary>
///     Administrator-defined governance environment slot used in approval submit and promotion workflows.
/// </summary>
public sealed class GovernanceEnvironmentDefinition
{
    public string Slug { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;
}
