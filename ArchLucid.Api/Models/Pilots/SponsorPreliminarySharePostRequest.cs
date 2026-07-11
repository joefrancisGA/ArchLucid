namespace ArchLucid.Api.Models.Pilots;

/// <summary>Optional body for <c>POST /v1/pilots/runs/{runId}/sponsor-preliminary-share</c>.</summary>
public sealed class SponsorPreliminarySharePostRequest
{
    public string? ReadinessStatus
    {
        get;
        init;
    }

    public string[]? KnownGaps
    {
        get;
        init;
    }

    public bool OverrideAcknowledged
    {
        get;
        init;
    }

    public string? ConfidentialityLabel
    {
        get;
        init;
    }

    public string? DeliveryMethod
    {
        get;
        init;
    }
}
