namespace ArchLucid.Contracts.Governance.Coverage;

/// <summary>Coverage classification for policy-pack selection behavior (orthogonal to pack.category).</summary>
public enum CoverageType
{
    ProviderNeutralBaseline,
    OrganizationRequired,
    PlatformOverlay,
    ContextualRecommended,
    AdditionalOptional,
}
