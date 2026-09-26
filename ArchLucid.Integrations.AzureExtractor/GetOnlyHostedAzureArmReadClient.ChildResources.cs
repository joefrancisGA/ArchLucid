using System.Net.Http.Headers;
using System.Text.Json;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    internal async Task<IReadOnlyList<JsonElement>> ListChildJsonElementsAsync(
        string accessToken,
        string parentResourceId,
        string childCollectionName,
        string apiVersion,
        string logLabel,
        CancellationToken cancellationToken)
    {
        string trimmedParentId = parentResourceId.Trim().TrimStart('/');
        string relativePath = string.IsNullOrWhiteSpace(childCollectionName)
            ? trimmedParentId
            : $"{trimmedParentId}/{childCollectionName.Trim()}";

        return await ListJsonElementsAtRelativePathAsync(
            accessToken,
            relativePath,
            apiVersion,
            logLabel,
            cancellationToken).ConfigureAwait(false);
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

    private async Task<IReadOnlyList<JsonElement>> ListJsonElementsAtRelativePathAsync(
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

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped {logLabel} listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped {logLabel} listing after {MaxPaginationRequests} pages.");
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
                        trimmedPath,
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

        return childResources;
    }
}
