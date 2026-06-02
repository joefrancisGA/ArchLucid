using ArchLucid.Application.Agents.IaC;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Llm;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using ArchLucid.Core.Scoping;
namespace ArchLucid.Application.Tests.Agents.IaC;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingIacStubGeneratorTests
{
    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_sets_stub_only_for_findings_with_evidence_refs()
    {
        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = "finding-1",
                    Message = "Use private endpoints.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = ["evidence-1"]
                },
                new ArchitectureFinding
                {
                    FindingId = "finding-2",
                    Message = "No evidence should skip generation.",
                    Category = "General",
                    Severity = FindingSeverity.Info,
                    EvidenceRefs = []
                }
            ]
        };

        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Use private endpoints.", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {}");

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), "run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([result]);

        List<AgentResult>? persisted = null;
        resultRepository
            .Setup(r => r.CreateManyAsync(It.IsAny<IReadOnlyList<AgentResult>>(), It.IsAny<CancellationToken>(), null, null))
            .Callback<IReadOnlyList<AgentResult>, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (rows, _, _, _) => persisted = rows.ToList())
            .Returns(Task.CompletedTask);

        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        FindingIacStubGenerator sut = new(
            completionClient.Object,
            resultRepository.Object,
            scopeContextProvider.Object,
            NullLogger<FindingIacStubGenerator>.Instance);

        await sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        persisted.Should().NotBeNull();
        persisted!.Should().ContainSingle();
        ArchitectureFinding findingWithEvidence = persisted[0].Findings.Single(f => f.FindingId == "finding-1");
        ArchitectureFinding findingWithoutEvidence = persisted[0].Findings.Single(f => f.FindingId == "finding-2");
        findingWithEvidence.IacStub.Should().NotBeNullOrWhiteSpace();
        findingWithoutEvidence.IacStub.Should().BeNull();
    }
}
