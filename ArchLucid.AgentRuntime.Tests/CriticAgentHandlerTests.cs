using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
///     Tests for Critic Agent Handler.
/// </summary>
[Trait("Suite", "Core")]
public sealed class CriticAgentHandlerTests
{
    [SkippableFact]
    public async Task ExecuteAsync_ShouldReturnParsedCriticAgentResult()
    {
        const string runId = AgentHandlerTestRunIds.Run001;

        const string json = """
                            {
                              "resultId": "RES-CRITIC-001",
                              "taskId": "TASK-CRITIC-001",
                              "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                              "agentType": "Critic",
                              "claims": [
                                "The architecture should explicitly address observability.",
                                "Secret management should not remain implicit."
                              ],
                              "evidenceRefs": [
                                "critic-checklist",
                                "request"
                              ],
                              "confidence": 0.84,
                              "findings": [
                                {
                                  "findingId": "FIND-CRITIC-001",
                                  "sourceAgent": "Critic",
                                  "severity": "Warning",
                                  "category": "Critic",
                                  "message": "ObservabilityUnderSpecified",
                                  "evidenceRefs": [ "critic-checklist" ]
                                },
                                {
                                  "findingId": "FIND-CRITIC-002",
                                  "sourceAgent": "Critic",
                                  "severity": "Warning",
                                  "category": "Critic",
                                  "message": "SecretManagementUnderSpecified",
                                  "evidenceRefs": [ "critic-checklist" ]
                                }
                              ],
                              "proposedChanges": {
                                "proposalId": "PROP-CRITIC-001",
                                "sourceAgent": "Critic",
                                "addedServices": [],
                                "addedDatastores": [],
                                "addedRelationships": [],
                                "requiredControls": [
                                  "Diagnostic Logging"
                                ],
                                "warnings": [
                                  "Operational observability should be made explicit before production rollout."
                                ]
                              },
                              "createdUtc": "2026-03-15T14:10:00Z"
                            }
                            """;

        StubAgentCompletionClient completionClient = new(json);
        AgentResultParser parser = new();
        NoOpTraceRecorder traceRecorder = new();
        IAgentSystemPromptCatalog catalog = AgentPromptCatalogTestFactory.Create();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        CriticAgentHandler handler = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completionClient),
            SchemaRemediationCompletionClientTestFactory.Create(completionClient),
            parser,
            traceRecorder,
            catalog,
            audit.Object,
            scopeProvider.Object,
            AgentSchemaRemediationOptionsMonitorTestFactory.Create());

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-001",
            SystemName = "EnterpriseRag",
            Description = "Design a secure Azure RAG system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints =
            [
                "Private endpoints required",
                "Use managed identity"
            ],
            RequiredCapabilities =
            [
                "Azure AI Search",
                "SQL",
                "Managed Identity",
                "Private Networking"
            ]
        };

        AgentTask task = new()
        {
            TaskId = "TASK-CRITIC-001",
            RunId = runId,
            AgentType = AgentType.Critic,
            Objective = "Critique the architecture direction."
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
                Assumptions = request.Assumptions.ToList()
            }
        };

        AgentResult result = await handler.ExecuteAsync(runId, request, evidence, task);

        result.AgentType.Should().Be(AgentType.Critic);
        result.RunId.Should().Be(runId);
        result.TaskId.Should().Be("TASK-CRITIC-001");
        result.Findings.Should().Contain(f => f.Message == "ObservabilityUnderSpecified");
        result.Findings.Should().Contain(f => f.Message == "SecretManagementUnderSpecified");
        result.ProposedChanges.Should().NotBeNull();
        result.ProposedChanges!.RequiredControls.Should().Contain("Diagnostic Logging");
    }

    [SkippableFact]
    public async Task ExecuteAsync_WhenConstraintViolationInJson_ReturnsHighOrCriticalCriticFinding()
    {
        const string runId = AgentHandlerTestRunIds.Run002;

        const string json = """
                            {
                              "resultId": "RES-CRITIC-002",
                              "taskId": "TASK-CRITIC-002",
                              "runId": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                              "agentType": "Critic",
                              "claims": [
                                "Public internet exposure conflicts with the private-endpoints constraint."
                              ],
                              "evidenceRefs": [ "request", "critic-checklist" ],
                              "confidence": 0.91,
                              "findings": [
                                {
                                  "findingId": "FIND-CRITIC-CRIT-001",
                                  "sourceAgent": "Critic",
                                  "severity": "Critical",
                                  "category": "Critic",
                                  "message": "Topology proposes public App Service ingress but request constraint requires private endpoints only.",
                                  "evidenceRefs": [ "request" ]
                                }
                              ],
                              "proposedChanges": {
                                "proposalId": "PROP-CRITIC-002",
                                "sourceAgent": "Critic",
                                "addedServices": [],
                                "addedDatastores": [],
                                "addedRelationships": [],
                                "requiredControls": [],
                                "warnings": []
                              },
                              "createdUtc": "2026-03-15T14:20:00Z"
                            }
                            """;

        StubAgentCompletionClient completionClient = new(json);
        AgentResultParser parser = new();
        NoOpTraceRecorder traceRecorder = new();
        IAgentSystemPromptCatalog catalog = AgentPromptCatalogTestFactory.Create();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(
            new ScopeContext { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() });

        CriticAgentHandler handler = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completionClient),
            SchemaRemediationCompletionClientTestFactory.Create(completionClient),
            parser,
            traceRecorder,
            catalog,
            audit.Object,
            scopeProvider.Object,
            AgentSchemaRemediationOptionsMonitorTestFactory.Create());

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-002",
            SystemName = "PaymentsApi",
            Description = "Design a secure Azure API.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            Constraints = [ "Private endpoints required" ],
            RequiredCapabilities = [ "Azure App Service", "Private Networking" ]
        };

        AgentTask task = new()
        {
            TaskId = "TASK-CRITIC-002",
            RunId = runId,
            AgentType = AgentType.Critic,
            Objective = "Critique the architecture direction."
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
                Assumptions = request.Assumptions.ToList()
            }
        };

        AgentResult result = await handler.ExecuteAsync(runId, request, evidence, task);

        result.Findings.Should().Contain(f =>
            f.Category == "Critic"
            && (f.Severity == FindingSeverity.Critical || f.Severity == FindingSeverity.Error));
    }

    [SkippableFact]
    public void SystemPromptTemplate_RequiresAdversarialChallengeOfOtherAgents()
    {
        string prompt = CriticSystemPromptTemplate.GetText();

        prompt.Should().Contain("You MUST challenge the other agents' implied decisions");
        prompt.Should().Contain("Do NOT treat prior agent outputs as correct by default");
        prompt.Should().Contain("missing failure mode");
        prompt.Should().Contain("emit a \"Critical\" severity finding");
        prompt.Should().NotContain("Prefer conservative, review-oriented findings");
    }

    [SkippableFact]
    public void EmptyFindingsCriticOutput_DoesNotPassQualityGateWarnThreshold()
    {
        const string emptyFindingsJson = """
                                         {
                                           "resultId": "RES-CRITIC-EMPTY",
                                           "taskId": "TASK-CRITIC-001",
                                           "runId": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                                           "agentType": "Critic",
                                           "claims": [
                                             "Prior agents assumed private networking without evidence."
                                           ],
                                           "evidenceRefs": [ "request" ],
                                           "confidence": 0.9,
                                           "findings": [],
                                           "createdUtc": "2026-03-15T14:00:00Z"
                                         }
                                         """;

        HeuristicAgentOutputSemanticEvaluator semanticEvaluator = new();
        AgentOutputSemanticScore semantic =
            semanticEvaluator.Evaluate("trace-empty-critic", emptyFindingsJson, AgentType.Critic);

        AgentOutputEvaluator structuralEvaluator = new();
        AgentOutputEvaluationScore structural =
            structuralEvaluator.Evaluate("trace-empty-critic", emptyFindingsJson, AgentType.Critic);

        AgentOutputQualityGate gate = new(Options.Create(new AgentOutputQualityGateOptions()));
        AgentOutputQualityGateOutcome outcome = gate.Evaluate(structural, semantic);

        semantic.OverallSemanticScore.Should().BeLessThan(
            new AgentOutputQualityGateOptions().SemanticWarnBelow,
            because: "empty Critic findings must score below the default warn floor");

        outcome.Should().NotBe(
            AgentOutputQualityGateOutcome.Accepted,
            because: "empty Critic output is suspicious and must not pass the quality gate warn threshold");
    }
}
