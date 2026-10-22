using System.Net.Http.Headers;
using System.Text.Json;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    internal async Task<HostedAzureArmChildCollectionReadResult> ListChildJsonElementsAsync(
        string accessToken,
        string parentResourceId,
        string childCollectionName,
        string apiVersion,
        string logLabel,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(parentResourceId);

        string trimmedParentId = parentResourceId.Trim().TrimStart('/');
        string relativePath = string.IsNullOrWhiteSpace(childCollectionName)
            ? trimmedParentId
            : $"{trimmedParentId}/{childCollectionName.Trim()}";
        string requestUri = $"https://management.azure.com/{relativePath}?api-version={apiVersion}";

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using HttpResponseMessage response =
            await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

        int statusCode = (int)response.StatusCode;

        if (!response.IsSuccessStatusCode)
        {
            return HostedAzureArmChildCollectionReadResult.Failed(statusCode);
        }

        (IReadOnlyList<JsonElement> values, bool partialCollection) = await ListJsonElementsAtRelativePathAsync(
            accessToken,
            relativePath,
            apiVersion,
            logLabel,
            cancellationToken).ConfigureAwait(false);

        return HostedAzureArmChildCollectionReadResult.Succeeded(values, partialCollection);
    }

    internal async Task<JsonElement?> TryGetArmResourceJsonAsync(
        string accessToken,
        string resourceId,
        string apiVersion,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceId);

        string trimmedResourceId = resourceId.Trim().TrimStart('/');
        string requestUri = $"https://management.azure.com/{trimmedResourceId}?api-version={apiVersion}";

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using HttpResponseMessage response =
            await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (!response.IsSuccessStatusCode)
        {
            return null;
        }

        await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return document.RootElement.Clone();
    }

    public async Task<(int StatusCode, JsonElement? Body)> ReadArmResourceWithStatusAsync(
        string accessToken,
        string resourceId,
        string apiVersion,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceId);

        string trimmedResourceId = resourceId.Trim().TrimStart('/');
        string requestUri = $"https://management.azure.com/{trimmedResourceId}?api-version={apiVersion}";

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using HttpResponseMessage response =
            await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

        int statusCode = (int)response.StatusCode;

        if (!response.IsSuccessStatusCode)
        {
            return (statusCode, null);
        }

        await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        return (statusCode, document.RootElement.Clone());
    }

    public async Task<HostedAzureArmChildCollectionReadResult> ListChildResourcesWithStatusAsync(
        string accessToken,
        string parentResourceId,
        string childSegment,
        string apiVersion,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(parentResourceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(childSegment);

        string trimmedParent = parentResourceId.Trim().TrimStart('/').TrimEnd('/');
        string relativePath = $"{trimmedParent}/{childSegment.Trim('/')}";
        string requestUri = $"https://management.azure.com/{relativePath}?api-version={apiVersion}";

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using HttpResponseMessage response =
            await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

        int statusCode = (int)response.StatusCode;

        if (!response.IsSuccessStatusCode)
        {
            return HostedAzureArmChildCollectionReadResult.Failed(statusCode);
        }

        (IReadOnlyList<JsonElement> values, bool partialCollection) = await ListJsonElementsAtRelativePathAsync(
            accessToken,
            relativePath,
            apiVersion,
            childSegment,
            cancellationToken).ConfigureAwait(false);

        return HostedAzureArmChildCollectionReadResult.Succeeded(values, partialCollection);
    }

    private async Task<(IReadOnlyList<JsonElement> Values, bool PartialCollection)> ListJsonElementsAtRelativePathAsync(
        string accessToken,
        string relativePath,
        string apiVersion,
        string logLabel,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(relativePath);

        string trimmedPath = relativePath.Trim().TrimStart('/');
        List<JsonElement> childResources = [];
        string? nextLink = $"https://management.azure.com/{trimmedPath}?api-version={apiVersion}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;
        bool partialCollection = false;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                break;
            }

            requestCount++;

            if (ShouldBreakForPageCap(requestCount))
            {
                if (childResources.Count > 0)
                {
                    partialCollection = true;
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
                        "Hosted Azure extractor skipped {LogLabel} list for {Path}; HTTP {StatusCode}.",
                        logLabel,
                        // ARM resource paths are operational identifiers, not credentials or secrets.

                        // codeql[cs/cleartext-storage-of-sensitive-information]
                        trimmedPath,
                        (int)response.StatusCode);
                }

                if (childResources.Count > 0)
                {
                    partialCollection = true;
                }

                break;
            }

            await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);

            using JsonDocument? document =
                await TryParseArmPaginationPageAsync(stream, childResources.Count, cancellationToken).ConfigureAwait(false);

            if (document is null)
            {
                if (childResources.Count > 0)
                {
                    partialCollection = true;
                }

                break;
            }

            if (document.RootElement.TryGetProperty("value", out JsonElement valueElement)
                && valueElement.ValueKind == JsonValueKind.Array)
            {
                foreach (JsonElement item in valueElement.EnumerateArray())
                {
                    childResources.Add(item.Clone());
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
                        trimmedPath);
                    nextLink = candidateNextLink;
                }
            }
        }

        return (childResources, partialCollection);
    }
}
