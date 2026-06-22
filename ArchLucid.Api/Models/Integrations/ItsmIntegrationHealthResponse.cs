namespace ArchLucid.Api.Models.Integrations;

/// <summary>Outbound ITSM connectivity for Jira / ServiceNow in the active tenant scope.</summary>
public sealed class ItsmIntegrationHealthResponse
{
    /// <summary>healthy — probes succeeded where configured; not_configured — neither vendor locally ready; unhealthy — upstream failure.</summary>
    public string Status { get; init; } = string.Empty;

    /// <summary>When <see langword="false"/>, one-click outbound create is disabled; correlation register and copy-as-work-item remain available.</summary>
    public bool NativeEnabled { get; init; }

    public ItsmIntegrationHealthProbeVm Jira { get; init; } = null!;

    public ItsmIntegrationHealthProbeVm ServiceNow { get; init; } = null!;
}
