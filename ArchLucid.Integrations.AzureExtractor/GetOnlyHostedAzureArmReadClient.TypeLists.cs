using System.Net.Http.Headers;
using System.Text.Json;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    public async Task<IReadOnlyList<HostedAzureArmResourceRecord>> ListSubscriptionResourcesByTypeAsync(
        string accessToken,
        string subscriptionId,
        string resourceType,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceType);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        HostedAzureArmTypeListDescriptor? descriptor = HostedAzureArmNetworkTypeListDescriptors.SubscriptionLists
            .FirstOrDefault(candidate =>
                candidate.ResourceType.Equals(resourceType, StringComparison.OrdinalIgnoreCase));

        if (descriptor is null)
        {
            throw new ArgumentException(
                $"Unsupported type-scoped list resource type '{resourceType}'.",
                nameof(resourceType));
        }

        List<HostedAzureArmResourceRecord> resources = [];
        string trimmedSubscriptionId = subscriptionId.Trim();
        string? nextLink =
            $"https://management.azure.com/subscriptions/{trimmedSubscriptionId}/{descriptor.RelativePath}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM type list for {resourceType} due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ARM type list for {resourceType} after {MaxPaginationRequests} pages.");
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
                        "Hosted Azure extractor skipped type list for {ResourceType}; HTTP {StatusCode}.",
                        resourceType,
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
                    HostedAzureArmResourceRecord? mapped = MapResource(item);

                    if (mapped is not null)
                    {
                        resources.Add(mapped);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsSubscription(candidateNextLink, trimmedSubscriptionId);
                    nextLink = candidateNextLink;
                }
            }
        }

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Hosted Azure extractor listed {Count} resources for type {ResourceType} in subscription {SubscriptionId}.",
                resources.Count,
                resourceType,
                trimmedSubscriptionId);
        }

        return resources;
    }

    public async Task<IReadOnlyList<HostedAzureArmResourceRecord>> ListPrivateDnsZoneVirtualNetworkLinksAsync(
        string accessToken,
        string subscriptionId,
        string privateDnsZoneResourceId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(privateDnsZoneResourceId);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        List<HostedAzureArmResourceRecord> resources = [];
        string trimmedZoneId = privateDnsZoneResourceId.Trim();
        string? nextLink =
            $"https://management.azure.com/{trimmedZoneId}/virtualNetworkLinks?api-version={HostedAzureArmNetworkTypeListDescriptors.PrivateDnsApiVersion}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                break;
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                break;
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (!response.IsSuccessStatusCode)
            {
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
                    HostedAzureArmResourceRecord? mapped = MapPrivateDnsVirtualNetworkLink(item, trimmedZoneId);

                    if (mapped is not null)
                    {
                        resources.Add(mapped);
                    }
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                nextLink = nextLinkElement.GetString();
            }
        }

        return resources;
    }

    private static HostedAzureArmResourceRecord? MapPrivateDnsVirtualNetworkLink(JsonElement item, string zoneResourceId)
    {
        if (!TryGetString(item, "id", out string? resourceId)
            || !TryGetString(item, "type", out string? resourceType))
        {
            return null;
        }

        string name = TryGetString(item, "name", out string? parsedName)
            ? parsedName!
            : resourceId!;

        Dictionary<string, object?> properties = new(StringComparer.OrdinalIgnoreCase);

        if (item.TryGetProperty("properties", out JsonElement propertiesElement)
            && propertiesElement.ValueKind == JsonValueKind.Object)
        {
            HostedAzureInventoryResourcePropertyExpander.Expand(resourceType!, propertiesElement, properties);
            properties["privateDnsZoneId"] = zoneResourceId;
        }

        return new HostedAzureArmResourceRecord(
            resourceType!,
            resourceId!,
            name,
            null,
            null,
            null,
            properties);
    }
}
