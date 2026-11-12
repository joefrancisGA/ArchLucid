using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Api.Tests;

/// <summary><c>/v1/architecture/review/{runId}/…</c> helpers that do not require a harness run record.</summary>
public static class ReviewSubresourceHarnessExtensions
{
    public static Task<HttpResponseMessage> GetReviewFindingsExportCsvHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{runGuid:D}/findings/export/csv", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewTraceabilityBundleZipHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{runGuid:D}/traceability-bundle.zip", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewStoredEvidenceFilesHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{runGuid:D}/evidence/files", cancellationToken);
    }

    public static async Task<AgentEvidencePackageResponse> GetReviewEvidenceAsync(
        this HttpClient client,
        Guid runGuid,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client.GetAsync(
            $"/v1/architecture/review/{runGuid:D}/evidence",
            cancellationToken);

        return await response.ReadJsonForTestAsync<AgentEvidencePackageResponse>(jsonOptions, cancellationToken);
    }

    public static async Task<AgentExecutionTraceResponse> GetReviewTracesAsync(
        this HttpClient client,
        Guid runGuid,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client.GetAsync(
            $"/v1/architecture/review/{runGuid:D}/traces",
            cancellationToken);

        return await response.ReadJsonForTestAsync<AgentExecutionTraceResponse>(jsonOptions, cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewFindingEvidenceChainHttpAsync(
        this HttpClient client,
        Guid runGuid,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(findingId);

        return client.GetAsync(
            $"/v1/architecture/review/{runGuid:D}/findings/{findingId}/evidence-chain",
            cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewDecisionsHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{runGuid:D}/decisions", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewRoiHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{runGuid:D}/roi", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetReviewExportsHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{runGuid:D}/exports", cancellationToken);
    }

    public static async Task<DecisionNodeResponseDto> GetReviewDecisionsAsync(
        this HttpClient client,
        Guid runGuid,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await GetReviewDecisionsHttpAsync(client, runGuid, cancellationToken);

        return await response.ReadJsonForTestAsync<DecisionNodeResponseDto>(jsonOptions, cancellationToken);
    }

    public static async Task<RunRoiScorecardDto> GetReviewRoiAsync(
        this HttpClient client,
        Guid runGuid,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await GetReviewRoiHttpAsync(client, runGuid, cancellationToken);

        return await response.ReadJsonForTestAsync<RunRoiScorecardDto>(jsonOptions, cancellationToken);
    }

    public static async Task<RunExportHistoryResponse> GetReviewExportsHistoryAsync(
        this HttpClient client,
        Guid runGuid,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await GetReviewExportsHttpAsync(client, runGuid, cancellationToken);

        return await response.ReadJsonForTestAsync<RunExportHistoryResponse>(jsonOptions, cancellationToken);
    }
}
