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
        FinalizedRun finalized = await ArrangeFinalizedAsync();
        await WaitForDecisionNodesAsync(finalized);
        DecisionNodeResponseDto payload = await finalized.GetDecisionsAsync(Client, JsonOptions);
        payload.Decisions.Should().NotBeEmpty();
        payload.Decisions.Should().Contain(d => d.Topic == "TopologyAcceptance");
        payload.Decisions.Should().Contain(d => d.Topic == "SecurityControlPromotion");
        payload.Decisions.Should().Contain(d => d.Topic == "ComplexityDisposition");
    }

    private async Task WaitForDecisionNodesAsync(FinalizedRun finalized)
    {
        IPostCommitProjectionOutboxProcessor processor =
            Factory.Services.GetRequiredService<IPostCommitProjectionOutboxProcessor>();

        for (int attempt = 0; attempt < 30; attempt++)
        {
            await processor.ProcessPendingBatchAsync(CancellationToken.None);

            try
            {
                DecisionNodeResponseDto payload = await finalized.GetDecisionsAsync(Client, JsonOptions);

                if (payload.Decisions.Count > 0)
                    return;
            }
            catch (Exception)
            {
            }

            await Task.Delay(100);
        }

        throw new TimeoutException($"Decision nodes were not materialized for run '{finalized.RunId}' within the test wait window.");
    }
}
