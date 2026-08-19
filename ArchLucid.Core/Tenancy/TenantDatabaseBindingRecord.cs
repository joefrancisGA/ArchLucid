namespace ArchLucid.Core.Tenancy;

public sealed class TenantDatabaseBindingRecord
{
    public Guid TenantId
    {
        get;
        init;
    }

    public string SqlLogicalDatabaseName
    {
        get;
        init;
    } = string.Empty;

    public TenantDatabaseProvisioningState ProvisioningState
    {
        get;
        init;
    }

    public string? LastError
    {
        get;
        init;
    }
}
