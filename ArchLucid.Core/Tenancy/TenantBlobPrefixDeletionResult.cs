namespace ArchLucid.Core.Tenancy;

/// <summary>Per-container blob delete counts from <see cref="ITenantBlobPrefixDeletionService" />.</summary>
public sealed class TenantBlobPrefixDeletionResult
{
    public IReadOnlyDictionary<string, int> BlobsDeletedByContainer
    {

        get;
        init;
    } = new Dictionary<string, int>();
}
