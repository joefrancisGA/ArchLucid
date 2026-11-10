using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Application.Common;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Governance Controller.
/// </summary>
[Trait("Category", "Integration")]
public sealed class GovernanceControllerTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    private async Task<FinalizedRun> CreateCommittedRunAsync(string requestId)
    {
        FinalizedRun committedRun = await CreateFinalizedRunAsync(requestId);

        committedRun.RunId.Should().NotBeNullOrWhiteSpace(
            "CreateRun response must include Run.RunId so downstream governance calls validate.");
        committedRun.ManifestVersion.Should().NotBeNullOrWhiteSpace();

        return committedRun;
    }

    /// <summary>
    ///     Governance payloads echo authority run identifiers; formatting may differ from create-run responses while still
    ///     referring to the same run GUID.
    /// </summary>
    private static bool SameArchitectureRunId(string left, string right)
    {
        if (Guid.TryParse(left, out Guid leftGuid) && Guid.TryParse(right, out Guid rightGuid))
            return leftGuid == rightGuid;

        return string.Equals(left, right, StringComparison.Ordinal);
    }

    private static void AssertSameArchitectureRunId(string expectedFromCreateFlow, string actualFromGovernancePayload)
    {
        SameArchitectureRunId(expectedFromCreateFlow, actualFromGovernancePayload).Should().BeTrue(
            $"Expected governance payloads to reference run '{expectedFromCreateFlow}', but saw '{actualFromGovernancePayload}'.");
    }

    // â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [SkippableFact]
    public async Task SubmitApprovalRequest_ValidRun_ReturnsOk()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));

        HttpResponseMessage response =
            await PostGovernanceApprovalRequestAsync(
                committed.RunId,
                manifestVersion: committed.ManifestVersion,
                requestComment: "Ready for test",
                testActorName: GovernanceSubmitterName,
                testActorId: GovernanceSubmitterId);

        string body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, body);

        GovernanceApprovalResponseDto? payload =
            JsonSerializer.Deserialize<GovernanceApprovalResponseDto>(body, JsonOptions);
        payload.Should().NotBeNull();
        payload.ApprovalRequestId.Should().NotBeNullOrWhiteSpace();
        payload.Status.Should().Be("Submitted");
        payload.RequestedBy.Should().Be(GovernanceSubmitterName);
        AssertSameArchitectureRunId(committed.RunId, payload.RunId);
    }

    [SkippableFact]
    public async Task SubmitApprovalRequest_UnknownRun_Returns404()
    {
        // Canonical run identifiers are GUIDs (see RunDetailQueryService.TryParseRunGuid). Use a random GUID so we hit
        // the repository miss path, not only the malformed-id path that returns null before lookup.
        string unknownRunId = Guid.NewGuid().ToString("N");

        HttpResponseMessage response = await PostGovernanceApprovalRequestAsync(unknownRunId);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task SubmitApprovalRequest_MissingBody_Returns400()
    {
        HttpResponseMessage response = await Client.PostAsync("/v1/governance/approval-requests", null);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    // â”€â”€ Approve â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [SkippableFact]
    public async Task Approve_ValidRequest_ReturnsOkWithApprovedStatus()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));

        HttpResponseMessage submitResponse = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
                GovernanceApprovalResponseDto? submitted =
            await submitResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);

        HttpResponseMessage approveResponse = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent("reviewer1", "Approved"),
            "reviewer1",
            "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");        GovernanceApprovalResponseDto? result =
            await approveResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);
        result!.Status.Should().Be("Approved");
        result.ReviewedBy.Should().Be("reviewer1");
    }

    // â”€â”€ Reject â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [SkippableFact]
    public async Task Reject_ValidRequest_ReturnsOkWithRejectedStatus()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));

        HttpResponseMessage submitResponse = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
                GovernanceApprovalResponseDto? submitted =
            await submitResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);

        HttpResponseMessage rejectResponse = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/reject",
            GovernanceReviewDecisionJsonContent("reviewer2", "Not ready"),
            "reviewer2",
            "cccccccc-cccc-cccc-cccc-cccccccccccc");        GovernanceApprovalResponseDto? result =
            await rejectResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);
        result!.Status.Should().Be("Rejected");
    }

    [SkippableFact]
    public async Task Reject_SecondReject_ReturnsConflict()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));
        HttpResponseMessage submitResponse = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
                GovernanceApprovalResponseDto? submitted =
            await submitResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);
        string url = $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/reject";
        HttpResponseMessage first = await PostJsonAsTestActorAsync(
            url,
            GovernanceReviewDecisionJsonContent("reviewer-rej2", "no"),
            "reviewer-rej2",
            "99999999-9999-9999-9999-999999999999");
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        HttpResponseMessage second = await PostJsonAsTestActorAsync(
            url,
            GovernanceReviewDecisionJsonContent("reviewer-rej2-again", "no"),
            "reviewer-rej2-again",
            "88888888-8888-8888-8888-888888888888");
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    // â”€â”€ Promote â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [SkippableFact]
    public async Task Promote_ToProd_WithoutApproval_Returns400()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));

        HttpResponseMessage response = await PostGovernancePromotionAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            promotedBy: "alice",
            sourceEnvironment: "test",
            targetEnvironment: "prod");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task Promote_ToProd_WithApprovedRequest_ReturnsOk()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));

        // Same reviewer identity shape as Approve_ValidRequest_ReturnsOkWithApprovedStatus (stable vs DevelopmentBypass defaults on CI).
        const string prodReviewerName = "reviewer1";
        const string prodReviewerOid = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

        HttpResponseMessage submitResponse =
            await PostGovernanceApprovalRequestAsync(
                committed.RunId,
                manifestVersion: committed.ManifestVersion,
                sourceEnvironment: "test",
                targetEnvironment: "prod",
                testActorName: GovernanceSubmitterName,
                testActorId: GovernanceSubmitterId);

        string submitBody = await submitResponse.Content.ReadAsStringAsync();

        submitResponse.IsSuccessStatusCode.Should().BeTrue(
            $"Submit failed {(int)submitResponse.StatusCode}: {submitBody}");

        GovernanceApprovalResponseDto? submitted =
            JsonSerializer.Deserialize<GovernanceApprovalResponseDto>(submitBody, JsonOptions);

        submitted.Should().NotBeNull();
        submitted.RunId.Should().NotBeNullOrWhiteSpace();
        submitted.ApprovalRequestId.Should().NotBeNullOrWhiteSpace();

        HttpResponseMessage approveResponse = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent(prodReviewerName, "Approved for prod"),
            prodReviewerName,
            prodReviewerOid);

        string approveBody = await approveResponse.Content.ReadAsStringAsync();

        approveResponse.IsSuccessStatusCode.Should().BeTrue(
            $"Approve failed {(int)approveResponse.StatusCode}: {approveBody}");

        HttpResponseMessage response = await PostGovernancePromotionAsync(
            submitted.RunId,
            promotedBy: prodReviewerName,
            manifestVersion: committed.ManifestVersion,
            sourceEnvironment: "test",
            targetEnvironment: "prod",
            approvalRequestId: submitted.ApprovalRequestId,
            testActorName: prodReviewerName,
            testActorId: prodReviewerOid);

        string promoteBody = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, promoteBody);

        GovernancePromotionResponseDto? result =
            JsonSerializer.Deserialize<GovernancePromotionResponseDto>(promoteBody, JsonOptions);
        result.Should().NotBeNull();
        result.TargetEnvironment.Should().Be("prod");
        result.PromotedBy.Should().Be($"{ActorContextKeys.JwtActorKeyPrefix}{prodReviewerOid}");
    }

    // â”€â”€ Activate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    [SkippableFact]
    public async Task Activate_ValidRun_ReturnsOkAndIsActive()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));

        HttpResponseMessage response =
            await PostGovernanceActivationAsync(
                committed.RunId,
                manifestVersion: committed.ManifestVersion,
                environment: "dev",
                testActorName: GovernanceSubmitterName,
                testActorId: GovernanceSubmitterId);

        string body = await response.Content.ReadAsStringAsync();

        response.StatusCode.Should().Be(HttpStatusCode.OK, body);

        GovernanceActivationResponseDto? result =
            JsonSerializer.Deserialize<GovernanceActivationResponseDto>(body, JsonOptions);
        result.Should().NotBeNull();
        result.IsActive.Should().BeTrue();
        AssertSameArchitectureRunId(committed.RunId, result.RunId);
        result.Environment.Should().Be("dev");
    }

    // List by run 

    [SkippableFact]
    public async Task GetApprovalRequests_ByRunId_ReturnsRows()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));

        HttpResponseMessage submitResponse = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
        await submitResponse.EnsureSuccessForTestAsync();
        HttpResponseMessage listResponse = await Client.GetAsync($"/v1/governance/runs/{committed.RunId}/approval-requests");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        GovernanceApprovalResponseDto[]? items =
            await listResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto[]>(JsonOptions);
        items.Should().NotBeNullOrEmpty();
        items.Should().Contain(x => SameArchitectureRunId(x.RunId, committed.RunId));
    }

    [SkippableFact]
    public async Task GetPromotions_ByRunId_ReturnsRows()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));

        // FluentValidation requires PromotedBy on the body; Promote persists promotedBy from GetActor() (default "Developer").
        HttpResponseMessage promoteResponse =
            await PostGovernancePromotionAsync(committed.RunId, promotedBy: "Developer", manifestVersion: committed.ManifestVersion);

        string promoteBody = await promoteResponse.Content.ReadAsStringAsync();

        promoteResponse.IsSuccessStatusCode.Should().BeTrue(
            $"Promote POST failed with {(int)promoteResponse.StatusCode}: {promoteBody}");

        HttpResponseMessage listResponse = await Client.GetAsync($"/v1/governance/runs/{committed.RunId}/promotions");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        GovernancePromotionResponseDto[]? items =
            await listResponse.ReadJsonForTestAsync<GovernancePromotionResponseDto[]>(JsonOptions);
        items.Should().NotBeNullOrEmpty();
        items.Should().Contain(x => SameArchitectureRunId(x.RunId, committed.RunId));
    }

    [SkippableFact]
    public async Task GetActivations_ByRunId_ReturnsRows()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));

        HttpResponseMessage activateResponse =
            await PostGovernanceActivationAsync(
                committed.RunId,
                manifestVersion: committed.ManifestVersion,
                environment: "test",
                testActorName: GovernanceSubmitterName,
                testActorId: GovernanceSubmitterId);

        string activateBody = await activateResponse.Content.ReadAsStringAsync();

        activateResponse.IsSuccessStatusCode.Should().BeTrue(
            $"Activate POST failed with {(int)activateResponse.StatusCode}: {activateBody}");

        HttpResponseMessage listResponse = await Client.GetAsync($"/v1/governance/runs/{committed.RunId}/activations");
        listResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        GovernanceActivationResponseDto[]? items =
            await listResponse.ReadJsonForTestAsync<GovernanceActivationResponseDto[]>(JsonOptions);
        items.Should().NotBeNullOrEmpty();
        items.Should().Contain(x => SameArchitectureRunId(x.RunId, committed.RunId));
    }

    [SkippableFact]
    public async Task GetApprovalRequestRationale_AfterSubmit_ReturnsOk()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));
        HttpResponseMessage submitResponse = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
                GovernanceApprovalResponseDto? submitted =
            await submitResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);

        HttpResponseMessage rationaleResponse = await Client.GetAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/rationale");        GovernanceRationaleResponseDto? payload =
            await rationaleResponse.ReadJsonForTestAsync<GovernanceRationaleResponseDto>(JsonOptions);
        payload.Should().NotBeNull();
        payload.ApprovalRequestId.Should().Be(submitted.ApprovalRequestId);
        payload.Bullets.Should().NotBeEmpty();
    }

    [SkippableFact]
    public async Task Approve_SecondApprove_ReturnsConflict()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));
        HttpResponseMessage submitResponse = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
                GovernanceApprovalResponseDto? submitted =
            await submitResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);
        HttpResponseMessage first = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent("reviewer-dup", "ok"),
            "reviewer-dup",
            "dddddddd-dddd-dddd-dddd-dddddddddddd");
        first.StatusCode.Should().Be(HttpStatusCode.OK);
        HttpResponseMessage second = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent("reviewer-dup-two", "ok"),
            "reviewer-dup-two",
            "cccccccc-cccc-cccc-cccc-cccccccccccc");
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [SkippableFact]
    public async Task Approve_ParallelDuplicateApproves_FromSameReviewer_HasConsistentOutcome()
    {
        FinalizedRun committed = await CreateCommittedRunAsync(TestRequestIds.ForScenario(nameof(GovernanceControllerTests)));
        // Default DevelopmentBypass submitter (same pattern as GovernanceApprovalConcurrencyIntegrationTests).
        HttpResponseMessage submitResponse = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion);
                GovernanceApprovalResponseDto? submitted =
            await submitResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);

        submitted.Should().NotBeNull();
        submitted.ApprovalRequestId.Should().NotBeNullOrWhiteSpace();

        string url = $"/v1/governance/approval-requests/{submitted.ApprovalRequestId}/approve";
        Task<HttpResponseMessage>[] tasks = Enumerable.Range(0, 5)
            .Select(_ =>
                PostJsonAsTestActorAsync(url, GovernanceReviewDecisionJsonContent("reviewer-par", "parallel"),
                    "reviewer-par",
                    "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"))
            .ToArray();

        HttpResponseMessage[] responses = await Task.WhenAll(tasks);

        try
        {
            int okCount = responses.Count(static r => r.StatusCode == HttpStatusCode.OK);
            int badCount = responses.Count(static r => r.StatusCode == HttpStatusCode.BadRequest);
            int conflictCount = responses.Count(static r => r.StatusCode == HttpStatusCode.Conflict);
            int rateLimitedCount = responses.Count(static r => r.StatusCode == HttpStatusCode.TooManyRequests);
            int serverErrorCount = responses.Count(static r => r.StatusCode == HttpStatusCode.InternalServerError);

            okCount.Should().BeGreaterThanOrEqualTo(1);
            (okCount + badCount + conflictCount + rateLimitedCount + serverErrorCount).Should().Be(5);
        }
        finally
        {

            foreach (HttpResponseMessage response in responses)
                response.Dispose();
        }
    }
}
