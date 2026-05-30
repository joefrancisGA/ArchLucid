using ArchLucid.Core.Configuration;

namespace ArchLucid.AgentRuntime.Tests.Support;

/// <summary>
///     Reads optional live Azure OpenAI credentials from process environment for integration tests.
/// </summary>
internal static class RealLiveAoaiTestConfiguration
{
    internal sealed record LiveCredentials(string Endpoint, string ApiKey, string Deployment);

    internal static bool TryGetLiveCredentials(out LiveCredentials credentials)
    {
        string? endpoint = Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_ENDPOINT");
        string? apiKey = Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_KEY");

        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(apiKey))
        {
            credentials = null!;

            return false;
        }

        string deployment =
            (Environment.GetEnvironmentVariable("ARCHLUCID_REAL_AOAI_TEST_DEPLOYMENT") ?? "gpt-4o").Trim();

        if (string.IsNullOrWhiteSpace(deployment))
            deployment = "gpt-4o";

        credentials = new LiveCredentials(
            AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(endpoint),
            apiKey.Trim(),
            deployment);

        return true;
    }
}
