using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Integrations;

/// <summary>Outbound ITSM connectivity for Jira / ServiceNow in the active tenant scope.</summary>
public sealed class ItsmIntegrationHealthStatusResponse
{
    private string status = string.Empty;

    public string Status
    {
        get => status;
        init => status = ContractCollectionDefaults.CoalesceRequired(value);
    }

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