using ArchLucid.Contracts.Findings;

namespace ArchLucid.Contracts.Governance;

/// <summary>Request body for recording a finding disposition (TB-058).</summary>
public sealed class RecordFindingDispositionRequest
{
    public required string FindingId
    {
        get;
        init;
    }

    public Guid? RunId
    {
        get;
        init;
    }

    public required FindingDisposition Disposition
    {
        get;
        init;
    }

    public string? Rationale
    {
        get;
        init;
    }

    /// <summary>Explicit trade-off narrative required when disposition is Accepted (assessment item 51).</summary>
    public string? TradeOffAcknowledgment
    {
        get;
        init;
    }

    public DateTimeOffset? RevisitDueUtc
    {
        get;
        init;
    }

    public string? EvidenceRequestText
    {
        get;
        init;
    }

    /// <summary>Working desk attestation that impact preview completed before Remediated (LP-14).</summary>
    public bool? ImpactPreviewCompleted
    {
        get;
        init;
    }

    /// <summary>Working desk override reason when Remediated without a completed impact preview (LP-14).</summary>
    public string? PreviewOverrideReason
    {
        get;
        init;
    }

    /// <summary>
    ///     Optimistic concurrency token for <c>dbo.FindingCurrentDispositions</c> (ADR 0076). Required when a current
    ///     disposition pointer already exists; omit only for the first disposition on a finding.
    /// </summary>
    public string? ExpectedCurrentDispositionRowVersionBase64
    {
        get;
        init;
    }
}
