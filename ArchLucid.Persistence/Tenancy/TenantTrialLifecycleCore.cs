using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>
///     Shared tenant trial-lifecycle mapping and validation used by SQL and in-memory <see cref="ITenantRepository" /> implementations.
/// </summary>
internal static class TenantTrialLifecycleCore
{
    public sealed class CommitSelfServiceTrialMutation
    {
        public required DateTimeOffset TrialStartUtc { get; init; }

        public required DateTimeOffset TrialExpiresUtc { get; init; }

        public required int TrialRunsLimit { get; init; }

        public required int TrialSeatsLimit { get; init; }

        public required Guid TrialSampleRunId { get; init; }

        public decimal? BaselineReviewCycleHours { get; init; }

        public string? BaselineReviewCycleSource { get; init; }

        public DateTimeOffset? BaselineReviewCycleCapturedUtc { get; init; }

        public string? CompanySize { get; init; }

        public int? ArchitectureTeamSize { get; init; }

        public string? IndustryVertical { get; init; }

        public string? IndustryVerticalOther { get; init; }
    }

    public sealed class PersistTrialSignupBaselineReviewCycleMutation
    {
        public required decimal BaselineReviewCycleHours { get; init; }

        public string? BaselineReviewCycleSource { get; init; }

        public required DateTimeOffset BaselineReviewCycleCapturedUtc { get; init; }
    }

    public sealed class TrialFirstManifestSourceRow
    {
        public required int TrialRunsUsed { get; init; }

        public int? TrialRunsLimit { get; init; }

        public required DateTimeOffset CreatedUtc { get; init; }

        public DateTimeOffset? TrialStartUtc { get; init; }
    }

    public static CommitSelfServiceTrialMutation CreateCommitSelfServiceTrialMutation(
        DateTimeOffset trialStartUtc,
        DateTimeOffset trialExpiresUtc,
        int runsLimit,
        int seatsLimit,
        Guid sampleRunId,
        decimal? baselineReviewCycleHours,
        string? baselineReviewCycleSource,
        DateTimeOffset? baselineReviewCycleCapturedUtc,
        string? companySize,
        int? architectureTeamSize,
        string? industryVertical,
        string? industryVerticalOther) =>
        new()
        {
            TrialStartUtc = trialStartUtc,
            TrialExpiresUtc = trialExpiresUtc,
            TrialRunsLimit = runsLimit,
            TrialSeatsLimit = seatsLimit,
            TrialSampleRunId = sampleRunId,
            BaselineReviewCycleHours = baselineReviewCycleHours,
            BaselineReviewCycleSource = baselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = baselineReviewCycleCapturedUtc,
            CompanySize = companySize,
            ArchitectureTeamSize = architectureTeamSize,
            IndustryVertical = industryVertical,
            IndustryVerticalOther = industryVerticalOther,
        };

    public static object CreateCommitSelfServiceTrialSqlParameters(Guid tenantId, CommitSelfServiceTrialMutation mutation)
    {
        ArgumentNullException.ThrowIfNull(mutation);

        return new
        {
            Id = tenantId,
            TrialStartUtc = mutation.TrialStartUtc,
            TrialExpiresUtc = mutation.TrialExpiresUtc,
            TrialRunsLimit = mutation.TrialRunsLimit,
            TrialSeatsLimit = mutation.TrialSeatsLimit,
            TrialStatus = TrialLifecycleStatus.Active,
            TrialSampleRunId = mutation.TrialSampleRunId,
            BaselineReviewCycleHours = mutation.BaselineReviewCycleHours,
            BaselineReviewCycleSource = mutation.BaselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = mutation.BaselineReviewCycleCapturedUtc,
            CompanySize = mutation.CompanySize,
            ArchitectureTeamSize = mutation.ArchitectureTeamSize,
            IndustryVertical = mutation.IndustryVertical,
            IndustryVerticalOther = mutation.IndustryVerticalOther,
        };
    }

    public static TenantRecord ApplyCommitSelfServiceTrial(TenantRecord existing, CommitSelfServiceTrialMutation mutation)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(mutation);

        return new TenantRecord
        {
            Id = existing.Id,
            Name = existing.Name,
            Slug = existing.Slug,
            Tier = existing.Tier,
            EntraTenantId = existing.EntraTenantId,
            DataRegion = existing.DataRegion,
            CreatedUtc = existing.CreatedUtc,
            SuspendedUtc = existing.SuspendedUtc,
            TrialStartUtc = mutation.TrialStartUtc,
            TrialExpiresUtc = mutation.TrialExpiresUtc,
            TrialRunsLimit = mutation.TrialRunsLimit,
            TrialRunsUsed = 0,
            TrialSeatsLimit = mutation.TrialSeatsLimit,
            TrialSeatsUsed = 0,
            TrialStatus = TrialLifecycleStatus.Active,
            TrialSampleRunId = mutation.TrialSampleRunId,
            TrialArchitecturePreseedEnqueuedUtc = null,
            TrialWelcomeRunId = null,
            TrialFirstManifestCommittedUtc = existing.TrialFirstManifestCommittedUtc,
            BaselineReviewCycleHours = mutation.BaselineReviewCycleHours,
            BaselineReviewCycleSource = mutation.BaselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = mutation.BaselineReviewCycleCapturedUtc,
            CompanySize = mutation.CompanySize,
            ArchitectureTeamSize = mutation.ArchitectureTeamSize,
            IndustryVertical = mutation.IndustryVertical,
            IndustryVerticalOther = mutation.IndustryVerticalOther,
            BaselineManualPrepHoursPerReview = existing.BaselineManualPrepHoursPerReview,
            BaselinePeoplePerReview = existing.BaselinePeoplePerReview,
            BaselineManualPrepCapturedUtc = existing.BaselineManualPrepCapturedUtc,
            EnterpriseSeatsLimit = existing.EnterpriseSeatsLimit,
            EnterpriseSeatsUsed = existing.EnterpriseSeatsUsed,
            OffboardedUtc = existing.OffboardedUtc,
            ErasureEligibleUtc = existing.ErasureEligibleUtc,
            LegalHoldUntilUtc = existing.LegalHoldUntilUtc,
            LegalHoldReason = existing.LegalHoldReason,
            LegalHoldSetByUserId = existing.LegalHoldSetByUserId,
            LegalHoldSetUtc = existing.LegalHoldSetUtc,
            TenantErasureRequestedUtc = existing.TenantErasureRequestedUtc,
            TenantErasureApprovedUtc = existing.TenantErasureApprovedUtc,
            TenantErasureApprovedByUserId = existing.TenantErasureApprovedByUserId,
        };
    }

    public static TenantRecord ApplyPersistTrialSignupBaselineReviewCycle(
        TenantRecord existing,
        PersistTrialSignupBaselineReviewCycleMutation mutation)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(mutation);

        return new TenantRecord
        {
            Id = existing.Id,
            Name = existing.Name,
            Slug = existing.Slug,
            Tier = existing.Tier,
            EntraTenantId = existing.EntraTenantId,
            DataRegion = existing.DataRegion,
            CreatedUtc = existing.CreatedUtc,
            SuspendedUtc = existing.SuspendedUtc,
            TrialStartUtc = existing.TrialStartUtc,
            TrialExpiresUtc = existing.TrialExpiresUtc,
            TrialRunsLimit = existing.TrialRunsLimit,
            TrialRunsUsed = existing.TrialRunsUsed,
            TrialSeatsLimit = existing.TrialSeatsLimit,
            TrialSeatsUsed = existing.TrialSeatsUsed,
            TrialStatus = existing.TrialStatus,
            TrialSampleRunId = existing.TrialSampleRunId,
            TrialArchitecturePreseedEnqueuedUtc = existing.TrialArchitecturePreseedEnqueuedUtc,
            TrialWelcomeRunId = existing.TrialWelcomeRunId,
            TrialFirstManifestCommittedUtc = existing.TrialFirstManifestCommittedUtc,
            BaselineReviewCycleHours = mutation.BaselineReviewCycleHours,
            BaselineReviewCycleSource = mutation.BaselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = mutation.BaselineReviewCycleCapturedUtc,
            BaselineManualPrepHoursPerReview = existing.BaselineManualPrepHoursPerReview,
            BaselinePeoplePerReview = existing.BaselinePeoplePerReview,
            BaselineManualPrepCapturedUtc = existing.BaselineManualPrepCapturedUtc,
            CompanySize = existing.CompanySize,
            ArchitectureTeamSize = existing.ArchitectureTeamSize,
            IndustryVertical = existing.IndustryVertical,
            IndustryVerticalOther = existing.IndustryVerticalOther,
            EnterpriseSeatsLimit = existing.EnterpriseSeatsLimit,
            EnterpriseSeatsUsed = existing.EnterpriseSeatsUsed,
            OffboardedUtc = existing.OffboardedUtc,
            ErasureEligibleUtc = existing.ErasureEligibleUtc,
            LegalHoldUntilUtc = existing.LegalHoldUntilUtc,
            LegalHoldReason = existing.LegalHoldReason,
            LegalHoldSetByUserId = existing.LegalHoldSetByUserId,
            LegalHoldSetUtc = existing.LegalHoldSetUtc,
            TenantErasureRequestedUtc = existing.TenantErasureRequestedUtc,
            TenantErasureApprovedUtc = existing.TenantErasureApprovedUtc,
            TenantErasureApprovedByUserId = existing.TenantErasureApprovedByUserId,
        };
    }

    public static TenantRecord? TryApplyMarkTrialConverted(TenantRecord existing, TenantTier? newCommercialTier)
    {
        ArgumentNullException.ThrowIfNull(existing);

        if (!string.Equals(existing.TrialStatus, TrialLifecycleStatus.Active, StringComparison.Ordinal))
            return null;

        TenantTier tier = newCommercialTier ?? existing.Tier;

        return new TenantRecord
        {
            Id = existing.Id,
            Name = existing.Name,
            Slug = existing.Slug,
            Tier = tier,
            EntraTenantId = existing.EntraTenantId,
            DataRegion = existing.DataRegion,
            CreatedUtc = existing.CreatedUtc,
            SuspendedUtc = existing.SuspendedUtc,
            TrialStartUtc = existing.TrialStartUtc,
            TrialExpiresUtc = existing.TrialExpiresUtc,
            TrialRunsLimit = existing.TrialRunsLimit,
            TrialRunsUsed = existing.TrialRunsUsed,
            TrialSeatsLimit = existing.TrialSeatsLimit,
            TrialSeatsUsed = existing.TrialSeatsUsed,
            TrialStatus = TrialLifecycleStatus.Converted,
            TrialSampleRunId = existing.TrialSampleRunId,
            TrialArchitecturePreseedEnqueuedUtc = existing.TrialArchitecturePreseedEnqueuedUtc,
            TrialWelcomeRunId = existing.TrialWelcomeRunId,
            TrialFirstManifestCommittedUtc = existing.TrialFirstManifestCommittedUtc,
            BaselineReviewCycleHours = existing.BaselineReviewCycleHours,
            BaselineReviewCycleSource = existing.BaselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = existing.BaselineReviewCycleCapturedUtc,
            BaselineManualPrepHoursPerReview = existing.BaselineManualPrepHoursPerReview,
            BaselinePeoplePerReview = existing.BaselinePeoplePerReview,
            BaselineManualPrepCapturedUtc = existing.BaselineManualPrepCapturedUtc,
            CompanySize = existing.CompanySize,
            ArchitectureTeamSize = existing.ArchitectureTeamSize,
            IndustryVertical = existing.IndustryVertical,
            IndustryVerticalOther = existing.IndustryVerticalOther,
            EnterpriseSeatsLimit = existing.EnterpriseSeatsLimit,
            EnterpriseSeatsUsed = existing.EnterpriseSeatsUsed,
            OffboardedUtc = existing.OffboardedUtc,
            ErasureEligibleUtc = existing.ErasureEligibleUtc,
            LegalHoldUntilUtc = existing.LegalHoldUntilUtc,
            LegalHoldReason = existing.LegalHoldReason,
            LegalHoldSetByUserId = existing.LegalHoldSetByUserId,
            LegalHoldSetUtc = existing.LegalHoldSetUtc,
            TenantErasureRequestedUtc = existing.TenantErasureRequestedUtc,
            TenantErasureApprovedUtc = existing.TenantErasureApprovedUtc,
            TenantErasureApprovedByUserId = existing.TenantErasureApprovedByUserId,
        };
    }

    public static bool IsTrialLifecycleAutomationCandidate(TenantRecord tenant)
    {
        ArgumentNullException.ThrowIfNull(tenant);

        return tenant.TrialExpiresUtc is not null
               && !string.IsNullOrWhiteSpace(tenant.TrialStatus)
               && !string.Equals(tenant.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal)
               && tenant.OffboardedUtc is null;
    }

    public static TrialFirstManifestCommitOutcome ComputeFirstManifestCommitOutcome(
        TrialFirstManifestSourceRow row,
        DateTimeOffset committedUtc)
    {
        ArgumentNullException.ThrowIfNull(row);

        DateTimeOffset anchor = row.TrialStartUtc ?? row.CreatedUtc;
        double seconds = (committedUtc - anchor).TotalSeconds;

        double ratio = 0;

        if (row.TrialRunsLimit is { } limit and > 0)

            ratio = (double)row.TrialRunsUsed / limit;

        return new TrialFirstManifestCommitOutcome { SignupToCommitSeconds = seconds, TrialRunUsageRatio = ratio };
    }
}
