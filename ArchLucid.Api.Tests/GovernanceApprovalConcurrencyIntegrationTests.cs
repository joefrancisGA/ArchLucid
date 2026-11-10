using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Parallel governance approve calls from distinct reviewer identities: exactly one terminal success; peers receive <c>400</c> or <c>409</c>.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class GovernanceApprovalConcurrencyIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    private async Task<string> CreateRunAsync(string requestId)
    {
        HttpResponseMessage response = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest(requestId)));
        await response.EnsureSuccessForTestAsync();
        CreateRunResponseDto? payload = await response.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        return payload!.Run.RunId;
    }

    [SkippableFact]
    public async Task Thirty_two_parallel_distinct_approves_single_terminal_outcome()
    {
        string runId = await CreateRunAsync("REQ-GOV-32-" + Guid.NewGuid().ToString("N")[..8]);
        HttpResponseMessage submitResponse = await PostGovernanceApprovalRequestAsync(runId);
        await submitResponse.EnsureSuccessForTestAsync();
        GovernanceApprovalResponseDto? submitted =
            await submitResponse.Content.ReadFromJsonAsync<GovernanceApprovalResponseDto>(JsonOptions);

        string url = $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve";

        const int parallel = 32;
        // Different reviewer identities are genuinely competing transitions. Identical actor/comment
        // pairs are intentionally idempotent retries and may all return HTTP 200 for a single mutation.
        Task<HttpResponseMessage>[] tasks = Enumerable.Range(0, parallel)
            .Select(index =>
            {
                string reviewer = $"reviewer-32-{index:D2}";
                string actorId = $"33333333-3333-3333-3333-{index + 1:D12}";
                return PostJsonAsTestActorAsync(
                    url,
                    GovernanceReviewDecisionJsonContent(reviewer, $"parallel-32-{index:D2}"),
                    reviewer,
                    actorId);
            })
            .ToArray();

        HttpResponseMessage[] responses = await Task.WhenAll(tasks);

        try
        {
            int ok = responses.Count(static r => r.StatusCode == HttpStatusCode.OK);
            int bad = responses.Count(static r => r.StatusCode == HttpStatusCode.BadRequest);
            int conflict = responses.Count(static r => r.StatusCode == HttpStatusCode.Conflict);
            ok.Should().Be(1, "distinct reviewers must not both win the terminal approval transition");
            (ok + bad + conflict).Should().Be(parallel, "there must be no hidden 5xx or unexpected status");

            using HttpResponseMessage listResponse =
                await Client.GetAsync($"/v1/governance/runs/{runId}/approval-requests");
            listResponse.StatusCode.Should().Be(HttpStatusCode.OK);
            GovernanceApprovalResponseDto[]? requests =
                await listResponse.Content.ReadFromJsonAsync<GovernanceApprovalResponseDto[]>(JsonOptions);
            requests.Should().ContainSingle(x =>
                x.ApprovalRequestId == submitted.ApprovalRequestId && x.Status == "Approved");
        }
        finally
        {
            foreach (HttpResponseMessage response in responses)
            {
                response.Dispose();
            }
        }
    }
}
