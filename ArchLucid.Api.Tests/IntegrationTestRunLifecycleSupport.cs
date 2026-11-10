using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

namespace ArchLucid.Api.Tests;

/// <summary>
///     SQL integration runs may complete the authority pipeline during <c>POST /v1/architecture/request</c>.
///     Execute then returns <c>409 Conflict</c> (TB-1007 / EK-07) — helpers treat that as a no-op for test setup.
/// </summary>
public static class IntegrationTestRunLifecycleSupport
{
    /// <summary>Architecture intake POST route used by test harness helpers.</summary>
    public const string ArchitectureRequestRelativeUrl = "/v1/architecture/request";

    /// <summary>Builds an architecture intake <see cref="HttpRequestMessage" /> (JWT, idempotency, custom body tests).</summary>
    public static HttpRequestMessage CreateArchitectureRequestMessage(HttpContent? body = null) =>
        new(HttpMethod.Post, ArchitectureRequestRelativeUrl) { Content = body };

    /// <summary>Builds an intake request with the standard <see cref="TestRequestFactory" /> payload.</summary>
    public static HttpRequestMessage CreateArchitectureRequestMessage(string requestId) =>
        CreateArchitectureRequestMessage(JsonContent.Create(TestRequestFactory.CreateArchitectureRequest(requestId)));

    /// <summary>Builds an intake request with an <c>Idempotency-Key</c> header (idempotency contract tests).</summary>
    public static HttpRequestMessage CreateArchitectureRequestMessage(HttpContent body, string idempotencyKey)
    {
        HttpRequestMessage request = CreateArchitectureRequestMessage(body);
        request.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        return request;
    }

    /// <summary>POST intake with a structured body (non-standard payloads).</summary>
    public static Task<HttpResponseMessage> PostArchitectureRequestForTestAsync(
        this HttpClient client,
        object body,
        CancellationToken cancellationToken = default) =>
        client.PostAsync(
            ArchitectureRequestRelativeUrl,
            JsonContent.Create(body),
            cancellationToken);

    /// <summary>
    ///     Greenfield SQL create with transient 503 retry and a unique <c>Idempotency-Key</c> from
    ///     <paramref name="idempotencyKeyPrefix" />.
    /// </summary>
    public static Task<HttpResponseMessage> PostGreenfieldArchitectureRequestForTestAsync(
        this HttpClient client,
        object body,
        string idempotencyKeyPrefix,
        CancellationToken cancellationToken = default)
    {
        string idempotencyKey = idempotencyKeyPrefix + Guid.NewGuid().ToString("N");

        return ArchitectureRequestConcurrencyTestSupport.PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
            client,
            body,
            idempotencyKey,
            cancellationToken);
    }

    /// <summary>Single source for the review execute route used by test harness helpers.</summary>
    public static string ExecuteReviewRelativeUrl(object runId) =>
        $"/v1/architecture/review/{runId}/execute";

    /// <summary>Single source for the review replay route used by test harness helpers.</summary>
    public static string ReplayReviewRelativeUrl(object runId) =>
        $"/v1/architecture/review/{runId}/replay";

    /// <summary>Single source for persisted comparison record replay.</summary>
    public static string ComparisonReplayRelativeUrl(string comparisonRecordId) =>
        $"/v1/architecture/comparisons/{comparisonRecordId}/replay";

    /// <summary>POST comparison record replay with standard JSON body.</summary>
    public static Task<HttpResponseMessage> PostComparisonReplayForTestAsync(
        this HttpClient client,
        string comparisonRecordId,
        string format = "markdown",
        CancellationToken cancellationToken = default) =>
        client.PostAsync(
            ComparisonReplayRelativeUrl(comparisonRecordId),
            JsonContent.Create(new { format }),
            cancellationToken);

    /// <summary>Query string for left/right run ids on end-to-end compare routes.</summary>
    public static string EndToEndCompareRunPairQuery(string leftRunId, string rightRunId) =>
        $"?leftRunId={Uri.EscapeDataString(leftRunId)}&rightRunId={Uri.EscapeDataString(rightRunId)}";

    /// <summary>Single source for end-to-end compare summary POST (persist or ad-hoc summary).</summary>
    public static string EndToEndCompareSummaryRelativeUrl(string leftRunId, string rightRunId) =>
        $"/v1/architecture/review/compare/end-to-end/summary{EndToEndCompareRunPairQuery(leftRunId, rightRunId)}";

    /// <summary>Markdown export JSON endpoint.</summary>
    public static string EndToEndCompareExportMarkdownRelativeUrl(string leftRunId, string rightRunId) =>
        $"/v1/architecture/review/compare/end-to-end/export{EndToEndCompareRunPairQuery(leftRunId, rightRunId)}";

    /// <summary>DOCX export endpoint.</summary>
    public static string EndToEndCompareExportDocxRelativeUrl(string leftRunId, string rightRunId) =>
        $"/v1/architecture/review/compare/end-to-end/export/docx{EndToEndCompareRunPairQuery(leftRunId, rightRunId)}";

    /// <summary>Markdown file download endpoint (supports range requests).</summary>
    public static string EndToEndCompareExportFileRelativeUrl(string leftRunId, string rightRunId) =>
        $"/v1/architecture/review/compare/end-to-end/export/file{EndToEndCompareRunPairQuery(leftRunId, rightRunId)}";

    public static Task<HttpResponseMessage> GetEndToEndCompareExportMarkdownForTestAsync(
        this HttpClient client,
        string leftRunId,
        string rightRunId,
        CancellationToken cancellationToken = default) =>
        client.GetAsync(EndToEndCompareExportMarkdownRelativeUrl(leftRunId, rightRunId), cancellationToken);

    public static Task<HttpResponseMessage> GetEndToEndCompareExportDocxForTestAsync(
        this HttpClient client,
        string leftRunId,
        string rightRunId,
        CancellationToken cancellationToken = default) =>
        client.GetAsync(EndToEndCompareExportDocxRelativeUrl(leftRunId, rightRunId), cancellationToken);

    public static Task<HttpResponseMessage> GetEndToEndCompareExportFileForTestAsync(
        this HttpClient client,
        string leftRunId,
        string rightRunId,
        CancellationToken cancellationToken = default) =>
        client.GetAsync(EndToEndCompareExportFileRelativeUrl(leftRunId, rightRunId), cancellationToken);

    /// <summary>POST end-to-end compare summary with an optional JSON body (e.g. <c>persist</c> flag).</summary>
    public static Task<HttpResponseMessage> PostEndToEndCompareSummaryForTestAsync(
        this HttpClient client,
        string leftRunId,
        string rightRunId,
        HttpContent? body = null,
        CancellationToken cancellationToken = default) =>
        client.PostAsync(EndToEndCompareSummaryRelativeUrl(leftRunId, rightRunId), body, cancellationToken);

    /// <summary>POST persist end-to-end comparison; returns <c>X-ArchLucid-ComparisonRecordId</c>.</summary>
    public static async Task<string> PostPersistEndToEndComparisonForTestAsync(
        this HttpClient client,
        string leftRunId,
        string rightRunId,
        CancellationToken cancellationToken = default)
    {
        using HttpResponseMessage persist = await client
            .PostEndToEndCompareSummaryForTestAsync(
                leftRunId,
                rightRunId,
                JsonContent.Create(new { persist = true }),
                cancellationToken)
            .ConfigureAwait(false);

        await persist.EnsureSuccessForTestAsync().ConfigureAwait(false);

        return persist.ReadComparisonRecordIdHeaderForTest();
    }

    /// <summary>Single source for the review finalize route used by test harness helpers.</summary>
    public static string FinalizeReviewRelativeUrl(string runId) =>
        $"/v1/architecture/review/{runId}/finalize";

    /// <summary>Builds an execute <see cref="HttpRequestMessage" /> (concurrency / raw response tests).</summary>
    public static HttpRequestMessage CreateExecuteReviewRequest(string runId, HttpContent? body = null) =>
        new(HttpMethod.Post, ExecuteReviewRelativeUrl(runId)) { Content = body };

    /// <summary>Builds a finalize <see cref="HttpRequestMessage" /> (idempotency / custom body tests).</summary>
    public static HttpRequestMessage CreateFinalizeReviewRequest(
        string runId,
        HttpContent? body = null) =>
        new(HttpMethod.Post, FinalizeReviewRelativeUrl(runId)) { Content = body };

    /// <summary>Builds a review replay <see cref="HttpRequestMessage" /> (custom headers / audit tests).</summary>
    public static HttpRequestMessage CreateReviewReplayRequest(
        string runId,
        bool commitReplay,
        string executionMode = "Current",
        string? manifestVersionOverride = null) =>
        new(HttpMethod.Post, ReplayReviewRelativeUrl(runId))
        {
            Content = JsonContent.Create(new { commitReplay, executionMode, manifestVersionOverride })
        };

    /// <summary>
    ///     POST review replay with optional κ pin refresh before commit-replay paths.
    /// </summary>
    public static async Task<HttpResponseMessage> PostReviewReplayForTestAsync(
        this HttpClient client,
        ArchLucidApiFactory? factory,
        string runId,
        bool commitReplay,
        string executionMode = "Current",
        string? manifestVersionOverride = null,
        CancellationToken cancellationToken = default)
    {
        if (factory is not null)
        {
            await IntegrationTestArchitectureVersionPinSupport
                .EnsureCurrentPinForRunAsync(factory, runId, cancellationToken)
                .ConfigureAwait(false);
        }

        return await client.PostAsync(
            ReplayReviewRelativeUrl(runId),
            JsonContent.Create(new { commitReplay, executionMode, manifestVersionOverride }),
            cancellationToken);
    }

    public static async Task<bool> IsAuthorityPipelineCompleteExecuteConflictAsync(
        this HttpResponseMessage response,
        CancellationToken cancellationToken = default)
    {
        if (response.StatusCode != HttpStatusCode.Conflict)
            return false;

        string body = await response.Content.ReadAsStringAsync(cancellationToken);

        return body.Contains("authority-pipeline complete", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Execute only when the authority pipeline is not already complete. Prefer
    ///     <see cref="PostExecuteAndEnsureArchitectureVersionPinForTestAsync" /> when finalize follows in the same test.
    /// </summary>
    public static async Task PostExecuteUnlessAuthorityPipelineCompleteAsync(
        this HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        using HttpResponseMessage response = await client.PostExecuteForTestAsync(runId, cancellationToken);
    }

    /// <summary>
    ///     Execute when the authority pipeline is not already complete, then refresh κ pins after any
    ///     knowledge-model or graph mutations so finalize does not fail integrity drift checks.
    /// </summary>
    public static async Task PostExecuteAndEnsureArchitectureVersionPinForTestAsync(
        this HttpClient client,
        ArchLucidApiFactory factory,
        string runId,
        CancellationToken cancellationToken = default)
    {
        await client.PostExecuteForTestAsync(runId, cancellationToken);

        await IntegrationTestArchitectureVersionPinSupport
            .EnsureCurrentPinForRunAsync(factory, runId, cancellationToken);
    }

    /// <summary>
    ///     Finalize after refreshing create-time architecture version κ pins (harness parity with production pin-sync).
    /// </summary>
    public static async Task<HttpResponseMessage> PostFinalizeForTestAsync(
        this HttpClient client,
        ArchLucidApiFactory factory,
        string runId,
        HttpContent? body = null,
        CancellationToken cancellationToken = default)
    {
        await IntegrationTestArchitectureVersionPinSupport
            .EnsureCurrentPinForRunAsync(factory, runId, cancellationToken);

        return await client.PostAsync(
            FinalizeReviewRelativeUrl(runId),
            body,
            cancellationToken);
    }

    public static Task<HttpResponseMessage> PostArchitectureRequestForTestAsync(
        this HttpClient client,
        string requestId,
        CancellationToken cancellationToken = default) =>
        client.PostAsync(
            ArchitectureRequestRelativeUrl,
            JsonContent.Create(TestRequestFactory.CreateArchitectureRequest(requestId)),
            cancellationToken);

    /// <summary>
    ///     Create-run → execute (when needed) → pin refresh → finalize; returns run id and committed manifest version.
    /// </summary>
    public static async Task<string> CreateArchitectureRunForTestAsync(
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        string requestId,
        CancellationToken cancellationToken = default)
    {
        HttpResponseMessage createResponse = await client.PostArchitectureRequestForTestAsync(
            requestId,
            cancellationToken);

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(jsonOptions, cancellationToken);

        return created!.Run.RunId;
    }

    /// <inheritdoc cref="CreateRunExecuteAndFinalizeForTestAsync" />
    public static Task<FinalizedRun> CreateFinalizedRunForTestAsync(
        HttpClient client,
        ArchLucidApiFactory factory,
        JsonSerializerOptions jsonOptions,
        string requestId,
        CancellationToken cancellationToken = default) =>
        CreateRunExecuteAndFinalizeForTestAsync(client, factory, jsonOptions, requestId, cancellationToken);

    public static async Task<FinalizedRun> CreateRunExecuteAndFinalizeForTestAsync(
        HttpClient client,
        ArchLucidApiFactory factory,
        JsonSerializerOptions jsonOptions,
        string requestId,
        CancellationToken cancellationToken = default)
    {
        string runId = await CreateArchitectureRunForTestAsync(client, jsonOptions, requestId, cancellationToken);

        await client.PostExecuteAndEnsureArchitectureVersionPinForTestAsync(factory, runId, cancellationToken);
        HttpResponseMessage commitResponse =
            await client.PostFinalizeForTestAsync(factory, runId, cancellationToken: cancellationToken);

        await commitResponse.EnsureSuccessForTestAsync();
        CommitRunResponseDto? commitPayload =
            await commitResponse.Content.ReadFromJsonAsync<CommitRunResponseDto>(jsonOptions, cancellationToken);

        return new FinalizedRun(runId, commitPayload!.Manifest.Metadata.ManifestVersion);
    }

    public static async Task<HttpResponseMessage> PostExecuteForTestAsync(
        this HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        HttpResponseMessage response = await client.PostAsync(
            ExecuteReviewRelativeUrl(runId),
            null,
            cancellationToken);

        if (await response.IsAuthorityPipelineCompleteExecuteConflictAsync(cancellationToken))
            return response;

        await response.EnsureSuccessForTestAsync();

        return response;
    }
}
