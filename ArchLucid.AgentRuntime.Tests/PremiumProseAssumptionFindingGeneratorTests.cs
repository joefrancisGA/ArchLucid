using ArchLucid.Application.Findings.ProseAssumption;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class PremiumProseAssumptionFindingGeneratorTests
{
    [Fact]
    public async Task GenerateAsync_in_simulator_mode_is_no_op_even_when_flag_true()
    {
        PremiumProseAssumptionFindingGenerator generator = CreateGenerator(
            enableProseAssumptionExtraction: true,
            executionMode: DevAgentExecutionModeHeaderNames.Simulator);

        IReadOnlyList<Finding> findings = (await generator.GenerateAsync(
            new GraphSnapshot(),
            analysisContext: null,
            CancellationToken.None)).Findings;

        findings.Should().BeEmpty();
    }

    [Fact]
    public async Task GenerateAsync_in_real_mode_with_flag_false_returns_empty()
    {
        PremiumProseAssumptionFindingGenerator generator = CreateGenerator(
            enableProseAssumptionExtraction: false,
            executionMode: DevAgentExecutionModeHeaderNames.Real);

        IReadOnlyList<Finding> findings = (await generator.GenerateAsync(
            new GraphSnapshot(),
            analysisContext: null,
            CancellationToken.None)).Findings;

        findings.Should().BeEmpty();
    }

    [Fact]
    public void ProseAssumptionExtractionParser_rejects_unfaithful_completion_rows_without_logical_property()
    {
        const string rawJson =
            """
            {
              "assumptions": [
                {
                  "statement": "The payment provider owns PCI scope.",
                  "documentPath": "architecture.md",
                  "lineNumber": 1,
                  "quotedSpan": "owns PCI scope"
                }
              ]
            }
            """;

        ProseAssumptionExtractionParser.TryParse(rawJson, maxCandidates: 8).Should().BeEmpty();
    }

    private static PremiumProseAssumptionFindingGenerator CreateGenerator(
        bool enableProseAssumptionExtraction,
        string executionMode)
    {
        Mock<IProseAssumptionContradictionService> contradictionService = new();
        contradictionService
            .Setup(service => service.EmitOutcomeAsync(
                It.IsAny<IReadOnlyList<ProseAssumptionCandidate>>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<Contracts.Architecture.FindingAnalysisContext?>(),
                It.IsAny<int>(),
                It.IsAny<int>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(ProseAssumptionContradictionOutcome.Empty);

        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Llm:Deployments:Reasoning"] = "reasoning-deployment",
            })
            .Build();

        return new PremiumProseAssumptionFindingGenerator(
            new StubAgentTierCompletionRouter(new CountingCompletionClient()),
            new StubTierOptionsMonitor(new AgentModelTierOptions { PremiumDeploymentName = "reasoning-deployment" }),
            new StubGateOptionsResolver(enableProseAssumptionExtraction),
            new StubExecutionModeAccessor(executionMode),
            configuration,
            new Mock<ArchLucid.Persistence.Interfaces.IRunRepository>().Object,
            new Mock<ArchLucid.Persistence.Data.Repositories.IArchitectureRequestRepository>().Object,
            new Mock<IScopeContextProvider>().Object,
            contradictionService.Object,
            NullLogger<PremiumProseAssumptionFindingGenerator>.Instance);
    }

    private sealed class StubTierOptionsMonitor(AgentModelTierOptions value) : IOptionsMonitor<AgentModelTierOptions>
    {
        public AgentModelTierOptions CurrentValue => value;

        public AgentModelTierOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<AgentModelTierOptions, string?> listener) => null;
    }

    private sealed class StubAgentTierCompletionRouter(IAgentCompletionClient client) : IAgentTierCompletionRouter
    {
        public IAgentCompletionClient DefaultCompletionClient => client;

        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgent(
            AgentType agentType,
            LlmModelTier? taskTierOverride) => (client, LlmModelTier.Premium);

        public (IAgentCompletionClient Client, LlmModelTier ResolvedTier) ResolveForAgentTypeName(
            string agentTypeName,
            LlmModelTier? taskTierOverride = null) => (client, LlmModelTier.Premium);
    }

    private sealed class StubExecutionModeAccessor(string mode) : IEffectiveAgentExecutionModeAccessor
    {
        public string GetEffectiveMode() => mode;
    }

    private sealed class StubGateOptionsResolver(bool enableProseAssumptionExtraction) : IInsightDensityGateOptionsResolver
    {
        public InsightDensityGateOptions Resolve(CancellationToken cancellationToken = default) => new()
        {
            EnableProseAssumptionExtraction = enableProseAssumptionExtraction,
        };
    }

    private sealed class CountingCompletionClient : IAgentCompletionClient
    {
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("counting", "counting");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default) =>
            Task.FromResult("""{"assumptions":[]}""");
    }
}
