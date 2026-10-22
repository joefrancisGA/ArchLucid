namespace ArchLucid.Contracts.Diagnostics;

/// <summary>One non-secret probe row for workspace AI availability diagnostics.</summary>
public sealed class WorkspaceAiAvailabilityCheckRow
{
    public string Name { get; init; } = string.Empty;

    /// <summary><c>ok</c>, <c>failed</c>, <c>degraded</c>, or <c>skipped</c>.</summary>
    public string Status { get; init; } = string.Empty;

    public string Detail { get; init; } = string.Empty;
}
