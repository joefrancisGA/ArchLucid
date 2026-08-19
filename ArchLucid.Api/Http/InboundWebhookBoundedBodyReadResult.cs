namespace ArchLucid.Api.Http;

/// <summary>
///     Outcome of a hard-capped inbound webhook body read (TB-967).
/// </summary>
public sealed class InboundWebhookBoundedBodyReadResult
{
    private InboundWebhookBoundedBodyReadResult(bool succeeded, string? body, int observedOrDeclaredBytes)
    {
        Succeeded = succeeded;
        Body = body;
        ObservedOrDeclaredBytes = observedOrDeclaredBytes;
    }

    public bool Succeeded
    {
        get;
    }

    /// <summary>UTF-8 decoded body when <see cref="Succeeded"/>; otherwise null.</summary>
    public string? Body
    {
        get;
    }

    /// <summary>
    ///     Declared <c>Content-Length</c> or observed stream bytes at reject/success (for audit/metrics; never log the body).
    /// </summary>
    public int ObservedOrDeclaredBytes
    {
        get;
    }

    public static InboundWebhookBoundedBodyReadResult Ok(string body, int utf8ByteCount)
    {
        ArgumentNullException.ThrowIfNull(body);

        return new InboundWebhookBoundedBodyReadResult(true, body, utf8ByteCount);
    }

    public static InboundWebhookBoundedBodyReadResult TooLarge(int observedOrDeclaredBytes)
    {
        return new InboundWebhookBoundedBodyReadResult(false, null, observedOrDeclaredBytes);
    }
}
