namespace ArchLucid.Contracts.Governance;

/// <summary>Operator-entered realized-value attestation fields (item 20 hybrid model).</summary>
public sealed class UpsertRealizedValueAttestationRequest
{
    public int? AttestedIncidentsAvoided
    {
        get;
        init;
    }

    public string? AttestedRevenueOrRetentionImpact
    {
        get;
        init;
    }

    public string? AttestedReviewerTimeSavedNote
    {
        get;
        init;
    }
}
