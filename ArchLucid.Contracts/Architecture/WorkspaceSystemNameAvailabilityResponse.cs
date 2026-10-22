namespace ArchLucid.Contracts.Architecture;

/// <summary>Result of <c>GET /v1/architecture/workspace-system-name-availability</c>.</summary>
public sealed class WorkspaceSystemNameAvailabilityResponse
{
    /// <summary>Trimmed name that was checked (empty when the request omitted a name).</summary>
    public string SystemName { get; init; } = string.Empty;

    /// <summary>
    ///     <see langword="true" /> when the name is free in the current workspace, or when the request name is empty
    ///     after trim (empty names are not reserved).
    /// </summary>
    public bool IsAvailable { get; init; }

    /// <summary>Operator-facing conflict detail when <see cref="IsAvailable" /> is false.</summary>
    public string? ConflictMessage { get; init; }
}
