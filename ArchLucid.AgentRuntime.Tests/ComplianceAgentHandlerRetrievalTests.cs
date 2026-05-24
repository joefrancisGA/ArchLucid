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
            parser,
            traceRecorder,
            catalog,
            audit.Object,
            scopeProvider.Object,
            retrieval.Object,
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
