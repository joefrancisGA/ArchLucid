namespace ArchLucid.Application.Pilots;

/// <summary>
///     V1 sponsor exports always disclose deferred buyer requirements (SOC 2 CPA, third-party pen test, etc.).
/// </summary>
public static class SponsorDeferredBuyerRequirementsResolver
{
    /// <summary>Until GTM owner programs ship, sponsor evidence-basis labels include deferred scope.</summary>
    public const bool V1DeferredScopeAlwaysPresent = true;
}
