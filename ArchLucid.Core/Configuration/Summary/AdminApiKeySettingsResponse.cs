namespace ArchLucid.Core.Configuration.Summary;

public sealed class AdminApiKeySettingsResponse
{
    public bool Enabled { get; set; }

    public bool DevelopmentBypassAll { get; set; }

    public ApiKeySlotStatusDto Admin { get; set; } = new();

    public ApiKeySlotStatusDto ReadOnly { get; set; } = new();
}
