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
        ArmPaginationResult result = await ReadArmObjectPagesAsync(
            accessToken,
            $"https://management.azure.com/{trimmedPath}?api-version={apiVersion}",
            candidate => HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(candidate, trimmedPath),
            item => childResources.Add(item.Clone()),
            cancellationToken).ConfigureAwait(false);

        if (result.PartialCollection && _logger.IsEnabled(LogLevel.Debug))
        {
            _logger.LogDebug("Hosted Azure extractor retained incomplete {LogLabel} list: {Reason}.",
                logLabel, result.FailureReason);
        }

        return (childResources, result.PartialCollection);
    }
}
