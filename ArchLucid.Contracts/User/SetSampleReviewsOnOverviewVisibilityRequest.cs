namespace ArchLucid.Contracts.User;

/// <summary>Request body for <c>PUT /v1/user/preferences/sample-reviews-on-overview</c>.</summary>
public sealed class SetSampleReviewsOnOverviewVisibilityRequest
{
    public bool Enabled
    {
        get;
        set;
    } = true;
}
