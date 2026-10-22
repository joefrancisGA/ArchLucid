namespace ArchLucid.Application.Tenancy;

/// <summary>Summary emitted as the durable background job result JSON.</summary>
public sealed class TenantDeletionResult
{
    public Guid TenantId
    {
        get;
        init;
    }

    public int SqlRowsDeleted
    {
        get;
        init;
    }

    public IReadOnlyDictionary<string, int> SqlRowCountsByTable
    {
        get;
        init;
    } = new Dictionary<string, int>();

    public IReadOnlyDictionary<string, int> BlobsDeletedByContainer
    {
        get;
        init;
    } = new Dictionary<string, int>();
}
