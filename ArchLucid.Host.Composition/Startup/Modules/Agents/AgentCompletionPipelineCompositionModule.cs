// Agent bounded-context composition registrations (extracted from ServiceCollectionExtensions.Agents* partials).

using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.AgentRuntime.Batch;
using ArchLucid.AgentRuntime.Caching;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.FineTuning;
using ArchLucid.AgentRuntime.PromptInjection;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.AgentRuntime.Safety;
using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.AgentRuntime;
using ArchLucid.AgentSimulator.Services;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Application.Agents.IaC;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Agents.PromptVariants;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Admin;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.AgentSimulation;
using ArchLucid.Core.Agents;
using ArchLucid.Core.AiProviders;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Evidence;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Http;
using ArchLucid.Core.Llm.Redaction;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Safety;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Composition.Caching;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DevTesting;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Retrieval.Admin;
using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Citations;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Evaluation;
using ArchLucid.Retrieval.FineTuning.Export;
using ArchLucid.Retrieval.FineTuning.Orchestration;
using ArchLucid.Retrieval.FineTuning.Redaction;
using ArchLucid.Retrieval.FineTuning.Registry;
using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.PolicyPacks;
using ArchLucid.Retrieval.Pricing;
using ArchLucid.Retrieval.Queries;
using ArchLucid.Retrieval.Reranking;
using ArchLucid.Retrieval.Summarization;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Polly;
using System.Text.Json.Serialization;
using System.Text.Json;

using ArchLucid.Host.Composition.Startup.Modules;

namespace ArchLucid.Host.Composition.Startup.Modules.Agents;

/// <summary>
/// Public entry points for agent completion pipeline variants.
/// </summary>
public static class AgentCompletionPipelineCompositionModule
{
    public static void RegisterEchoPipeline(IServiceCollection services)
    {
        AgentCompletionPipelineHelpers.RegisterEchoAgentCompletionPipeline(services);
    }

    public static void RegisterFakeClient(IServiceCollection services)
    {
        AgentCompletionPipelineHelpers.RegisterFakeAgentCompletionClient(services);
    }

    public static void RegisterSchemaRemediationClient(IServiceCollection services, bool useAzureOpenAi)
    {
        AgentCompletionPipelineHelpers.RegisterSchemaRemediationAgentCompletionClient(services, useAzureOpenAi);
    }

    public static void ConfigureLlmTelemetryLabels(
        IServiceCollection services,
        IConfiguration configuration,
        string? agentMode,
        bool useAzureOpenAi,
        bool useEchoClient)
    {
        services.Configure<LlmTelemetryLabelOptions>(options =>
        {
            if (useEchoClient)
            {
                options.ProviderId = "echo";
                options.ModelDeploymentLabel = "echo";
            }
            else if (useAzureOpenAi)
            {
                options.ProviderId = "azure-openai";
                options.ModelDeploymentLabel = configuration["AzureOpenAI:DeploymentName"]?.Trim() ?? "unknown";
            }
            else if (string.Equals(agentMode, "Simulator", StringComparison.OrdinalIgnoreCase))
            {
                options.ProviderId = "simulator";
                options.ModelDeploymentLabel = "deterministic";
            }
            else
            {
                options.ProviderId = "fake";
                options.ModelDeploymentLabel = "fake";
            }
        });
    }

}
