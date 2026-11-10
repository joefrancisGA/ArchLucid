using System.Text.Json;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models;
using ArchLucid.Core.Pagination;

namespace ArchLucid.Api.Tests;

/// <summary>Canonical GET helpers for <c>/v1/authority/*</c> routes in harness fixtures.</summary>
public static class AuthorityHarnessExtensions
{
    public static Task<HttpResponseMessage> GetAuthorityReviewSummaryHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/authority/reviews/{runGuid:D}/summary", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetAuthorityRunProvenanceHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/authority/reviews/{runGuid:D}/provenance", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetAuthorityProjectReviewsHttpAsync(
        this HttpClient client,
        string projectIdSegment,
        string? querySuffix = "take=20",
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrEmpty(projectIdSegment);

        string path = string.IsNullOrEmpty(querySuffix)
            ? $"/v1/authority/projects/{projectIdSegment}/reviews"
            : $"/v1/authority/projects/{projectIdSegment}/reviews?{querySuffix}";

        return client.GetAsync(path, cancellationToken);
    }

    public static async Task<CursorPagedResponse<RunSummaryResponse>> ReadAuthorityProjectReviewsAsync(
        this HttpClient client,
        JsonSerializerOptions jsonOptions,
        string projectId,
        int take = 20,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);
        ArgumentException.ThrowIfNullOrEmpty(projectId);

        HttpResponseMessage response = await GetAuthorityProjectReviewsHttpAsync(
                client,
                Uri.EscapeDataString(projectId),
                $"take={take}",
                cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static Task<HttpResponseMessage> GetAuthorityReviewsInScopeHttpAsync(
        this HttpClient client,
        string querySuffix = "take=50",
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/authority/reviews?{querySuffix}", cancellationToken);
    }

    public static async Task<CursorPagedResponse<RunSummaryResponse>> ReadAuthorityProjectReviewsQueryAsync(
        this HttpClient client,
        JsonSerializerOptions jsonOptions,
        string projectIdSegment,
        string querySuffix,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);
        ArgumentException.ThrowIfNullOrEmpty(projectIdSegment);

        HttpResponseMessage response = await GetAuthorityProjectReviewsHttpAsync(
                client,
                projectIdSegment,
                querySuffix,
                cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }

    public static async Task<CursorPagedResponse<RunSummaryResponse>> ReadAuthorityReviewsInScopeAsync(
        this HttpClient client,
        JsonSerializerOptions jsonOptions,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await GetAuthorityReviewsInScopeHttpAsync(client, $"take={take}", cancellationToken)
            .ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }
}
