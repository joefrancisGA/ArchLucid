using System.Net;

namespace ArchLucid.Application.AzureExtractor;

/// <summary>Maps hosted Azure extractor collection faults to stable failure kinds for auto-pull logging.</summary>
internal static class HostedAzureExtractorHttpFailureClassifier
{
    internal static bool IsArmThrottled(Exception exception) =>
        TryGetHttpStatusCode(exception, out HttpStatusCode statusCode)
        && statusCode == HttpStatusCode.TooManyRequests;

    internal static string Describe(Exception exception) =>
        exception.Message;

    private static bool TryGetHttpStatusCode(Exception exception, out HttpStatusCode statusCode)
    {
        statusCode = default;

        if (exception is not HttpRequestException httpRequestException)
            return false;

        if (httpRequestException.StatusCode is null)
            return false;

        statusCode = httpRequestException.StatusCode.Value;

        return true;
    }
}
