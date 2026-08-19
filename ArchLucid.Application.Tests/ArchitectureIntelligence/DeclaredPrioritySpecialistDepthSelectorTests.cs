using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class DeclaredPrioritySpecialistDepthSelectorTests
{
    [Fact]
    public void SelectDimensions_returns_baseline_when_no_priorities()
    {
        IReadOnlyList<QualityDimension> dimensions = DeclaredPrioritySpecialistDepthSelector.SelectDimensions([]);

        dimensions.Should().BeEquivalentTo(
        [
            QualityDimension.Cost,
            QualityDimension.Reliability,
            QualityDimension.Security,
        ]);
    }

    [Fact]
    public void SelectDimensions_adds_depth_for_security_first_priorities()
    {
        IReadOnlyList<QualityDimension> dimensions = DeclaredPrioritySpecialistDepthSelector.SelectDimensions(
            ["Security-first"]);

        dimensions.Should().Contain(QualityDimension.Security);
        dimensions.Should().Contain(QualityDimension.PrivacyCompliance);
        dimensions.Should().Contain(QualityDimension.AiSpecificRisk);
        dimensions.Count.Should().BeGreaterThan(3);
    }

    [Fact]
    public void SelectDimensions_adds_reliability_and_performance_depth()
    {
        IReadOnlyList<QualityDimension> dimensions = DeclaredPrioritySpecialistDepthSelector.SelectDimensions(
            ["Reliability", "Performance"]);

        dimensions.Should().Contain(QualityDimension.Reliability);
        dimensions.Should().Contain(QualityDimension.Operations);
        dimensions.Should().Contain(QualityDimension.PerformanceScalability);
    }
}
