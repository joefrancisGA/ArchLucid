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
        CommittedReplayPair pair = await ArrangeCommittedPairAsync();

        PersistedComparison persisted = await pair.PersistEndToEndComparisonForTestAsync(Client);
        persisted.ComparisonRecordId.Should().NotBeNullOrWhiteSpace(); // struct field from PostPersist header

        EndToEndReplayComparisonExportResponse payload = await (
            await Client.GetEndToEndCompareExportMarkdownForTestAsync(pair))
            .ReadJsonForTestAsync<EndToEndReplayComparisonExportResponse>(JsonOptions);
        payload.Format.Should().Be("markdown");
        payload.Content.Should().Contain("# ArchLucid End-to-End Replay Comparison Export");
    }

    [SkippableFact]
    public async Task Golden_path_finalize_governance_and_replay_pair_arrange()
    {
        FinalizedRun finalized = await ArrangeFinalizedAsync();
        finalized.RunId.Should().NotBeNullOrWhiteSpace();
        finalized.ManifestVersion.Should().NotBeNullOrWhiteSpace();

        FinalizedRun governance = await ArrangeGovernanceCommittedAsync();
        governance.RunId.Should().NotBeNullOrWhiteSpace();

        CommittedReplayPair pair = await ArrangeCommittedPairAsync();
        pair.RunId.Should().NotBeNullOrWhiteSpace();
        pair.ReplayRunId.Should().NotBeNullOrWhiteSpace();
    }
}
