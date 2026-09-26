using System.Text.Json;

using ArchLucid.Application.Agents.IaC;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Agents.IaC;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingIacStubGeneratorEnrichmentPreservationTests
{
    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_preserves_withheld_findings_in_enriched_json()
    {
        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Compliance,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = "finding-1",
                    Message = "Use private endpoints.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs =
                    [
                        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    ],
                },
            ],
            WithheldFindings =
            [
                new WithheldFindingSummary
                {
                    Title = "Prose-only gap",
                    Reason = WithheldFindingReasons.ProseOnlyEmission,
                },
            ],
        };

        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {}");

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), "run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([result]);

        string? persistedJson = null;
        Mock<IAgentResultEnrichmentRepository> enrichmentRepository = new();
        enrichmentRepository
            .Setup(r => r.UpsertEnrichedResultJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, string, CancellationToken>((_, json, _) => persistedJson = json)
            .Returns(Task.CompletedTask);

        FindingIacStubGenerator sut = new(
            completionClient.Object,
            resultRepository.Object,
            enrichmentRepository.Object,
            new Mock<IRunRepository>().Object,
            new Mock<IFindingRecordMuteRepository>().Object,
            CreateScopeProvider(),
            NullLogger<FindingIacStubGenerator>.Instance);

        await sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        persistedJson.Should().NotBeNullOrWhiteSpace();

        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        persisted.Should().NotBeNull();
        persisted!.WithheldFindings.Should().ContainSingle();
        persisted.WithheldFindings[0].Title.Should().Be("Prose-only gap");
        persisted.WithheldFindings[0].Reason.Should().Be(WithheldFindingReasons.ProseOnlyEmission);
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_preserves_proposed_evidence_json_in_enriched_json()
    {
        const string proposedJson = """{"type":"Policy","title":"Encrypt","description":"Use CMK.","rationale":"Gap"}""";

        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Compliance,
            ProposedEvidenceJson = proposedJson,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = "finding-1",
                    Message = "Use private endpoints.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs =
                    [
                        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    ],
                },
            ],
        };

        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {}");

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), "run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([result]);

        string? persistedJson = null;
        Mock<IAgentResultEnrichmentRepository> enrichmentRepository = new();
        enrichmentRepository
            .Setup(r => r.UpsertEnrichedResultJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, string, CancellationToken>((_, json, _) => persistedJson = json)
            .Returns(Task.CompletedTask);

        FindingIacStubGenerator sut = new(
            completionClient.Object,
            resultRepository.Object,
            enrichmentRepository.Object,
            new Mock<IRunRepository>().Object,
            new Mock<IFindingRecordMuteRepository>().Object,
            CreateScopeProvider(),
            NullLogger<FindingIacStubGenerator>.Instance);

        await sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        persistedJson.Should().NotBeNullOrWhiteSpace();

        using JsonDocument document = JsonDocument.Parse(persistedJson!);
        document.RootElement.GetProperty("proposedEvidenceJson").GetString().Should().Be(proposedJson);
    }

    private static IScopeContextProvider CreateScopeProvider()
    {
        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());
        return scopeContextProvider.Object;
    }
}
