namespace ArchLucid.Contracts.Integrations;

/// <summary>Outbound ITSM connectivity for Jira / ServiceNow in the active tenant scope.</summary>
public sealed class ItsmIntegrationHealthStatusResponse
{
    public string Status
    {
        get;
        init;
    } = string.Empty;

    public bool NativeEnabled
    {
        get;
        init;
    }

    public ItsmIntegrationHealthProviderProbeResponse Jira
    {
        get;
        init;
    } = new();

    public ItsmIntegrationHealthProviderProbeResponse ServiceNow
    {
        get;
        init;
    } = new();
}
