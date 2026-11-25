using System.Net.Http.Headers;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

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
        string listingRelativePath = $"{trimmedFactoryId}/{childCollectionName}";
        List<JsonElement> childResources = [];
        string? nextLink = $"https://management.azure.com/{listingRelativePath}?api-version={apiVersion}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
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
                using HttpResponseMessage response =
                    await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

                if (!response.IsSuccessStatusCode)
                {
                    // Preserve the initial permission/throttling exception contract.
                    if (requestCount == 1 && (int)response.StatusCode is 403 or 404 or 429)
                        throw new HttpRequestException($"{logLabel} list failed.", null, response.StatusCode);

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

                    childResources.Add(item.Clone());
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
            catch (HttpRequestException) when (requestCount > 1)
            {
                partial = true;
                break;
            }
            catch (Exception ex) when (ex is JsonException or IOException)
            {
                partial = true;
                break;
            }
        }

        return new HostedAzureAdfCollection<JsonElement>(childResources, partial);
    }
}
