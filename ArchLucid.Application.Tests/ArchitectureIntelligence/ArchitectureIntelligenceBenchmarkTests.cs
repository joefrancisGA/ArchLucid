using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Xunit;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
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

    [Fact]
    [Trait("Category", "Unit")]
    public void MutationChangesFindings_detects_authentication_evidence_change()
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
                    Kind = ArchitectureElementKind.Interface,
                    Name = "public HTTPS API",
                    ExtractionConfidence = 0.9,
                    Provenance = new ClaimProvenance
                    {
                        Origin = ClaimOrigin.DirectlyExtracted,
                        SupportStatus = SupportStatus.DirectlyEstablished,
                        Confidence = 0.9
                    }
                }
            ]
        };

        BenchmarkMutation mutation = sut.GetMutationTests().First(m => m.MutationId == "mutate-add-authentication");

        bool changed = sut.MutationChangesFindings(model, mutation, specialist);

        changed.Should().BeTrue();
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void MutationChangesFindings_detects_replication_removal()
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
                    Kind = ArchitectureElementKind.RecoveryObjective,
                    Name = "RTO 30 minutes",
                    Description = "RTO is 30 minutes",
                    ExtractionConfidence = 0.9,
                    Provenance = new ClaimProvenance
                    {
                        Origin = ClaimOrigin.DirectlyExtracted,
                        SupportStatus = SupportStatus.DirectlyEstablished,
                        Confidence = 0.9
                    }
                },
                new ArchitectureModelElement
                {
                    ElementId = Guid.NewGuid().ToString("N"),
                    Kind = ArchitectureElementKind.Evidence,
                    Name = "backup replication every 15 minutes",
                    Description = "geo-replication interval 15m",
                    ExtractionConfidence = 0.9,
                    Provenance = new ClaimProvenance
                    {
                        Origin = ClaimOrigin.DirectlyExtracted,
                        SupportStatus = SupportStatus.DirectlyEstablished,
                        Confidence = 0.9
                    }
                },
                new ArchitectureModelElement
                {
                    ElementId = Guid.NewGuid().ToString("N"),
                    Kind = ArchitectureElementKind.Component,
                    Name = "database",
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

        BenchmarkMutation mutation = sut.GetMutationTests().First(m => m.MutationId == "mutate-remove-replication");

        bool changed = sut.MutationChangesFindings(model, mutation, specialist);

        changed.Should().BeTrue();
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void GetDeepCases_includes_golden_incomplete_fixture()
    {
        ArchitectureIntelligenceBenchmark sut = new(new ExtractionFidelityBenchmark());

        IReadOnlyList<ArchitectureIntelligenceDeepCase> deepCases = sut.GetDeepCases();

        deepCases.Should().HaveCountGreaterThanOrEqualTo(8);
        deepCases.Should().Contain(deepCase =>
            deepCase.CaseId == GoldenIncompleteArchitectureFixture.DeepCaseId
            && deepCase.PlantedDefects.Count >= 3);
        deepCases.Should().OnlyContain(deepCase => deepCase.PlantedDefects.Count >= 1);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public void ScoreCategories_returns_four_categories()
    {
        ArchitectureIntelligenceBenchmark sut = new(new ExtractionFidelityBenchmark());
        ArchitectureKnowledgeModel model = new()
        {
            ModelId = "m1",
            TenantId = "t1",
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "c1",
                    Kind = ArchitectureElementKind.Component,
                    Name = "api",
                },
            ],
        };

        IReadOnlyList<CategoryBenchmarkScore> scores = sut.ScoreCategories(
            model,
            findings: [],
            recommendations: [],
            plantedDefectRecall: 0.5,
            mutationChangedFindings: true);

        scores.Should().HaveCount(4);
        scores.Select(score => score.Category).Should().Contain(BenchmarkScoreCategory.Review);
    }
}
