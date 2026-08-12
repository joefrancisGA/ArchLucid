using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.AgentModelAliases;
using ArchLucid.AgentRuntime.Batch;
using ArchLucid.AgentRuntime.Caching;
using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Evaluation.ReferenceCases;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.Prompts.Variants;
using ArchLucid.AgentRuntime.Tokens;
using ArchLucid.Contracts.Persistence.Agents.PromptVariants;
using ArchLucid.Core.Findings;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.AgentRuntime.QuickScan;
using ArchLucid.AgentRuntime.Safety;
using ArchLucid.AgentSimulator.Services;
using ArchLucid.Core.AgentSimulation;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Budgeting;
using ArchLucid.Application.Agents;
using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Core.Evidence;
using ArchLucid.AgentRuntime.PromptInjection;
using ArchLucid.Application.Agents.IaC;
using ArchLucid.Application.Findings;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Agents;
using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Http;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Llm.Redaction;
using IAgentCompletionClient = ArchLucid.AgentRuntime.IAgentCompletionClient;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Resilience;
using ArchLucid.Core.Safety;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Validation;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Composition.Caching;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Diagnostics;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Resilience;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Startup;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Core.Admin;
using ArchLucid.Retrieval.Admin;
using ArchLucid.Retrieval.Agentic;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Citations;
using ArchLucid.Retrieval.Embedding;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.PolicyPacks;
using ArchLucid.Retrieval.Reranking;
using ArchLucid.Retrieval.Summarization;
using ArchLucid.Retrieval.Pricing;
using ArchLucid.Retrieval.Queries;
using ArchLucid.Retrieval.FineTuning;
using ArchLucid.Retrieval.FineTuning.Consent;
using ArchLucid.Retrieval.FineTuning.Evaluation;
using ArchLucid.Retrieval.FineTuning.Export;
using ArchLucid.Retrieval.FineTuning.Orchestration;
using ArchLucid.Retrieval.FineTuning.Redaction;
using ArchLucid.Retrieval.FineTuning.Registry;
using ArchLucid.AgentRuntime.FineTuning;

using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

using Polly;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{

    private static void RegisterLlmBatchServices(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<LlmBatchOptions>(configuration.GetSection(LlmBatchOptions.SectionPath));
        services.PostConfigure<LlmBatchOptions>(static options =>
        {
            options.PollIntervalSeconds = Math.Clamp(options.PollIntervalSeconds, 5, 300);
            options.MaxWaitMinutes = Math.Clamp(options.MaxWaitMinutes, 1, 1_440);
            options.EstimatedDiscountRatio = Math.Clamp(options.EstimatedDiscountRatio, 0.0, 1.0);
        });
        services.AddSingleton<ILlmBatchRoutingContext>(_ => LlmBatchRoutingContext.Instance);
        services.AddHttpClient(
            AzureOpenAiBatchHttpClients.BatchHttpClientName,
            static (sp, client) =>
            {
                IConfiguration config = sp.GetRequiredService<IConfiguration>();
                string? apiKey = config["AzureOpenAI:ApiKey"];

                if (!string.IsNullOrWhiteSpace(apiKey))
                    client.DefaultRequestHeaders.Add("api-key", apiKey);

                client.Timeout = TimeSpan.FromHours(3);
            })
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.LlmCompletion);
        services.AddSingleton<IBatchAgentCompletionClient>(static sp =>
        {
            IConfiguration config = sp.GetRequiredService<IConfiguration>();
            LlmBatchOptions batchOptions = config.GetSection(LlmBatchOptions.SectionPath).Get<LlmBatchOptions>()
                                           ?? new LlmBatchOptions();

            if (!batchOptions.Enabled)
                return DisabledBatchAgentCompletionClient.Instance;

            string endpoint = config["AzureOpenAI:Endpoint"]?.Trim()
                              ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is missing.");
            string deploymentName = config["AzureOpenAI:DeploymentName"]?.Trim()
                                    ?? throw new InvalidOperationException("AzureOpenAI:DeploymentName is missing.");
            string authenticationMode = config["AzureOpenAI:AuthenticationMode"]?.Trim() ?? "ApiKey";
            string? apiKey = config["AzureOpenAI:ApiKey"];

            if (string.Equals(authenticationMode, "ManagedIdentity", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "ArchLucid:LlmBatch requires ApiKey authentication today; ManagedIdentity batch transport is not implemented.");
            }

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException("AzureOpenAI:ApiKey is missing.");

            IAzureOpenAiBatchTransport transport = new AzureOpenAiBatchHttpTransport(
                sp.GetRequiredService<IHttpClientFactory>(),
                endpoint,
                sp.GetRequiredService<ILogger<AzureOpenAiBatchHttpTransport>>());

            return new AzureOpenAiBatchCompletionClient(
                transport,
                deploymentName,
                sp.GetRequiredService<IOptionsMonitor<LlmBatchOptions>>(),
                sp.GetRequiredService<ILlmCostEstimator>(),
                TimeProvider.System,
                sp.GetRequiredService<ILogger<AzureOpenAiBatchCompletionClient>>());
        });
    }
}
