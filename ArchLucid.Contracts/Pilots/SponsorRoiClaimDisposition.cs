namespace ArchLucid.Contracts.Pilots;

/// <summary>
///     Sponsor-facing ROI narrative gate — presentation only; does not change ROI math.
/// </summary>
public enum SponsorRoiClaimDisposition
{
    Pass,
    Warn,
    Hold,
}
