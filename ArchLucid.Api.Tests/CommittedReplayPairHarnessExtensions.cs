using System.Text.Json;

using ArchLucid.Api.Models;

namespace ArchLucid.Api.Tests;

/// <summary>Comparison arrange helpers on <see cref="CommittedReplayPair" />.</summary>
public static class CommittedReplayPairHarnessExtensions
{
    public static Task<PersistedComparison> PersistEndToEndComparisonForTestAsync(
        this CommittedReplayPair pair,
        HttpClient client) =>
        client.PostPersistEndToEndComparisonForTestAsync(pair.RunId, pair.ReplayRunId);

    public static async Task<EndToEndReplayComparisonExportResponse> ReadEndToEndCompareExportMarkdownAsync(
        this CommittedReplayPair pair,
        HttpClient client,
        JsonSerializerOptions jsonOptions,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(pair);
        ArgumentNullException.ThrowIfNull(client);
        ArgumentNullException.ThrowIfNull(jsonOptions);

        HttpResponseMessage response =
            await client.GetEndToEndCompareExportMarkdownForTestAsync(pair, cancellationToken).ConfigureAwait(false);

        return await response.ReadJsonForTestAsync<EndToEndReplayComparisonExportResponse>(jsonOptions, cancellationToken)
            .ConfigureAwait(false);
    }
}
