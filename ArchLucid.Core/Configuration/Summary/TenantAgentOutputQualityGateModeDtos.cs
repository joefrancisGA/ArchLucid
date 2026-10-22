namespace ArchLucid.Core.Configuration.Summary;

public sealed class TenantAgentOutputQualityGateModeResponse
{
    public string EffectiveMode { get; set; } = "WarnOnly";

    public string Source { get; set; } = "HostDefault";

    public string HostDefaultMode { get; set; } = "WarnOnly";
}

public sealed class TenantAgentOutputQualityGateModeUpdateRequest
{
    public string Mode { get; set; } = "WarnOnly";
}
