using System.Text.Json;

using ArchLucid.Application.Agents.IaC;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Merge;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Llm;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Agents.IaC;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingIacStubGeneratorTests
{
    private const string TypedEmissionArmRef =
        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

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
                    EvidenceRefs = [TypedEmissionArmRef]
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

        string? persistedJson = null;
        Mock<IAgentResultEnrichmentRepository> enrichmentRepository = new();
        enrichmentRepository
            .Setup(r => r.UpsertEnrichedResultJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, string, CancellationToken>((_, json, _) => persistedJson = json)
            .Returns(Task.CompletedTask);

        FindingIacStubGenerator sut = CreateSut(
            completionClient.Object,
            resultRepository.Object,
            enrichmentRepository.Object);

        await sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        persistedJson.Should().NotBeNullOrWhiteSpace();

        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        persisted.Should().NotBeNull();
        ArchitectureFinding findingWithEvidence = persisted!.Findings.Single(f => f.FindingId == "finding-1");
        ArchitectureFinding findingWithoutEvidence = persisted.Findings.Single(f => f.FindingId == "finding-2");
        findingWithEvidence.IacStub.Should().NotBeNullOrWhiteSpace();
        findingWithEvidence.IacStub.Should().Contain("AI-generated stub");
        findingWithoutEvidence.IacStub.Should().BeNull();
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_skips_muted_findings_with_evidence_refs()
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
                    FindingId = "finding-muted",
                    Message = "Muted finding should not generate IaC.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = ["evidence-1"],
                    IsMuted = true,
                    MuteReason = "Operator muted."
                },
                new ArchitectureFinding
                {
                    FindingId = "finding-active",
                    Message = "Active finding should still generate IaC.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef]
                }
            ]
        };

        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Active finding should still generate IaC.", StringComparison.Ordinal)),
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

        FindingIacStubGenerator sut = CreateSut(
            completionClient.Object,
            resultRepository.Object,
            enrichmentRepository.Object);

        await sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        completionClient.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Muted finding should not generate IaC.", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Never);

        persistedJson.Should().NotBeNullOrWhiteSpace();
        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        persisted.Should().NotBeNull();
        persisted!.Findings.Single(f => f.FindingId == "finding-muted").IacStub.Should().BeNull();
        persisted.Findings.Single(f => f.FindingId == "finding-active").IacStub.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_skips_findings_muted_in_finding_records()
    {
        Guid runGuid = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid snapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        string runId = runGuid.ToString("N");

        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = runId,
            AgentType = AgentType.Topology,
            Findings =
            [
                new ArchitectureFinding
                {
                    FindingId = "finding-muted",
                    Message = "Relationally muted finding should not generate IaC.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef]
                },
                new ArchitectureFinding
                {
                    FindingId = "finding-active",
                    Message = "Active finding should still generate IaC.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef]
                }
            ]
        };

        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Active finding should still generate IaC.", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {}");

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([result]);

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(r => r.GetByRunIdAdminAsync(runGuid, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runGuid,
                FindingsSnapshotId = snapshotId
            });

        Mock<IFindingRecordMuteRepository> muteRepository = new();
        muteRepository
            .Setup(r => r.GetMuteFlagsAsync(snapshotId, It.IsAny<ScopeContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, FindingMuteFlag>
            {
                ["finding-muted"] = new FindingMuteFlag(true, "Operator muted.", null)
            });

        string? persistedJson = null;
        Mock<IAgentResultEnrichmentRepository> enrichmentRepository = new();
        enrichmentRepository
            .Setup(r => r.UpsertEnrichedResultJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Callback<string, string, CancellationToken>((_, json, _) => persistedJson = json)
            .Returns(Task.CompletedTask);

        FindingIacStubGenerator sut = CreateSut(
            completionClient.Object,
            resultRepository.Object,
            enrichmentRepository.Object,
            runRepository.Object,
            muteRepository.Object);

        await sut.GenerateAndPersistStubsForRunAsync(runId, CancellationToken.None);

        completionClient.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Relationally muted finding should not generate IaC.", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Never);

        persistedJson.Should().NotBeNullOrWhiteSpace();
        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        persisted.Should().NotBeNull();
        persisted!.Findings.Single(f => f.FindingId == "finding-muted").IacStub.Should().BeNull();
        persisted.Findings.Single(f => f.FindingId == "finding-active").IacStub.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_skips_findings_without_typed_emission_even_with_evidence_refs()
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
                    FindingId = "finding-prose-only",
                    Message = "Consider improving security.",
                    Category = "General",
                    Severity = FindingSeverity.Info,
                    EvidenceRefs = ["evidence-1"],
                },
                new ArchitectureFinding
                {
                    FindingId = "finding-typed",
                    Message = "Private endpoint required for storage.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs =
                    [
                        "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1",
                    ],
                },
            ],
        };

        AgentArchitectureFindingEmissionGate.HasTypedEmission(result.Findings[0]).Should().BeFalse();
        AgentArchitectureFindingEmissionGate.HasTypedEmission(result.Findings[1]).Should().BeTrue();

        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Private endpoint required", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {}");

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), "run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([result]);

        Mock<IAgentResultEnrichmentRepository> enrichmentRepository = new();
        enrichmentRepository
            .Setup(r => r.UpsertEnrichedResultJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        FindingIacStubGenerator sut = CreateSut(
            completionClient.Object,
            resultRepository.Object,
            enrichmentRepository.Object);

        await sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        completionClient.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Consider improving security.", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Never,
            "emission-withheld findings must not trigger IaC generation even when enrichment merge re-hydrates them into Findings");
    }

    private static FindingIacStubGenerator CreateSut(
        IAgentCompletionClient completionClient,
        IAgentResultRepository resultRepository,
        IAgentResultEnrichmentRepository enrichmentRepository,
        IRunRepository? runRepository = null,
        IFindingRecordMuteRepository? muteRepository = null)
    {
        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());

        return new FindingIacStubGenerator(
            completionClient,
            resultRepository,
            enrichmentRepository,
            runRepository ?? new Mock<IRunRepository>().Object,
            muteRepository ?? new Mock<IFindingRecordMuteRepository>().Object,
            scopeContextProvider.Object,
            NullLogger<FindingIacStubGenerator>.Instance);
    }
}
