using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.AgentRuntime.Tests;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class ComplianceAgentHandlerRetrievalTests
{
    [Fact]
    public async Task ExecuteAsync_prepends_retrieved_policy_pack_rule_to_prompt()
    {
        const string runId = AgentHandlerTestRunIds.Run001;
        const string complianceJson = """
                                      {
                                        "resultId": "RES-COMP-001",
                                        "taskId": "TASK-COMP-001",
                                        "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                                        "agentType": "Compliance",
                                        "claims": ["Managed identity is required."],
                                        "evidenceRefs": [],
                                        "confidence": 0.95,
                                        "findings": [],
                                        "proposedChanges": {
                                          "proposalId": "PROP-COMP-001",
                                          "sourceAgent": "Compliance",
                                          "addedServices": [],
                                          "addedDatastores": [],
                                          "addedRelationships": [],
                                          "requiredControls": ["Managed Identity"],
                                          "warnings": []
                                        },
                                        "createdUtc": "2026-03-15T14:05:00Z"
                                      }
                                      """;

        CapturingCompletionClient completionClient = new(complianceJson);
        AgentResultParser parser = new();
        NoOpTraceRecorder traceRecorder = new();
        IAgentSystemPromptCatalog catalog = AgentPromptCatalogTestFactory.Create();
        Mock<ArchLucid.Core.Audit.IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<ArchLucid.Core.Audit.AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
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
                    ChunkId = "c1",
                    DocumentId = "policy-pack-rule-saas-vertical-v1-saas-ctrl-002",
                    CorpusKind = nameof(CorpusKind.PolicyPack),
                    SourceType = "PolicyPackRule",
                    SourceId = "saas-ctrl-002",
                    Title = "Encryption control",
                    Text = "[saas-vertical-v1 v1.0.0] [Error] Encryption (encryption): Encrypt data.",
                    Score = 0.9,
                },
            ]);

        ComplianceAgentHandler handler = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completionClient),
            SchemaRemediationCompletionClientTestFactory.Create(completionClient),
            parser,
            traceRecorder,
            catalog,
            audit.Object,
            scopeProvider.Object,
            retrieval.Object,
            ComplianceAgentHandlerTestDependencies.CreateCitationFormatter(),
            ComplianceAgentHandlerTestDependencies.CreateNoOpGroundingTraceWriter(),
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(),
            ComplianceAgentHandlerTestDependencies.CreateNullLogger());

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "EnterpriseRag",
            Description = "Design a secure Azure RAG system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        AgentTask task = new()
        {
            TaskId = "TASK-COMP-001",
            RunId = runId,
            AgentType = AgentType.Compliance,
            Objective = "Produce a compliance proposal.",
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

        completionClient.LastUserPrompt.Should().Contain("saas-ctrl-002");
        completionClient.LastUserPrompt.Should().Contain("Policy Pack Controls");
        completionClient.LastUserPrompt.Should().Contain("groundingMissing: false");
        completionClient.LastUserPrompt.Should().Contain("Encrypt data.");
    }

    [Fact]
    public async Task ExecuteAsync_sets_groundingMissing_when_policy_pack_retrieval_returns_no_hits()
    {
        const string runId = AgentHandlerTestRunIds.Run001;
        const string complianceJson = """
                                      {
                                        "resultId": "RES-COMP-001",
                                        "taskId": "TASK-COMP-001",
                                        "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                                        "agentType": "Compliance",
                                        "claims": ["Managed identity is required."],
                                        "evidenceRefs": [],
                                        "confidence": 0.95,
                                        "findings": [],
                                        "proposedChanges": {
                                          "proposalId": "PROP-COMP-001",
                                          "sourceAgent": "Compliance",
                                          "addedServices": [],
                                          "addedDatastores": [],
                                          "addedRelationships": [],
                                          "requiredControls": ["Managed Identity"],
                                          "warnings": []
                                        },
                                        "createdUtc": "2026-03-15T14:05:00Z"
                                      }
                                      """;

        CapturingCompletionClient completionClient = new(complianceJson);
        AgentResultParser parser = new();
        NoOpTraceRecorder traceRecorder = new();
        IAgentSystemPromptCatalog catalog = AgentPromptCatalogTestFactory.Create();
        Mock<ArchLucid.Core.Audit.IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<ArchLucid.Core.Audit.AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
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
            .ReturnsAsync(Array.Empty<RetrievalHit>());

        ComplianceAgentHandler handler = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completionClient),
            SchemaRemediationCompletionClientTestFactory.Create(completionClient),
            parser,
            traceRecorder,
            catalog,
            audit.Object,
            scopeProvider.Object,
            retrieval.Object,
            ComplianceAgentHandlerTestDependencies.CreateCitationFormatter(),
            ComplianceAgentHandlerTestDependencies.CreateNoOpGroundingTraceWriter(),
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(),
            ComplianceAgentHandlerTestDependencies.CreateNullLogger());

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "EnterpriseRag",
            Description = "Design a secure Azure RAG system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        AgentTask task = new()
        {
            TaskId = "TASK-COMP-001",
            RunId = runId,
            AgentType = AgentType.Compliance,
            Objective = "Produce a compliance proposal.",
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

        completionClient.LastUserPrompt.Should().Contain("groundingMissing: true");
        completionClient.LastUserPrompt.Should().Contain("none retrieved — grounding unavailable");
    }

    [Fact]
    public async Task ExecuteAsync_persists_retrieval_grounding_trace_when_hits_exist()
    {
        const string runId = AgentHandlerTestRunIds.Run001;
        const string complianceJson = """
                                      {
                                        "resultId": "RES-COMP-001",
                                        "taskId": "TASK-COMP-001",
                                        "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                                        "agentType": "Compliance",
                                        "claims": ["Managed identity is required."],
                                        "evidenceRefs": [],
                                        "confidence": 0.95,
                                        "findings": [],
                                        "proposedChanges": {
                                          "proposalId": "PROP-COMP-001",
                                          "sourceAgent": "Compliance",
                                          "addedServices": [],
                                          "addedDatastores": [],
                                          "addedRelationships": [],
                                          "requiredControls": ["Managed Identity"],
                                          "warnings": []
                                        },
                                        "createdUtc": "2026-03-15T14:05:00Z"
                                      }
                                      """;

        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid parsedRunId = Guid.Parse("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

        CapturingCompletionClient completionClient = new(complianceJson);
        AgentResultParser parser = new();
        NoOpTraceRecorder traceRecorder = new();
        IAgentSystemPromptCatalog catalog = AgentPromptCatalogTestFactory.Create();
        Mock<ArchLucid.Core.Audit.IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<ArchLucid.Core.Audit.AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<ArchLucid.Core.Scoping.IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ArchLucid.Core.Scoping.ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
            });

        Mock<IRetrievalQueryService> retrieval = new();
        retrieval.Setup(r => r.SearchAsync(It.IsAny<RetrievalQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalHit
                {
                    ChunkId = "c1",
                    DocumentId = "policy-pack-rule-saas-vertical-v1-saas-ctrl-002",
                    CorpusKind = nameof(CorpusKind.PolicyPack),
                    SourceType = "PolicyPackRule",
                    SourceId = "saas-ctrl-002",
                    Title = "Encryption control",
                    Text = "[saas-vertical-v1 v1.0.0] [Error] Encryption (encryption): Encrypt data.",
                    Score = 0.9,
                },
            ]);

        Mock<IRetrievalGroundingTraceWriter> groundingTraceWriter = new();
        groundingTraceWriter
            .Setup(w => w.AppendAsync(It.IsAny<RetrievalGroundingTraceInsert>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ComplianceAgentHandler handler = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completionClient),
            SchemaRemediationCompletionClientTestFactory.Create(completionClient),
            parser,
            traceRecorder,
            catalog,
            audit.Object,
            scopeProvider.Object,
            retrieval.Object,
            ComplianceAgentHandlerTestDependencies.CreateCitationFormatter(),
            groundingTraceWriter.Object,
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(),
            ComplianceAgentHandlerTestDependencies.CreateNullLogger());

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "EnterpriseRag",
            Description = "Design a secure Azure RAG system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };

        AgentTask task = new()
        {
            TaskId = "TASK-COMP-001",
            RunId = runId,
            AgentType = AgentType.Compliance,
            Objective = "Produce a compliance proposal.",
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

        groundingTraceWriter.Verify(
            w => w.AppendAsync(
                It.Is<RetrievalGroundingTraceInsert>(insert =>
                    insert.TenantId == tenantId
                    && insert.WorkspaceId == workspaceId
                    && insert.ProjectId == projectId
                    && insert.RunId == parsedRunId
                    && insert.AgentName == AgentType.Compliance.ToString()
                    && insert.RetrievedChunkIds.Contains("c1")
                    && insert.TopK == 6
                    && !string.IsNullOrWhiteSpace(insert.QueryText)),
                It.IsAny<CancellationToken>()),
            Times.Once);
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
