namespace ArchLucid.Application.AwsExtractor;

internal static class HostedAwsExtractorFailureClassifier
{
    public static bool IsThrottled(Exception exception) =>
        exception.Message.Contains("Throttling", StringComparison.OrdinalIgnoreCase)
        || exception.Message.Contains("Rate exceeded", StringComparison.OrdinalIgnoreCase);

    public static string Describe(Exception exception) =>
        exception.Message;
}
