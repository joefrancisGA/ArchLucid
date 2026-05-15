namespace ArchLucid.Api.Models.Integrations;

/// <summary>Wire representation for one outbound ITSM vendor probe.</summary>
public sealed class ItsmIntegrationHealthProbeVm
{
    public bool LocallyConfigured { get; init; }

    public bool? Reachable { get; init; }

    public string Summary { get; init; } = string.Empty;
}
