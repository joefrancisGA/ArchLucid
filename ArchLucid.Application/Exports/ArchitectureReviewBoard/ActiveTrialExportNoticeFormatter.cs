using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Exports.ArchitectureReviewBoard;

/// <summary>Formats trial export watermark/footer copy for DOCX/PDF board packs.</summary>
public static class ActiveTrialExportNoticeFormatter
{
    /// <summary>Base suffix when expiry is unknown.</summary>
    public const string BaseSuffix = "Generated during ArchLucid Trial";

    /// <summary>
    ///     Returns notice text for active trials, or <see langword="null" /> when the tenant is not on an active trial.
    /// </summary>
    public static string? Format(TenantRecord? tenant)
    {
        if (tenant is null)
            return null;

        if (!string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
            return null;

        if (tenant.TrialExpiresUtc is not { } expiresUtc)
            return BaseSuffix;

        return $"{BaseSuffix} — Expires on {expiresUtc:yyyy-MM-dd} UTC";
    }
}
