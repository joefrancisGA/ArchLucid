using ArchLucid.Contracts.Metadata;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Parallel persisted end-to-end compares: in-memory <see cref="IComparisonRecordRepository" /> stores one row per
///     successful persist (no deduplication on same run pair), so this test requires five distinct
///     <c>X-ArchLucid-ComparisonRecordId</c> values and five retrievable records.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class ComparisonPersistConcurrencyIntegrationTests
{
    [SkippableFact]
    public async Task Five_parallel_persisted_compares_produce_five_distinct_in_memory_record_ids()
    {
        await IntegrationTestIsolatedSqlScope.RunWithReplayAsync(async (replay, factory) =>
        {
            CommittedReplayPair pair = await replay.CommitAndReplayAsync(
                TestRequestIds.ForScenario(nameof(ComparisonPersistConcurrencyIntegrationTests)));

            IComparisonRecordRepository repository =
                factory.Services.GetRequiredService<IComparisonRecordRepository>();

            const int parallel = 5;
            Task<PersistedComparison>[] tasks = new Task<PersistedComparison>[parallel];

            for (int i = 0; i < parallel; i++)
            {
                tasks[i] = replay.PersistEndToEndComparisonAsync(pair.RunId, pair.ReplayRunId);
            }

            IReadOnlyList<PersistedComparison> persisted = await Task.WhenAll(tasks);
            persisted.Select(static p => p.ComparisonRecordId).ToHashSet().Count.Should()
                .Be(parallel, "each persist should create a new record id");

            IReadOnlyList<ComparisonRecord> matches = await repository.SearchAsync(
                comparisonType: null,
                leftRunId: pair.RunId,
                rightRunId: pair.ReplayRunId,
                createdFromUtc: null,
                createdToUtc: null,
                leftExportRecordId: null,
                rightExportRecordId: null,
                label: null,
                tags: null,
                sortBy: null,
                sortDir: null,
                skip: 0,
                limit: 100,
                cancellationToken: CancellationToken.None);

            int pairMatches = matches.Count(m => string.Equals(m.LeftRunId, pair.RunId, StringComparison.Ordinal)
                                                 && string.Equals(m.RightRunId, pair.ReplayRunId, StringComparison.Ordinal));
            pairMatches.Should().BeGreaterThanOrEqualTo(parallel);
        });
    }
}
