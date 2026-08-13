namespace ArchLucid.Application.Pilots;

/// <summary>
///     Sponsor-safe novelty confidence for first-value and sponsor exports — not blind-validation scores.
/// </summary>
public enum SponsorNoveltyConfidence
{
    NotAssessed = 0,
    Low = 1,
    Partial = 2,
    Strong = 3,
}
