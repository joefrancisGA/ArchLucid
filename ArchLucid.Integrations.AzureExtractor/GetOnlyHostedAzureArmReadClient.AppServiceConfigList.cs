using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    private const string WebSitesConfigListApiVersion = "2022-03-01";

    public async Task<HostedAzureAppServiceConfigListResult> TryListAppServiceConfigPropertiesAsync(
        string accessToken,
        string siteResourceId,
        string configListRelativePath,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(siteResourceId);
        ArgumentException.ThrowIfNullOrWhiteSpace(configListRelativePath);

        string trimmedSiteId = siteResourceId.Trim().TrimStart('/');
        string trimmedListPath = configListRelativePath.Trim().TrimStart('/');
        string requestUri =
            $"https://management.azure.com/{trimmedSiteId}/{trimmedListPath}?api-version={WebSitesConfigListApiVersion}";

        using HttpRequestMessage request = new(HttpMethod.Post, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Content = new StringContent("{}", Encoding.UTF8, "application/json");

        using HttpResponseMessage response =
            await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (response.StatusCode == System.Net.HttpStatusCode.Forbidden)
        {
            return HostedAzureAppServiceConfigListResult.Forbidden();
        }

        if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return HostedAzureAppServiceConfigListResult.NotFound();
        }

        if (!response.IsSuccessStatusCode)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug(
                    "Hosted Azure extractor skipped app service config list for {SiteResourceId}; HTTP {StatusCode}.",
                    trimmedSiteId,
                    (int)response.StatusCode);
            }

            return HostedAzureAppServiceConfigListResult.Failed();
        }

        await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
        using JsonDocument document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
            .ConfigureAwait(false);

        if (!document.RootElement.TryGetProperty("properties", out JsonElement propertiesElement)
            || propertiesElement.ValueKind is not JsonValueKind.Object)
        {
            return HostedAzureAppServiceConfigListResult.Succeeded(new Dictionary<string, string>());
        }

        Dictionary<string, string> settings = new(StringComparer.OrdinalIgnoreCase);

        foreach (JsonProperty property in propertiesElement.EnumerateObject())
        {
            string? value = property.Value.ValueKind switch
            {
                JsonValueKind.String => property.Value.GetString(),
                JsonValueKind.Null => null,
                _ => property.Value.GetRawText().Trim('"'),
            };

            if (string.IsNullOrWhiteSpace(property.Name))
            {
                continue;
            }

            settings[property.Name] = value ?? string.Empty;
        }

        return HostedAzureAppServiceConfigListResult.Succeeded(settings);
    }
}
