using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
///     Guards the DX-55 pipeline wiring. <see cref="FindingsProseAssumptionStage" /> shipped registered in DI but
///     unreferenced by <see cref="FindingsOrchestrator" />, which made prose extraction unreachable at runtime even
///     with the flag on. These tests fail if the stage is dropped from the pipeline again.
/// </summary>
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
        // The stage runs before merge-and-gate, so an extracted finding must arrive carrying a gate verdict.
        // A finding appended after the gate would keep the default unscored classification.
        Finding contradiction = CreateProseContradictionFinding();
        StubProseAssumptionFindingGenerator generator = new([contradiction]);

        FindingsSnapshot snapshot = await RunOrchestratorAsync(generator);

        Finding emitted = snapshot.Findings.Single(finding => finding.FindingId == contradiction.FindingId);
        emitted.InsightDensityScore.Should().BeGreaterThan(0, "the gate must have scored the prose finding");
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
        return new Finding
        {
            FindingId = "prose-assumption-1",
            FindingType = "PolicyViolation",
            Category = "Security",
            EngineType = "declaration-premise-conflict",
            Title = "Design document states payments never leave the VNet; sql-pay allows public network access",
            Rationale = "Document assumption contradicts the inventory property on the matched resource.",
            Severity = FindingSeverity.Error,
            EvidenceRefs =
            [
                "doc:docs/design/payments.docx#L42",
            ],
        };
    }

    private sealed class StubProseAssumptionFindingGenerator(IReadOnlyList<Finding> findings)
        : IProseAssumptionFindingGenerator
    {
        private readonly IReadOnlyList<Finding> _findings = findings ?? throw new ArgumentNullException(nameof(findings));

        public int InvocationCount
        {
            get;
            private set;
        }

        public Task<IReadOnlyList<Finding>> GenerateAsync(
            GraphSnapshot graphSnapshot,
            FindingAnalysisContext? analysisContext,
            CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(graphSnapshot);
            cancellationToken.ThrowIfCancellationRequested();

            InvocationCount++;

            return Task.FromResult(_findings);
        }
    }
}
