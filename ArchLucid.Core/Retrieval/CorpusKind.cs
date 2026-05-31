namespace ArchLucid.Core.Retrieval;

/// <summary>Typed corpus discriminator for retrieval indexing and MCP filters.</summary>
public enum CorpusKind
{
    Conversation,
    TenantManifest,
    PriorManifest,
    PolicyPack,
    PlatformDoc,
    ReferenceArchitecture,
    AzureRetailPrice
}

/// <summary>Platform-scoped corpus sentinel values.</summary>
public static class CorpusKindSentinels
{
    /// <summary>Platform-scoped corpora use TenantId = Guid.Empty.</summary>
    public static readonly Guid PlatformSentinelTenantId = Guid.Empty;
}
