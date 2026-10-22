namespace ArchLucid.Application.Integrations;

/// <summary>Resolved HTTP probe outcome for outbound webhook dry-runs.</summary>
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
