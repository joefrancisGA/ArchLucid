using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.AgentRuntime.Prompts;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Retrieval.Pricing;

using FluentAssertions;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class CostAgentHandlerTests
{
    [SkippableFact]
    public async Task ExecuteAsync_appends_technology_ledger_section_when_repository_returns_rows()
    {
        const string runId = AgentHandlerTestRunIds.Run001;
        StubAgentCompletionClient completionClient = new("""{"resultId":"r1","taskId":"TASK-COST-LEDGER","runId":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","agentType":"Cost","claims":[],"evidenceRefs":[],"confidence":0.5,"findings":[],"proposedChanges":{"proposalId":"p1","sourceAgent":"Cost","addedServices":[],"addedDatastores":[],"addedRelationships":[],"requiredControls":[],"warnings":[]},"createdUtc":"2026-03-15T14:00:00Z"}""");
        ListCapturingAgentExecutionTraceRecorder traceRecorder = new();
        IAgentSystemPromptCatalog catalog = AgentPromptCatalogTestFactory.Create();
        Mock<IAuditService> audit = new();
        audit.Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        Mock<IScopeContextProvider> scopeProvider = new();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<ITechnologyLedgerRepository> ledgerRepository = new();
        ledgerRepository.Setup(r => r.GetByRunIdAsync(scope, runId, It.IsAny<CancellationToken>())).ReturnsAsync([
            new TechnologyLedgerEntry
            {
                RunId = runId,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Amazon Web Services",
                ProviderFamily = CloudProvider.Aws,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
        ]);
        CostRetailGroundingLookups lookups = new(
            new InMemoryAzureRetailPriceStructuredLookup(),
            new InMemoryAwsRetailPriceStructuredLookup(),
            new InMemoryGcpRetailPriceStructuredLookup());
        CostAgentHandler handler = new(
            AgentTierCompletionRouterTestFactory.CreatePassThrough(completionClient),
            SchemaRemediationCompletionClientTestFactory.Create(completionClient),
            new AgentResultParser(),
            traceRecorder,
            catalog,
            audit.Object,
            scopeProvider.Object,
            ledgerRepository.Object,
            lookups,
            ComplianceAgentHandlerTestDependencies.CreateNoOpGroundingTraceWriter(),
            AgentSchemaRemediationOptionsMonitorTestFactory.Create(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<CostAgentHandler>.Instance);
        ArchitectureRequest request = new()
        {
            RequestId = "REQ-LEDGER",
            SystemName = "EnterpriseRag",
            Description = "Design a secure Azure RAG system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
        };
        AgentTask task = new() { TaskId = "TASK-COST-LEDGER", RunId = runId, AgentType = AgentType.Cost, Objective = "Estimate cost." };
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

        traceRecorder.Calls[^1].UserPrompt.Should().Contain("Technology Ledger (canonical baseline for this run):");
        traceRecorder.Calls[^1].UserPrompt.Should().Contain("CloudPlatform");
        traceRecorder.Calls[^1].SystemPrompt.Should().Contain("Savings Plans");
    }
}
