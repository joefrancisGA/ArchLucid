using System.Net;
using System.Net.Http.Json;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     TB-322: committed review proof is immutable at the API boundary — sealed evidence cannot be rewritten and
///     mutating endpoints reject post-commit agent-result injection.
/// </summary>
[Trait("Category", "Slow")]
public sealed class FinalizedEvidenceImmutabilityIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Committed_run_rejects_agent_result_submission_and_preserves_golden_manifest_fingerprint()
    {
        HttpResponseMessage createResponse = await Client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(FinalizedEvidenceImmutabilityIntegrationTests))));
                CreateRunResponseDto? created = await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        await ExecuteForTestAsync(runId);
        HttpResponseMessage commitResponse = await Client.PostFinalizeForTestAsync(Factory, runId);
        await commitResponse.EnsureSuccessForTestAsync();

        string fingerprintBefore = await HarnessAuthorityGoldenManifestFingerprintSupport.GetWireGoldenManifestSha256HexAsync(
            Client,
            runId,
            JsonOptions);

        HttpResponseMessage secondCommit = await Client.PostFinalizeForTestAsync(Factory, runId);
        secondCommit.StatusCode.Should().Be(HttpStatusCode.OK);
        string fingerprintAfterSecondCommit = await HarnessAuthorityGoldenManifestFingerprintSupport.GetWireGoldenManifestSha256HexAsync(
            Client,
            runId,
            JsonOptions);
        fingerprintAfterSecondCommit.Should().Be(fingerprintBefore);

        AgentResult forgedResult = new()
        {
            ResultId = "tb322-forged-" + Guid.NewGuid().ToString("N"),
            TaskId = "tb322-task",
            RunId = runId,
            AgentType = AgentType.Topology,
            Confidence = 0.99,
            Claims = ["Fabricated post-commit evidence mutation attempt."],
        };

        HttpResponseMessage submitResponse = await Client.PostAsync(
            $"/v1/architecture/review/{runId}/result",
            JsonContent(new { result = forgedResult }));
        submitResponse.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.Conflict);

        string fingerprintAfterSubmitAttempt = await HarnessAuthorityGoldenManifestFingerprintSupport.GetWireGoldenManifestSha256HexAsync(
            Client,
            runId,
            JsonOptions);
        fingerprintAfterSubmitAttempt.Should().Be(fingerprintBefore);
    }

    [SkippableFact]
    public async Task Committed_run_execute_is_idempotent_and_does_not_change_stored_results()
    {
        HttpResponseMessage createResponse = await Client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(TestRequestIds.ForScenario(nameof(FinalizedEvidenceImmutabilityIntegrationTests))));
                CreateRunResponseDto? created = await createResponse.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage firstExecute = await Client.PostExecuteForTestAsync(runId);

        await HarnessSkipWhen.AuthorityPipelineCompleteOnCreateAsync(firstExecute);

        ExecuteRunResponseDto? firstPayload =
            await firstExecute.ReadJsonForTestAsync<ExecuteRunResponseDto>(JsonOptions);
        firstPayload.Should().NotBeNull();

        HttpResponseMessage commitResponse = await Client.PostFinalizeForTestAsync(Factory, runId);
        await commitResponse.EnsureSuccessForTestAsync();

        HttpResponseMessage secondExecute = await Client.PostAsync(
            IntegrationTestRunLifecycleSupport.ExecuteReviewRelativeUrl(runId),
            null);
        (await secondExecute.IsAuthorityPipelineCompleteExecuteConflictAsync()).Should().BeTrue();

        GetRunResponseDto getRunPayload = await Client.GetRunReviewForTestAsync(runId, JsonOptions);
        getRunPayload.Results.Should().HaveCount(firstPayload!.Results.Count);
    }

}
