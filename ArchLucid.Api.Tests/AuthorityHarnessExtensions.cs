using System.Text.Json;

using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Runs;
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
            cancellationToken);

        return await response.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(jsonOptions, cancellationToken);
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
            cancellationToken);

        return await response.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(jsonOptions, cancellationToken);
    }

    public static async Task<CursorPagedResponse<RunSummaryResponse>> ReadAuthorityReviewsInScopeAsync(
        this HttpClient client,
        JsonSerializerOptions jsonOptions,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await GetAuthorityReviewsInScopeHttpAsync(client, $"take={take}", cancellationToken);

        return await response.ReadJsonForTestAsync<CursorPagedResponse<RunSummaryResponse>>(jsonOptions, cancellationToken);
    }

    public static Task<HttpResponseMessage> GetAuthorityReviewDetailHttpAsync(
        this HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return client.GetAsync($"/v1/authority/reviews/{runId}", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetAuthorityReviewBundleHttpAsync(
        this HttpClient client,
        Guid runGuid,
        string bundleSegment,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentException.ThrowIfNullOrWhiteSpace(bundleSegment);

        return client.GetAsync(
            $"/v1/authority/reviews/{runGuid:D}/{bundleSegment}",
            cancellationToken);
    }

    public static Task<HttpResponseMessage> GetAuthorityReviewCriticalPageBundleHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return GetAuthorityReviewBundleHttpAsync(client, runGuid, "critical-page-bundle", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetAuthorityReviewTimelinesBundleHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return GetAuthorityReviewBundleHttpAsync(client, runGuid, "timelines-bundle", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetAuthorityReviewWorkspaceContextBundleHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return GetAuthorityReviewBundleHttpAsync(client, runGuid, "workspace-context-bundle", cancellationToken);
    }

    public static async Task<RunDetailCriticalPageBundleResponse> ReadAuthorityReviewCriticalPageBundleAsync(
        this HttpClient client,
        Guid runGuid,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await GetAuthorityReviewCriticalPageBundleHttpAsync(
            client,
            runGuid,
            cancellationToken);

        return await response.ReadJsonForTestAsync<RunDetailCriticalPageBundleResponse>(jsonOptions, cancellationToken);
    }

    public static async Task<RunDetailTimelinesBundleResponse> ReadAuthorityReviewTimelinesBundleAsync(
        this HttpClient client,
        Guid runGuid,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await GetAuthorityReviewTimelinesBundleHttpAsync(
            client,
            runGuid,
            cancellationToken);

        return await response.ReadJsonForTestAsync<RunDetailTimelinesBundleResponse>(jsonOptions, cancellationToken);
    }

    public static async Task<RunDetailWorkspaceContextBundleResponse> ReadAuthorityReviewWorkspaceContextBundleAsync(
        this HttpClient client,
        Guid runGuid,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response = await GetAuthorityReviewWorkspaceContextBundleHttpAsync(
            client,
            runGuid,
            cancellationToken);

        return await response.ReadJsonForTestAsync<RunDetailWorkspaceContextBundleResponse>(jsonOptions, cancellationToken);
    }
}
