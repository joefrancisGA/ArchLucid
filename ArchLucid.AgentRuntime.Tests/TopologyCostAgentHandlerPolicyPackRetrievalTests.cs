using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Retrieval;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;
using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class TopologyCostAgentHandlerPolicyPackRetrievalTests
{
    [Fact]
    public async Task Topology_ExecuteAsync_appends_dimension_framed_policy_pack_block()
    {
        const string runId = AgentHandlerTestRunIds.Run001;
        const string topologyJson = """
                                     {
                                       "resultId": "RES-TOPO-001",
                                       "taskId": "TASK-TOPO-001",
                                       "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                                       "agentType": "Topology",
                                       "claims": ["Use zone-redundant storage."],
                                       "evidenceRefs": [],
                                       "confidence": 0.9,
                                       "findings": [],
                                       "proposedChanges": {
                                         "proposalId": "PROP-TOPO-001",
                                         "sourceAgent": "Topology",
                                         "addedServices": [],
                                         "addedDatastores": [],
                                         "addedRelationships": [],
                                         "requiredControls": [],
                                         "warnings": []
                                       },
                                       "createdUtc": "2026-03-15T14:00:00Z"
                                     }
                                     """;

        CapturingCompletionClient completionClient = new(topologyJson);
        Mock<ArchLucid.Core.Scoping.IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ArchLucid.Core.Scoping.ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });

        Mock<IRetrievalQueryService> retrieval = new();
        retrieval.Setup(r => r.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    ChunkId = "c-rel",
                    DocumentId = "policy-pack-rule-rel-base-001",
                    CorpusKind = nameof(CorpusKind.PolicyPack),
                    SourceType = "PolicyPackRule",
                    SourceId = "rel-base-001",
                    Title = "Availability zones",
                    Text = "[reliability v1.0.0] [Error] Availability zones (compute): Deploy across zones.",
                    Score = 0.91,
                },
            ]);

        Mock<IPolicyPackResolver> packResolver = new();
        packResolver.Setup(r => r.ResolveAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectivePolicyPackSet
            {
                Packs =
                [
                    new ResolvedPolicyPack
                    {
                        PolicyPackId = Guid.NewGuid(),
                        Name = "Reliability and Resilience",
                        Version = "1.0.0",
                        PackType = "BuiltIn",
                        ContentJson = """{"metadata":{"rulePackId":"reliability-vertical-v1"}}""",
                        QualityDimension = QualityDimension.ReliabilityAndResilience,
                    },
                ],
            });

        TopologyAgentHandler handler = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completionClient),
            SchemaRemediationCompletionClientTestFactory.Create(completionClient),
            new AgentResultParser(),
            new NoOpTraceRecorder(),
            AgentPromptCatalogTestFactory.Create(),
            new Mock<ArchLucid.Core.Audit.IAuditService>().Object,
            scopeProvider.Object,
            TopologyAgentHandlerTestFactory.CreateEmptyLedgerRepository(),
            retrieval.Object,
            ComplianceAgentHandlerTestDependencies.CreatePolicyPackRetrievalAppender(
                scopeProvider.Object,
                retrieval.Object,
                policyPackResolver: packResolver.Object),
            ComplianceAgentHandlerTestDependencies.CreateNoOpGroundingTraceWriter(),
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(),
            ComplianceAgentHandlerTestDependencies.CreateTopologyNullLogger());

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "EnterpriseRag",
            Description = "Design a resilient Azure system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        AgentTask task = new()
        {
            TaskId = "TASK-TOPO-001",
            RunId = runId,
            AgentType = AgentType.Topology,
            Objective = "Produce a topology proposal.",
        };

        AgentEvidencePackage evidence = new()
        {
            RunId = runId,
            RequestId = request.RequestId,
            SystemName = request.SystemName,
            Environment = request.Environment,
            CloudProvider = request.CloudProvider.ToString(),
            Request = new RequestEvidence { Description = request.Description },
        };

        await handler.ExecuteAsync(runId, request, evidence, task);

        completionClient.LastUserPrompt.Should().Contain("Reliability / Performance");
        completionClient.LastUserPrompt.Should().Contain("rel-base-001");
        completionClient.LastUserPrompt.Should().Contain("groundingMissing: false");
    }

    [Fact]
    public async Task Cost_ExecuteAsync_appends_finops_framed_policy_pack_block()
    {
        const string runId = AgentHandlerTestRunIds.Run001;
        const string costJson = """
                                {
                                  "resultId": "RES-COST-001",
                                  "taskId": "TASK-COST-001",
                                  "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                                  "agentType": "Cost",
                                  "claims": ["Right-size VMs."],
                                  "evidenceRefs": [],
                                  "confidence": 0.9,
                                  "findings": [],
                                  "proposedChanges": {
                                    "proposalId": "PROP-COST-001",
                                    "sourceAgent": "Cost",
                                    "addedServices": [],
                                    "addedDatastores": [],
                                    "addedRelationships": [],
                                    "requiredControls": [],
                                    "warnings": []
                                  },
                                  "createdUtc": "2026-03-15T14:00:00Z"
                                }
                                """;

        CapturingCompletionClient completionClient = new(costJson);
        Mock<ArchLucid.Core.Scoping.IScopeContextProvider> scopeProvider = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IRetrievalQueryService> retrieval = new();
        retrieval.Setup(r => r.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    ChunkId = "c-cost",
                    DocumentId = "policy-pack-rule-cost-opt-001",
                    CorpusKind = nameof(CorpusKind.PolicyPack),
                    SourceType = "PolicyPackRule",
                    SourceId = "cost-opt-001",
                    Title = "Right-size compute",
                    Text = "[finops v1.0.0] [Warning] Right-size compute (compute): Avoid oversized SKUs.",
                    Score = 0.87,
                },
            ]);

        Mock<IPolicyPackResolver> packResolver = new();
        packResolver.Setup(r => r.ResolveAsync(scope.TenantId, scope.WorkspaceId, scope.ProjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectivePolicyPackSet
            {
                Packs =
                [
                    new ResolvedPolicyPack
                    {
                        PolicyPackId = Guid.NewGuid(),
                        Name = "FinOps & Cloud Cost Optimization",
                        Version = "1.0.1",
                        PackType = "BuiltIn",
                        ContentJson = """{"metadata":{"rulePackId":"finops-vertical-v1"}}""",
                        QualityDimension = QualityDimension.CostEffectiveness,
                    },
                ],
            });

        CostRetailGroundingLookups lookups = new(
            new InMemoryAzureRetailPriceStructuredLookup(),
            new InMemoryAwsRetailPriceStructuredLookup(),
            new InMemoryGcpRetailPriceStructuredLookup());

        CostAgentHandler handler = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completionClient),
            SchemaRemediationCompletionClientTestFactory.Create(completionClient),
            new AgentResultParser(),
            new NoOpTraceRecorder(),
            AgentPromptCatalogTestFactory.Create(),
            new Mock<ArchLucid.Core.Audit.IAuditService>().Object,
            scopeProvider.Object,
            ComplianceAgentHandlerTestDependencies.CreateEmptyTechnologyLedgerRepository(),
            lookups,
            ComplianceAgentHandlerTestDependencies.CreatePolicyPackRetrievalAppender(
                scopeProvider.Object,
                retrieval.Object,
                policyPackResolver: packResolver.Object),
            ComplianceAgentHandlerTestDependencies.CreateNoOpGroundingTraceWriter(),
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<CostAgentHandler>.Instance);

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "EnterpriseRag",
            Description = "Estimate monthly spend.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        AgentTask task = new()
        {
            TaskId = "TASK-COST-001",
            RunId = runId,
            AgentType = AgentType.Cost,
            Objective = "Estimate cost.",
        };

        AgentEvidencePackage evidence = new()
        {
            RunId = runId,
            RequestId = request.RequestId,
            SystemName = request.SystemName,
            Environment = request.Environment,
            CloudProvider = request.CloudProvider.ToString(),
            Request = new RequestEvidence { Description = request.Description },
        };

        await handler.ExecuteAsync(runId, request, evidence, task);

        completionClient.LastUserPrompt.Should().Contain("Cost / FinOps");
        completionClient.LastUserPrompt.Should().Contain("cost-opt-001");
        completionClient.LastUserPrompt.Should().Contain("groundingMissing: false");
    }

    private sealed class CapturingCompletionClient(string json) : IAgentCompletionClient
    {
        public string? LastUserPrompt { get; private set; }

        public LlmProviderDescriptor Descriptor { get; } = LlmProviderDescriptor.ForOffline("capture", "test");

        public Task<string> CompleteJsonAsync(
            string systemPrompt,
            string userPrompt,
            int? maxTokens = null,
            float? temperature = null,
            CancellationToken cancellationToken = default)
        {
            LastUserPrompt = userPrompt;
            return Task.FromResult(json);
        }
    }
}
