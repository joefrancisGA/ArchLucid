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

        using HttpRequestMessage first =
            IntegrationTestRunLifecycleSupport.CreateArchitectureRequestMessage(JsonContent(body), idempotencyKey);

        HttpResponseMessage firstResponse = await Client.SendAsync(first);
        firstResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        CreateRunResponseDto? firstPayload =
            await firstResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        firstPayload.Should().NotBeNull();

        using HttpRequestMessage second =
            IntegrationTestRunLifecycleSupport.CreateArchitectureRequestMessage(JsonContent(body), idempotencyKey);

        HttpResponseMessage secondResponse = await Client.SendAsync(second);
        secondResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        secondResponse.Headers.TryGetValues("X-Idempotency-Replayed", out IEnumerable<string>? replayValues).Should()
            .BeTrue();
        replayValues.Should().Contain("true");

        CreateRunResponseDto? secondPayload =
            await secondResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        secondPayload.Should().NotBeNull();
        secondPayload!.Run.RunId.Should().Be(firstPayload!.Run.RunId);
    }

    [SkippableFact]
    public async Task CommitRun_same_idempotency_key_replays_without_new_manifest_version()
    {
        HttpResponseMessage createResponse = await Client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(MutatingEndpointIdempotencyContractIntegrationTests))));
                CreateRunResponseDto? created = await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        await ExecuteForTestAsync(runId);

        string idempotencyKey = "tb323-commit-" + Guid.NewGuid().ToString("N");
        object commitBody = new { notifySponsor = false };

        using HttpRequestMessage firstCommit = IntegrationTestRunLifecycleSupport.CreateFinalizeReviewRequest(runId);
        firstCommit.Content = JsonContent(commitBody);
        firstCommit.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        HttpResponseMessage firstCommitResponse = await Client.SendAsync(firstCommit);        CommitRunResponseDto? firstCommitPayload =
            await firstCommitResponse.ReadJsonForTestAsync<CommitRunResponseDto>(JsonOptions);
        firstCommitPayload.Should().NotBeNull();
        string firstManifestVersion = firstCommitPayload!.Manifest.Metadata.ManifestVersion;

        using HttpRequestMessage secondCommit = IntegrationTestRunLifecycleSupport.CreateFinalizeReviewRequest(runId);
        secondCommit.Content = JsonContent(commitBody);
        secondCommit.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        HttpResponseMessage secondCommitResponse = await Client.SendAsync(secondCommit);
        secondCommitResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        secondCommitResponse.Headers.TryGetValues("X-Idempotency-Replayed", out IEnumerable<string>? replayValues).Should()
            .BeTrue();
        replayValues.Should().Contain("true");

        CommitRunResponseDto? secondCommitPayload =
            await secondCommitResponse.ReadJsonForTestAsync<CommitRunResponseDto>(JsonOptions);
        secondCommitPayload.Should().NotBeNull();
        secondCommitPayload!.Manifest.Metadata.ManifestVersion.Should().Be(firstManifestVersion);
    }

    [SkippableFact]
    public async Task Governance_approval_submit_same_idempotency_key_replays_without_duplicate_request_id()
    {
        HttpResponseMessage createResponse = await Client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(MutatingEndpointIdempotencyContractIntegrationTests))));
                CreateRunResponseDto? created = await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        await ExecuteForTestAsync(runId);
        HttpResponseMessage commitResponse = await Client.PostFinalizeForTestAsync(Factory, runId);
                CommitRunResponseDto? commitPayload =
            await commitResponse.ReadJsonForTestAsync<CommitRunResponseDto>(JsonOptions);
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
