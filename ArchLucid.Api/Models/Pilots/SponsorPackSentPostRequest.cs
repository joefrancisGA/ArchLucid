namespace ArchLucid.Api.Models.Pilots;

/// <summary>Optional body for <c>POST /v1/pilots/runs/{runId}/sponsor-pack-sent</c> (TB-243).</summary>
public sealed class SponsorPackSentPostRequest
{
    public string? RecipientEmail
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
