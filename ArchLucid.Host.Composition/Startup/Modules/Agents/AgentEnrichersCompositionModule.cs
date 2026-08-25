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
/// Agent enrichers and core agent execution options.
/// </summary>
public static class AgentEnrichersCompositionModule
{
    public static void Register(IServiceCollection services, IConfiguration configuration)
    {
            services.Configure<GenerateIacStubsOptions>(configuration.GetSection(GenerateIacStubsOptions.SectionPath));
            services.Configure<RerankFindingsOptions>(configuration.GetSection(RerankFindingsOptions.SectionPath));
            services.Configure<ExplainGovernanceBlocksOptions>(configuration.GetSection(ExplainGovernanceBlocksOptions.SectionPath));
            services.Configure<EvidenceSummarizationOptions>(
                configuration.GetSection(EvidenceSummarizationOptions.SectionPath));
            services.AddScoped(static sp =>
                new Lazy<IAgentTierCompletionRouter>(() => sp.GetRequiredService<IAgentTierCompletionRouter>()));
            services.AddScoped<IEvidenceSummarizationService, EvidenceSummarizationService>();
            services.AddScoped<IFindingIacStubGenerator, FindingIacStubGenerator>();
            services.AddScoped<IFindingPriorityReranker, FindingPriorityReranker>();
            services.Configure<AgentConfidenceCalibrationOptions>(
                configuration.GetSection(AgentConfidenceCalibrationOptions.SectionPath));
            services.Configure<TopologyProposalConsensusOptions>(
                configuration.GetSection(TopologyProposalConsensusOptions.SectionPath));
            services.Configure<AgentCuratedEvidenceProposalOptions>(
                configuration.GetSection(AgentCuratedEvidenceProposalOptions.SectionPath));
            services.AddScoped<IAgentConfidenceCalibrator, AgentConfidenceCalibrator>();
            services.AddScoped<IAgentConfidenceCalibrationService, AgentConfidenceCalibrationService>();
            services.AddScoped<IPromptVariantStatsService, PromptVariantStatsService>();
            services.AddScoped<IAgentCuratedEvidenceProposer, AgentCuratedEvidenceProposer>();
            services.AddScoped<AgentResultPostExecutionEnricher>();
            services.AddScoped<AgentResultRegionMismatchEnricher>();
            services.AddScoped<AgentProposalStructuralPostProcessorEnricher>();
            services.AddScoped<CrossAgentProposalConsistencyEnricher>();
            services.AddScoped<TopologyProposalDualModelConsensusEnricher>();
            services.AddScoped<AgentArchitectureFindingEmissionEnricher>();
            services.AddScoped<IAgentResultPostExecutionEnricher>(static sp =>
                new CompositeAgentResultPostExecutionEnricher(
                [
                    sp.GetRequiredService<AgentResultPostExecutionEnricher>(),
                    sp.GetRequiredService<AgentProposalStructuralPostProcessorEnricher>(),
                    sp.GetRequiredService<CrossAgentProposalConsistencyEnricher>(),
                    sp.GetRequiredService<TopologyProposalDualModelConsensusEnricher>(),
                    sp.GetRequiredService<AgentArchitectureFindingEmissionEnricher>(),
                    sp.GetRequiredService<AgentResultRegionMismatchEnricher>(),
                ]));
            services.AddSingleton<IAgentEvidenceUntrustedInputSanitizer, AgentEvidenceUntrustedInputSanitizer>();
            services.AddScoped<IEvidenceProposalQueryService, EvidenceProposalQueryService>();
            services.AddScoped<IEvidenceProposalPromoter, EvidenceProposalPromoter>();
            services.Configure<AgentExecutionOptions>(configuration.GetSection(AgentExecutionOptions.SectionName));
            services.Configure<StagedCriticAgentOptions>(
                configuration.GetSection(StagedCriticAgentOptions.SectionPath));
            services.Configure<ArchLucidLlmOptions>(configuration.GetSection(ArchLucidLlmOptions.SectionPath));
            services.AddSingleton<IPostConfigureOptions<StagedCriticAgentOptions>,
                StagedCriticAgentOptionsNormalizePostConfigure>();
            services.AddOptions<AzureOpenAiOptions>()
                .Bind(configuration.GetSection(AzureOpenAiOptions.SectionName))
                .ValidateOnStart();
            services.AddSingleton<IValidateOptions<AzureOpenAiOptions>, AzureOpenAiOptionsValidator>();
            services.Configure<ArchLucidPersistenceOptions>(
                configuration.GetSection(ArchLucidPersistenceOptions.SectionPath));
    }

}
