namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Shared <c>dbo.Tenants</c> projections used by <see cref="DapperTenantRepository"/> directory lookups.
///     Column lists live here so every SELECT stays aligned when the tenant row shape changes.
/// </summary>
internal static class TenantDirectorySql
{
    /// <summary>Full directory projection used by id / slug / name / Entra / list lookups.</summary>
    public const string SelectColumns = """
                                        Id, Name, Slug, Tier, EntraTenantId, DataRegion, CreatedUtc, SuspendedUtc,
                                               TenantErasureRequestedUtc,
                                               OffboardedUtc, ErasureEligibleUtc, LegalHoldUntilUtc, LegalHoldReason, LegalHoldSetByUserId, LegalHoldSetUtc,
                                               TrialStartUtc, TrialExpiresUtc, TrialRunsLimit, TrialRunsUsed, TrialSeatsLimit, TrialSeatsUsed,
                                               TrialStatus, TrialSampleRunId,
                                               TrialArchitecturePreseedEnqueuedUtc, TrialArchitecturePreseedAttemptCount,
                                               TrialArchitecturePreseedFailedUtc, TrialArchitecturePreseedLastError,
                                               TrialWelcomeRunId, TrialFirstManifestCommittedUtc,
                                               BaselineReviewCycleHours, BaselineReviewCycleSource, BaselineReviewCycleCapturedUtc,
                                               BaselineManualPrepHoursPerReview, BaselinePeoplePerReview, BaselineManualPrepCapturedUtc,
                                               CompanySize, ArchitectureTeamSize, IndustryVertical, IndustryVerticalOther,
                                               EnterpriseSeatsLimit, EnterpriseSeatsUsed
                                        """;

    public const string SelectById = $"""
                                      SELECT {SelectColumns}
                                      FROM dbo.Tenants
                                      WHERE Id = @Id;
                                      """;

    public const string SelectBySlug = $"""
                                        SELECT {SelectColumns}
                                        FROM dbo.Tenants
                                        WHERE Slug = @Slug;
                                        """;

    public const string SelectByNormalizedOrganizationName = $"""
                                                              SELECT {SelectColumns}
                                                              FROM dbo.Tenants
                                                              WHERE UPPER(LTRIM(RTRIM(Name))) = @NormalizedOrganizationName;
                                                              """;

    public const string SelectByEntraTenantId = $"""
                                                 SELECT {SelectColumns}
                                                 FROM dbo.Tenants
                                                 WHERE EntraTenantId = @EntraTenantId;
                                                 """;

    public const string ListOrderByCreatedUtcDesc = $"""
                                                     SELECT {SelectColumns}
                                                     FROM dbo.Tenants
                                                     ORDER BY CreatedUtc DESC;
                                                     """;
}
