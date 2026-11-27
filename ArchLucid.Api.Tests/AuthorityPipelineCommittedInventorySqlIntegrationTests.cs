using System.Net;
using System.Text.Json;

using ArchLucid.Api.Models;

using FluentAssertions;

using Microsoft.Data.SqlClient;

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

    [SkippableFact]
    public async Task Repeat_finalize_rejects_a_corrupt_persisted_inventory_hash()
    {
        await using ArchLucidApiFactory factory = new(sqlAuthorityStorage: true);
        using CancellationTokenSource budget = new(TimeSpan.FromMinutes(2));
        CancellationToken ct = budget.Token;
        using HttpClient client = await IntegrationTestSqlClientBootstrap.CreateSqlIntegrationClientAsync(factory, ct);
        string runId = await IntegrationTestRunLifecycleSupport.CreateArchitectureRunForTestAsync(
            client, IntegrationTestBase.CreateApiJsonOptions(), TestRequestIds.ForScenario("SQL-CORRUPT-INVENTORY"), ct);
        using HttpResponseMessage finalize = await client.PostFinalizeForTestAsync(factory, runId, cancellationToken: ct);
        await finalize.EnsureSuccessForTestAsync();

        await using SqlConnection connection = new(factory.SqlConnectionString);
        await connection.OpenAsync(ct);
        using SqlCommand corrupt = connection.CreateCommand();
        corrupt.CommandText = """
            UPDATE manifest
            SET HasherBoundJson = JSON_MODIFY(manifest.HasherBoundJson,
                'strict $.CommittedArtifactInventory[0].ContentHashSha256', @wrongHash)
            FROM dbo.GoldenManifests AS manifest
            INNER JOIN dbo.Runs AS run
                ON run.GoldenManifestId = manifest.ManifestId
                AND run.TenantId = manifest.TenantId
            WHERE run.RunId = @runId;
            """;
        corrupt.Parameters.AddWithValue("@runId", Guid.Parse(runId));
        corrupt.Parameters.AddWithValue("@wrongHash", new string('0', 64));
        (await corrupt.ExecuteNonQueryAsync(ct)).Should().Be(1, "only this disposable test run may be modified");

        using HttpResponseMessage replay = await client.PostAsync(
            IntegrationTestRunLifecycleSupport.FinalizeReviewRelativeUrl(runId), null, ct);
        replay.StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await replay.Content.ReadAsStringAsync(ct)).Should().Contain("diverges from recomputed bytes");
    }
}
