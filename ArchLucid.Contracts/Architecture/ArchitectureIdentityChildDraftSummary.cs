using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Contracts.Architecture;

/// <summary>Child draft summary for architecture identity detail (ADR 0074).</summary>
public sealed class ArchitectureIdentityChildDraftSummary
{
    public Guid DraftId
    {
        get;
        set;
    }

    public DraftRequestStatus Status
    {
        get;
        set;
    }

    public string? SystemName
    {
        get;
        set;
    }

    public DateTime UpdatedUtc
    {
        get;
        set;
    }
}
