namespace ArchLucid.Contracts.Findings;

/// <summary>Relational mute state from <c>dbo.FindingRecords</c> keyed by logical <c>FindingId</c>.</summary>
public readonly struct FindingMuteFlag
{
    public FindingMuteFlag(bool isMuted, string? muteReason)
    {
        IsMuted = isMuted;
        MuteReason = muteReason;
    }

    public bool IsMuted
    {
        get;
    }

    public string? MuteReason
    {
        get;
    }
}
