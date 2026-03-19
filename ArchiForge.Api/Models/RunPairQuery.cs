namespace ArchiForge.Api.Models;

/// <summary>Shared query model for run-vs-run comparison endpoints.</summary>
public sealed class RunPairQuery
{
    public string LeftRunId { get; set; } = string.Empty;

    public string RightRunId { get; set; } = string.Empty;
}
