using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Diagnostics;

/// <summary>Result of <c>GET /v1/diagnostics/workspace-ai-availability</c>.</summary>
public sealed class WorkspaceAiAvailabilityResponse
{
    /// <summary>True when live probes indicate review completions can reach AI for this workspace.</summary>
    public bool IsAvailable { get; init; }

    /// <summary>Always true for successful API responses — UI must not claim outage without this payload.</summary>
    public bool Validated { get; init; } = true;

    /// <summary><c>managed-platform</c>, <c>customer-connection</c>, or <c>simulator</c>.</summary>
    public string AiSource { get; init; } = string.Empty;

    public string Summary { get; init; } = string.Empty;

    public DateTime AsOfUtc { get; init; }

    private IReadOnlyList<WorkspaceAiAvailabilityCheckRow> checks = [];

    public IReadOnlyList<WorkspaceAiAvailabilityCheckRow> Checks
    {
        get => checks;
        init => checks = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    /// <summary>Non-secret configuration and probe metadata for operator troubleshooting.</summary>
    private IReadOnlyDictionary<string, string> debug = new Dictionary<string, string>();

    public IReadOnlyDictionary<string, string> Debug
    {
        get => debug;
        init => debug = value ?? new Dictionary<string, string>();
    }
}
