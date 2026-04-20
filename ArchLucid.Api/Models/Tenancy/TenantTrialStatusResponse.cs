namespace ArchLucid.Api.Models.Tenancy;

/// <summary>JSON for <c>GET /v1/tenant/trial-status</c>.</summary>
public sealed class TenantTrialStatusResponse
{
    public string Status { get; init; } = "None";

    public DateTimeOffset? TrialStartUtc
    {
        get; init;
    }

    public DateTimeOffset? TrialExpiresUtc
    {
        get; init;
    }

    public int? DaysRemaining
    {
        get; init;
    }

    public int TrialRunsUsed
    {
        get; init;
    }

    public int? TrialRunsLimit
    {
        get; init;
    }

    public int TrialSeatsUsed
    {
        get; init;
    }

    public int? TrialSeatsLimit
    {
        get; init;
    }

    public Guid? TrialSampleRunId
    {
        get; init;
    }

    /// <summary>When set, operator UI may deep-link first visit to <c>/runs/{id}</c> (pre-seeded welcome run).</summary>
    public Guid? TrialWelcomeRunId
    {
        get; init;
    }
}
