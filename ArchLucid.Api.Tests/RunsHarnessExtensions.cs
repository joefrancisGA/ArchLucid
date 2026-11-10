using System.Text.Json;

namespace ArchLucid.Api.Tests;

/// <summary>Canonical GET helpers for <c>/v1/runs/*</c> routes in harness fixtures.</summary>
public static class RunsHarnessExtensions
{
    public static Task<HttpResponseMessage> GetRunsListHttpAsync(
        this HttpClient client,
        string querySuffix = "take=20",
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/runs?{querySuffix}", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetRunDetailHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/runs/{runGuid:D}", cancellationToken);
    }

    public static Task<HttpResponseMessage> GetRunReviewTrailHttpAsync(
        this HttpClient client,
        Guid runGuid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        return client.GetAsync($"/v1/runs/{runGuid:D}/review-trail", cancellationToken);
    }

    public static async Task<string> ReadRunsListBodyAsync(
        this HttpClient client,
        int take = 20,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(client);

        HttpResponseMessage response = await GetRunsListHttpAsync(client, $"take={take}", cancellationToken)
            .ConfigureAwait(false);

        await response.EnsureSuccessForTestAsync();

        return await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
    }
}
