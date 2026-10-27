using System.Text.Json;

using ArchLucid.Application.Analysis;
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
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-1",
                    Message = "Use private endpoints.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef]
                },
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
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
    public async Task GenerateAndPersistStubsForRunAsync_does_not_duplicate_disclaimer_when_llm_wraps_bicep_in_markdown_fence()
    {
        const string disclaimer = "// AI-generated stub — review before use";

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
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-1",
                    Message = "Use private endpoints.",
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
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                "```bicep\n"
                + disclaimer
                + "\nresource sa 'Microsoft.Storage/storageAccounts@2023-01-01' = {}\n```");

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

        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        string? stub = persisted!.Findings.Single().IacStub;

        stub.Should().StartWith(disclaimer);
        stub!.Split(disclaimer, StringSplitOptions.None).Should().HaveCount(2);
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_strips_utf8_bom_before_disclaimer_check()
    {
        const string disclaimer = "// AI-generated stub — review before use";

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
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-1",
                    Message = "Use private endpoints.",
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
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("\uFEFF" + disclaimer + "\nresource sa 'Microsoft.Storage/storageAccounts@2023-01-01' = {}");

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

        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        string? stub = persisted!.Findings.Single().IacStub;

        stub.Should().StartWith(disclaimer);
        stub!.Split(disclaimer, StringSplitOptions.None).Should().HaveCount(2);
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_unwraps_json_string_literal_completion_before_disclaimer_check()
    {
        const string disclaimer = "// AI-generated stub — review before use";

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
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-1",
                    Message = "Use private endpoints.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef]
                }
            ]
        };

        string innerStub = disclaimer + "\nresource sa 'Microsoft.Storage/storageAccounts@2023-01-01' = {}";
        string jsonLiteral = JsonSerializer.Serialize(innerStub);

        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(jsonLiteral);

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

        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        string? stub = persisted!.Findings.Single().IacStub;

        stub.Should().StartWith(disclaimer);
        stub!.Split(disclaimer, StringSplitOptions.None).Should().HaveCount(2);
        stub.Should().NotStartWith("\"");
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
                    SourceAgent = AgentType.Topology,
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
                    SourceAgent = AgentType.Topology,
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
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-muted",
                    Message = "Relationally muted finding should not generate IaC.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef]
                },
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
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
    public async Task GenerateAndPersistStubsForRunAsync_skips_relational_mute_lookup_when_run_id_is_not_a_guid()
    {
        const string runId = "opaque-demo-run-not-a-guid";

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
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-only-muted-in-snapshot",
                    Message = "Would be relationally muted when run id parses as GUID.",
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
                It.IsAny<string>(),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {}");

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([result]);

        Mock<IRunRepository> runRepository = new(MockBehavior.Strict);
        Mock<IFindingRecordMuteRepository> muteRepository = new(MockBehavior.Strict);

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
            enrichmentRepository.Object,
            runRepository.Object,
            muteRepository.Object);

        await sut.GenerateAndPersistStubsForRunAsync(runId, CancellationToken.None);

        completionClient.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Would be relationally muted", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
        runRepository.VerifyNoOtherCalls();
        muteRepository.VerifyNoOtherCalls();
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
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-prose-only",
                    Message = "Consider improving security.",
                    Category = "General",
                    Severity = FindingSeverity.Info,
                    EvidenceRefs = ["evidence-1"],
                },
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
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

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_clones_rows_when_result_agent_type_missing_but_findings_declare_source_agent()
    {
        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = "run-1",
            Findings =
            [
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-1",
                    Message = "Enable soft delete on storage.",
                    Category = "Storage",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef],
                },
            ],
        };

        result.AgentType.Should().Be(default(AgentType));

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

        FindingIacStubGenerator sut = CreateSut(
            completionClient.Object,
            resultRepository.Object,
            enrichmentRepository.Object);

        await sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        persistedJson.Should().NotBeNullOrWhiteSpace();
        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        persisted.Should().NotBeNull();
        persisted!.AgentType.Should().Be(AgentType.Topology);
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_clones_rows_when_findings_omit_source_agent()
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
                    Message = "Enable soft delete on storage.",
                    Category = "Storage",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef],
                },
            ],
        };

        result.Findings[0].SourceAgent.Should().Be(default(AgentType));

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

        Func<Task> act = () => sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_skips_null_finding_entries()
    {
        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            Findings =
            [
                null!,
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-1",
                    Message = "Use private endpoints.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef],
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

        FindingIacStubGenerator sut = CreateSut(
            completionClient.Object,
            resultRepository.Object,
            enrichmentRepository.Object);

        await sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        persistedJson.Should().NotBeNullOrWhiteSpace();
        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        persisted!.Findings.Should().HaveCount(2);
        persisted.Findings[1]!.IacStub.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_skips_null_result_entries()
    {
        AgentResult retained = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            Findings =
            [
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-1",
                    Message = "Use private endpoints.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef],
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
            .ReturnsAsync([null!, retained]);

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
        persisted!.Findings.Single().IacStub.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_tolerates_null_finding_slots_when_applying_relational_mutes()
    {
        Guid runGuid = Guid.Parse("55555555-5555-5555-5555-555555555555");
        Guid snapshotId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        string runId = runGuid.ToString("N");

        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = runId,
            AgentType = AgentType.Topology,
            Findings =
            [
                null!,
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-active",
                    Message = "Active finding should still generate IaC.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef]
                },
            ],
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

        persistedJson.Should().NotBeNullOrWhiteSpace();
        AgentResult? persisted = JsonSerializer.Deserialize<AgentResult>(persistedJson!, ContractJson.Default);
        persisted!.Findings.Should().ContainSingle();
        persisted.Findings[0].IacStub.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_tolerates_null_findings_when_applying_relational_mutes()
    {
        Guid runGuid = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid snapshotId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        string runId = runGuid.ToString("N");

        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = runId,
            AgentType = AgentType.Topology,
            Findings = null!,
        };

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

        Mock<IAgentResultEnrichmentRepository> enrichmentRepository = new();

        FindingIacStubGenerator sut = CreateSut(
            new Mock<IAgentCompletionClient>().Object,
            resultRepository.Object,
            enrichmentRepository.Object,
            runRepository.Object,
            muteRepository.Object);

        Func<Task> act = () => sut.GenerateAndPersistStubsForRunAsync(runId, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task GenerateAndPersistStubsForRunAsync_tolerates_null_findings_and_evidence_refs_on_deserialized_rows()
    {
        AgentResult result = new()
        {
            ResultId = "result-1",
            TaskId = "task-1",
            RunId = "run-1",
            AgentType = AgentType.Topology,
            Findings = null!,
        };

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), "run-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync([result]);

        Mock<IAgentResultEnrichmentRepository> enrichmentRepository = new();

        FindingIacStubGenerator sut = CreateSut(
            new Mock<IAgentCompletionClient>().Object,
            resultRepository.Object,
            enrichmentRepository.Object);

        Func<Task> act = () => sut.GenerateAndPersistStubsForRunAsync("run-1", CancellationToken.None);

        await act.Should().NotThrowAsync();

        enrichmentRepository.Verify(
            r => r.UpsertEnrichedResultJsonAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CompareQuality_GenerateAndPersistStubsForRunAsync_merges_agent_results_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("51515151-5151-5151-5151-515151515151");
        string canonicalRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runGuid.ToString());
        string legacyUpper = canonicalRunId.ToUpperInvariant();

        AgentResult legacyResult = new()
        {
            ResultId = "result-legacy",
            TaskId = "task-1",
            RunId = legacyUpper,
            AgentType = AgentType.Topology,
            Findings =
            [
                new ArchitectureFinding
                {
                    SourceAgent = AgentType.Topology,
                    FindingId = "finding-legacy",
                    Message = "Legacy-keyed finding needs IaC stub.",
                    Category = "Network",
                    Severity = FindingSeverity.Warning,
                    EvidenceRefs = [TypedEmissionArmRef],
                },
            ],
        };

        Mock<IAgentCompletionClient> completionClient = new();
        completionClient
            .Setup(c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Legacy-keyed finding needs IaC stub.", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync("resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {}");

        Mock<IAgentResultRepository> resultRepository = new();
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), canonicalRunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        resultRepository
            .Setup(r => r.GetByRunIdAsync(It.IsAny<ScopeContext>(), legacyUpper, It.IsAny<CancellationToken>()))
            .ReturnsAsync([legacyResult]);
        resultRepository
            .Setup(r => r.GetByRunIdAsync(
                It.IsAny<ScopeContext>(),
                It.Is<string>(id => id != canonicalRunId && id != legacyUpper),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

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

        await sut.GenerateAndPersistStubsForRunAsync(canonicalRunId, CancellationToken.None);

        persistedJson.Should().NotBeNullOrWhiteSpace();
        completionClient.Verify(
            c => c.CompleteJsonAsync(
                It.IsAny<string>(),
                It.Is<string>(prompt => prompt.Contains("Legacy-keyed finding needs IaC stub.", StringComparison.Ordinal)),
                null,
                null,
                It.IsAny<CancellationToken>()),
            Times.Once);
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
