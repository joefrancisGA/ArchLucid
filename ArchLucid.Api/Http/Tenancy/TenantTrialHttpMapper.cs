using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Application.Tenancy;

namespace ArchLucid.Api.Http.Tenancy;

internal static class TenantTrialHttpMapper
{
    internal static TenantTrialStatusResponse MapStatus(TenantTrialStatusDto dto) =>
        new()
        {
            Status = dto.Status,
            TrialStartUtc = dto.TrialStartUtc,
            TrialExpiresUtc = dto.TrialExpiresUtc,
            DaysRemaining = dto.DaysRemaining,
            TrialRunsUsed = dto.TrialRunsUsed,
            TrialRunsLimit = dto.TrialRunsLimit,
            TrialSeatsUsed = dto.TrialSeatsUsed,
            TrialSeatsLimit = dto.TrialSeatsLimit,
            TrialSampleRunId = dto.TrialSampleRunId,
            TrialWelcomeRunId = dto.TrialWelcomeRunId,
            FirstCommitUtc = dto.FirstCommitUtc,
            TimeToFirstCommittedManifestTotalSeconds = dto.TimeToFirstCommittedManifestTotalSeconds,
            BaselineReviewCycleHours = dto.BaselineReviewCycleHours,
            BaselineReviewCycleSource = dto.BaselineReviewCycleSource,
            BaselineReviewCycleCapturedUtc = dto.BaselineReviewCycleCapturedUtc,
            IdentityHandoffPending = dto.IdentityHandoffPending,
        };

    internal static TenantTrialLinkEntraBody MapLinkEntraBody(TenantLinkEntraRequest request) =>
        new()
        {
            EntraTenantId = request.EntraTenantId,
            LocalEmail = request.LocalEmail,
            EntraOid = request.EntraOid,
        };

    internal static TenantTrialConvertBody? MapConvertBody(TenantTrialConvertRequest? request) =>
        request is null ? null : new TenantTrialConvertBody { TargetTier = request.TargetTier };
}
