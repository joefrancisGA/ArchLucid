namespace ArchLucid.Api.Models;

/// <summary>Result shape for webhook dry-run (matches CLI <c>webhooks test --json</c> fields where practical).</summary>
public sealed class OutboundWebhookDryRunResponse
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

    /// <summary>First 8192 UTF-8 characters of response body when available.</summary>
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
