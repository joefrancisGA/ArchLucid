namespace ArchLucid.Core.Billing;

/// <summary>
///     Resolves Azure Marketplace <c>planId</c> values to persisted tenant tier storage codes using configured offer
///     mappings (never substring or natural-language inference).
/// </summary>
public interface IMarketplacePlanIdTierResolver
{
    /// <summary>
    ///     Returns <c>Standard</c> or <c>Enterprise</c> (or other configured tier storage code) for a marketplace plan id.
    ///     Unknown ids default to <c>Standard</c>.
    /// </summary>
    string ResolveTierStorageCode(string? planId);
}
