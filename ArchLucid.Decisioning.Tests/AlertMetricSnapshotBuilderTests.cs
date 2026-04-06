using ArchLucid.Core.Comparison;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Models;
using ArchLucid.Decisioning.Advisory.Workflow;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// Unit tests for <see cref="AlertMetricSnapshotBuilder"/>: one cluster per metric, each
/// covering the null/empty guard and at least one value-producing path.
/// </summary>
[Trait("Category", "Unit")]
public sealed class AlertMetricSnapshotBuilderTests
{
    private readonly AlertMetricSnapshotBuilder _sut = new();

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private static AlertEvaluationContext EmptyContext() => new();

    // ──────────────────────────────────────────────────────────────────────────
    // CriticalRecommendationCount
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Build_NullPlan_CriticalCountIsZero()
    {
        AlertMetricSnapshot snap = _sut.Build(EmptyContext());

        snap.CriticalRecommendationCount.Should().Be(0);
    }

    [Fact]
    public void Build_MixedUrgencies_CountsOnlyCriticalAndHigh()
    {
        AlertEvaluationContext ctx = EmptyContext();
        ctx.ImprovementPlan = new ImprovementPlan
        {
            Recommendations =
            [
                new ImprovementRecommendation { Urgency = AlertUrgencies.Critical },
                new ImprovementRecommendation { Urgency = AlertUrgencies.High },
                new ImprovementRecommendation { Urgency = "Low" },
                new ImprovementRecommendation { Urgency = "Medium" }
            ]
        };

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.CriticalRecommendationCount.Should().Be(2);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // NewComplianceGapCount
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Build_NullComparison_ComplianceGapCountIsZero()
    {
        AlertMetricSnapshot snap = _sut.Build(EmptyContext());

        snap.NewComplianceGapCount.Should().Be(0);
    }

    [Fact]
    public void Build_ThreeSecurityDeltas_ComplianceGapCountIsThree()
    {
        AlertEvaluationContext ctx = EmptyContext();
        ctx.ComparisonResult = new ComparisonResult
        {
            SecurityChanges =
            [
                new SecurityDelta { ControlName = "a" },
                new SecurityDelta { ControlName = "b" },
                new SecurityDelta { ControlName = "c" }
            ]
        };

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.NewComplianceGapCount.Should().Be(3);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // CostIncreasePercent
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Build_NoCostDelta_CostIncreasePercentIsZero()
    {
        AlertMetricSnapshot snap = _sut.Build(EmptyContext());

        snap.CostIncreasePercent.Should().Be(0);
    }

    [Fact]
    public void Build_ZeroBaseCost_CostIncreasePercentIsZero()
    {
        AlertEvaluationContext ctx = EmptyContext();
        ctx.ComparisonResult = new ComparisonResult
        {
            CostChanges = [new CostDelta { BaseCost = 0m, TargetCost = 100m }]
        };

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.CostIncreasePercent.Should().Be(0);
    }

    [Fact]
    public void Build_ValidCostDelta_CorrectPercentComputed()
    {
        // (120 - 100) / 100 * 100 = 20 %
        AlertEvaluationContext ctx = EmptyContext();
        ctx.ComparisonResult = new ComparisonResult
        {
            CostChanges = [new CostDelta { BaseCost = 100m, TargetCost = 120m }]
        };

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.CostIncreasePercent.Should().Be(20m);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DeferredHighPriorityRecommendationCount
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Build_DeferredLowPriority_NotCounted()
    {
        AlertEvaluationContext ctx = EmptyContext();
        ctx.RecommendationRecords =
        [
            new RecommendationRecord
            {
                Status = RecommendationStatus.Deferred,
                PriorityScore = 50, // below 80
                Title = "low-pri",
                RecommendationId = Guid.NewGuid()
            }
        ];

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.DeferredHighPriorityRecommendationCount.Should().Be(0);
    }

    [Fact]
    public void Build_DeferredHighPriority_Counted()
    {
        AlertEvaluationContext ctx = EmptyContext();
        ctx.RecommendationRecords =
        [
            new RecommendationRecord
            {
                Status = RecommendationStatus.Deferred,
                PriorityScore = 85,
                Title = "high-pri",
                RecommendationId = Guid.NewGuid()
            }
        ];

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.DeferredHighPriorityRecommendationCount.Should().Be(1);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // RejectedSecurityRecommendationCount
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Build_RejectedNonSecurity_NotCounted()
    {
        AlertEvaluationContext ctx = EmptyContext();
        ctx.RecommendationRecords =
        [
            new RecommendationRecord
            {
                Status = RecommendationStatus.Rejected,
                Category = "Cost",
                Title = "cost rec",
                RecommendationId = Guid.NewGuid()
            }
        ];

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.RejectedSecurityRecommendationCount.Should().Be(0);
    }

    [Fact]
    public void Build_RejectedSecurity_Counted()
    {
        AlertEvaluationContext ctx = EmptyContext();
        ctx.RecommendationRecords =
        [
            new RecommendationRecord
            {
                Status = RecommendationStatus.Rejected,
                Category = AlertCategories.Security,
                Title = "mfa rec",
                RecommendationId = Guid.NewGuid()
            }
        ];

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.RejectedSecurityRecommendationCount.Should().Be(1);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // AcceptanceRatePercent
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public void Build_NullLearningProfile_AcceptanceRateIsZero()
    {
        AlertMetricSnapshot snap = _sut.Build(EmptyContext());

        snap.AcceptanceRatePercent.Should().Be(0);
    }

    [Fact]
    public void Build_ZeroProposed_AcceptanceRateIsZero()
    {
        AlertEvaluationContext ctx = EmptyContext();
        ctx.LearningProfile = new RecommendationLearningProfile
        {
            CategoryStats = [new RecommendationOutcomeStats { ProposedCount = 0, AcceptedCount = 0 }]
        };

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.AcceptanceRatePercent.Should().Be(0);
    }

    [Fact]
    public void Build_TypicalProfile_AcceptanceRatePercentCorrect()
    {
        // 4 accepted out of 10 proposed = 40 %
        AlertEvaluationContext ctx = EmptyContext();
        ctx.LearningProfile = new RecommendationLearningProfile
        {
            CategoryStats =
            [
                new RecommendationOutcomeStats { ProposedCount = 6, AcceptedCount = 2 },
                new RecommendationOutcomeStats { ProposedCount = 4, AcceptedCount = 2 }
            ]
        };

        AlertMetricSnapshot snap = _sut.Build(ctx);

        snap.AcceptanceRatePercent.Should().Be(40m);
    }
}
