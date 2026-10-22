namespace ArchLucid.Application.Governance.DefaultPolicyPacks;

/// <summary>One GA bundled policy pack ready for <see cref="DefaultPolicyPackSeeder" />.</summary>
public sealed record DefaultPolicyPackBundleDefinition(
    string PackSlug,
    string DisplayName,
    string Description,
    string ContentJson);
