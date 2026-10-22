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

    private ItsmIntegrationHealthProviderProbeResponse jira = new();

    public ItsmIntegrationHealthProviderProbeResponse Jira
    {
        get => jira;
        init => jira = value ?? new();
    }

    private ItsmIntegrationHealthProviderProbeResponse serviceNow = new();

    public ItsmIntegrationHealthProviderProbeResponse ServiceNow
    {
        get => serviceNow;
        init => serviceNow = value ?? new();
    }
}
