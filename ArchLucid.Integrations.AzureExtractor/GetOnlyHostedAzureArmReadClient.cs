using System.Net.Http.Headers;
using System.Text.Json;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     GET-only ARM reader for subscription resource inventory.
/// </summary>
public sealed class GetOnlyHostedAzureArmReadClient(
    HttpClient httpClient,
    ILogger<GetOnlyHostedAzureArmReadClient> logger) : IHostedAzureArmReadClient
{
    private const string ResourcesApiVersion = "2021-04-01";

    private readonly HttpClient _httpClient =
        httpClient ?? throw new ArgumentNullException(nameof(httpClient));

    private readonly ILogger<GetOnlyHostedAzureArmReadClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<IReadOnlyList<HostedAzureArmResourceRecord>> ListSubscriptionResourcesAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(subscriptionId);

        List<HostedAzureArmResourceRecord> resources = [];
        string? nextLink =
            $"https://management.azure.com/subscriptions/{subscriptionId.Trim()}/resources?api-version={ResourcesApiVersion}";

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            response.EnsureSuccessStatusCode();

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                .ConfigureAwait(false);

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement) &&
                valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    HostedAzureArmResourceRecord? mapped = MapResource(item);

                    if (mapped is not null)
                        resources.Add(mapped);
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement) &&
                nextLinkElement.ValueKind == JsonValueKind.String)
            {
                nextLink = nextLinkElement.GetString();
            }
        }

        if (_logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug(
                "Hosted Azure extractor listed {Count} resources for subscription {SubscriptionId}.",
                resources.Count,
                subscriptionId);
        }

        return resources;
    }

    private static HostedAzureArmResourceRecord? MapResource(JsonElement item)
    {
        if (!TryGetString(item, "id", out string? resourceId) ||
            !TryGetString(item, "type", out string? resourceType))
        {
            return null;
        }

        string name = TryGetString(item, "name", out string? parsedName)
            ? parsedName!
            : resourceId!;

        string? location = TryGetString(item, "location", out string? parsedLocation)
            ? parsedLocation
            : null;

        object? sku = item.TryGetProperty("sku", out JsonElement skuElement)
            ? JsonSerializer.Deserialize<object>(skuElement.GetRawText())
            : null;

        Dictionary<string, string>? tags = null;

        if (item.TryGetProperty("tags", out JsonElement tagsElement) &&
            tagsElement.ValueKind == JsonValueKind.Object)
        {
            tags = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

            foreach (JsonProperty tag in tagsElement.EnumerateObject())
            {
                if (tag.Value.ValueKind == JsonValueKind.String)
                    tags[tag.Name] = tag.Value.GetString() ?? string.Empty;
            }
        }

        Dictionary<string, object?> properties = BuildProperties(item, resourceType!);

        return new HostedAzureArmResourceRecord(
            resourceType!,
            resourceId!,
            name,
            location,
            sku,
            tags,
            properties);
    }

    private static Dictionary<string, object?> BuildProperties(JsonElement item, string resourceType)
    {
        Dictionary<string, object?> properties = new(StringComparer.OrdinalIgnoreCase);

        if (!item.TryGetProperty("properties", out JsonElement propertiesElement) ||
            propertiesElement.ValueKind != JsonValueKind.Object)
        {
            return properties;
        }

        if (propertiesElement.TryGetProperty("provisioningState", out JsonElement provisioningState) &&
            provisioningState.ValueKind == JsonValueKind.String)
        {
            properties["provisioningState"] = provisioningState.GetString();
        }

        if (string.Equals(resourceType, "Microsoft.Compute/virtualMachines", StringComparison.OrdinalIgnoreCase) &&
            propertiesElement.TryGetProperty("hardwareProfile", out JsonElement hardwareProfile) &&
            hardwareProfile.ValueKind == JsonValueKind.Object &&
            hardwareProfile.TryGetProperty("vmSize", out JsonElement vmSize) &&
            vmSize.ValueKind == JsonValueKind.String)
        {
            properties["vmSize"] = vmSize.GetString();
        }

        return properties;
    }

    private static bool TryGetString(JsonElement item, string propertyName, out string? value)
    {
        value = null;

        if (!item.TryGetProperty(propertyName, out JsonElement element) ||
            element.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        value = element.GetString();

        return !string.IsNullOrWhiteSpace(value);
    }
}
