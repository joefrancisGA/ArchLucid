using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Persistence.Coordination.Projection;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Decision Engine V2.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureDecisionEngineV2Tests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task CommitRun_PersistsDecisionNodes()
    {
        HttpResponseMessage createResponse = await Client.PostAsync(
            "/v1/architecture/request",
            JsonContent(TestRequestFactory.CreateArchitectureRequest("REQ-DECISION-V2-001")));

        await createResponse.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created =
            await createResponse.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions);
        string runId = created!.Run.RunId;

        HttpResponseMessage executeResponse = await Client.PostAsync($"/v1/architecture/review/{runId}/execute", null);
        await executeResponse.EnsureSuccessForTestAsync();
        HttpResponseMessage commitResponse = await Client.PostAsync($"/v1/architecture/review/{runId}/finalize", null);
        await commitResponse.EnsureSuccessForTestAsync();
        await WaitForDecisionNodesAsync(runId);
        HttpResponseMessage decisionsResponse = await Client.GetAsync($"/v1/architecture/review/{runId}/decisions");
        decisionsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        DecisionNodeResponseDto? payload =
            await decisionsResponse.Content.ReadFromJsonAsync<DecisionNodeResponseDto>(JsonOptions);
        payload.Should().NotBeNull();
        payload.Decisions.Should().NotBeEmpty();
        payload.Decisions.Should().Contain(d => d.Topic == "TopologyAcceptance");
        payload.Decisions.Should().Contain(d => d.Topic == "SecurityControlPromotion");
        payload.Decisions.Should().Contain(d => d.Topic == "ComplexityDisposition");
    }

    private async Task WaitForDecisionNodesAsync(string runId)
    {
        IPostCommitProjectionOutboxProcessor processor =
            Factory.Services.GetRequiredService<IPostCommitProjectionOutboxProcessor>();

        for (int attempt = 0; attempt < 30; attempt++)
        {
            await processor.ProcessPendingBatchAsync(CancellationToken.None);

            HttpResponseMessage decisionsResponse =
                await Client.GetAsync($"/v1/architecture/review/{runId}/decisions");

            if (decisionsResponse.IsSuccessStatusCode)
            {
                DecisionNodeResponseDto? payload =
                    await decisionsResponse.Content.ReadFromJsonAsync<DecisionNodeResponseDto>(JsonOptions);

                if (payload is not null && payload.Decisions.Count > 0)
                    return;
            }

            await Task.Delay(100);
        }

        throw new TimeoutException($"Decision nodes were not materialized for run '{runId}' within the test wait window.");
    }
}
