namespace ArchLucid.Api.Models.Tenancy;

public sealed class ConnectorSurfaceStatusResponse
{
    public string ConnectorKey
    {
        get;
        set;
    } = "";

    public string DisplayName
    {
        get;
        set;
    } = "";

    public bool IsConfigured
    {
        get;
        set;
    }

    public string SmokeReadiness
    {
        get;
        set;
    } = "";

    public string Summary
    {
        get;
        set;
    } = "";

    public string? ConfigurationHref
    {
        get;
        set;
    }
}
