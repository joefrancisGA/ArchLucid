namespace ArchiForge.Api.Models;

public sealed class ReplayRunRequest
{
    public bool CommitReplay { get; set; } = false;
    public string ExecutionMode { get; set; } = "Current";
    public string? ManifestVersionOverride { get; set; }
}
