using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Contracts.Drafts;

/// <summary>Partial update while <see cref="DraftRequestStatus.Drafting" /> (ADR 0048).</summary>
public sealed class PatchDraftRequest
{
    public string? FreeTextIntent
    {
        get;
        set;
    }

    public string? SystemName
    {
        get;
        set;
    }

    public string? BusinessOutcome
    {
        get;
        set;
    }

    public ActorSet? ActorSet
    {
        get;
        set;
    }
}
