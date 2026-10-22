namespace ArchLucid.Contracts.Findings;

/// <summary>Relational mute state from <c>dbo.FindingRecords</c> keyed by logical <c>FindingId</c>.</summary>
public readonly struct FindingMuteFlag
{
    public FindingMuteFlag(bool isMuted, string? muteReason, DateTimeOffset? expiresAtUtc = null)
    {
        IsMuted = isMuted;
        MuteReason = muteReason;
        ExpiresAtUtc = expiresAtUtc;
    }

    public bool IsMuted
    {
        get;
    }

    public string? MuteReason
    {
        get;
    }

    public DateTimeOffset? ExpiresAtUtc
    {
        get;
    }
}
