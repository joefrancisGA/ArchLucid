using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    private const string AdfDatasetsApiVersion = "2018-06-01";

    private const string AdfPipelinesApiVersion = "2018-06-01";

    private const string SynapseFactoryStyleApiVersion = "2020-12-01";

    public async Task<IReadOnlyList<JsonElement>> ListFactoryDatasetsAsync(
        string accessToken,
        string factoryResourceId,
        CancellationToken cancellationToken)
    {
        return await ListFactoryChildResourcesAsync(
            accessToken,
            factoryResourceId,
            "datasets",
            ResolveFactoryStyleApiVersion(factoryResourceId),
            "ADF dataset",
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<JsonElement>> ListFactoryPipelinesAsync(
        string accessToken,
        string factoryResourceId,
        CancellationToken cancellationToken)
    {
        return await ListFactoryChildResourcesAsync(
            accessToken,
            factoryResourceId,
            "pipelines",
            ResolveFactoryStyleApiVersion(factoryResourceId),
            "ADF pipeline",
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<JsonElement>> ListFactoryTriggersAsync(
        string accessToken,
        string factoryResourceId,
        CancellationToken cancellationToken)
    {
        return await ListFactoryChildResourcesAsync(
            accessToken,
            factoryResourceId,
            "triggers",
            ResolveFactoryStyleApiVersion(factoryResourceId),
            "ADF trigger",
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<JsonElement>> ListFactoryIntegrationRuntimesAsync(
        string accessToken,
        string factoryResourceId,
        CancellationToken cancellationToken)
    {
        return await ListFactoryChildResourcesAsync(
            accessToken,
            factoryResourceId,
            "integrationruntimes",
            ResolveFactoryStyleApiVersion(factoryResourceId),
            "ADF integration runtime",
            cancellationToken).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<JsonElement>> ListFactoryDataflowsAsync(
        string accessToken,
        string factoryResourceId,
        CancellationToken cancellationToken)
    {
        return await ListFactoryChildResourcesAsync(
            accessToken,
            factoryResourceId,
            "dataflows",
            ResolveFactoryStyleApiVersion(factoryResourceId),
            "ADF dataflow",
            cancellationToken).ConfigureAwait(false);
    }

    private static string ResolveFactoryStyleApiVersion(string factoryResourceId)
    {
        if (AzureInventoryFactoryStyleResourceCatalog.IsSynapseWorkspaceArmId(factoryResourceId))
        {
            return SynapseFactoryStyleApiVersion;
        }

        return AdfPipelinesApiVersion;
    }

    private async Task<IReadOnlyList<JsonElement>> ListFactoryChildResourcesAsync(
        string accessToken,
        string factoryResourceId,
        string childCollectionName,
        string apiVersion,
        string logLabel,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(factoryResourceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(childCollectionName);

        string trimmedFactoryId = factoryResourceId.Trim().TrimStart('/');
        List<JsonElement> childResources = [];
        string? nextLink =
            $"https://management.azure.com/{trimmedFactoryId}/{childCollectionName}?api-version={apiVersion}";
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

            if (response.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                throw new HttpRequestException($"{logLabel} list returned Forbidden.", null, response.StatusCode);
            }

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                throw new HttpRequestException($"{logLabel} list returned NotFound.", null, response.StatusCode);
            }

            if ((int)response.StatusCode == 429)
            {
                throw new HttpRequestException($"{logLabel} list returned TooManyRequests.", null, response.StatusCode);
            }

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped {LogLabel} list for factory {FactoryId}; HTTP {StatusCode}.",
                        logLabel,
                        trimmedFactoryId,
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
                    HostedAzureArmNextLinkValidator.EnsureTargetsFactoryResource(
                        candidateNextLink,
                        trimmedFactoryId);
                    nextLink = candidateNextLink;
                }
            }
        }

        return childResources;
    }
}
