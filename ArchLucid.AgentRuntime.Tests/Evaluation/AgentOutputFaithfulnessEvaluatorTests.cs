using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

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
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryEvaluateAsync_parses_faithfulness_score_when_enabled()
    {
        Mock<IAgentCompletionClient> client = new();
        string? capturedSystem = null;
        string? capturedUser = null;
        client
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<int?>(),
                It.IsAny<float?>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, string, int?, float?, CancellationToken>((sys, user, _, _, _) =>
            {
                capturedSystem = sys;
                capturedUser = user;
            })
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
        capturedSystem.Should().Contain("FAITHFULNESS DEFINITION");
        capturedSystem.Should().Contain("RUBRIC");
        capturedUser.Should().Contain("traceId:trace-2");
        capturedUser.Should().Contain("Blob storage");
    }

    [Fact]
    public void FaithfulnessJudgePromptResolver_exposes_catalog_metadata()
    {
        ResolvedSystemPrompt resolved = FaithfulnessJudgePromptResolver.Resolve();

        resolved.TemplateId.Should().Be(FaithfulnessJudgeSystemPromptTemplate.TemplateId);
        resolved.TemplateVersion.Should().Be(FaithfulnessJudgeSystemPromptTemplate.Version);
        resolved.Text.Should().Contain("1.0 (Perfect)");
        resolved.ContentSha256Hex.Should().NotBeNullOrWhiteSpace();
    }

    private static AgentOutputFaithfulnessEvaluator CreateEvaluator(
        IAgentCompletionClient client,
        bool qualityGateEnabled,
        bool faithfulnessEnabled)
    {
        Mock<IOptionsMonitor<LlmJudgeDailyTokenBudgetOptions>> judgeBudgetOpts = new();
        judgeBudgetOpts.Setup(o => o.CurrentValue).Returns(new LlmJudgeDailyTokenBudgetOptions { Enabled = true });
        LlmJudgeDailyTokenBudgetTracker judgeBudgetTracker =
            new(judgeBudgetOpts.Object, new InMemoryLlmTenantBudgetRepository());

        ServiceCollection services = new();
        services.AddKeyedSingleton(AgentOutputLlmJudgeCompletionServiceKey.Value, client);
        services.AddScoped<ILlmJudgeBudgetTracker>(_ => judgeBudgetTracker);
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

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = ScopeIds.DefaultTenant,
            WorkspaceId = ScopeIds.DefaultWorkspace,
            ProjectId = ScopeIds.DefaultProject
        });

        return new AgentOutputFaithfulnessEvaluator(
            provider.GetRequiredService<IServiceScopeFactory>(),
            scopeProvider.Object,
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
            Request = new RequestEvidence
            {
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
