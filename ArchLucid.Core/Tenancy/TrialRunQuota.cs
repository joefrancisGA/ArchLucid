namespace ArchLucid.Core.Tenancy;

/// <summary>
///     Rules for when creating a <c>dbo.Runs</c> row should consume self-service trial run allowance.
/// </summary>
public static class TrialRunQuota
{
    /// <summary>
    ///     Prefix for trial welcome / architecture-preseed request ids
    ///     (kept here so Persistence can exempt preseed without referencing Application).
    /// </summary>
    public const string WelcomeRequestIdPrefix = "trial-welcome-";

    /// <summary>
    ///     Sample / demo-welcome / trial preseed runs must not burn the paid trial run allowance.
    /// </summary>
    public static bool ShouldConsumeAllowanceOnCreate(
        bool isSample,
        bool isDemoWelcomeRun,
        string? architectureRequestId)
    {
        if (isSample || isDemoWelcomeRun)
            return false;

        if (string.IsNullOrWhiteSpace(architectureRequestId))
            return true;

        return !architectureRequestId.Trim().StartsWith(WelcomeRequestIdPrefix, StringComparison.OrdinalIgnoreCase);
    }
}
