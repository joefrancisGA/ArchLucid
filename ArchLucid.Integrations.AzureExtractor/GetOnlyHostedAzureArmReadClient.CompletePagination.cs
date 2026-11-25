using System.Net.Http.Headers;
using System.Text.Json;

namespace ArchLucid.Integrations.AzureExtractor;

public sealed partial class GetOnlyHostedAzureArmReadClient
{
    private sealed record ArmPaginationResult(
        int ObservedCount,
        bool PartialCollection,
        string? FailureReason);

    /// <summary>
    /// Shared streaming enumeration for ARM object lists. Consumers retain valid observations
    /// and decide how incomplete coverage is represented in their own contracts.
    /// Scope validation and caller cancellation are deliberately not swallowed.
    /// </summary>
    private async Task<ArmPaginationResult> ReadArmObjectPagesAsync(
        string accessToken,
        string initialUrl,
        Action<string> validateNextLink,
        Action<JsonElement> onItem,
        CancellationToken cancellationToken)
    {
        HashSet<string> visitedLinks = new(StringComparer.OrdinalIgnoreCase);
        string? nextLink = initialUrl;
        int requestCount = 0;
        int observedCount = 0;
        string? failureReason = null;

        while (!string.IsNullOrWhiteSpace(nextLink))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!visitedLinks.Add(nextLink))
                return new(observedCount, true, "repeated continuation");

            if (ShouldBreakForPageCap(++requestCount))
                return new(observedCount, true, "page limit");

            using HttpRequestMessage request = new(HttpMethod.Get, nextLink);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            JsonDocument document;
            try
            {
                using HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken)
                    .ConfigureAwait(false);
                if (!response.IsSuccessStatusCode)
                    return new(observedCount, true, $"HTTP {(int)response.StatusCode}");

                await using Stream stream = await response.Content.ReadAsStreamAsync(cancellationToken)
                    .ConfigureAwait(false);
                document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (JsonException)
            {
                return new(observedCount, true, "invalid JSON");
            }
            catch (Exception ex) when (ex is HttpRequestException or IOException)
            {
                cancellationToken.ThrowIfCancellationRequested();
                return new(observedCount, true, "transport failure");
            }

            using (document)
            {
                JsonElement root = document.RootElement;
                if (root.ValueKind != JsonValueKind.Object
                    || !root.TryGetProperty("value", out JsonElement values)
                    || values.ValueKind != JsonValueKind.Array)
                    return new(observedCount, true, "invalid list envelope");

                foreach (JsonElement item in values.EnumerateArray())
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    if (item.ValueKind != JsonValueKind.Object)
                    {
                        failureReason = "invalid list item";
                        continue;
                    }

                    onItem(item);
                    observedCount++;
                }

                nextLink = null;
                if (!root.TryGetProperty("nextLink", out JsonElement continuation)
                    || continuation.ValueKind == JsonValueKind.Null)
                    continue;

                if (continuation.ValueKind != JsonValueKind.String)
                    return new(observedCount, true, "invalid continuation");

                string? candidate = continuation.GetString();
                if (!string.IsNullOrWhiteSpace(candidate))
                {
                    validateNextLink(candidate);
                    nextLink = candidate;
                }
            }
        }

        return new(observedCount, failureReason is not null, failureReason);
    }
}
