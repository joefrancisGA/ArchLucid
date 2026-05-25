using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Category", "Unit")]
public sealed class AgentOutputFaithfulnessEvaluatorTests
{
    [Fact]
    public async Task TryEvaluateAsync_skips_when_quality_gate_disabled()
    {
        Mock<IAgentCompletionClient> client = new();
        AgentOutputFaithfulnessEvaluator sut = CreateEvaluator(
            client.Object,
            qualityGateEnabled: false,
            faithfulnessEnabled: true);

        double? score = await sut.TryEvaluateAsync(
            "trace-1",
            """{"claims":[{"text":"x","evidence":"y"}]}""",
            SampleEvidence(),
            CancellationToken.None);

        score.Should().BeNull();
        client.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryEvaluateAsync_parses_faithfulness_score_when_enabled()
    {
        Mock<IAgentCompletionClient> client = new();
        client
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("""{"faithfulnessScore":0.82,"rationale":"grounded"}""");

        AgentOutputFaithfulnessEvaluator sut = CreateEvaluator(
            client.Object,
            qualityGateEnabled: true,
            faithfulnessEnabled: true);

        double? score = await sut.TryEvaluateAsync(
            "trace-2",
            """{"claims":[{"text":"Use Blob storage","evidence":"catalog"}]}""",
            SampleEvidence(),
            CancellationToken.None);

        score.Should().BeApproximately(0.82, 0.001);
    }

    private static AgentOutputFaithfulnessEvaluator CreateEvaluator(
        IAgentCompletionClient client,
        bool qualityGateEnabled,
        bool faithfulnessEnabled)
    {
        ServiceCollection services = new();
        services.AddKeyedSingleton(AgentOutputLlmJudgeCompletionServiceKey.Value, client);
        ServiceProvider provider = services.BuildServiceProvider();

        Mock<IOptionsMonitor<AgentOutputLlmFaithfulnessOptions>> faithOpts = new();
        faithOpts.Setup(o => o.CurrentValue).Returns(new AgentOutputLlmFaithfulnessOptions
        {
            Enabled = faithfulnessEnabled,
            SkipWhenSimulator = false,
        });

        Mock<IOptionsMonitor<AgentOutputQualityGateOptions>> gateOpts = new();
        gateOpts.Setup(o => o.CurrentValue).Returns(new AgentOutputQualityGateOptions
        {
            Enabled = qualityGateEnabled,
        });

        Mock<IOptionsMonitor<AgentExecutionOptions>> execOpts = new();
        execOpts.Setup(o => o.CurrentValue).Returns(new AgentExecutionOptions { Mode = "Real" });

        return new AgentOutputFaithfulnessEvaluator(
            provider.GetRequiredService<IServiceScopeFactory>(),
            faithOpts.Object,
            gateOpts.Object,
            execOpts.Object,
            NullLogger<AgentOutputFaithfulnessEvaluator>.Instance);
    }

    private static AgentEvidencePackage SampleEvidence() =>
        new()
        {
            SystemName = "Acct",
            Environment = "Prod",
            CloudProvider = "Azure",
            Request = new ArchitectureRequest
            {
                SystemName = "Acct",
                Description = "Use Blob storage for archives",
            },
            ServiceCatalog =
            [
                new ServiceCatalogEvidence
                {
                    ServiceId = "blob",
                    ServiceName = "Blob storage",
                    Category = "Storage",
                    Summary = "Durable object storage",
                },
            ],
        };
}
