namespace ArchLucid.Decisioning.Governance.PolicyPacks;

/// <summary>Compatibility shim; canonical source is <see cref="ArchLucid.Core.Governance.PolicyPacks.PolicyPackJsonSerializerOptions" />.</summary>
public static class PolicyPackJsonSerializerOptions
{
    public static System.Text.Json.JsonSerializerOptions Default { get; } = ArchLucid.Core.Governance.PolicyPacks.PolicyPackJsonSerializerOptions.Default;
}
