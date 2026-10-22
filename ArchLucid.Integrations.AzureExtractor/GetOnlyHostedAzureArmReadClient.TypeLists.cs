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

        if (!HostedAzureArmTypeListDescriptorRegistry.TryGet(resourceType, out HostedAzureArmTypeListDescriptor descriptor))
        {
            throw new ArgumentException(
                $"Unsupported type-scoped list resource type '{resourceType}'.",
                nameof(resourceType));
        }

        List<HostedAzureArmResourceRecord> resources = [];
        string trimmedSubscriptionId = subscriptionId.Trim();
        string listingRelativePath = BuildSubscriptionTypeListRelativePath(trimmedSubscriptionId, descriptor.RelativePath);
        string descriptorQuerySuffix = ExtractDescriptorQuerySuffix(descriptor.RelativePath);
        string? nextLink =
            $"https://management.azure.com/{listingRelativePath}{descriptorQuerySuffix}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                break;
            }

            requestCount++;

            if (ShouldBreakForPageCap(requestCount))
            {
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
                        "Hosted Azure extractor skipped type list for {ResourceType}; HTTP {StatusCode}.",
                        resourceType,
                        (int)response.StatusCode);
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument? document =
                await TryParseArmPaginationPageAsync(stream, resources.Count, cancellationToken).ConfigureAwait(false);

            if (document is null)
            {
                break;
            }

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
                    HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                        candidateNextLink,
                        listingRelativePath);
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

    private static string BuildSubscriptionTypeListRelativePath(string subscriptionId, string descriptorRelativePath)
    {
        string pathWithoutQuery = descriptorRelativePath;

        int queryIndex = pathWithoutQuery.IndexOf('?', StringComparison.Ordinal);

        if (queryIndex >= 0)
            pathWithoutQuery = pathWithoutQuery[..queryIndex];

        return $"subscriptions/{subscriptionId.Trim()}/{pathWithoutQuery.TrimStart('/')}";
    }

    private static string ExtractDescriptorQuerySuffix(string descriptorRelativePath)
    {
        int queryIndex = descriptorRelativePath.IndexOf('?', StringComparison.Ordinal);

        return queryIndex >= 0 ? descriptorRelativePath[queryIndex..] : string.Empty;
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
        string trimmedZoneId = privateDnsZoneResourceId.Trim().TrimStart('/');
        string listingRelativePath = $"{trimmedZoneId}/virtualNetworkLinks";
        string? nextLink =
            $"https://management.azure.com/{listingRelativePath}?api-version={HostedAzureArmNetworkTypeListDescriptors.PrivateDnsApiVersion}";
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

            using JsonDocument? document =
                await TryParseArmPaginationPageAsync(stream, resources.Count, cancellationToken).ConfigureAwait(false);

            if (document is null)
            {
                break;
            }

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
                string? candidateNextLink = nextLinkElement.GetString();

                if (!string.IsNullOrWhiteSpace(candidateNextLink))
                {
                    HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                        candidateNextLink,
                        listingRelativePath);
                    nextLink = candidateNextLink;
                }
            }
        }

        return resources;
    }

    public async Task<IReadOnlyList<HostedAzureArmResourceRecord>> ListVirtualNetworkPeeringsAsync(
        string accessToken,
        string subscriptionId,
        string virtualNetworkResourceId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(virtualNetworkResourceId);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        List<HostedAzureArmResourceRecord> resources = [];
        string trimmedVnetId = virtualNetworkResourceId.Trim().TrimStart('/');
        string listingRelativePath = $"{trimmedVnetId}/virtualNetworkPeerings";
        string? nextLink =
            $"https://management.azure.com/{listingRelativePath}?api-version={HostedAzureArmNetworkTypeListDescriptors.NetworkApiVersion}";
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

            using JsonDocument? document =
                await TryParseArmPaginationPageAsync(stream, resources.Count, cancellationToken).ConfigureAwait(false);

            if (document is null)
            {
                break;
            }

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
                    HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                        candidateNextLink,
                        listingRelativePath);
                    nextLink = candidateNextLink;
                }
            }
        }

        return resources;
    }

    public async Task<IReadOnlyList<HostedAzureArmResourceRecord>> ListNetworkSecurityPerimeterResourceAssociationsAsync(
        string accessToken,
        string subscriptionId,
        string networkSecurityPerimeterResourceId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(networkSecurityPerimeterResourceId);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        List<HostedAzureArmResourceRecord> resources = [];
        string trimmedPerimeterId = networkSecurityPerimeterResourceId.Trim().TrimStart('/');
        string listingRelativePath = $"{trimmedPerimeterId}/resourceAssociations";
        string? nextLink =
            $"https://management.azure.com/{listingRelativePath}?api-version={HostedAzureArmNetworkTypeListDescriptors.NetworkSecurityPerimeterApiVersion}";
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

            using JsonDocument? document =
                await TryParseArmPaginationPageAsync(stream, resources.Count, cancellationToken).ConfigureAwait(false);

            if (document is null)
            {
                break;
            }

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
                    HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                        candidateNextLink,
                        listingRelativePath);
                    nextLink = candidateNextLink;
                }
            }
        }

        return resources;
    }

    public async Task<IReadOnlyList<HostedAzureArmResourceRecord>> ListMonitorPrivateLinkScopeScopedResourcesAsync(
        string accessToken,
        string subscriptionId,
        string monitorPrivateLinkScopeResourceId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(monitorPrivateLinkScopeResourceId);
        HostedAzureExtractorGuidValidator.RequireAzureGuid(nameof(subscriptionId), subscriptionId);

        List<HostedAzureArmResourceRecord> resources = [];
        string trimmedScopeId = monitorPrivateLinkScopeResourceId.Trim().TrimStart('/');
        string listingRelativePath = $"{trimmedScopeId}/scopedResources";
        string? nextLink =
            $"https://management.azure.com/{listingRelativePath}?api-version={HostedAzureArmNetworkTypeListDescriptors.MonitorPrivateLinkScopeApiVersion}";
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

            using JsonDocument? document =
                await TryParseArmPaginationPageAsync(stream, resources.Count, cancellationToken).ConfigureAwait(false);

            if (document is null)
            {
                break;
            }

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
                    HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                        candidateNextLink,
                        listingRelativePath);
                    nextLink = candidateNextLink;
                }
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
