namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>SQL column limits for <c>dbo.PolicyPackCatalogEntry</c> snapshot fields.</summary>
public static class PolicyPackCatalogEntryLimits
{
    public const int DisplayNameMaxLength = 256;

    public const int DescriptionMaxLength = 2000;
}
