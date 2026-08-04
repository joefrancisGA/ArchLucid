namespace ArchLucid.Api.Http;

/// <summary>
///     Shared hard ceiling for anonymous inbound webhook bodies (TB-967).
///     Keep aligned with <c>ItsmInboundWebhookSyncService.MaxInboundWebhookPayloadUtf8Bytes</c>.
/// </summary>
public static class InboundWebhookBodyLimits
{
    public const int DefaultMaxUtf8Bytes = 65536;
}
