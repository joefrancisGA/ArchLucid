namespace ArchLucid.Retrieval.Models;

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

public static class CorpusKindSentinels
{
    /// <summary>Platform-scoped corpora use TenantId = Guid.Empty.</summary>
    public static readonly Guid PlatformSentinelTenantId = Guid.Empty;
}
