using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingInspectReadModelMapperTests
{
    [Theory]
    [InlineData(null, FindingSeverity.Info)]
    [InlineData("", FindingSeverity.Info)]
    [InlineData("  ", FindingSeverity.Info)]
    [InlineData("  critical  ", FindingSeverity.Critical)]
    [InlineData("critical", FindingSeverity.Critical)]
    [InlineData("UNKNOWN", FindingSeverity.Info)]
    [InlineData("999", FindingSeverity.Info)]
    public void ParseFindingSeverity_maps_or_defaults(string? raw, FindingSeverity expected)
    {
        FindingSeverity actual = FindingInspectReadModelMapper.ParseFindingSeverity(raw);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData(null, FindingHumanReviewStatus.NotRequired)]
    [InlineData("   ", FindingHumanReviewStatus.NotRequired)]
    [InlineData("  Pending  ", FindingHumanReviewStatus.Pending)]
    [InlineData("Pending", FindingHumanReviewStatus.Pending)]
    [InlineData("bad", FindingHumanReviewStatus.NotRequired)]
    [InlineData("99", FindingHumanReviewStatus.NotRequired)]
    [InlineData("999", FindingHumanReviewStatus.NotRequired)]
    public void ParseHumanReview_maps_or_defaults(string? raw, FindingHumanReviewStatus expected)
    {
        FindingHumanReviewStatus actual = FindingInspectReadModelMapper.ParseHumanReview(raw);

        actual.Should().Be(expected);
    }

    [Theory]
    [InlineData("999")]
    [InlineData("-1")]
    [InlineData("bogus")]
    public void TryParseEvaluationConfidenceLevel_returns_null_for_undefined_or_unrecognized_values(string raw)
    {
        FindingConfidenceLevel? actual = FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel(raw);

        actual.Should().BeNull();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-a-level")]
    public void TryParseEvaluationConfidenceLevel_returns_null_for_missing_or_invalid(string? raw)
    {
        FindingConfidenceLevel? actual = FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel(raw);

        actual.Should().BeNull();
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_parses_known_value()
    {
        FindingConfidenceLevel? actual = FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("High");

        actual.Should().Be(FindingConfidenceLevel.High);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_trims_surrounding_whitespace()
    {
        FindingConfidenceLevel? actual = FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("  High  ");

        actual.Should().Be(FindingConfidenceLevel.High);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ParseDisposition_returns_null_for_blank(string? raw)
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition(raw);

        actual.Should().BeNull();
    }

    [Fact]
    public void ParseDisposition_parses_known_value()
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition("Accepted");

        actual.Should().Be(FindingDisposition.Accepted);
    }

    [Fact]
    public void ParseDisposition_trims_surrounding_whitespace()
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition("  Accepted  ");

        actual.Should().Be(FindingDisposition.Accepted);
    }

    [Theory]
    [InlineData("999")]
    [InlineData("-1")]
    [InlineData("bogus")]
    public void ParseDisposition_returns_null_for_undefined_or_unrecognized_values(string raw)
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition(raw);

        actual.Should().BeNull();
    }

    [Fact]
    public void ParseDisposition_parses_case_insensitive_enum_value()
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition("accepted");

        actual.Should().Be(FindingDisposition.Accepted);
    }

    [Fact]
    public void ParseHumanReview_parses_case_insensitive_enum_value()
    {
        FindingHumanReviewStatus actual = FindingInspectReadModelMapper.ParseHumanReview("pending");

        actual.Should().Be(FindingHumanReviewStatus.Pending);
    }

    [Fact]
    public void ParseFindingSeverity_parses_case_insensitive_warning_value()
    {
        FindingSeverity actual = FindingInspectReadModelMapper.ParseFindingSeverity("warning");

        actual.Should().Be(FindingSeverity.Warning);
    }

    [Fact]
    public void ParseFindingSeverity_parses_case_insensitive_error_value()
    {
        FindingSeverity actual = FindingInspectReadModelMapper.ParseFindingSeverity("error");

        actual.Should().Be(FindingSeverity.Error);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_parses_case_insensitive_low_value()
    {
        FindingConfidenceLevel? actual = FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("low");

        actual.Should().Be(FindingConfidenceLevel.Low);
    }

    [Fact]
    public void ParseDisposition_parses_case_insensitive_deferred_value()
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition("deferred");

        actual.Should().Be(FindingDisposition.Deferred);
    }

    [Fact]
    public void ParseFindingSeverity_parses_case_insensitive_info_value()
    {
        FindingSeverity actual = FindingInspectReadModelMapper.ParseFindingSeverity("info");

        actual.Should().Be(FindingSeverity.Info);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_parses_case_insensitive_medium_value()
    {
        FindingConfidenceLevel? actual = FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("medium");

        actual.Should().Be(FindingConfidenceLevel.Medium);
    }

    [Fact]
    public void ParseDisposition_parses_case_insensitive_needs_evidence_value()
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition("needsevidence");

        actual.Should().Be(FindingDisposition.NeedsEvidence);
    }

    [Fact]
    public void ParseDisposition_parses_case_insensitive_remediated_value()
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition("remediated");

        actual.Should().Be(FindingDisposition.Remediated);
    }

    [Fact]
    public void ParseDisposition_parses_case_insensitive_rejected_as_not_applicable_value()
    {
        FindingDisposition? actual = FindingInspectReadModelMapper.ParseDisposition("rejectedasnotapplicable");

        actual.Should().Be(FindingDisposition.RejectedAsNotApplicable);
    }

    [Fact]
    public void ParseHumanReview_parses_case_insensitive_not_required_value()
    {
        FindingHumanReviewStatus actual = FindingInspectReadModelMapper.ParseHumanReview("notrequired");

        actual.Should().Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void ParseHumanReview_parses_case_insensitive_approved_value()
    {
        FindingHumanReviewStatus actual = FindingInspectReadModelMapper.ParseHumanReview("approved");

        actual.Should().Be(FindingHumanReviewStatus.Approved);
    }

    [Fact]
    public void ParseHumanReview_parses_case_insensitive_rejected_value()
    {
        FindingHumanReviewStatus actual = FindingInspectReadModelMapper.ParseHumanReview("rejected");

        actual.Should().Be(FindingHumanReviewStatus.Rejected);
    }

    [Fact]
    public void ParseHumanReview_parses_case_insensitive_overridden_value()
    {
        FindingHumanReviewStatus actual = FindingInspectReadModelMapper.ParseHumanReview("overridden");

        actual.Should().Be(FindingHumanReviewStatus.Overridden);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_parses_case_insensitive_high_value()
    {
        FindingConfidenceLevel? actual = FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("high");

        actual.Should().Be(FindingConfidenceLevel.High);
    }

    [Fact]
    public void ParseFindingSeverity_parses_case_insensitive_critical_value()
    {
        FindingSeverity actual = FindingInspectReadModelMapper.ParseFindingSeverity("critical");

        actual.Should().Be(FindingSeverity.Critical);
    }

    [Fact]
    public void ParseFindingSeverity_maps_negative_numeric_string_to_info_default()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("-1").Should().Be(FindingSeverity.Info);
    }

    [Fact]
    public void ParseFindingSeverity_maps_positive_undefined_numeric_string_to_info_default()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("4").Should().Be(FindingSeverity.Info);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_returns_null_for_positive_undefined_numeric_string()
    {
        FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("3").Should().BeNull();
    }

    [Fact]
    public void ParseHumanReview_maps_positive_undefined_numeric_string_to_not_required_default()
    {
        FindingInspectReadModelMapper.ParseHumanReview("5").Should().Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void ParseDisposition_returns_null_for_positive_undefined_numeric_string()
    {
        FindingInspectReadModelMapper.ParseDisposition("5").Should().BeNull();
    }

    [Fact]
    public void ParseFindingSeverity_maps_defined_numeric_string_to_warning()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("1").Should().Be(FindingSeverity.Warning);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_parses_defined_numeric_string_zero_as_high()
    {
        FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("0").Should().Be(FindingConfidenceLevel.High);
    }

    [Fact]
    public void ParseHumanReview_maps_defined_numeric_string_one_to_pending()
    {
        FindingInspectReadModelMapper.ParseHumanReview("1").Should().Be(FindingHumanReviewStatus.Pending);
    }

    [Fact]
    public void ParseHumanReview_maps_defined_numeric_string_zero_to_not_required()
    {
        FindingInspectReadModelMapper.ParseHumanReview("0").Should().Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void ParseDisposition_maps_defined_numeric_string_one_to_deferred()
    {
        FindingInspectReadModelMapper.ParseDisposition("1").Should().Be(FindingDisposition.Deferred);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_parses_defined_numeric_string_one_as_medium()
    {
        FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("1").Should().Be(FindingConfidenceLevel.Medium);
    }

    [Fact]
    public void ParseFindingSeverity_maps_defined_numeric_string_zero_to_info()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("0").Should().Be(FindingSeverity.Info);
    }

    [Fact]
    public void ParseFindingSeverity_maps_defined_numeric_string_two_to_error()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("2").Should().Be(FindingSeverity.Error);
    }

    [Fact]
    public void ParseDisposition_maps_defined_numeric_string_zero_to_accepted()
    {
        FindingInspectReadModelMapper.ParseDisposition("0").Should().Be(FindingDisposition.Accepted);
    }

    [Fact]
    public void ParseHumanReview_maps_defined_numeric_string_two_to_approved()
    {
        FindingInspectReadModelMapper.ParseHumanReview("2").Should().Be(FindingHumanReviewStatus.Approved);
    }

    [Fact]
    public void ParseHumanReview_maps_defined_numeric_string_three_to_rejected()
    {
        FindingInspectReadModelMapper.ParseHumanReview("3").Should().Be(FindingHumanReviewStatus.Rejected);
    }

    [Fact]
    public void ParseHumanReview_maps_defined_numeric_string_four_to_overridden()
    {
        FindingInspectReadModelMapper.ParseHumanReview("4").Should().Be(FindingHumanReviewStatus.Overridden);
    }

    [Fact]
    public void ParseDisposition_maps_defined_numeric_string_two_to_needs_evidence()
    {
        FindingInspectReadModelMapper.ParseDisposition("2").Should().Be(FindingDisposition.NeedsEvidence);
    }

    [Fact]
    public void ParseDisposition_maps_defined_numeric_string_three_to_remediated()
    {
        FindingInspectReadModelMapper.ParseDisposition("3").Should().Be(FindingDisposition.Remediated);
    }

    [Fact]
    public void ParseDisposition_maps_defined_numeric_string_four_to_rejected_as_not_applicable()
    {
        FindingInspectReadModelMapper.ParseDisposition("4").Should().Be(FindingDisposition.RejectedAsNotApplicable);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_parses_defined_numeric_string_two_as_low()
    {
        FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("2").Should().Be(FindingConfidenceLevel.Low);
    }

    [Fact]
    public void ParseFindingSeverity_maps_defined_numeric_string_three_to_critical()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("3").Should().Be(FindingSeverity.Critical);
    }

    [Fact]
    public void ParseHumanReview_maps_negative_numeric_string_to_not_required_default()
    {
        FindingInspectReadModelMapper.ParseHumanReview("-1").Should().Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void ParseDisposition_returns_null_for_negative_numeric_string()
    {
        FindingInspectReadModelMapper.ParseDisposition("-1").Should().BeNull();
    }

    [Fact]
    public void ParseFindingSeverity_maps_fractional_numeric_string_to_info_default()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("1.5").Should().Be(FindingSeverity.Info);
    }

    [Fact]
    public void ParseHumanReview_maps_fractional_numeric_string_to_not_required_default()
    {
        FindingInspectReadModelMapper.ParseHumanReview("2.5").Should().Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_returns_null_for_fractional_numeric_string()
    {
        FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("1.5").Should().BeNull();
    }

    [Fact]
    public void ParseDisposition_returns_null_for_fractional_numeric_string()
    {
        FindingInspectReadModelMapper.ParseDisposition("0.5").Should().BeNull();
        FindingInspectReadModelMapper.ParseDisposition("1.5").Should().BeNull();
    }

    [Fact]
    public void ParseDisposition_trims_whitespace_from_fractional_numeric_string_before_rejecting()
    {
        FindingInspectReadModelMapper.ParseDisposition("  1.5  ").Should().BeNull();
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_returns_null_for_negative_numeric_string()
    {
        FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("-1").Should().BeNull();
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_trims_whitespace_from_negative_numeric_string_before_rejecting()
    {
        FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("  -1  ").Should().BeNull();
    }

    [Fact]
    public void ParseFindingSeverity_trims_whitespace_from_negative_numeric_string_before_defaulting_to_info()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("  -1  ").Should().Be(FindingSeverity.Info);
    }

    [Fact]
    public void ParseHumanReview_trims_whitespace_from_negative_numeric_string_before_defaulting_to_not_required()
    {
        FindingInspectReadModelMapper.ParseHumanReview("  -1  ").Should().Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void ParseDisposition_trims_whitespace_from_negative_numeric_string_before_rejecting()
    {
        FindingInspectReadModelMapper.ParseDisposition("  -1  ").Should().BeNull();
    }

    [Fact]
    public void ParseFindingSeverity_trims_whitespace_from_fractional_numeric_string_before_defaulting_to_info()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("  1.5  ").Should().Be(FindingSeverity.Info);
    }

    [Fact]
    public void ParseHumanReview_trims_whitespace_from_fractional_numeric_string_before_defaulting_to_not_required()
    {
        FindingInspectReadModelMapper.ParseHumanReview("  2.5  ").Should().Be(FindingHumanReviewStatus.NotRequired);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_trims_whitespace_from_fractional_numeric_string_before_rejecting()
    {
        FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("  1.5  ").Should().BeNull();
    }

    [Fact]
    public void ParseDisposition_trims_whitespace_from_fractional_numeric_string_before_rejecting_for_all_fractional_inputs()
    {
        FindingInspectReadModelMapper.ParseDisposition("  0.5  ").Should().BeNull();
        FindingInspectReadModelMapper.ParseDisposition("  1.5  ").Should().BeNull();
    }

    [Fact]
    public void ParseDisposition_trims_whitespace_from_positive_undefined_numeric_string_before_rejecting()
    {
        FindingInspectReadModelMapper.ParseDisposition("  5  ").Should().BeNull();
    }

    [Fact]
    public void ParseFindingSeverity_trims_whitespace_from_positive_undefined_numeric_string_before_defaulting_to_info()
    {
        FindingInspectReadModelMapper.ParseFindingSeverity("  4  ").Should().Be(FindingSeverity.Info);
    }

    [Fact]
    public void TryParseEvaluationConfidenceLevel_trims_whitespace_from_positive_undefined_numeric_string_before_rejecting()
    {
        FindingInspectReadModelMapper.TryParseEvaluationConfidenceLevel("  3  ").Should().BeNull();
    }
}
