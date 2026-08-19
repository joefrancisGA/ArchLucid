namespace ArchLucid.Contracts.Governance;

/// <summary>Read model for tenant-scoped realized-value attestation (Batch B item 4).</summary>
public sealed class RealizedValueAttestationResponse
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

    /// <summary>True when any attestation field is populated.</summary>
    public bool HasAttestation
    {
        get;
        init;
    }
}
