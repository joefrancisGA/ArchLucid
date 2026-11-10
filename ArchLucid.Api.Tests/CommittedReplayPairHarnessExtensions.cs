namespace ArchLucid.Api.Tests;

/// <summary>Comparison arrange helpers on <see cref="CommittedReplayPair" />.</summary>
public static class CommittedReplayPairHarnessExtensions
{
    public static Task<PersistedComparison> PersistEndToEndComparisonForTestAsync(
        this CommittedReplayPair pair,
        HttpClient client) =>
        client.PostPersistEndToEndComparisonForTestAsync(pair.RunId, pair.ReplayRunId);
}
