using System.Net;
using System.Text.Json;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Audit;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Polls greenfield SQL integration hosts until committed-run artifacts are readable after
///     <see cref="ArchitectureRequestConcurrencyTestSupport.PostCommitWithGreenfieldTransientRetryAsync" />.
/// </summary>
internal static class GreenfieldCommittedRunReadinessPoll
{
    private static readonly JsonSerializerOptions JsonOptions = IntegrationTestBase.CreateApiJsonOptions();

    internal static Task WaitUntilCommittedRunDetailReadableAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return WaitUntilAsync(
            async ct =>
            {
                using HttpResponseMessage response = await client.GetRunHttpAsync(runId, ct);

                if (!response.IsSuccessStatusCode)
                    return false;

                GetRunResponseDto detail =
                    await response.ReadJsonForTestAsync<GetRunResponseDto>(JsonOptions, ct);

                return detail?.Run is { Status: "Committed", CurrentManifestVersion: { Length: > 0 } };
            },
            "GET /v1/architecture/review/{runId} did not show a committed run with manifest after commit.",
            cancellationToken);
    }

    /// <summary>
    ///     Waits for staged agent results or an already committed authority run that can be verified by finalize.
    /// </summary>
    internal static Task WaitUntilRunManifestReadableForCommitAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return WaitUntilAsync(
            async ct =>
            {
                using HttpResponseMessage response = await client.GetRunHttpAsync(runId, ct);

                if (!response.IsSuccessStatusCode)
                    return false;

                GetRunResponseDto detail =
                    await response.ReadJsonForTestAsync<GetRunResponseDto>(JsonOptions, ct);

                if (detail?.Run is null)
                    return false;

                return detail.Run is { Status: "Committed", CurrentManifestVersion: { Length: > 0 } }
                    || (detail.Run.Status == "ReadyForCommit" && detail.Results is { Count: > 0 });
            },
            "GET /v1/architecture/review/{runId} showed neither ReadyForCommit with agent results nor Committed with a manifest version.",
            cancellationToken,
            maxAttempts: 30,
            maxDelayMs: 4000);
    }

    internal static bool IsManifestNotLoadedYetConflict(HttpStatusCode statusCode, string? responseBody)
    {
        if (statusCode != HttpStatusCode.Conflict)
            return false;

        if (string.IsNullOrEmpty(responseBody))
            return false;

        return responseBody.Contains("manifest could not be loaded yet", StringComparison.OrdinalIgnoreCase);
    }

    internal static async Task<string> FormatRunDetailDiagnosticAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        using CancellationTokenSource bounded =
            CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        bounded.CancelAfter(TimeSpan.FromSeconds(30));

        using HttpResponseMessage response = await client.GetRunHttpAsync(runId, bounded.Token);

        string body = await response.Content.ReadAsStringAsync(bounded.Token);

        GetRunResponseDto? detail = string.IsNullOrWhiteSpace(body)
            ? null
            : JsonSerializer.Deserialize<GetRunResponseDto>(body, JsonOptions);

        int resultsCount = detail?.Results?.Count ?? 0;
        string status = detail?.Run?.Status ?? "(null run)";
        string manifestVersion = detail?.Run?.CurrentManifestVersion ?? "(none)";

        return "GET status="
            + ((int)response.StatusCode).ToString(System.Globalization.CultureInfo.InvariantCulture)
            + " runStatus="
            + status
            + " resultsCount="
            + resultsCount.ToString(System.Globalization.CultureInfo.InvariantCulture)
            + " currentManifestVersion="
            + manifestVersion
            + " bodyLength="
            + body.Length.ToString(System.Globalization.CultureInfo.InvariantCulture);
    }

    internal static async Task<string> WaitUntilFirstValueReportMarkdownReadyAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        string route = $"/v1/pilots/runs/{runId}/first-value-report";
        using HttpResponseMessage response = await ReadEvidenceResponseAsync(client, route, runId, cancellationToken);
        if (response.Content.Headers.ContentType?.MediaType != "text/markdown")
            throw new InvalidOperationException($"Expected Markdown for committed run '{runId}'.");
        return await response.Content.ReadAsStringAsync(cancellationToken);
    }

    internal static Task<string> WaitUntilAuditSearchContainsScopedLifecycleEventsAsync(
        HttpClient client,
        Guid runGuid,
        Guid expectedTenantId,
        CancellationToken cancellationToken = default)
    {
        string tenantMarker = expectedTenantId.ToString("D");

        return WaitUntilAsync(
            async ct =>
            {
                using HttpResponseMessage response =
                    await client.GetAsync($"/v1/audit/search?runId={runGuid:D}&take=200", ct);

                if (!response.IsSuccessStatusCode)
                    return (Ready: false, Value: (string?)null);

                string json = await response.Content.ReadAsStringAsync(ct);

                if (!json.Contains(AuditEventTypes.RunStarted, StringComparison.Ordinal))
                    return (Ready: false, Value: json);

                if (!json.Contains(AuditEventTypes.RunCompleted, StringComparison.Ordinal))
                    return (Ready: false, Value: json);

                if (!json.Contains(tenantMarker, StringComparison.Ordinal))
                    return (Ready: false, Value: json);

                return (Ready: true, Value: json);
            },
            "GET /v1/audit/search did not return scoped RunStarted/RunCompleted audit rows after commit.",
            cancellationToken);
    }

    internal static async Task<byte[]> WaitUntilReferenceEvidenceZipReadyAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        using HttpResponseMessage response = await ReadEvidenceResponseAsync(
            client, "/v1/admin/reference-evidence?includeDemo=false", runId, cancellationToken);
        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }

    private static async Task<HttpResponseMessage> ReadEvidenceResponseAsync(
        HttpClient client, string route, string runId, CancellationToken cancellationToken)
    {
        using CancellationTokenSource budget = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        budget.CancelAfter(TimeSpan.FromSeconds(25));
        string last = "no response";
        try
        {
            for (int attempt = 1; attempt <= 6; attempt++)
            {
                HttpResponseMessage response = await client.GetAsync(route, budget.Token);
                if (response.IsSuccessStatusCode)
                    return response;

                using (response)
                {
                    last = $"HTTP {(int)response.StatusCode}, content type {response.Content.Headers.ContentType?.MediaType ?? "not set"}";
                    if (response.StatusCode is not (HttpStatusCode.ServiceUnavailable or HttpStatusCode.NotFound))
                        break;
                }

                if (attempt < 6)
                    await Task.Delay(TimeSpan.FromMilliseconds(250 * attempt), budget.Token);
            }
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            throw new TimeoutException($"Evidence readiness timed out for '{runId}' at GET {route}. Last response was {last}.");
        }

        throw new InvalidOperationException($"Evidence was unavailable for '{runId}' at GET {route}. Last response was {last}.");
    }

    private static async Task WaitUntilAsync(
        Func<CancellationToken, Task<bool>> probe,
        string failureMessage,
        CancellationToken cancellationToken,
        int maxAttempts = 20,
        int maxDelayMs = 2000)
    {
        int delayMs = 200;

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (await probe(cancellationToken))
                return;

            await Task.Delay(delayMs, cancellationToken);
            delayMs = Math.Min(delayMs * 2, maxDelayMs);
        }

        throw new InvalidOperationException(failureMessage + " See " + nameof(GreenfieldCommittedRunReadinessPoll) + ".");
    }

    private static async Task<string> WaitUntilAsync(
        Func<CancellationToken, Task<(bool Ready, string? Value)>> probe,
        string failureMessage,
        CancellationToken cancellationToken)
    {
        int delayMs = 200;
        string? lastValue = null;

        for (int attempt = 0; attempt < 20; attempt++)
        {
            cancellationToken.ThrowIfCancellationRequested();

            (bool ready, string? value) = await probe(cancellationToken);
            lastValue = value ?? lastValue;

            if (ready && value is not null)
                return value;

            await Task.Delay(delayMs, cancellationToken);
            delayMs = Math.Min(delayMs * 2, 2000);
        }

        throw new InvalidOperationException(
            failureMessage
            + " See "
            + nameof(GreenfieldCommittedRunReadinessPoll)
            + "."
            + (lastValue is null ? string.Empty : " Last payload length=" + lastValue.Length.ToString()));
    }

}
