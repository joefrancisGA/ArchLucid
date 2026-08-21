using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Advisory;

/// <summary>
///     Validates that advisory scan schedules have at least one finalized review to scan against.
/// </summary>
public static class AdvisoryScheduleEligibilityGuard
{
    public const string NoFinalizedReviewMessage =
        "At least one finalized architecture review is required before creating or running an advisory scan schedule.";

    public static async Task<bool> HasFinalizedReviewForProjectAsync(
        IAuthorityQueryService authorityQueryService,
        ScopeContext scope,
        string? runProjectSlug,
        CancellationToken cancellationToken)
    {
        if (authorityQueryService is null)
            throw new ArgumentNullException(nameof(authorityQueryService));

        string slug = NormalizeRunProjectSlug(runProjectSlug);
        Guid? latestCommittedRunId = await authorityQueryService.GetLatestCommittedRunIdByManifestCreatedUtcAsync(
            scope,
            slug,
            cancellationToken);

        return latestCommittedRunId.HasValue;
    }

    internal static string NormalizeRunProjectSlug(string? runProjectSlug)
    {
        if (string.IsNullOrWhiteSpace(runProjectSlug))
            return AdvisoryScanSchedule.DefaultProjectSlug;

        return runProjectSlug.Trim();
    }
}
