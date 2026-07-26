using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Tests.TestDtos;

using GovernanceApprovalResponseDto = ArchLucid.Api.Tests.GovernanceApprovalResponseDto;
using ArchLucid.Core.Audit;
using ArchLucid.Host.Core.ProblemDetails;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Governance;

/// <summary>
///     TB-297: HTTP negative-path matrix for governance workflows — problem types + durable audit events.
/// </summary>
[Trait("Category", "Integration")]
public sealed class GovernanceNegativePathIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    private const string ProdReviewerName = "reviewer-prod-neg";
    private const string ProdReviewerOid = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    [SkippableFact]
    public async Task Self_approval_returns_governance_self_approval_problem_and_audit_tb297()
    {
        string runId = await CreateRunAsync("REQ-GOV-NEG-SELF-01");

        HttpResponseMessage submit = await PostGovernanceApprovalRequestAsync(
            runId,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
        await submit.EnsureSuccessForTestAsync();
        GovernanceApprovalResponseDto? submitted =
            await submit.Content.ReadFromJsonAsync<GovernanceApprovalResponseDto>(JsonOptions);

        HttpResponseMessage approve = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent(GovernanceSubmitterName, "self"),
            GovernanceSubmitterName,
            GovernanceSubmitterId);

        approve.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        ReadProblemType(await approve.Content.ReadAsStringAsync())
            .Should()
            .Be(ProblemTypes.GovernanceSelfApproval);

        await AssertAuditContainsEventTypeAsync(AuditEventTypes.GovernanceSelfApprovalBlocked);
    }

    [SkippableFact]
    public async Task Reject_after_approve_returns_conflict_tb297()
    {
        // Unique per execution: fixed request ids collide across sharded SQL integration runs.
        string runId = await CreateRunAsync($"REQ-GOV-NEG-REJ-{Guid.NewGuid():N}");

        HttpResponseMessage submit = await PostGovernanceApprovalRequestAsync(
            runId,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
        await submit.EnsureSuccessForTestAsync();
        GovernanceApprovalResponseDto? submitted =
            await submit.Content.ReadFromJsonAsync<GovernanceApprovalResponseDto>(JsonOptions);

        HttpResponseMessage approve = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent(ProdReviewerName, "ok"),
            ProdReviewerName,
            ProdReviewerOid);
        approve.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage reject = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted.ApprovalRequestId}/reject",
            GovernanceReviewDecisionJsonContent(ProdReviewerName, "too late"),
            ProdReviewerName,
            ProdReviewerOid);

        // Reject after approve is a first-wins CAS conflict (GovernanceApprovalReviewConflictException → 409).
        reject.StatusCode.Should().Be(HttpStatusCode.Conflict);
        ReadProblemType(await reject.Content.ReadAsStringAsync()).Should().Be(ProblemTypes.Conflict);
    }

    [SkippableFact]
    public async Task Double_promote_to_prod_with_same_approval_returns_bad_request_tb297()
    {
        string runId = await CreateRunAsync("REQ-GOV-NEG-DBL-01");

        HttpResponseMessage submit = await PostGovernanceApprovalRequestAsync(
            runId,
            sourceEnvironment: "test",
            targetEnvironment: "prod",
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
        await submit.EnsureSuccessForTestAsync();
        GovernanceApprovalResponseDto? submitted =
            await submit.Content.ReadFromJsonAsync<GovernanceApprovalResponseDto>(JsonOptions);

        HttpResponseMessage approve = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent(ProdReviewerName, "prod ok"),
            ProdReviewerName,
            ProdReviewerOid);
        approve.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage firstPromote = await PostGovernancePromotionAsync(
            submitted.RunId,
            promotedBy: ProdReviewerName,
            sourceEnvironment: "test",
            targetEnvironment: "prod",
            approvalRequestId: submitted.ApprovalRequestId,
            testActorName: ProdReviewerName,
            testActorId: ProdReviewerOid);
        firstPromote.StatusCode.Should().Be(HttpStatusCode.OK);

        await AssertAuditContainsEventTypeAsync(AuditEventTypes.GovernanceManifestPromoted);

        HttpResponseMessage secondPromote = await PostGovernancePromotionAsync(
            submitted.RunId,
            promotedBy: ProdReviewerName,
            sourceEnvironment: "test",
            targetEnvironment: "prod",
            approvalRequestId: submitted.ApprovalRequestId,
            testActorName: ProdReviewerName,
            testActorId: ProdReviewerOid);

        secondPromote.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        ReadProblemType(await secondPromote.Content.ReadAsStringAsync()).Should().Be(ProblemTypes.BadRequest);
    }

    [SkippableFact]
    public async Task Promote_with_stale_manifest_version_returns_bad_request_tb297()
    {
        string runId = await CreateRunAsync("REQ-GOV-NEG-STALE-01");

        HttpResponseMessage submit = await PostGovernanceApprovalRequestAsync(
            runId,
            manifestVersion: "v1",
            sourceEnvironment: "test",
            targetEnvironment: "prod",
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
        await submit.EnsureSuccessForTestAsync();
        GovernanceApprovalResponseDto? submitted =
            await submit.Content.ReadFromJsonAsync<GovernanceApprovalResponseDto>(JsonOptions);

        HttpResponseMessage approve = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent(ProdReviewerName, "ok"),
            ProdReviewerName,
            ProdReviewerOid);
        approve.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage promote = await PostGovernancePromotionAsync(
            submitted.RunId,
            promotedBy: ProdReviewerName,
            manifestVersion: "v-stale-mismatch",
            sourceEnvironment: "test",
            targetEnvironment: "prod",
            approvalRequestId: submitted.ApprovalRequestId,
            testActorName: ProdReviewerName,
            testActorId: ProdReviewerOid);

        promote.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        ReadProblemType(await promote.Content.ReadAsStringAsync()).Should().Be(ProblemTypes.BadRequest);
    }

    private async Task<string> CreateRunAsync(string requestId)
    {
        HttpResponseMessage response = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest(requestId)));
        await response.EnsureSuccessForTestAsync();
        CreateRunResponseDto? payload = await response.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);

        payload.Should().NotBeNull();
        payload!.Run.RunId.Should().NotBeNullOrWhiteSpace();

        return payload.Run.RunId;
    }

    private static string ReadProblemType(string body)
    {
        using JsonDocument doc = JsonDocument.Parse(body);
        JsonElement root = doc.RootElement;

        if (root.TryGetProperty("type", out JsonElement typeProp) && typeProp.ValueKind == JsonValueKind.String)
            return typeProp.GetString() ?? string.Empty;

        if (root.TryGetProperty("Type", out JsonElement typePascal) && typePascal.ValueKind == JsonValueKind.String)
            return typePascal.GetString() ?? string.Empty;

        return string.Empty;
    }

    private async Task AssertAuditContainsEventTypeAsync(string eventType)
    {
        HttpResponseMessage search =
            await Client.GetAsync($"/v1/audit/search?eventType={Uri.EscapeDataString(eventType)}&take=50");

        await search.EnsureSuccessForTestAsync();
        string json = await search.Content.ReadAsStringAsync();
        json.Should().Contain(eventType, because: $"audit search must include durable event type {eventType}");
    }
}
