namespace ArchLucid.Core.Configuration;

/// <summary>
///     Optional Microsoft Graph group-membership reads for SecureNow privilege paths (SA-20).
///     Default off — tenant must grant documented least-privilege scopes; never Global Reader.
/// </summary>
public sealed class EntraGroupMembershipGraphOptions
{
    public const string SectionName = "EntraGroupMembershipGraph";

    /// <summary>When false, hosted collectors must not call Microsoft Graph for group membership.</summary>
    public bool Enabled { get; set; }

    /// <summary>Maximum nested group expansion depth when collecting direct memberOf rows.</summary>
    public int MaxNestedDepth { get; set; } = 5;
}
