using ArchLucid.Core.Configuration;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

/// <summary>
/// Optional live Azure OpenAI gate for ArchitectureIntelligence eval (not CI-required).
/// Set ARCHLUCID_REAL_AOAI_TEST_ENDPOINT and ARCHLUCID_REAL_AOAI_TEST_KEY.
/// </summary>
internal static class ArchitectureIntelligenceLiveLlmGate
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
        {
            deployment = "gpt-4o";
        }

        credentials = new LiveCredentials(
            AzureOpenAiEndpointNormalizer.NormalizeForChatCompletions(endpoint),
            apiKey.Trim(),
            deployment);

        return true;
    }
}
