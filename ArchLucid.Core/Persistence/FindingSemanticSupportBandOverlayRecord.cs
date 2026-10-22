using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Persistence;

/// <summary>
///     AS-060: post-commit overlay for <see cref="Finding.SemanticSupportBand" /> (does not mutate sealed finding prose).
/// </summary>
public sealed class FindingSemanticSupportBandOverlayRecord
{
    public string FindingId
    {
        get;
        init;
    } = "";

    public FindingSemanticSupportBand Band
    {
        get;
        init;
    }

    public string ScorerVersion
    {
        get;
        init;
    } = "";

    public string? EvidenceExcerptHashSha256
    {
        get;
        init;
    }

    public DateTime ScoredAtUtc
    {
        get;
        init;
    }

    public DateTime UpdatedUtc
    {
        get;
        init;
    }

    public DateTime? FrozenAtUtc
    {
        get;
        init;
    }
}
