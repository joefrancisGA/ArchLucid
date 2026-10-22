namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Current deferrable baseline fields from <c>dbo.Tenants</c> for the scoped tenant.</summary>
public sealed class TenantBaselineGetResponse
{
    public decimal? ManualPrepHoursPerReview
    {
        get;
        init;
    }

    public int? PeoplePerReview
    {
        get;
        init;
    }

    public DateTimeOffset? CapturedUtc
    {
        get;
        init;
    }

    /// <summary>Median hours from architecture request to reviewable package (tenant baseline).</summary>
    public decimal? BaselineReviewCycleHours
    {
        get;
        init;
    }

    /// <summary>Optional provenance / signup note — operators may persist reserved <c>baseline_settings</c> markers.</summary>
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
}
