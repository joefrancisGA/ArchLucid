
namespace ArchLucid.Api.Services;

/// <summary>Resolved HTTP probe outcome.</summary>
public sealed class OutboundWebhookDryRunResult
{
    public bool TransportSucceeded
    {
        get;
        init;
    }

    public int StatusCode
    {
        get;
        init;
    }

    public string? ReasonPhrase
    {
        get;
        init;
    }

    public string? ResponseBodyPreview
    {
        get;
        init;
    }

    public bool ResponseBodyTruncated
    {
        get;
        init;
    }

    public string? Error
    {
        get;
        init;
    }
}
