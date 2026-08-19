using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class QuickScanSampleResultProviderTests
{
    [Fact]
    public void Build_returns_fixed_sample_without_visitor_content()
    {
        ArchitectureQuickScanResponse sample = QuickScanSampleResultProvider.Build();

        sample.IsSampleResult.Should().BeTrue();
        sample.SystemName.Should().Be("Claims intake API");
        sample.PrimaryEnvironment.Should().Be(QuickScanPrimaryEnvironment.Azure);
        sample.DemonstrationDisclaimer.Should().Be(QuickScanSampleResultProvider.DemonstrationDisclaimer);
        sample.Findings.Should().NotBeEmpty();
        sample.RecommendedNextSteps.Should().NotBeEmpty();
    }

    [Fact]
    public void Build_ignores_visitor_submission_labels()
    {
        ArchitectureQuickScanResponse sample = QuickScanSampleResultProvider.Build();

        sample.SystemName.Should().NotBe("Visitor secret system");
        sample.Summary.Should().NotContain("Visitor secret system");
    }
}
