using System.Text.Json;

using ArchLucid.Api.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class AuthorityPipelineCommittedInventorySqlIntegrationTests
{
    [SkippableFact]
    public async Task Fresh_sql_review_finalization_replays_the_sealed_artifact_inventory()
    {
        await using ArchLucidApiFactory factory = new(sqlAuthorityStorage: true);
        using HttpClient client = await IntegrationTestSqlClientBootstrap.CreateSqlIntegrationClientAsync(factory);
        JsonSerializerOptions jsonOptions = IntegrationTestBase.CreateApiJsonOptions();
        string runId = await IntegrationTestRunLifecycleSupport.CreateArchitectureRunForTestAsync(
            client, jsonOptions, TestRequestIds.ForScenario("SQL-SEALED-INVENTORY"));

        using HttpResponseMessage finalize = await client.PostFinalizeForTestAsync(factory, runId);
        CommitRunResponse first = await finalize.ReadJsonForTestAsync<CommitRunResponse>(jsonOptions);

        first.Manifest.RunId.Should().Be(runId);
        first.CommittedArtifactInventory.Select(row => row.ArtifactName).Should().BeEquivalentTo(
            ["golden-manifest", "findings-snapshot", "decision-trace", "artifact-bundle"]);
        foreach (CommitRunCommittedArtifactInventoryEntry row in first.CommittedArtifactInventory)
        {
            Convert.FromHexString(row.ContentHashSha256).Should().HaveCount(32);
        }

        // No idempotency key. Finalize must read and verify the persisted inventory again.
        using HttpResponseMessage replay = await client.PostAsync(
            IntegrationTestRunLifecycleSupport.FinalizeReviewRelativeUrl(runId), null);
        CommitRunResponse repeated = await replay.ReadJsonForTestAsync<CommitRunResponse>(jsonOptions);

        repeated.Manifest.Should().BeEquivalentTo(first.Manifest);
        repeated.CommittedArtifactInventory.Should().BeEquivalentTo(first.CommittedArtifactInventory);
    }
}
