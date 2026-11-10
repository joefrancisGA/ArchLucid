using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models;
namespace ArchLucid.Api.Tests;

/// <summary>Read helpers for runs produced by <see cref="CreateRunForTestAsync" /> / <see cref="RunReadyForExecuteAsync" />.</summary>
public static class CreatedRunForTestHarnessExtensions
{
    public static Task<HttpResponseMessage> GetFindingsExportCsvHttpAsync(
        this CreatedRunForTest created,
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{created.RunId}/findings/export/csv", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetTraceabilityBundleZipHttpAsync(
        this CreatedRunForTest created,
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{created.RunId}/traceability-bundle.zip", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetStoredEvidenceFilesHttpAsync(
        this CreatedRunForTest created,
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{created.RunId}/evidence/files", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetStoredEvidenceFileHttpAsync(
        this CreatedRunForTest created,
        HttpClient client,
        string evidenceItemId,
        string? disposition = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(evidenceItemId);

        string path = string.IsNullOrEmpty(disposition)
            ? $"/v1/architecture/review/{created.RunId}/evidence/files/{evidenceItemId}"
            : $"/v1/architecture/review/{created.RunId}/evidence/files/{evidenceItemId}?disposition={disposition}";

        return client.GetAsync(path, cancellationToken);
    }

    public static Task<HttpResponseMessage> PostEvidenceBulkHttpAsync(
        this CreatedRunForTest created,
        HttpClient client,
        HttpContent content,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(content);

        return client.PostAsync($"/v1/architecture/review/{created.RunId}/evidence/bulk", content, cancellationToken);
    }

    public static Task<HttpResponseMessage> GetRunHttpAsync(
        this CreatedRunForTest created,
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);

        return client.GetRunHttpAsync(created.RunId, cancellationToken);
    }

    public static Task<HttpResponseMessage> GetRunHttpAsync(
        this HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(runId);

        return client.GetAsync($"/v1/architecture/review/{runId}", cancellationToken);
    }

    public static HttpRequestMessage CreateRunGetRequest(this CreatedRunForTest created)
    {
        ArgumentNullException.ThrowIfNull(created);

        return new HttpRequestMessage(HttpMethod.Get, $"/v1/architecture/review/{created.RunId}");
    }

    public static HttpRequestMessage CreateConditionalRunGetRequest(this CreatedRunForTest created, string etag)
    {
        ArgumentNullException.ThrowIfNull(created);

        HttpRequestMessage request = created.CreateRunGetRequest();
        request.Headers.TryAddWithoutValidation("If-None-Match", etag);

        return request;
    }

    public static async Task<PinRunResponse> PatchPinAsync(
        this CreatedRunForTest created,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        bool? isPinned = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpContent content = isPinned is null
            ? new StringContent("{}", Encoding.UTF8, "application/json")
            : JsonContent.Create(new { isPinned });

        HttpResponseMessage response = await client
            .PatchAsync($"/v1/architecture/review/{created.RunId}/pin", content, cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<PinRunResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<RunSummaryResponse> GetAuthorityRunSummaryAsync(
        this CreatedRunForTest created,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/authority/reviews/{created.RunGuid:D}/summary", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<RunSummaryResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<AgentEvidencePackageResponse> GetEvidenceAsync(
        this CreatedRunForTest created,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{created.RunId}/evidence", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<AgentEvidencePackageResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<AgentExecutionTraceResponse> GetTracesAsync(
        this CreatedRunForTest created,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(created);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{created.RunId}/traces", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<AgentExecutionTraceResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }
}
