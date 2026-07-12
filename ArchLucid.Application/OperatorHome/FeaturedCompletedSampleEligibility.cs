using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.OperatorHome;

/// <summary>Shared eligibility rules for workspace featured completed-sample selection.</summary>
public static class FeaturedCompletedSampleEligibility
{
    public static bool IsEligible(RunRecord run)
    {
        if (run.ArchivedUtc.HasValue)
        {
            return false;
        }

        if (!run.GoldenManifestId.HasValue)
        {
            return false;
        }

        return true;
    }

    public static bool IsSampleApproved(RunRecord run) => run.IsPublicShowcase || run.IsSample;

    public static string ResolveReviewTitle(RunRecord run)
    {
        string description = run.Description?.Trim() ?? string.Empty;

        if (description.Length > 0)
        {
            return description;
        }

        return "Completed review";
    }

    public static string ResolveArchitectureName(RunRecord run)
    {
        string description = run.Description?.Trim() ?? string.Empty;

        if (description.Length > 0)
        {
            return description;
        }

        return "Architecture review";
    }

    public static DateTimeOffset ResolveCompletedUtc(RunRecord run)
    {
        if (run.CompletedUtc.HasValue)
        {
            return new DateTimeOffset(DateTime.SpecifyKind(run.CompletedUtc.Value, DateTimeKind.Utc));
        }

        return new DateTimeOffset(DateTime.SpecifyKind(run.CreatedUtc, DateTimeKind.Utc));
    }
}
