namespace ArchLucid.Core.Configuration;

/// <summary>Internal cross-tenant analytics rollups (operator-only; pseudonymized tenant keys).</summary>
public sealed class InternalCrossTenantAnalyticsOptions
{
    public const string SectionName = "ArchLucid:InternalCrossTenantAnalytics";

    /// <summary>When false, the daily rollup hosted worker performs no SQL work.</summary>
    public bool RollupJobEnabled
    {
        get;
        init;
    } = true;

    /// <summary>Delay between daily rollup passes (UTC calendar day).</summary>
    public int RollupIntervalHours
    {
        get;
        init;
    } = 24;

    /// <summary>
    ///     HMAC key material for stable <c>AnalyticsTenantKey</c> derivation (Key Vault in production).
    ///     Required when SQL rollups run.
    /// </summary>
    public string? PseudonymizationSalt
    {
        get;
        init;
    }
}
