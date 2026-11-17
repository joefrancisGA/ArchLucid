using ArchLucid.AgentRuntime;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Retrieval;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Retrieval.Citations;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.PolicyPacks;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.AgentRuntime;

[Trait("Category", "Unit")]
public sealed class TopologyAgentHandlerLegacyRunIdTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
    };

    [Fact]
    public async Task CompareQuality_ExecuteAsync_uses_legacy_ledger_chosen_cloud_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string runId = runGuid.ToString("N");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId).ToUpperInvariant();

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = legacyUpper,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Amazon Web Services",
                ProviderFamily = CloudProvider.Aws,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        string taskId = Guid.NewGuid().ToString("N");
        CapturingAgentCompletionClient completionClient = new(runId, taskId);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(TestScope);
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IRetrievalQueryService> retrieval = new();
        retrieval
            .Setup(r => r.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IRetrievalGroundingTraceWriter> groundingTrace = new();
        groundingTrace
            .Setup(w => w.AppendAsync(It.IsAny<RetrievalGroundingTraceInsert>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IPolicyPackResolver> policyPackResolver = new();
        policyPackResolver
            .Setup(r => r.ResolveAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectivePolicyPackSet());

        Mock<IOptionsMonitor<PolicyPackCorpusIndexerOptions>> corpusOptions = new();
        corpusOptions.Setup(o => o.CurrentValue).Returns(new PolicyPackCorpusIndexerOptions());

        AgentPolicyPackRetrievalAppender policyPackAppender = new(
            scopeProvider.Object,
            retrieval.Object,
            new RetrievalCitationFormatter(),
            groundingTrace.Object,
            new AgentPolicyPackRulePackIdResolver(policyPackResolver.Object, corpusOptions.Object),
            NullLogger<AgentPolicyPackRetrievalAppender>.Instance);

        AgentSchemaRemediationOptions remediationOptions = new();
        remediationOptions.Normalize();
        Mock<IOptionsMonitor<AgentSchemaRemediationOptions>> remediationMonitor = new();
        remediationMonitor.Setup(o => o.CurrentValue).Returns(remediationOptions);

        TopologyAgentHandler handler = new(
            new PassThroughAgentTierCompletionRouter(completionClient, new FixedTierResolver()),
            new SchemaRemediationAgentCompletionClientAdapter(completionClient),
            new AgentResultParser(),
            new NoOpTraceRecorder(),
            CreatePromptCatalog(),
            audit.Object,
            scopeProvider.Object,
            ledgerRepository,
            retrieval.Object,
            policyPackAppender,
            groundingTrace.Object,
            remediationMonitor.Object,
            NullLogger<TopologyAgentHandler>.Instance);

        ArchitectureRequest request = new()
        {
            RequestId = "req-topology-legacy",
            SystemName = "Sys",
            Description = "Design a secure system with enough detail.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        AgentEvidencePackage evidence = new()
        {
            RunId = runId,
            RequestId = request.RequestId,
            SystemName = request.SystemName,
            Environment = request.Environment,
            CloudProvider = request.CloudProvider.ToString(),
            Request = new RequestEvidence
            {
                Description = request.Description,
                Constraints = request.Constraints.ToList(),
                RequiredCapabilities = request.RequiredCapabilities.ToList(),
                Assumptions = request.Assumptions.ToList(),
            },
        };

        AgentTask task = new()
        {
            TaskId = taskId,
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective = "Design topology",
            Status = AgentTaskStatus.Created,
            CreatedUtc = DateTime.UtcNow,
        };

        await handler.ExecuteAsync(runId, request, evidence, task, CancellationToken.None);

        completionClient.LastUserPrompt.Should().NotBeNull();
        completionClient.LastUserPrompt!.Should().Contain("AWS");
        completionClient.LastUserPrompt.Should().Contain("Amazon Web Services");
    }

    private static IAgentSystemPromptCatalog CreatePromptCatalog() =>
        new CachedAgentSystemPromptCatalog(new StaticPromptOptionsMonitor(new AgentPromptCatalogOptions()));

    private sealed class StaticPromptOptionsMonitor(AgentPromptCatalogOptions value)
        : IOptionsMonitor<AgentPromptCatalogOptions>
    {
        public AgentPromptCatalogOptions CurrentValue => value;

        public AgentPromptCatalogOptions Get(string? name) => value;

        public IDisposable? OnChange(Action<AgentPromptCatalogOptions, string?> listener) => null;
    }

    private sealed class NoOpTraceRecorder : IAgentExecutionTraceRecorder
    {
        public Task RecordAsync(
            string runId,
            string taskId,
            AgentType agentType,
            string systemPrompt,
            string userPrompt,
            string rawResponse,
            string? parsedResultJson,
            bool parseSucceeded,
            string? errorMessage,
            AgentPromptReproMetadata? promptRepro = null,
            int? inputTokenCount = null,
            int? outputTokenCount = null,
            int? reasoningTokenCount = null,
            string? modelDeploymentName = null,
            string? modelVersion = null,
            bool isSimulatorExecution = false,
            string? failureReasonCode = null,
            float? completionTemperature = null,
            int? maxCompletionTokens = null,
            float? completionTopP = null,
            int attemptIndex = 0,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class FixedTierResolver : IAgentModelTierResolver
    {
        public LlmModelTier ResolveTierForAgent(AgentType agentType, LlmModelTier? taskTierOverride) =>
            taskTierOverride ?? LlmModelTier.Standard;

        public LlmModelTier ResolveTierForAgentTypeName(string agentTypeName, LlmModelTier? taskTierOverride) =>
            taskTierOverride ?? LlmModelTier.Standard;

        public LlmModelTier ResolveDefaultTenantTier() => LlmModelTier.Standard;

        public LlmModelTier ResolveNonAgentDefaultTier() => LlmModelTier.Economy;

        public string ResolveDeploymentName(LlmModelTier tier) => tier.ToString();
    }

    private sealed class CapturingAgentCompletionClient(string runId, string taskId) : IAgentCompletionClient
    {
        public LlmProviderDescriptor Descriptor => LlmProviderDescriptor.ForOffline("stub", "stub");

        public string? LastUserPrompt { get; private set; }

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            LastUserPrompt = userPrompt;
            string json = $$"""
                            {
                              "resultId": "RES-TOPO-LEGACY",
                              "taskId": "{{taskId}}",
                              "runId": "{{runId}}",
                              "agentType": "Topology",
                              "claims": ["Use AWS App Service."],
                              "evidenceRefs": ["request"],
                              "confidence": 0.9,
                              "findings": [],
                              "proposedChanges": {
                                "proposalId": "PROP-LEGACY",
                                "sourceAgent": "Topology",
                                "addedServices": [
                                  {
                                    "serviceId": "svc-api",
                                    "serviceName": "api",
                                    "serviceType": "Api",
                                    "runtimePlatform": "AppService",
                                    "purpose": "API"
                                  }
                                ],
                                "addedDatastores": [],
                                "addedRelationships": [],
                                "requiredControls": [],
                                "warnings": []
                              },
                              "createdUtc": "2026-03-15T14:00:00Z"
                            }
                            """;

            return Task.FromResult(json);
        }
    }
}
