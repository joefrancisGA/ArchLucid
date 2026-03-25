namespace ArchiForge.Api.Tests;

public sealed class ManifestServiceDto
{
    public string ServiceId { get; set; } = string.Empty;
    public string ServiceName { get; set; } = string.Empty;
    public List<string> RequiredControls { get; set; } = [];
}
