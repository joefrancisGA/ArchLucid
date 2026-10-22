namespace ArchLucid.Contracts.Integrations;

public sealed class ItsmIntegrationHealthProviderProbeResponse
{
    public bool LocallyConfigured
    {
        get;
        init;
    }

    public bool? Reachable
    {
        get;
        init;
    }

    public string Summary
    {
        get;
        init;
    } = string.Empty;
}
