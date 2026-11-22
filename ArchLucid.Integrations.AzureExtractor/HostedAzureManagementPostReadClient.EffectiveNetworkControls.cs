using System.Net;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class HostedAzureManagementPostReadClient
{
    private const int MaxEffectiveNetworkControlPolls = 15;
    private static readonly TimeSpan DefaultEffectiveNetworkControlPollDelay = TimeSpan.FromSeconds(1);

    public async Task<IReadOnlyList<HostedAzureArmEffectiveNetworkControlRecord>> ListEffectiveNetworkControlsForNicAsync(
        string accessToken,
        string nicResourceId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(nicResourceId);

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
            $"https://management.azure.com/{nicResourceId.TrimStart('/')}/{relativePath}"
            + $"?api-version={HostedAzureArmNetworkTypeListDescriptors.NetworkApiVersion}";

        using HttpRequestMessage request = new(HttpMethod.Post, requestUri);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using HttpResponseMessage response =
            await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (response.StatusCode is HttpStatusCode.Accepted)
        {
            return await PollEffectiveControlAsync(
                    accessToken,
                    nicResourceId,
                    kind,
                    resolveEffectiveResourceId,
                    response,
                    cancellationToken)
                .ConfigureAwait(false);
        }

        return await ReadEffectiveControlResponseAsync(
                nicResourceId,
                kind,
                resolveEffectiveResourceId,
                response,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<HostedAzureArmEffectiveNetworkControlRecord> PollEffectiveControlAsync(
        string accessToken,
        string nicResourceId,
        string kind,
        Func<JsonElement, string?> resolveEffectiveResourceId,
        HttpResponseMessage acceptedResponse,
        CancellationToken cancellationToken)
    {
        Uri? location = acceptedResponse.Headers.Location;

        if (location is null)
        {
            return SkippedEffectiveControlRow(nicResourceId, kind);
        }

        string pollUri = location.IsAbsoluteUri
            ? location.AbsoluteUri
            : new Uri(new Uri("https://management.azure.com/"), location).AbsoluteUri;
        HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
            pollUri,
            ResolveSubscriptionScope(nicResourceId));

        TimeSpan delay = ResolvePollDelay(acceptedResponse.Headers.RetryAfter);

        for (int poll = 0; poll < MaxEffectiveNetworkControlPolls; poll++)
        {
            if (delay > TimeSpan.Zero)
            {
                await Task.Delay(delay, cancellationToken).ConfigureAwait(false);
            }

            using HttpRequestMessage pollRequest = new(HttpMethod.Get, pollUri);
            pollRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            using HttpResponseMessage pollResponse =
                await _httpClient.SendAsync(pollRequest, cancellationToken).ConfigureAwait(false);

            if (pollResponse.StatusCode is HttpStatusCode.Accepted)
            {
                if (pollResponse.Headers.Location is { } nextLocation)
                {
                    string nextPollUri = nextLocation.IsAbsoluteUri
                        ? nextLocation.AbsoluteUri
                        : new Uri(new Uri(pollUri), nextLocation).AbsoluteUri;
                    HostedAzureArmNextLinkValidator.EnsureTargetsArmRelativeListingPath(
                        nextPollUri,
                        ResolveSubscriptionScope(nicResourceId));
                    pollUri = nextPollUri;
                }

                delay = ResolvePollDelay(pollResponse.Headers.RetryAfter);
                continue;
            }

            return await ReadEffectiveControlResponseAsync(
                    nicResourceId,
                    kind,
                    resolveEffectiveResourceId,
                    pollResponse,
                    cancellationToken)
                .ConfigureAwait(false);
        }

        return SkippedEffectiveControlRow(nicResourceId, kind);
    }

    private async Task<HostedAzureArmEffectiveNetworkControlRecord> ReadEffectiveControlResponseAsync(
        string nicResourceId,
        string kind,
        Func<JsonElement, string?> resolveEffectiveResourceId,
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
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

            return SkippedEffectiveControlRow(nicResourceId, kind);
        }

        string payload = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

        try
        {
            using JsonDocument document = JsonDocument.Parse(payload);
            string? effectiveResourceId = resolveEffectiveResourceId(document.RootElement);

            if (string.IsNullOrWhiteSpace(effectiveResourceId))
            {
                return SkippedEffectiveControlRow(nicResourceId, kind);
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

            return SkippedEffectiveControlRow(nicResourceId, kind);
        }
    }

    private static HostedAzureArmEffectiveNetworkControlRecord SkippedEffectiveControlRow(string nicResourceId, string kind)
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

    private static string ResolveSubscriptionScope(string nicResourceId)
    {
        string[] segments = nicResourceId.Trim('/').Split('/', StringSplitOptions.RemoveEmptyEntries);

        if (segments.Length < 2 || !segments[0].Equals("subscriptions", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("NIC resource id must be scoped to an Azure subscription.", nameof(nicResourceId));
        }

        return $"subscriptions/{segments[1]}";
    }

    private static TimeSpan ResolvePollDelay(RetryConditionHeaderValue? retryAfter)
    {
        if (retryAfter?.Delta is { } delta)
        {
            return delta < TimeSpan.Zero ? TimeSpan.Zero : delta;
        }

        if (retryAfter?.Date is { } date)
        {
            TimeSpan remaining = date - TimeProvider.System.GetUtcNow();
            return remaining < TimeSpan.Zero ? TimeSpan.Zero : remaining;
        }

        return DefaultEffectiveNetworkControlPollDelay;
    }

    private static string ComputePayloadHash(string payload)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexStringLower(hash);
    }
}
