using ArchLucid.Application.Analysis;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class ComparisonDriftAnalyzerTests
{
    [Fact]
    public void CompareQuality_Analyze_does_not_pair_existing_array_element_when_membership_grows()
    {
        ComparisonDriftAnalyzer sut = new();

        DriftAnalysisResult result = sut.Analyze(
            new DriftListPayload { Labels = ["beta"] },
            new DriftListPayload { Labels = ["alpha", "beta"] });

        result.DriftDetected.Should().BeTrue();
        result.Items.Should().ContainSingle(item => item.Category == "ArrayLength" && item.Path == "$.Labels");
        result.Items.Should().ContainSingle(item =>
            item.Category == "Added"
            && item.Path == "$.Labels"
            && item.StoredValue == null
            && item.RegeneratedValue == "alpha");
        result.Items.Should().NotContain(item => item.Category == "ValueChange");
    }

    [Fact]
    public void CompareQuality_Analyze_reports_value_change_when_array_length_stays_the_same()
    {
        DriftAnalysisResult result = new ComparisonDriftAnalyzer().Analyze(
            new DriftListPayload { Labels = ["alpha"] },
            new DriftListPayload { Labels = ["beta"] });

        result.Items.Should().ContainSingle(item =>
            item.Category == "ValueChange"
            && item.Path == "$.Labels[0]"
            && item.StoredValue == "alpha"
            && item.RegeneratedValue == "beta");
    }

    [Fact]
    public void CompareQuality_Analyze_ignores_array_order_when_membership_matches()
    {
        DriftAnalysisResult result = new ComparisonDriftAnalyzer().Analyze(
            new DriftListPayload { Labels = ["beta", "alpha"] },
            new DriftListPayload { Labels = ["alpha", "beta"] });

        result.DriftDetected.Should().BeFalse();
        result.Items.Should().BeEmpty();
    }

    private sealed class DriftListPayload
    {
        public List<string> Labels { get; init; } = [];
    }
}
