namespace ArchLucid.Api.Models.Tenancy;

/// <summary>Body for <c>PUT /v1/tenant/baseline</c> — optional fields merge with the existing tenant row.</summary>
public sealed class TenantBaselinePutRequest
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

    /// <summary>When set, persists review-cycle baseline hours for ROI deltas (signup-equivalent columns).</summary>
    public decimal? BaselineReviewCycleHours
    {
        get;
        init;
    }

    /// <summary>Optional operator note appended after reserved <c>baseline_settings:</c> persistence marker.</summary>
    public string? BaselineReviewCycleSourceNote
    {
        get;
        init;
    }
}
