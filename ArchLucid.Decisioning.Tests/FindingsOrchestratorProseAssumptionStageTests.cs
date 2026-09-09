using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsOrchestratorProseAssumptionStageTests
{
    private static readonly IInsightDensityGate InsightDensityGate = DeterministicInsightDensityGate.CreateDefault();

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_invokes_prose_assumption_generator()
    {
        StubProseAssumptionFindingGenerator generator = new([]);

        FindingsSnapshot snapshot = await RunOrchestratorAsync(generator);

        generator.InvocationCount.Should().Be(1, "the orchestrator must call the prose assumption stage");
        snapshot.Should().NotBeNull();
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_prose_assumption_findings_reach_the_snapshot()
    {
        Finding contradiction = CreateProseContradictionFinding();
        StubProseAssumptionFindingGenerator generator = new([contradiction]);

        FindingsSnapshot snapshot = await RunOrchestratorAsync(generator);

        snapshot.Findings.Should().ContainSingle(finding => finding.FindingId == contradiction.FindingId);
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_prose_assumption_findings_are_scored_by_the_density_gate()
    {
        Finding contradiction = CreateProseContradictionFinding();
        StubProseAssumptionFindingGenerator generator = new([contradiction]);

        FindingsSnapshot snapshot = await RunOrchestratorAsync(generator);

        Finding emitted = snapshot.Findings.Single(finding => finding.FindingId == contradiction.FindingId);
        emitted.InsightDensityScore.Should().BeGreaterThan(0, "the gate must have scored the prose finding");
    }

    [Fact]
    public async Task GenerateFindingsSnapshotAsync_persists_prose_assumption_register_on_snapshot()
    {
        ProseAssumptionRegisterEntry registerEntry = new()
        {
            Statement = "The storage account must not be public.",
            DocumentPath = "architecture.md",
            LineNumber = 1,
            EvidenceRef = "doc:architecture.md#L1",
            LogicalPropertyName = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
            Disposition = ProseAssumptionDisposition.Consistent,
        };

        StubProseAssumptionFindingGenerator generator = new([], [registerEntry]);

        FindingsSnapshot snapshot = await RunOrchestratorAsync(generator);

        snapshot.InsightDensityCuration?.ProseAssumptionRegisterEntries.Should().ContainSingle()
            .Which.Disposition.Should().Be(ProseAssumptionDisposition.Consistent);
    }

    private static async Task<FindingsSnapshot> RunOrchestratorAsync(
        IProseAssumptionFindingGenerator proseAssumptionFindingGenerator)
    {
        Mock<IFindingPayloadValidator> validator = new();
        validator.Setup(v => v.Validate(It.IsAny<Finding>()));

        FindingsOrchestrator orchestrator = FindingsOrchestratorComposer.Compose(
            [],
            validator.Object,
            Options.Create(new HumanReviewFindingOptions()),
            InsightDensityGate,
            proseAssumptionFindingGenerator: proseAssumptionFindingGenerator);

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
        };

        return await orchestrator.GenerateFindingsSnapshotAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            graph,
            CancellationToken.None);
    }

    private static Finding CreateProseContradictionFinding()
    {
        const string graphNodeId = "storage-1";
        const string inventoryResourceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stpayprod";

        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingId = "prose-assumption-1",
            FindingType = "DeclarationPremiseConflictFinding",
            Category = "Security",
            EngineType = "declaration-premise-conflict",
            Title = "stpayprod prose assumption contradicts live inventory (publicNetworkAccess=Enabled)",
            Rationale =
                "In-batch prose states \"must not be public\" while scoped Azure inventory reports "
                + "'publicNetworkAccess' as 'Enabled'.",
            Severity = FindingSeverity.Warning,
            RelatedNodeIds = [graphNodeId],
            EvidenceRefs =
            [
                "doc:docs/design/payments.docx#L42",
                inventoryResourceId,
            ],
            PayloadType = nameof(DeclarationPremiseConflictFindingPayload),
            Payload = new DeclarationPremiseConflictFindingPayload
            {
                ConflictKind = "prose-inventory-contradiction",
                DeclarationPropertyKey = DeclarationSecurityPropertyLogicalNames.PublicNetworkAccess,
                DeclarationPropertyValue = "Disabled",
                IntentNodeId = graphNodeId,
                IntentRequirementText = "The storage account must not be public.",
                IsNarrowApplicability = false,
                TopologyNodeId = graphNodeId,
                Source = "prose-assumption",
            },
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [graphNodeId],
                RulesApplied = ["declaration-premise-conflict", "prose-assumption"],
                DecisionsTaken =
                [
                    "Compared mapped prose assumption to inventory row properties for the same resource identifier.",
                ],
                Notes =
                [
                    "doc:docs/design/payments.docx#L42",
                    $"evidence:inventory:{inventoryResourceId}",
                    $"evidence:graph-node:{graphNodeId}",
                ],
            },
        };
    }

    private sealed class StubProseAssumptionFindingGenerator(
        IReadOnlyList<Finding> findings,
        IReadOnlyList<ProseAssumptionRegisterEntry>? registerEntries = null)
        : IProseAssumptionFindingGenerator
    {
        private readonly IReadOnlyList<Finding> _findings = findings ?? throw new ArgumentNullException(nameof(findings));

        private readonly IReadOnlyList<ProseAssumptionRegisterEntry> _registerEntries =
            registerEntries ?? [];

        public int InvocationCount
        {
            get;
            private set;
        }

        public Task<ProseAssumptionGenerationResult> GenerateAsync(
            GraphSnapshot graphSnapshot,
            FindingAnalysisContext? analysisContext,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(graphSnapshot);
            cancellationToken.ThrowIfCancellationRequested();

            InvocationCount++;

            return Task.FromResult(new ProseAssumptionGenerationResult(_findings, _registerEntries));
        }
    }
}
