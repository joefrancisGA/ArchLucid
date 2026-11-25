using ArchLucid.AgentRuntime.Batch;
using ArchLucid.AgentRuntime.FineTuning;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Models;
using ArchLucid.Retrieval.FineTuning.Registry;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentOptionalPathCancellationTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Evidence_summarization_preserves_caller_cancellation(bool cancelCaller)
    {
        using CancellationTokenSource caller = new();
        Mock<IAgentCompletionClient> client = CanceledCompletion(caller, cancelCaller);
        EvidenceSummarizationService service = new(
            new Lazy<IAgentTierCompletionRouter>(() => CreateRouter(client.Object)),
            Monitor(new EvidenceSummarizationOptions { Enabled = true }),
            NullLogger<EvidenceSummarizationService>.Instance);

        await CheckOutcomeAsync(
            service.SummarizeAsync("original evidence", 100, AgentType.Topology, caller.Token),
            caller, cancelCaller, "original evidence");
        VerifyCompletion(client, caller.Token);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Graph_summary_preserves_caller_cancellation_on_the_synchronous_path(bool cancelCaller)
    {
        using CancellationTokenSource caller = new();
        Mock<IAgentCompletionClient> client = CanceledCompletion(caller, cancelCaller);
        GraphCommunitySummaryCompletionClient service = new(
            CreateRouter(client.Object), Mock.Of<IBatchAgentCompletionClient>(),
            Monitor(new LlmBatchOptions { Enabled = false }), Mock.Of<ILlmBatchRoutingContext>(),
            NullLogger<GraphCommunitySummaryCompletionClient>.Instance);
        string original = new('a', 2_001);

        await CheckOutcomeAsync(
            service.SummarizeCommunityAsync(original, caller.Token),
            caller, cancelCaller, original[..2_000]);
        VerifyCompletion(client, caller.Token);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task Fine_tuned_deployment_resolution_preserves_caller_cancellation(bool cancelCaller)
    {
        using CancellationTokenSource caller = new();
        Guid tenantId = Guid.NewGuid();
        Mock<IFineTuningConsentService> consent = new();
        consent.Setup(s => s.GetConsentAsync(tenantId, caller.Token))
            .Returns(() => CanceledResult<FineTuningConsentStatus>(caller, cancelCaller, caller.Token));
        Mock<IFineTunedModelRegistry> registry = new(MockBehavior.Strict);
        FineTunedAgentCompletionDeploymentResolver service = new(
            Monitor(new FineTuningOptions { Enabled = true }), consent.Object, registry.Object,
            NullLogger<FineTunedAgentCompletionDeploymentResolver>.Instance);

        await CheckOutcomeAsync(
            service.ResolveDeploymentNameAsync(tenantId, "default-deployment", caller.Token),
            caller, cancelCaller, "default-deployment");
        consent.Verify(s => s.GetConsentAsync(tenantId, caller.Token), Times.Once);
        registry.VerifyNoOtherCalls();
    }

    private static IOptionsMonitor<T> Monitor<T>(T value) where T : class
    {
        Mock<IOptionsMonitor<T>> monitor = new();
        monitor.SetupGet(m => m.CurrentValue).Returns(value);
        return monitor.Object;
    }

    private static IAgentTierCompletionRouter CreateRouter(IAgentCompletionClient client)
    {
        Mock<IAgentTierCompletionRouter> router = new();
        router.Setup(r => r.ResolveForAgent(AgentType.Topology, LlmModelTier.Economy))
            .Returns((client, LlmModelTier.Economy));
        return router.Object;
    }

    private static Mock<IAgentCompletionClient> CanceledCompletion(CancellationTokenSource caller, bool cancelCaller)
    {
        Mock<IAgentCompletionClient> client = new();
        client.Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), It.IsAny<CancellationToken>()))
            .Returns((string _, string _, int? _, float? _, CancellationToken token) =>
                CanceledResult<string>(caller, cancelCaller, token));
        return client;
    }

    private static void VerifyCompletion(Mock<IAgentCompletionClient> client, CancellationToken token) =>
        client.Verify(c => c.CompleteJsonAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<float?>(), token), Times.Once);

    private static Task<T> CanceledResult<T>(CancellationTokenSource caller, bool cancelCaller, CancellationToken token)
    {
        if (!cancelCaller)
            return Task.FromCanceled<T>(new CancellationToken(canceled: true));

        caller.Cancel();
        return Task.FromCanceled<T>(token);
    }

    private static async Task CheckOutcomeAsync(
        Task<string> outcome, CancellationTokenSource caller, bool cancelCaller, string fallback)
    {
        if (cancelCaller)
        {
            OperationCanceledException exception = await Assert.ThrowsAnyAsync<OperationCanceledException>(() => outcome);
            Assert.Equal(caller.Token, exception.CancellationToken);
        }
        else
        {
            Assert.Equal(fallback, await outcome);
            Assert.False(caller.IsCancellationRequested);
        }
    }
}
