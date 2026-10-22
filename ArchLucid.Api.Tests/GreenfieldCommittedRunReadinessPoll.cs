using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Audit;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Polls greenfield SQL integration hosts until committed-run artifacts are readable after
///     <see cref="ArchitectureRequestConcurrencyTestSupport.PostCommitWithGreenfieldTransientRetryAsync" />.
/// </summary>
internal static class GreenfieldCommittedRunReadinessPoll
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(null) },
    };

    internal static Task WaitUntilCommittedRunDetailReadableAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return WaitUntilAsync(
            async ct =>
            {
                using HttpResponseMessage response = await client.GetAsync($"/v1/architecture/review/{runId}", ct);

                if (!response.IsSuccessStatusCode)
                    return false;

                ArchitectureRunDetailProbeDto? detail =
                    await response.Content.ReadFromJsonAsync<ArchitectureRunDetailProbeDto>(JsonOptions, ct);

                return detail?.Run is { Status: "Committed", CurrentManifestVersion: { Length: > 0 } };
            },
            "GET /v1/architecture/review/{runId} did not show a committed run with manifest after commit.",
            cancellationToken);
    }

    /// <summary>
    ///     Returns <see langword="true" /> when the run is already committed with a readable manifest version (idempotent
    ///     success after a 409 manifest-load race or duplicate commit attempt).
    /// </summary>
    internal static async Task<bool> TryReturnIfRunAlreadyCommittedAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        using HttpResponseMessage response = await client.GetAsync($"/v1/architecture/review/{runId}", cancellationToken);

        if (!response.IsSuccessStatusCode)
            return false;

        ArchitectureRunDetailProbeDto? detail =
            await response.Content.ReadFromJsonAsync<ArchitectureRunDetailProbeDto>(JsonOptions, cancellationToken);

        return detail?.Run is { Status: "Committed", CurrentManifestVersion: { Length: > 0 } };
    }

    /// <summary>
    ///     Polls until execute has promoted the run to <c>ReadyForCommit</c> with agent results visible on
    ///     <c>GET /v1/architecture/review/{runId}</c>. Prevents POST /commit racing snapshot/materialization under CI SQL load.
    ///     Note: <c>CurrentManifestVersion</c> is populated only after commit, not at ReadyForCommit.
    /// </summary>
    internal static Task WaitUntilRunManifestReadableForCommitAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return WaitUntilAsync(
            async ct =>
            {
                using HttpResponseMessage response = await client.GetAsync($"/v1/architecture/review/{runId}", ct);

                if (!response.IsSuccessStatusCode)
                    return false;

                ArchitectureRunExecuteReadinessProbeDto? detail =
                    await response.Content.ReadFromJsonAsync<ArchitectureRunExecuteReadinessProbeDto>(JsonOptions, ct);

                if (detail?.Run is null)
                    return false;

                if (!string.Equals(detail.Run.Status, "ReadyForCommit", StringComparison.Ordinal))
                    return false;

                return detail.Results is { Count: > 0 };
            },
            "GET /v1/architecture/review/{runId} did not show ReadyForCommit with agent results before commit.",
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

        using HttpResponseMessage response =
            await client.GetAsync($"/v1/architecture/review/{runId}", bounded.Token);

        string body = await response.Content.ReadAsStringAsync(bounded.Token);

        ArchitectureRunExecuteReadinessProbeDto? detail =
            await response.Content.ReadFromJsonAsync<ArchitectureRunExecuteReadinessProbeDto>(JsonOptions, bounded.Token);

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

    internal static Task<string> WaitUntilFirstValueReportMarkdownReadyAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return WaitUntilAsync(
            async ct =>
            {
                using HttpResponseMessage response =
                    await client.GetAsync($"/v1/pilots/runs/{runId}/first-value-report", ct);

                if (response.StatusCode != HttpStatusCode.OK)
                    return (Ready: false, Value: (string?)null);

                string markdown = await response.Content.ReadAsStringAsync(ct);

                if (!markdown.Contains(runId, StringComparison.Ordinal))
                    return (Ready: false, Value: markdown);

                if (ContainsCanonicalShowcaseDemoRunIds(markdown))
                    return (Ready: false, Value: markdown);

                return (Ready: true, Value: markdown);
            },
            "GET /v1/pilots/runs/{runId}/first-value-report did not return sponsor-safe markdown for the committed run.",
            cancellationToken);
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

    internal static Task<string> WaitUntilReferenceEvidenceReadmeAnchorsRunAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        return WaitUntilAsync(
            async ct =>
            {
                using HttpResponseMessage response =
                    await client.GetAsync("/v1/admin/reference-evidence?includeDemo=false", ct);

                if (response.StatusCode == HttpStatusCode.NotFound)
                    return (Ready: false, Value: (string?)null);

                if (!response.IsSuccessStatusCode)
                    return (Ready: false, Value: (string?)null);

                byte[] zipBytes = await response.Content.ReadAsByteArrayAsync(ct);
                string? readme = ReferenceEvidenceZipReadmeReader.TryReadReadmeText(zipBytes);

                if (readme is null)
                    return (Ready: false, Value: null);

                if (!readme.Contains(runId, StringComparison.Ordinal))
                    return (Ready: false, Value: readme);

                if (ContainsCanonicalShowcaseDemoRunIds(readme))
                    return (Ready: false, Value: readme);

                return (Ready: true, Value: readme);
            },
            "GET /v1/admin/reference-evidence?includeDemo=false did not anchor on the committed non-demo run.",
            cancellationToken);
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

    private static bool ContainsCanonicalShowcaseDemoRunIds(string text)
    {
        if (string.IsNullOrEmpty(text))
            return false;

        return text.Contains(ContosoRetailDemoIdentifiers.RunBaseline, StringComparison.Ordinal)
            || text.Contains(ContosoRetailDemoIdentifiers.RunHardened, StringComparison.Ordinal)
            || text.Contains(ContosoRetailDemoIdentifiers.AuthorityRunBaselineId.ToString("D"), StringComparison.Ordinal)
            || text.Contains(ContosoRetailDemoIdentifiers.AuthorityRunHardenedId.ToString("D"), StringComparison.Ordinal);
    }

    private sealed class ArchitectureRunDetailProbeDto
    {
        public RunDto? Run
        {
            get;
            set;
        }
    }

    private sealed class ArchitectureRunExecuteReadinessProbeDto
    {
        public RunDto? Run
        {
            get;
            set;
        }

        public List<object>? Results
        {
            get;
            set;
        }
    }
}
