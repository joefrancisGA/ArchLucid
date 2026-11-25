using System.Net.Http.Headers;
using System.Text.Json;

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

        string trimmedSubscriptionId = subscriptionId.Trim();

        return await ListPolicyDefinitionDocumentsAtRestPathAsync(
            accessToken,
            $"https://management.azure.com/subscriptions/{trimmedSubscriptionId}/providers/Microsoft.Authorization/policyDefinitions?api-version={PolicyDefinitionsApiVersion}",
            subscriptionId,
            validateSubscriptionNextLink: true,
            subscriptionListingRelativePath:
                $"subscriptions/{trimmedSubscriptionId}/providers/Microsoft.Authorization/policyDefinitions",
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
            subscriptionListingRelativePath: null,
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
            subscriptionListingRelativePath:
                $"subscriptions/{subscriptionId.Trim()}/providers/Microsoft.Authorization/policyAssignments",
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<JsonElement>> ListPolicyDefinitionDocumentsAtRestPathAsync(
        string accessToken,
        string initialUrl,
        string scopeKey,
        bool validateSubscriptionNextLink,
        string? subscriptionListingRelativePath,
        CancellationToken cancellationToken)
    {
        return await ListPolicyPagesWithCompletenessAsync(
            accessToken,
            initialUrl,
            item => item.TryGetProperty("id", out JsonElement id) && id.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(id.GetString()) ? item.Clone() : (JsonElement?)null,
            candidateNextLink =>
            {
                if (validateSubscriptionNextLink)
                {
                    if (subscriptionListingRelativePath is null)
                        HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(candidateNextLink, scopeKey);
                    else
                        HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                            candidateNextLink, subscriptionListingRelativePath);
                }
                else
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsBuiltInPolicyDefinitionsListing(candidateNextLink);
                }
            },
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<T>> ListPolicyPagesWithCompletenessAsync<T>(
        string accessToken,
        string initialUrl,
        Func<JsonElement, T?> mapItem,
        Action<string> validateNextLink,
        CancellationToken cancellationToken) where T : class
    {
        return await ReadPolicyPagesAsync(
            accessToken, initialUrl, item =>
            {
                T? mapped = mapItem(item);
                return (mapped is not null, mapped!);
            }, validateNextLink, cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<JsonElement>> ListPolicyPagesWithCompletenessAsync(
        string accessToken,
        string initialUrl,
        Func<JsonElement, JsonElement?> mapItem,
        Action<string> validateNextLink,
        CancellationToken cancellationToken)
    {
        return await ReadPolicyPagesAsync(
            accessToken, initialUrl, item =>
            {
                JsonElement? mapped = mapItem(item);
                return (mapped.HasValue, mapped.GetValueOrDefault());
            }, validateNextLink, cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<T>> ReadPolicyPagesAsync<T>(
        string accessToken,
        string initialUrl,
        Func<JsonElement, (bool Valid, T Value)> mapItem,
        Action<string> validateNextLink,
        CancellationToken cancellationToken)
    {
        List<T> observations = [];
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        string? nextLink = initialUrl;
        int requestCount = 0;
        bool partial = false;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink) || ShouldBreakForPageCap(++requestCount))
            {
                partial = true;
                break;
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            try
            {
                using HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken)
                    .ConfigureAwait(false);
                if (!response.IsSuccessStatusCode)
                {
                    partial = true;
                    break;
                }

                await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken)
                    .ConfigureAwait(false);
                using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                    .ConfigureAwait(false);
                JsonElement root = document.RootElement;
                if (root.ValueKind != JsonValueKind.Object
                    || !root.TryGetProperty("value", out JsonElement values)
                    || values.ValueKind != JsonValueKind.Array)
                {
                    partial = true;
                    break;
                }

                foreach (JsonElement item in values.EnumerateArray())
                {
                    if (item.ValueKind != JsonValueKind.Object)
                    {
                        partial = true;
                        continue;
                    }

                    (bool valid, T value) = mapItem(item);
                    if (valid)
                        observations.Add(value);
                    else
                        partial = true;
                }

                nextLink = null;
                if (!root.TryGetProperty("nextLink", out JsonElement continuation)
                    || continuation.ValueKind == JsonValueKind.Null)
                    continue;

                if (continuation.ValueKind != JsonValueKind.String)
                {
                    partial = true;
                    break;
                }

                string? candidate = continuation.GetString();
                if (!string.IsNullOrWhiteSpace(candidate))
                {
                    validateNextLink(candidate);
                    nextLink = candidate;
                }
            }
            catch (Exception ex) when (ex is JsonException or HttpRequestException or IOException)
            {
                partial = true;
                break;
            }
        }

        return new HostedAzureArmPolicyCollection<T>(observations, partial);
    }
}
