namespace ArchLucid.Contracts.InfraEvidence;

public sealed class CloudResourceCurrentConfigurationSection
{
    public Guid SnapshotId
    {
        get;
        set;
    }

    public string AzureResourceId
    {
        get;
        set;
    } = string.Empty;

    public string ResourceType
    {
        get;
        set;
    } = string.Empty;

    public string? ResourceGroup
    {
        get;
        set;
    }

    public string? Region
    {
        get;
        set;
    }

    public Dictionary<string, string> Properties
    {
        get;
        set;
    } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, string> Tags
    {
        get;
        set;
    } = new(StringComparer.OrdinalIgnoreCase);
}
