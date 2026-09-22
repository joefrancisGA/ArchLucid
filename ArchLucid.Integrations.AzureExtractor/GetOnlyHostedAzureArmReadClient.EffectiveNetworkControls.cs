using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    public async Task<IReadOnlyList<HostedAzureArmEffectiveNetworkControlRecord>> ListEffectiveNetworkControlsForNicAsync(
        string accessToken,
        string nicResourceId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
        {
            throw new ArgumentException("Access token is required.", nameof(accessToken));
        }

        if (string.IsNullOrWhiteSpace(nicResourceId))
        {
            throw new ArgumentException("NIC resource id is required.", nameof(nicResourceId));
        }

        string trimmedNicId = nicResourceId.Trim();
        List<HostedAzureArmEffectiveNetworkControlRecord> rows =
        [
            await ReadEffectiveControlAsync(
                accessToken,
                trimmedNicId,
                AzureInventoryEffectiveNetworkControlKind.EffectiveNsg,
                "effectiveNetworkSecurityGroups",
                TryResolveEffectiveNsgResourceId,
                cancellationToken).ConfigureAwait(false),
            await ReadEffectiveControlAsync(
                accessToken,
                trimmedNicId,
                AzureInventoryEffectiveNetworkControlKind.EffectiveRoutes,
                "effectiveRouteTable",
                TryResolveEffectiveRouteTableResourceId,
                cancellationToken).ConfigureAwait(false),
        ];

        return rows;
    }

    private async Task<HostedAzureArmEffectiveNetworkControlRecord> ReadEffectiveControlAsync(
        string accessToken,
        string nicResourceId,
        string kind,
        string relativePath,
        Func<JsonElement, string?> resolveEffectiveResourceId,
        CancellationToken cancellationToken)
    {
        string requestUri =
            $"https://management.azure.com/{nicResourceId.TrimStart('/')}/{relativePath}?api-version={HostedAzureArmNetworkTypeListDescriptors.NetworkApiVersion}";

        using HttpRequestMessage request = new(HttpMethod.Get, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using HttpResponseMessage response =
            await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (response.StatusCode is HttpStatusCode.NotFound or HttpStatusCode.Forbidden)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug(
                    "Hosted Azure extractor skipped {Kind} for NIC {NicResourceId}; HTTP {StatusCode}.",
                    kind,
                    nicResourceId,
                    (int)response.StatusCode);
            }

            return SkippedRow(nicResourceId, kind);
        }

        if (!response.IsSuccessStatusCode)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug(
                    "Hosted Azure extractor skipped {Kind} for NIC {NicResourceId}; HTTP {StatusCode}.",
                    kind,
                    nicResourceId,
                    (int)response.StatusCode);
            }

            return SkippedRow(nicResourceId, kind);
        }

        string payload = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            using JsonDocument document = JsonDocument.Parse(payload);
            string? effectiveResourceId = resolveEffectiveResourceId(document.RootElement);

            if (string.IsNullOrWhiteSpace(effectiveResourceId))
            {
                return SkippedRow(nicResourceId, kind);
            }

            return new HostedAzureArmEffectiveNetworkControlRecord(
                NicResourceId: nicResourceId,
                Kind: kind,
                CollectionStatus: AzureInventoryEffectiveNetworkControlCollectionStatus.Succeeded,
                EffectiveResourceId: effectiveResourceId.Trim(),
                PayloadHashSha256: ComputePayloadHash(payload));
        }
        catch (JsonException ex)
        {
            if (_logger.IsEnabled(LogLevel.Debug))
            {
                _logger.LogDebug(
                    ex,
                    "Hosted Azure extractor skipped {Kind} for NIC {NicResourceId}; response was not valid JSON.",
                    kind,
                    nicResourceId);
            }

            return SkippedRow(nicResourceId, kind);
        }
    }

    private static HostedAzureArmEffectiveNetworkControlRecord SkippedRow(string nicResourceId, string kind)
    {
        return new HostedAzureArmEffectiveNetworkControlRecord(
            NicResourceId: nicResourceId,
            Kind: kind,
            CollectionStatus: AzureInventoryEffectiveNetworkControlCollectionStatus.Skipped,
            EffectiveResourceId: null,
            PayloadHashSha256: null);
    }

    private static string? TryResolveEffectiveNsgResourceId(JsonElement root)
    {
        if (!root.TryGetProperty("value", out JsonElement valueElement)
            || valueElement.ValueKind is not JsonValueKind.Array)
        {
            return null;
        }

        foreach (JsonElement item in valueElement.EnumerateArray())
        {
            if (!item.TryGetProperty("networkSecurityGroup", out JsonElement nsgElement)
                || nsgElement.ValueKind is not JsonValueKind.Object)
            {
                continue;
            }

            if (nsgElement.TryGetProperty("id", out JsonElement idElement)
                && idElement.ValueKind is JsonValueKind.String)
            {
                string? nsgId = idElement.GetString();

                if (!string.IsNullOrWhiteSpace(nsgId))
                {
                    return nsgId;
                }
            }
        }

        return null;
    }

    private static string? TryResolveEffectiveRouteTableResourceId(JsonElement root)
    {
        if (root.TryGetProperty("id", out JsonElement idElement)
            && idElement.ValueKind is JsonValueKind.String)
        {
            string? routeTableId = idElement.GetString();

            if (!string.IsNullOrWhiteSpace(routeTableId)
                && routeTableId.Contains("/routeTables/", StringComparison.OrdinalIgnoreCase))
            {
                return routeTableId;
            }
        }

        return null;
    }

    private static string ComputePayloadHash(string payload)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));

        return Convert.ToHexStringLower(hash);
    }
}
