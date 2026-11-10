using System.Text.Json;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Pagination;

namespace ArchLucid.Api.Tests;

/// <summary>Read helpers for runs produced by <see cref="ArrangeFinalizedAsync" />.</summary>
public static class FinalizedRunHarnessExtensions
{
    public static async Task<ManifestMarkdownDocumentResponse> GetManifestSummaryAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/manifest/{finalized.ManifestVersion}/summary", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<ManifestMarkdownDocumentResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<RunDetailsResponseDto> GetRunDetailsAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{finalized.RunId}", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<RunDetailsResponseDto>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<AgentEvidencePackageResponse> GetEvidenceAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{finalized.RunId}/evidence", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<AgentEvidencePackageResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<AgentExecutionTraceResponse> GetTracesAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{finalized.RunId}/traces", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<AgentExecutionTraceResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<DecisionNodeResponseDto> GetDecisionsAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{finalized.RunId}/decisions", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<DecisionNodeResponseDto>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<RunRoiScorecardDto> GetRoiAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{finalized.RunId}/roi", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<RunRoiScorecardDto>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<RunExportHistoryResponse> GetExportsHistoryAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/architecture/review/{finalized.RunId}/exports", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<RunExportHistoryResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<AuthorityReviewDetailHarnessResponse> GetAuthorityReviewDetailAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .GetAsync($"/v1/authority/reviews/{finalized.RunGuid:D}", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<AuthorityReviewDetailHarnessResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<RunSummaryResponse> GetAuthorityRunSummaryAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await AuthorityHarnessExtensions
            .GetAuthorityReviewSummaryHttpAsync(client, finalized.RunGuid, cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<RunSummaryResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static Task<CursorPagedResponse<RunSummaryResponse>> ListAuthorityReviewsForProjectAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        int take = 20,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        return AuthorityHarnessExtensions.ReadAuthorityProjectReviewsAsync(
            client,
            jsonOptions,
            finalized.SystemName,
            take,
            cancellationToken);
    }

    public static async Task<ArchitectureAnalysisExportResponse> PostAnalysisReportMarkdownExportAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .PostAsync(
                $"/v1/architecture/review/{finalized.RunId}/analysis-report/export",
                HarnessAnalysisReportRequestFactory.CreateDefaultJsonContent(jsonOptions),
                cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<ArchitectureAnalysisExportResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<ArchitectureAnalysisReportResponse> PostAnalysisReportAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await client
            .PostAsync(
                $"/v1/architecture/review/{finalized.RunId}/analysis-report",
                HarnessAnalysisReportRequestFactory.CreateDefaultJsonContent(jsonOptions),
                cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<ArchitectureAnalysisReportResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static Task<HttpResponseMessage> PostAnalysisReportDocxHttpAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        return client.PostAsync(
            $"/v1/architecture/review/{finalized.RunId}/analysis-report/export/docx",
            HarnessAnalysisReportRequestFactory.CreateDefaultJsonContent(jsonOptions),
            cancellationToken);
    }

    public static Task<HttpResponseMessage> PostAnalysisReportDocxAsyncJobHttpAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        return client.PostAsync(
            $"/v1/architecture/review/{finalized.RunId}/analysis-report/export/docx/async",
            HarnessAnalysisReportRequestFactory.CreateDefaultJsonContent(jsonOptions),
            cancellationToken);
    }

    public static Task<HttpResponseMessage> PostAnalysisReportConsultingDocxHttpAsync(
        this FinalizedRun finalized,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        object requestBody,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);
        ArgumentNullException.ThrowIfNull(requestBody);

        return client.PostAsync(
            $"/v1/architecture/review/{finalized.RunId}/analysis-report/export/docx/consulting",
            IntegrationTestHttpContent.CreateJson(requestBody, jsonOptions),
            cancellationToken);
    }

    public static Task<CommittedReplayPair> OpenCommittedReplayPairAsync(
        this FinalizedRun finalized,
        ReplaySession replay)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(replay);

        return replay.OpenCommittedPairAsync(finalized.RequestId);
    }

    public static Task<HttpResponseMessage> GetFindingsExportCsvHttpAsync(
        this FinalizedRun finalized,
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{finalized.RunId}/findings/export/csv", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetTraceabilityBundleZipHttpAsync(
        this FinalizedRun finalized,
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{finalized.RunId}/traceability-bundle.zip", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetFindingEvidenceChainHttpAsync(
        this FinalizedRun finalized,
        HttpClient client,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(findingId);

        return client.GetAsync(
            $"/v1/architecture/review/{finalized.RunId}/findings/{findingId}/evidence-chain",
            cancellationToken);
    }

    public static Task<HttpResponseMessage> GetStoredEvidenceFilesHttpAsync(
        this FinalizedRun finalized,
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/architecture/review/{finalized.RunId}/evidence/files", cancellationToken);
    }

    public static Task<HttpResponseMessage> PostEvidenceBulkHttpAsync(
        this FinalizedRun finalized,
        HttpClient client,
        HttpContent content,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(content);

        return client.PostAsync($"/v1/architecture/review/{finalized.RunId}/evidence/bulk", content, cancellationToken);
    }

    public static Task<HttpResponseMessage> GetExportRecordDiffHttpAsync(
        this FinalizedRun finalized,
        HttpClient client,
        string leftExportRecordId,
        string rightExportRecordId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(finalized);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(leftExportRecordId);
        ArgumentException.ThrowIfNullOrEmpty(rightExportRecordId);

        return client.GetAsync(
            $"/v1/architecture/review/exports/compare?leftExportRecordId={leftExportRecordId}&rightExportRecordId={rightExportRecordId}",
            cancellationToken);
    }
}
