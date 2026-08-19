using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     TB-323: strict idempotency contract verification for core mutating endpoints under retry semantics.
/// </summary>
[Trait("Category", "Slow")]
public sealed class MutatingEndpointIdempotencyContractIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CreateRun_same_idempotency_key_replays_without_duplicate_run_rows()
    {
        string idempotencyKey = "tb323-create-" + Guid.NewGuid().ToString("N");
        object body = TestRequestFactory.CreateArchitectureRequest("REQ-TB323-CREATE");

        using HttpRequestMessage first = new(HttpMethod.Post, "/v1/architecture/request");
        first.Content = JsonContent(body);
        first.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        HttpResponseMessage firstResponse = await Client.SendAsync(first);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        CreateRunResponseDto? firstPayload =
            await firstResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        firstPayload.Should().NotBeNull();

        using HttpRequestMessage second = new(HttpMethod.Post, "/v1/architecture/request");
        second.Content = JsonContent(body);
        second.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        HttpResponseMessage secondResponse = await Client.SendAsync(second);
        secondResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        secondResponse.Headers.TryGetValues("X-Idempotency-Replayed", out IEnumerable<string>? replayValues).Should()
            .BeTrue();
        replayValues.Should().Contain("true");

        CreateRunResponseDto? secondPayload =
            await secondResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        secondPayload.Should().NotBeNull();
        secondPayload!.Run.RunId.Should().Be(firstPayload!.Run.RunId);
    }

    [SkippableFact]
    public async Task CommitRun_same_idempotency_key_replays_without_new_manifest_version()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-TB323-COMMIT")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage executeResponse = await Client.PostAsync($"/v1/architecture/review/{runId}/execute", null);
        await executeResponse.EnsureSuccessForTestAsync();

        string idempotencyKey = "tb323-commit-" + Guid.NewGuid().ToString("N");
        object commitBody = new { notifySponsor = false };

        using HttpRequestMessage firstCommit = new(HttpMethod.Post, $"/v1/architecture/review/{runId}/finalize");
        firstCommit.Content = JsonContent(commitBody);
        firstCommit.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        HttpResponseMessage firstCommitResponse = await Client.SendAsync(firstCommit);
        firstCommitResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        CommitRunResponseDto? firstCommitPayload =
            await firstCommitResponse.Content.ReadFromJsonAsync<CommitRunResponseDto>(JsonOptions);
        firstCommitPayload.Should().NotBeNull();
        string firstManifestVersion = firstCommitPayload!.Manifest.Metadata.ManifestVersion;

        using HttpRequestMessage secondCommit = new(HttpMethod.Post, $"/v1/architecture/review/{runId}/finalize");
        secondCommit.Content = JsonContent(commitBody);
        secondCommit.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        HttpResponseMessage secondCommitResponse = await Client.SendAsync(secondCommit);
        secondCommitResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        secondCommitResponse.Headers.TryGetValues("X-Idempotency-Replayed", out IEnumerable<string>? replayValues).Should()
            .BeTrue();
        replayValues.Should().Contain("true");

        CommitRunResponseDto? secondCommitPayload =
            await secondCommitResponse.Content.ReadFromJsonAsync<CommitRunResponseDto>(JsonOptions);
        secondCommitPayload.Should().NotBeNull();
        secondCommitPayload!.Manifest.Metadata.ManifestVersion.Should().Be(firstManifestVersion);
    }

    [SkippableFact]
    public async Task Governance_approval_submit_same_idempotency_key_replays_without_duplicate_request_id()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-TB323-GOV")));
        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage executeResponse = await Client.PostAsync($"/v1/architecture/review/{runId}/execute", null);
        await executeResponse.EnsureSuccessForTestAsync();
        HttpResponseMessage commitResponse = await Client.PostAsync($"/v1/architecture/review/{runId}/finalize", null);
        await commitResponse.EnsureSuccessForTestAsync();
        CommitRunResponseDto? commitPayload =
            await commitResponse.Content.ReadFromJsonAsync<CommitRunResponseDto>(JsonOptions);
        commitPayload.Should().NotBeNull();
        string manifestVersion = commitPayload!.Manifest.Metadata.ManifestVersion;

        string idempotencyKey = "tb323-gov-" + Guid.NewGuid().ToString("N");

        HttpResponseMessage first = await PostGovernanceMutationAsync(
            "/v1/governance/approval-requests",
            JsonContent(new
            {
                runId,
                manifestVersion,
                sourceEnvironment = "dev",
                targetEnvironment = "test",
            }),
            idempotencyKey,
            GovernanceSubmitterName,
            GovernanceSubmitterId);

        first.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
        string firstBody = await first.Content.ReadAsStringAsync();

        HttpResponseMessage second = await PostGovernanceMutationAsync(
            "/v1/governance/approval-requests",
            JsonContent(new
            {
                runId,
                manifestVersion,
                sourceEnvironment = "dev",
                targetEnvironment = "test",
            }),
            idempotencyKey,
            GovernanceSubmitterName,
            GovernanceSubmitterId);

        second.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
        string secondBody = await second.Content.ReadAsStringAsync();
        secondBody.Should().Be(firstBody);
    }
}
