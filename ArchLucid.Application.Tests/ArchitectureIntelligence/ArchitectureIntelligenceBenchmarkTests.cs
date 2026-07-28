using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

public sealed class ArchitectureIntelligenceBenchmarkTests
{
    [Fact]
    [Trait("Category", "Unit")]
    public void GetHeldOutMicrocases_are_prefixed_and_not_in_visible_set()
    {
        ArchitectureIntelligenceBenchmark sut = new(new ExtractionFidelityBenchmark());

        IReadOnlyList<ExtractionFidelityCase> heldOut = sut.GetHeldOutMicrocases();
        IReadOnlyList<ExtractionFidelityCase> visible = sut.GetVisibleMicrocases();

        heldOut.Should().NotBeEmpty();
        heldOut.Should().OnlyContain(c => c.CaseId.StartsWith("holdout-", StringComparison.OrdinalIgnoreCase));
        visible.Select(c => c.CaseId).Should().NotIntersectWith(heldOut.Select(c => c.CaseId));
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void MutationChangesFindings_detects_recovery_objective_change()
    {
        ArchitectureIntelligenceBenchmark sut = new(new ExtractionFidelityBenchmark());
        SpecialistReviewService specialist = new();
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = Guid.NewGuid().ToString("N"),
            TenantId = Guid.NewGuid().ToString("N"),
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = Guid.NewGuid().ToString("N"),
                    Kind = ArchitectureElementKind.Component,
                    Name = "api",
                    ExtractionConfidence = 0.8,
                    Provenance = new ClaimProvenance
                    {
                        Origin = ClaimOrigin.DirectlyExtracted,
                        SupportStatus = SupportStatus.IndirectlySupported,
                        Confidence = 0.8
                    }
                }
            ]
        };

        BenchmarkMutation mutation = sut.GetMutationTests().First(m => m.MutationId == "mutate-rto-30m");

        bool changed = sut.MutationChangesFindings(model, mutation, specialist);

        changed.Should().BeTrue();
    }
}
