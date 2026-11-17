using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     INV-013: committing a replay must not mutate the original run's committed golden manifest payload; replay run id
///     is distinct.
/// </summary>
[Trait("Category", "Slow")]
public sealed class ReplayCommitOriginalGoldenManifestIsolationIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CommitReplay_leaves_original_run_golden_manifest_payload_unchanged_and_uses_distinct_replay_run_id()
    {
        string runId = await Replay.CreateAndExecuteAsync(TestRequestIds.ForScenario(nameof(ReplayCommitOriginalGoldenManifestIsolationIntegrationTests)));
        HttpResponseMessage commitResponse = await Client.PostFinalizeForTestAsync(Factory, runId);
        await commitResponse.EnsureSuccessForTestAsync();

        string fingerprintBefore = await HarnessAuthorityGoldenManifestFingerprintSupport.GetWireGoldenManifestSha256HexAsync(
            Client,
            runId,
            JsonOptions);

        string replayManifestVersion = ReplaySession.NewReplayCommittedManifestVersion();

        HttpResponseMessage replayResponse = await Client.PostReviewReplayForTestAsync(Factory, 
            runId,
            commitReplay: true,
            manifestVersionOverride: replayManifestVersion);
                ReplayRunResponseDto? replayPayload = await replayResponse.ReadJsonForTestAsync<ReplayRunResponseDto>(JsonOptions);
        replayPayload!.ReplayRunId.Should().NotBe(runId);

        string fingerprintAfter = await HarnessAuthorityGoldenManifestFingerprintSupport.GetWireGoldenManifestSha256HexAsync(
            Client,
            runId,
            JsonOptions);

        fingerprintAfter.Should().Be(fingerprintBefore);

        HttpResponseMessage replayRunDetail = await Client.GetAuthorityReviewDetailHttpAsync(replayPayload.ReplayRunId);
        await replayRunDetail.ReadJsonForTestAsync<JsonElement>(JsonOptions);
    }
}
