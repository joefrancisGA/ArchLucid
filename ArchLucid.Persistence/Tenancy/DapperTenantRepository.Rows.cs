using ArchLucid.Core.Tenancy;

namespace ArchLucid.Persistence.Tenancy;

public sealed partial class DapperTenantRepository
{
    private sealed class TenantRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public string Slug
        {
            get;
            init;
        } = string.Empty;

        public string Tier
        {
            get;
            init;
        } = string.Empty;

        public Guid? EntraTenantId
        {
            get;
            init;
        }

        public string DataRegion
        {
            get;
            init;
        } = TenantDataRegions.Default;

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? SuspendedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TenantErasureRequestedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? OffboardedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? ErasureEligibleUtc
        {
            get;
            init;
        }

        public DateTimeOffset? LegalHoldUntilUtc
        {
            get;
            init;
        }

        public string? LegalHoldReason
        {
            get;
            init;
        }

        public string? LegalHoldSetByUserId
        {
            get;
            init;
        }

        public DateTimeOffset? LegalHoldSetUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TrialStartUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TrialExpiresUtc
        {
            get;
            init;
        }

        public int? TrialRunsLimit
        {
            get;
            init;
        }

        public int TrialRunsUsed
        {
            get;
            init;
        }

        public int? TrialSeatsLimit
        {
            get;
            init;
        }

        public int TrialSeatsUsed
        {
            get;
            init;
        }

        public string? TrialStatus
        {
            get;
            init;
        }

        public Guid? TrialSampleRunId
        {
            get;
            init;
        }

        public DateTimeOffset? TrialArchitecturePreseedEnqueuedUtc
        {
            get;
            init;
        }

        public int TrialArchitecturePreseedAttemptCount
        {
            get;
            init;
        }

        public DateTimeOffset? TrialArchitecturePreseedFailedUtc
        {
            get;
            init;
        }

        public string? TrialArchitecturePreseedLastError
        {
            get;
            init;
        }

        public Guid? TrialWelcomeRunId
        {
            get;
            init;
        }

        public DateTimeOffset? TrialFirstManifestCommittedUtc
        {
            get;
            init;
        }

        public decimal? BaselineReviewCycleHours
        {
            get;
            init;
        }

        public string? BaselineReviewCycleSource
        {
            get;
            init;
        }

        public DateTimeOffset? BaselineReviewCycleCapturedUtc
        {
            get;
            init;
        }

        public decimal? BaselineManualPrepHoursPerReview
        {
            get;
            init;
        }

        public int? BaselinePeoplePerReview
        {
            get;
            init;
        }

        public DateTimeOffset? BaselineManualPrepCapturedUtc
        {
            get;
            init;
        }

        public string? CompanySize
        {
            get;
            init;
        }

        public int? ArchitectureTeamSize
        {
            get;
            init;
        }

        public string? IndustryVertical
        {
            get;
            init;
        }

        public string? IndustryVerticalOther
        {
            get;
            init;
        }

        public int? EnterpriseSeatsLimit
        {
            get;
            init;
        }

        public int EnterpriseSeatsUsed
        {
            get;
            init;
        }

        internal TenantRecord ToRecord()
        {
            return new TenantRecord
            {
                Id = Id,
                Name = Name,
                Slug = Slug,
                Tier = TenantTierSql.ParseTier(Tier),
                EntraTenantId = EntraTenantId,
                DataRegion = TenantDataRegions.NormalizeOptional(DataRegion),
                CreatedUtc = CreatedUtc,
                SuspendedUtc = SuspendedUtc,
                TenantErasureRequestedUtc = TenantErasureRequestedUtc,
                OffboardedUtc = OffboardedUtc,
                ErasureEligibleUtc = ErasureEligibleUtc,
                LegalHoldUntilUtc = LegalHoldUntilUtc,
                LegalHoldReason = LegalHoldReason,
                LegalHoldSetByUserId = LegalHoldSetByUserId,
                LegalHoldSetUtc = LegalHoldSetUtc,
                TrialStartUtc = TrialStartUtc,
                TrialExpiresUtc = TrialExpiresUtc,
                TrialRunsLimit = TrialRunsLimit,
                TrialRunsUsed = TrialRunsUsed,
                TrialSeatsLimit = TrialSeatsLimit,
                TrialSeatsUsed = TrialSeatsUsed,
                TrialStatus = TrialStatus,
                TrialSampleRunId = TrialSampleRunId,
                TrialArchitecturePreseedEnqueuedUtc = TrialArchitecturePreseedEnqueuedUtc,
                TrialArchitecturePreseedAttemptCount = TrialArchitecturePreseedAttemptCount,
                TrialArchitecturePreseedFailedUtc = TrialArchitecturePreseedFailedUtc,
                TrialArchitecturePreseedLastError = TrialArchitecturePreseedLastError,
                TrialWelcomeRunId = TrialWelcomeRunId,
                TrialFirstManifestCommittedUtc = TrialFirstManifestCommittedUtc,
                BaselineReviewCycleHours = BaselineReviewCycleHours,
                BaselineReviewCycleSource = BaselineReviewCycleSource,
                BaselineReviewCycleCapturedUtc = BaselineReviewCycleCapturedUtc,
                BaselineManualPrepHoursPerReview = BaselineManualPrepHoursPerReview,
                BaselinePeoplePerReview = BaselinePeoplePerReview,
                BaselineManualPrepCapturedUtc = BaselineManualPrepCapturedUtc,
                CompanySize = CompanySize,
                ArchitectureTeamSize = ArchitectureTeamSize,
                IndustryVertical = IndustryVertical,
                IndustryVerticalOther = IndustryVerticalOther,
                EnterpriseSeatsLimit = EnterpriseSeatsLimit,
                EnterpriseSeatsUsed = EnterpriseSeatsUsed
            };
        }
    }

    private sealed class WorkspaceRow
    {
        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid DefaultProjectId
        {
            get;
            init;
        }
    }

    private sealed class WorkspaceListRow
    {
        public Guid WorkspaceId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string Name
        {
            get;
            init;
        } = string.Empty;

        public Guid DefaultProjectId
        {
            get;
            init;
        }

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }
    }

    private sealed class TenantSeatRow
    {
        public string? TrialStatus
        {
            get;
            init;
        }

        public int? TrialSeatsLimit
        {
            get;
            init;
        }

        public int TrialSeatsUsed
        {
            get;
            init;
        }

        public DateTimeOffset? TrialExpiresUtc
        {
            get;
            init;
        }
    }

    private sealed class TrialRunGateRow
    {
        public string? TrialStatus
        {
            get;
            init;
        }

        public DateTimeOffset? TrialExpiresUtc
        {
            get;
            init;
        }

        public int? TrialRunsLimit
        {
            get;
            init;
        }

        public int TrialRunsUsed
        {
            get;
            init;
        }
    }

    private sealed class TrialFirstManifestOutputRow
    {
        public int TrialRunsUsed
        {
            get;
            init;
        }

        public int? TrialRunsLimit
        {
            get;
            init;
        }

        public DateTimeOffset CreatedUtc
        {
            get;
            init;
        }

        public DateTimeOffset? TrialStartUtc
        {
            get;
            init;
        }
    }
}
