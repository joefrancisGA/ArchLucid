using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Parallel governance approve calls: exactly one terminal success; peers receive <c>400</c> or <c>409</c>.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class GovernanceApprovalConcurrencyIntegrationTests(ArchLucidApiFactory factory)
    : IntegrationTestBase(factory)
{
    private async Task<string> CreateRunAsync(string requestId)
    {
        HttpResponseMessage response = await Client.PostArchitectureRequestForTestAsync(TestRequestFactory.CreateArchitectureRequest(requestId));
                CreateRunResponseDto? payload = await response.ReadJsonForTestAsync<CreateRunResponseDto>(JsonOptions);
        return payload!.Run.RunId;
    }

    [SkippableFact]
    public async Task Thirty_two_parallel_approves_single_ok_terminal_outcome()
    {
        string runId = await CreateRunAsync(TestRequestIds.ForScenario(nameof(GovernanceApprovalConcurrencyIntegrationTests)));
        HttpResponseMessage submitResponse = await PostGovernanceApprovalRequestAsync(runId);
                GovernanceApprovalResponseDto? submitted =
            await submitResponse.ReadJsonForTestAsync<GovernanceApprovalResponseDto>(JsonOptions);

        string url = $"/v1/governance/approval-requests/{submitted!.ApprovalRequestId}/approve";

        const int parallel = 32;
        Task<HttpResponseMessage>[] tasks = Enumerable.Range(0, parallel)
            .Select(_ =>
                PostJsonAsTestActorAsync(url, GovernanceReviewDecisionJsonContent("reviewer-32", "parallel-32"),
                    "reviewer-32",
                    "33333333-3333-3333-3333-333333333333"))
            .ToArray();

        HttpResponseMessage[] responses = await Task.WhenAll(tasks);

        try
        {
            int ok = responses.Count(static r => r.StatusCode == HttpStatusCode.OK);
            int bad = responses.Count(static r => r.StatusCode == HttpStatusCode.BadRequest);
            int conflict = responses.Count(static r => r.StatusCode == HttpStatusCode.Conflict);
            ok.Should().Be(1);
            (ok + bad + conflict).Should().Be(parallel);
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
