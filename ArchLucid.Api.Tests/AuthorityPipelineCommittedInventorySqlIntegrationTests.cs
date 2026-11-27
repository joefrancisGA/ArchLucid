using System.Net;
using System.Text.Json;

using ArchLucid.Api.Models;

using FluentAssertions;

using Microsoft.Data.SqlClient;

using Xunit.Abstractions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Collection("ArchLucidEnvMutation")]
public sealed class AuthorityPipelineCommittedInventorySqlIntegrationTests(ITestOutputHelper output)
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
        ReportStage("bootstrap");
        await using ArchLucidApiFactory factory = new(sqlAuthorityStorage: true);
        using CancellationTokenSource budget = new(TimeSpan.FromMinutes(2));
        CancellationToken ct = budget.Token;
        using HttpClient client = await IntegrationTestSqlClientBootstrap.CreateSqlIntegrationClientAsync(factory, ct);
        ReportStage("create-review");
        string runId = await IntegrationTestRunLifecycleSupport.CreateArchitectureRunForTestAsync(
            client, IntegrationTestBase.CreateApiJsonOptions(), TestRequestIds.ForScenario("SQL-CORRUPT-INVENTORY"), ct);
        ReportStage("initial-finalize");
        using HttpResponseMessage finalize = await client.PostFinalizeForTestAsync(factory, runId, cancellationToken: ct);
        ReportStage(FormattableString.Invariant($"initial-status {(int)finalize.StatusCode}"));
        await finalize.EnsureSuccessForTestAsync();

        ReportStage("prepare-fixture");
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
        int rowsChanged = await corrupt.ExecuteNonQueryAsync(ct);
        ReportStage(FormattableString.Invariant($"fixture-row-count {rowsChanged}"));
        rowsChanged.Should().Be(1, "only this disposable test run may be modified");

        ReportStage("repeat-finalize");
        using HttpResponseMessage replay = await client.PostAsync(
            IntegrationTestRunLifecycleSupport.FinalizeReviewRelativeUrl(runId), null, ct);
        ReportStage(FormattableString.Invariant($"repeat-status {(int)replay.StatusCode}"));
        replay.StatusCode.Should().Be(HttpStatusCode.Conflict);
        ReportStage("read-repeat-detail");
        bool mismatchReported = (await replay.Content.ReadAsStringAsync(ct))
            .Contains("diverges from recomputed bytes", StringComparison.Ordinal);
        ReportStage(mismatchReported ? "repeat-detail present" : "repeat-detail missing");
        mismatchReported.Should().BeTrue("the response should identify a persisted inventory mismatch");
        ReportStage("cleanup");
    }

    private void ReportStage(string stage) => output.WriteLine($"ARCHLUCID_SQL_INVENTORY_STAGE {stage}");
}
