using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     INV-013: committing a replay must not mutate the original run's committed golden manifest payload; replay run id
///     is distinct.
/// </summary>
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
public sealed class ReplayCommitOriginalGoldenManifestIsolationIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CommitReplay_leaves_original_run_golden_manifest_payload_unchanged_and_uses_distinct_replay_run_id()
    {
        JsonSerializerOptions jsonOptions = new(JsonSerializerDefaults.Web);
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-INV013-REPLAY-001")));
        createResponse.EnsureSuccessStatusCode();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(jsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage executeResponse = await Client.PostAsync($"/v1/architecture/run/{runId}/execute", null);
        executeResponse.EnsureSuccessStatusCode();

        HttpResponseMessage commitResponse = await Client.PostAsync($"/v1/architecture/run/{runId}/commit", null);
        commitResponse.EnsureSuccessStatusCode();

        HttpResponseMessage detailBeforeReplay = await Client.GetAsync($"/v1/authority/runs/{runId}");
        detailBeforeReplay.EnsureSuccessStatusCode();
        string bodyBefore = await detailBeforeReplay.Content.ReadAsStringAsync();
        string fingerprintBefore = GoldenManifestRawFingerprint(bodyBefore);

        string replayManifestVersion = ComparisonReplayTestFixture.NewReplayCommittedManifestVersion();

        HttpResponseMessage replayResponse = await Client.PostAsync(
            $"/v1/architecture/run/{runId}/replay",
            JsonContent(new
            {
                commitReplay = true, executionMode = "Current", manifestVersionOverride = replayManifestVersion
            }));
        replayResponse.EnsureSuccessStatusCode();
        ReplayRunResponseDto? replayPayload = await replayResponse.Content.ReadFromJsonAsync<ReplayRunResponseDto>(jsonOptions);
        replayPayload!.ReplayRunId.Should().NotBe(runId);

        HttpResponseMessage detailAfterReplay = await Client.GetAsync($"/v1/authority/runs/{runId}");
        detailAfterReplay.EnsureSuccessStatusCode();
        string bodyAfter = await detailAfterReplay.Content.ReadAsStringAsync();
        string fingerprintAfter = GoldenManifestRawFingerprint(bodyAfter);

        fingerprintAfter.Should().Be(fingerprintBefore);

        HttpResponseMessage replayRunDetail = await Client.GetAsync($"/v1/authority/runs/{replayPayload.ReplayRunId}");
        replayRunDetail.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    private static string GoldenManifestRawFingerprint(string runDetailJson)
    {
        using JsonDocument document = JsonDocument.Parse(runDetailJson);
        if (!document.RootElement.TryGetProperty("goldenManifest", out JsonElement golden))
            throw new InvalidOperationException("Response missing goldenManifest (committed run expected).");

        byte[] utf8 = Encoding.UTF8.GetBytes(golden.GetRawText());

        return Convert.ToHexString(SHA256.HashData(utf8));
    }

    private static StringContent JsonContent(object value)
    {
        JsonSerializerOptions options = new(JsonSerializerDefaults.Web);

        return new StringContent(JsonSerializer.Serialize(value, options), Encoding.UTF8, "application/json");
    }
}
