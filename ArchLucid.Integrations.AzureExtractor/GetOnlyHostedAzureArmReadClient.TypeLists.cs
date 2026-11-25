using System.Net.Http.Headers;
using System.Text.Json;

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

        string trimmedSubscriptionId = subscriptionId.Trim();
        string listingRelativePath = BuildSubscriptionTypeListRelativePath(trimmedSubscriptionId, descriptor.RelativePath);
        string descriptorQuerySuffix = ExtractDescriptorQuerySuffix(descriptor.RelativePath);
        string initialUrl =
            $"https://management.azure.com/{listingRelativePath}{descriptorQuerySuffix}";
        return await ListTypedResourcesWithCompletenessAsync(
            accessToken, initialUrl, listingRelativePath, MapResource, cancellationToken).ConfigureAwait(false);
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

        string trimmedZoneId = privateDnsZoneResourceId.Trim().TrimStart('/');
        string listingRelativePath = $"{trimmedZoneId}/virtualNetworkLinks";
        string initialUrl =
            $"https://management.azure.com/{listingRelativePath}?api-version={HostedAzureArmNetworkTypeListDescriptors.PrivateDnsApiVersion}";
        return await ListTypedResourcesWithCompletenessAsync(
            accessToken, initialUrl, listingRelativePath, item => MapPrivateDnsVirtualNetworkLink(item, trimmedZoneId), cancellationToken).ConfigureAwait(false);
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

        string trimmedVnetId = virtualNetworkResourceId.Trim().TrimStart('/');
        string listingRelativePath = $"{trimmedVnetId}/virtualNetworkPeerings";
        string initialUrl =
            $"https://management.azure.com/{listingRelativePath}?api-version={HostedAzureArmNetworkTypeListDescriptors.NetworkApiVersion}";
        return await ListTypedResourcesWithCompletenessAsync(
            accessToken, initialUrl, listingRelativePath, MapResource, cancellationToken).ConfigureAwait(false);
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

        string trimmedPerimeterId = networkSecurityPerimeterResourceId.Trim().TrimStart('/');
        string listingRelativePath = $"{trimmedPerimeterId}/resourceAssociations";
        string initialUrl =
            $"https://management.azure.com/{listingRelativePath}?api-version={HostedAzureArmNetworkTypeListDescriptors.NetworkSecurityPerimeterApiVersion}";
        return await ListTypedResourcesWithCompletenessAsync(
            accessToken, initialUrl, listingRelativePath, MapResource, cancellationToken).ConfigureAwait(false);
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

        string trimmedScopeId = monitorPrivateLinkScopeResourceId.Trim().TrimStart('/');
        string listingRelativePath = $"{trimmedScopeId}/scopedResources";
        string initialUrl =
            $"https://management.azure.com/{listingRelativePath}?api-version={HostedAzureArmNetworkTypeListDescriptors.MonitorPrivateLinkScopeApiVersion}";
        return await ListTypedResourcesWithCompletenessAsync(
            accessToken, initialUrl, listingRelativePath, MapResource, cancellationToken).ConfigureAwait(false);
    }

    private async Task<IReadOnlyList<HostedAzureArmResourceRecord>> ListTypedResourcesWithCompletenessAsync(
        string accessToken,
        string initialUrl,
        string listingRelativePath,
        Func<JsonElement, HostedAzureArmResourceRecord?> mapItem,
        CancellationToken cancellationToken)
    {
        List<HostedAzureArmResourceRecord> resources = [];
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
                    HostedAzureArmResourceRecord? mapped = item.ValueKind == JsonValueKind.Object
                        ? mapItem(item)
                        : null;
                    if (mapped is null)
                    {
                        partial = true;
                        continue;
                    }

                    resources.Add(mapped);
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
                    HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(candidate, listingRelativePath);
                    nextLink = candidate;
                }
            }
            catch (Exception ex) when (ex is JsonException or HttpRequestException or IOException)
            {
                partial = true;
                break;
            }
        }

        return new HostedAzureArmTypeListCollection(resources, partial);
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
