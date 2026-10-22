namespace ArchLucid.Contracts.Architecture;

/// <summary>Public capacity signal for the Quick Scan marketing surface.</summary>
public sealed class QuickScanStatusResponse
{
    public bool Enabled { get; init; }

    public bool CapacityAvailable { get; init; }

    public bool RequireSignIn { get; init; }

    public bool SampleResultAvailable { get; init; } = true;

    /// <summary>Resolved operational mode for marketing UX (TB-898).</summary>
    public string? OperationalMode { get; init; }

    /// <summary>Operator-facing public capacity message when AI is unavailable.</summary>
    public string? PublicMessage { get; init; }

    /// <summary>Plain-language capacity state for marketing UX (TB-900).</summary>
    public string? CapacityState { get; init; }

    /// <summary>Visitor-facing explanation for <see cref="CapacityState" />.</summary>
    public string? CapacityStateMessage { get; init; }
}
