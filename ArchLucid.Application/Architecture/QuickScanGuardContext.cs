namespace ArchLucid.Application.Architecture;

/// <summary>Caller identity for Quick Scan guard decisions.</summary>
public sealed class QuickScanGuardContext
{
    public required string ClientIp { get; init; }

    public required string SessionId { get; init; }

    public required string PayloadFingerprint { get; init; }
}
