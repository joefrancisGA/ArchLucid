using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Capabilities.Cost;
using CapabilitiesCostAgentHandler = ArchLucid.Capabilities.Cost.CostAgentHandler;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.DriftDetection;

/// <summary>
///     Builds a <see cref="RealAgentExecutor" /> wired like the live AOAI smoke harness (<c>RealAzureOpenAIEndToEndTests</c>),
///     plus a critic handler so batches match <see cref="GoldenCohortDriftScenarioFixtures.BuildStandardQuad" />.
/// </summary>
internal static class GoldenCohortLiveAoaiExecutorFactory
{
    internal static (RealAgentExecutor Executor, GoldenCohortDriftTokenRecorder Recorder) CreateLiveExecutor(
        string endpoint,
        string apiKey,
        string deploymentTrimmed)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(endpoint);
        ArgumentException.ThrowIfNullOrWhiteSpace(apiKey);
        ArgumentException.ThrowIfNullOrWhiteSpace(deploymentTrimmed);

        AzureOpenAiCompletionClient completion = new(
            endpoint.Trim(),
            apiKey.Trim(),
            deploymentTrimmed,
            AzureOpenAiCompletionClient.DefaultMaxCompletionTokens);

        AgentResultParser parser = new();
        GoldenCohortDriftTokenRecorder recorder = new();
        IAgentSystemPromptCatalog promptCatalog = AgentPromptCatalogTestFactory.Create();

        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeProvider = new();

        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext
            {
                TenantId = ScopeIds.DefaultTenant,
                WorkspaceId = ScopeIds.DefaultWorkspace,
                ProjectId = ScopeIds.DefaultProject,
            });

        IOptionsMonitor<AgentSchemaRemediationOptions> schemaRemediation =
            AgentSchemaRemediationOptionsMonitorTestFactory.Create();

        TopologyAgentHandler topology = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completion),
            SchemaRemediationCompletionClientTestFactory.Create(completion),
            parser,
            recorder,
            promptCatalog,
            audit.Object,
            scopeProvider.Object,
            ComplianceAgentHandlerTestDependencies.CreateEmptyRetrievalQueryService(),
            schemaRemediation,
            ComplianceAgentHandlerTestDependencies.CreateTopologyNullLogger());

        ComplianceAgentHandler compliance = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completion),
            SchemaRemediationCompletionClientTestFactory.Create(completion),
            parser,
            recorder,
            promptCatalog,
            audit.Object,
            scopeProvider.Object,
            ComplianceAgentHandlerTestDependencies.CreateEmptyRetrievalQueryService(),
            ComplianceAgentHandlerTestDependencies.CreateCitationFormatter(),
            ComplianceAgentHandlerTestDependencies.CreateNoOpGroundingTraceWriter(),
            schemaRemediation,
            ComplianceAgentHandlerTestDependencies.CreateNullLogger());

        CapabilitiesCostAgentHandler cost = new();

        CriticAgentHandler critic = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completion),
            SchemaRemediationCompletionClientTestFactory.Create(completion),
            parser,
            recorder,
            promptCatalog,
            audit.Object,
            scopeProvider.Object,
            schemaRemediation);

        IOptions<AgentExecutionResilienceOptions> resilience = Options.Create(
            new AgentExecutionResilienceOptions { MaxConcurrentHandlers = 0, PerHandlerTimeoutSeconds = 0 });

        RealAgentExecutor executor = new(
            [topology, compliance, cost, critic],
            NullLogger<RealAgentExecutor>.Instance,
            new DriftMixedModePromptCatalogMonitor(new AgentPromptCatalogOptions()),
            scopeProvider.Object,
            new AgentHandlerConcurrencyGate(resilience),
            resilience,
            Options.Create(new StagedCriticAgentOptions()),
            Options.Create(new AgentOutputQualityGateOptions()),
            new NoOpPromptRedactor(),
            new FixedValueOptionsMonitor<ArchLucidLlmOptions>(new ArchLucidLlmOptions()),
            new InMemoryAgentResultRepository());

        return (executor, recorder);
    }

    private sealed class DriftMixedModePromptCatalogMonitor(AgentPromptCatalogOptions value)
        : IOptionsMonitor<AgentPromptCatalogOptions>
    {
        public AgentPromptCatalogOptions CurrentValue
        {
            get;
        } = value;

        public AgentPromptCatalogOptions Get(string? name)
        {
            return CurrentValue;
        }

        public IDisposable? OnChange(Action<AgentPromptCatalogOptions, string?> listener)
        {
            return null;
        }
    }
}
