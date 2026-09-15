using System.Net.Http.Headers;
using System.Text.Json;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    private const string AdfLinkedServicesApiVersion = "2018-06-01";

    public async Task<IReadOnlyList<JsonElement>> ListFactoryLinkedServicesAsync(
        string accessToken,
        string factoryResourceId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(factoryResourceId);

        string trimmedFactoryId = factoryResourceId.Trim().TrimStart('/');
        List<JsonElement> linkedServices = [];
        string? nextLink =
            $"https://management.azure.com/{trimmedFactoryId}/linkedservices?api-version={AdfLinkedServicesApiVersion}";
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        int requestCount = 0;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            if (!visitedLinks.Add(nextLink))
            {
                throw new InvalidOperationException(
                    "Hosted Azure extractor stopped ADF linked-service listing due to repeating nextLink.");
            }

            requestCount++;

            if (requestCount > MaxPaginationRequests)
            {
                throw new InvalidOperationException(
                    $"Hosted Azure extractor stopped ADF linked-service listing after {MaxPaginationRequests} pages.");
            }

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage response =
                await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

            if (response.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                throw new HttpRequestException("ADF linked-service list returned Forbidden.", null, response.StatusCode);
            }

            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                throw new HttpRequestException("ADF linked-service list returned NotFound.", null, response.StatusCode);
            }

            if ((int)response.StatusCode == 429)
            {
                throw new HttpRequestException("ADF linked-service list returned TooManyRequests.", null, response.StatusCode);
            }

            if (!response.IsSuccessStatusCode)
            {
                if (_logger.IsEnabled(LogLevel.Debug))
                {
                    _logger.LogDebug(
                        "Hosted Azure extractor skipped ADF linked-service list for factory {FactoryId}; HTTP {StatusCode}.",
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
                    linkedServices.Add(item.Clone());
                }
            }

            nextLink = null;

            if (document.RootElement.TryGetProperty("nextLink", out JsonElement nextLinkElement)
                && nextLinkElement.ValueKind == JsonValueKind.String)
            {
                nextLink = nextLinkElement.GetString();
            }
        }

        return linkedServices;
    }
}
