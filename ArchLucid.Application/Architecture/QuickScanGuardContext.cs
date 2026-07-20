namespace ArchLucid.Application.Architecture;

/// <summary>Caller identity for Quick Scan guard decisions.</summary>
public sealed class QuickScanGuardContext
{
    public required string ClientIp { get; init; }

    public required string SessionId { get; init; }

    public required string PayloadFingerprint { get; init; }

    /// <summary>When true, in-process concurrent scan counting is skipped (distributed store enforces limits).</summary>
    public bool UseDistributedConcurrencyLimit { get; init; }
}
