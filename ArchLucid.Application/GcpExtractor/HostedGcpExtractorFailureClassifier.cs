namespace ArchLucid.Application.GcpExtractor;

internal static class HostedGcpExtractorFailureClassifier
{
    public static bool IsThrottled(Exception exception) =>
        exception.Message.Contains("RESOURCE_EXHAUSTED", StringComparison.OrdinalIgnoreCase)
        || exception.Message.Contains("Quota exceeded", StringComparison.OrdinalIgnoreCase)
        || exception.Message.Contains("rate limit", StringComparison.OrdinalIgnoreCase);

    public static string Describe(Exception exception) =>
        exception.Message;
}
