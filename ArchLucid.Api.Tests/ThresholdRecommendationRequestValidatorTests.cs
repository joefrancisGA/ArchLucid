using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Alerts.Tuning;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ThresholdRecommendationRequestValidatorTests
{
    private readonly ThresholdRecommendationRequestValidator _validator = new();

    [Fact]
    public void Valid_request_passes()
    {
        ThresholdRecommendationRequest request = new()
        {
            RuleKind = "Simple",
            TunedMetricType = "finding_count",
            CandidateThresholds = [1m, 2m],
            RecentRunCount = 5,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Empty_candidate_thresholds_fails()
    {
        ThresholdRecommendationRequest request = new()
        {
            RuleKind = "Simple",
            TunedMetricType = "finding_count",
            CandidateThresholds = [],
            RecentRunCount = 1,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.ErrorMessage.Contains("candidate threshold", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Zero_recent_run_count_fails()
    {
        ThresholdRecommendationRequest request = new()
        {
            RuleKind = "Simple",
            TunedMetricType = "finding_count",
            CandidateThresholds = [1m],
            RecentRunCount = 0,
        };

        ValidationResult result = _validator.Validate(request);

        result.IsValid.Should().BeFalse();
    }
}
