using ArchLucid.Api.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Single ladder smoke: intake → finalize → commit-replay → persist compare → export read (wiring regressions).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
public sealed class HarnessGoldenPathSmokeTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Golden_path_intake_through_end_to_end_export_markdown()
    {
        CommittedReplayPair pair = await Replay.OpenCommittedPairAsync(
            TestRequestIds.ForScenario(nameof(HarnessGoldenPathSmokeTests)));

        PersistedComparison persisted = await Client.PostPersistEndToEndComparisonForTestAsync(pair.RunId, pair.ReplayRunId);
        persisted.ComparisonRecordId.Should().NotBeNullOrWhiteSpace(); // struct field from PostPersist header

        EndToEndReplayComparisonExportResponse payload = await (
            await Client.GetEndToEndCompareExportMarkdownForTestAsync(pair))
            .ReadJsonForTestAsync<EndToEndReplayComparisonExportResponse>(JsonOptions);
        payload.Format.Should().Be("markdown");
        payload.Content.Should().Contain("# ArchLucid End-to-End Replay Comparison Export");
    }
}
