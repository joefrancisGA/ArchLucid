namespace ArchLucid.Contracts.Architecture;

/// <summary>Public capacity signal for the Quick Scan marketing surface.</summary>
public sealed class QuickScanStatusResponse
{
    public bool Enabled { get; init; }

    public bool CapacityAvailable { get; init; }

    public bool RequireSignIn { get; init; }

    public bool SampleResultAvailable { get; init; } = true;
}
