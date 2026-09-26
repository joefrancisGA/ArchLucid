using System.Net.Http.Headers;
using System.Text.Json;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    private const string PolicyDefinitionsApiVersion = "2021-06-01";

    public async Task<IReadOnlyList<JsonElement>> ListSubscriptionPolicyDefinitionDocumentsAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        return await ListPolicyDefinitionDocumentsAtRestPathAsync(
            accessToken,
            $"https://management.azure.com/subscriptions/{subscriptionId.Trim()}/providers/Microsoft.Authorization/policyDefinitions?api-version={PolicyDefinitionsApiVersion}",
            subscriptionId,
            validateSubscriptionNextLink: true,
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<JsonElement>> ListBuiltInPolicyDefinitionDocumentsAsync(
        string accessToken,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);

        return await ListPolicyDefinitionDocumentsAtRestPathAsync(
            accessToken,
            $"https://management.azure.com/providers/Microsoft.Authorization/policyDefinitions?api-version={PolicyDefinitionsApiVersion}",
            scopeKey: "builtIn",
            validateSubscriptionNextLink: false,
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<JsonElement>> ListSubscriptionPolicyAssignmentDocumentsAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        return await ListPolicyDefinitionDocumentsAtRestPathAsync(
            accessToken,
            $"https://management.azure.com/subscriptions/{subscriptionId.Trim()}/providers/Microsoft.Authorization/policyAssignments?api-version={PolicyAssignmentsApiVersion}",
            subscriptionId,
            validateSubscriptionNextLink: true,
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<JsonElement>> ListPolicyDefinitionDocumentsAtRestPathAsync(
        string accessToken,
        string initialUrl,
        string scopeKey,
        bool validateSubscriptionNextLink,
        CancellationToken cancellationToken)
    {
        List<JsonElement> documents = [];
        string? nextLink = initialUrl;
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    "Hosted Azure extractor stopped ARM policy definition listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                if (_logger.IsEnabled(LogLevel.Warning))
                {
                    _logger.LogWarning(
                        "Hosted Azure extractor stopped policy definition listing for scope {ScopeKey} after {MaxPages} pages.",
                        scopeKey,
                        MaxPaginationRequests);
                }

                break;
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped policy definition listing for scope {ScopeKey}; HTTP {StatusCode}.",
                        scopeKey,
                        (int)response.StatusCode);
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                && valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    documents.Add(item.Clone());
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    if (validateSubscriptionNextLink)
                    {
                        HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(candidateNextLink, scopeKey);
                    }
                    else
                    {
                        HostedAzureArmNextLinkValidator.EnsureTargetsBuiltInPolicyDefinitionsListing(candidateNextLink);
                    }

                    nextLink = candidateNextLink;
                }
            }
        }

        return documents;
    }
}
