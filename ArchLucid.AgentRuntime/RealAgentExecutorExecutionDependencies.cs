using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime;

internal sealed class RealAgentExecutorExecutionDependencies
{
    internal RealAgentExecutorExecutionDependencies(
        IReadOnlyDictionary<string, IAgentHandler> handlers,
        ILogger<RealAgentExecutor> logger,
        IOptionsMonitor<AgentPromptCatalogOptions> promptCatalog,
        IScopeContextProvider scopeContextProvider,
        IAgentHandlerConcurrencyGate concurrencyGate,
        IOptions<AgentExecutionResilienceOptions> resilienceOptions,
        IOptions<StagedCriticAgentOptions> stagedCriticOptions,
        IOptions<AgentOutputQualityGateOptions> agentOutputBudgetGate,
        IPromptRedactor promptRedactor,
        IOptionsMonitor<ArchLucidLlmOptions> archLucidLlmOptions,
        IAgentResultRepository agentResultRepository)
    {
        Handlers = handlers;
        Logger = logger;
        PromptCatalog = promptCatalog;
        ScopeContextProvider = scopeContextProvider;
        ConcurrencyGate = concurrencyGate;
        ResilienceOptions = resilienceOptions;
        StagedCriticOptions = stagedCriticOptions;
        AgentOutputBudgetGate = agentOutputBudgetGate;
        PromptRedactor = promptRedactor;
        ArchLucidLlmOptions = archLucidLlmOptions;
        AgentResultRepository = agentResultRepository;
    }

    internal IReadOnlyDictionary<string, IAgentHandler> Handlers { get; }

    internal ILogger<RealAgentExecutor> Logger { get; }

    internal IOptionsMonitor<AgentPromptCatalogOptions> PromptCatalog { get; }

    internal IScopeContextProvider ScopeContextProvider { get; }

    internal IAgentHandlerConcurrencyGate ConcurrencyGate { get; }

    internal IOptions<AgentExecutionResilienceOptions> ResilienceOptions { get; }

    internal IOptions<StagedCriticAgentOptions> StagedCriticOptions { get; }

    internal IOptions<AgentOutputQualityGateOptions> AgentOutputBudgetGate { get; }

    internal IPromptRedactor PromptRedactor { get; }

    internal IOptionsMonitor<ArchLucidLlmOptions> ArchLucidLlmOptions { get; }

    internal IAgentResultRepository AgentResultRepository { get; }
}
