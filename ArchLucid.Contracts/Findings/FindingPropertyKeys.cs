namespace ArchLucid.Contracts.Findings;

/// <summary>Well-known keys in <see cref="Finding.Properties" />.</summary>
public static class FindingPropertyKeys
{
    public const string EnforcementTier = "enforcementTier";

    public const string TechnologyLedgerRole = "technologyLedgerRole";

    public const string ProviderFamily = "providerFamily";

    public const string TechnologyLedgerEntryIds = "technologyLedgerEntryIds";

    /// <summary>Wave-15 suggestion 144: typed evidence package anchor when the engine declares one.</summary>
    public const string EvidencePackageId = "evidencePackageId";
}
