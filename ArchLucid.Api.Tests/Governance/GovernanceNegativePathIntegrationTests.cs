using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
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
        FinalizedRun committed = await ArrangeGovernanceCommittedAsync();

        HttpResponseMessage submit = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
        GovernanceApprovalResponseDto? submitted =
            await submit.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);

        HttpResponseMessage approve = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent(GovernanceSubmitterName, "self"),
            GovernanceSubmitterName,
            GovernanceSubmitterId);

        await approve.AssertGovernanceSelfApprovalAsync();

        await AssertAuditContainsEventTypeAsync(AuditEventTypes.GovernanceSelfApprovalBlocked);
    }

    [SkippableFact]
    public async Task Reject_after_approve_returns_conflict_tb297()
    {
        FinalizedRun committed = await ArrangeGovernanceCommittedAsync();

        HttpResponseMessage submit = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
                GovernanceApprovalResponseDto? submitted =
            await submit.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);

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
        await reject.AssertProblemElementForTestAsync(HttpStatusCode.Conflict, ProblemTypes.Conflict);
    }

    [SkippableFact]
    public async Task Double_promote_to_prod_with_same_approval_returns_bad_request_tb297()
    {
        FinalizedRun committed = await ArrangeGovernanceCommittedAsync();

        HttpResponseMessage submit = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            sourceEnvironment: "test",
            targetEnvironment: "prod",
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
                GovernanceApprovalResponseDto? submitted =
            await submit.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);

        HttpResponseMessage approve = await PostJsonAsTestActorAsync(
            $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve",
            GovernanceReviewDecisionJsonContent(ProdReviewerName, "prod ok"),
            ProdReviewerName,
            ProdReviewerOid);
        approve.StatusCode.Should().Be(HttpStatusCode.OK);

        HttpResponseMessage firstPromote = await PostGovernancePromotionAsync(
            submitted.RunId,
            promotedBy: ProdReviewerName,
            manifestVersion: committed.ManifestVersion,
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
            manifestVersion: committed.ManifestVersion,
            sourceEnvironment: "test",
            targetEnvironment: "prod",
            approvalRequestId: submitted.ApprovalRequestId,
            testActorName: ProdReviewerName,
            testActorId: ProdReviewerOid);

        await secondPromote.AssertProblemElementForTestAsync(HttpStatusCode.BadRequest, ProblemTypes.BadRequest);
    }

    [SkippableFact]
    public async Task Promote_with_stale_manifest_version_returns_bad_request_tb297()
    {
        FinalizedRun committed = await ArrangeGovernanceCommittedAsync();

        HttpResponseMessage submit = await PostGovernanceApprovalRequestAsync(
            committed.RunId,
            manifestVersion: committed.ManifestVersion,
            sourceEnvironment: "test",
            targetEnvironment: "prod",
            testActorName: GovernanceSubmitterName,
            testActorId: GovernanceSubmitterId);
                GovernanceApprovalResponseDto? submitted =
            await submit.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);

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

        await promote.AssertProblemElementForTestAsync(HttpStatusCode.BadRequest, ProblemTypes.BadRequest);
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
