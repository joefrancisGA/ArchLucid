using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Architecture;

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
}
